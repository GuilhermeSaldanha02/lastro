// lastro · SDD.md §5.1 — leitura/escrita de treino e série via Supabase.
// Fora de src/lib/analise/: este módulo só faz I/O, não faz conta nenhuma.
//
// `usuario_id` da série NUNCA é escrito por este módulo: o trigger do
// schema (SDD §3.2) preenche a partir de `treino_id`. Já `usuario_id` do
// TREINO precisa ser escrito aqui — não há trigger equivalente para
// `treino`, e a RLS (`with check usuario_id = auth.uid()`) exige o valor
// certo no insert.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { dataLocalBrasil } from "@/lib/tempo";

export type Exercicio = {
  id: string;
  nome: string;
  grupoMuscularPrimario: string;
  unilateral: boolean;
};

export type Serie = {
  id: string;
  exercicioId: string;
  exercicioNome: string;
  exercicioUnilateral: boolean;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  /** RIR ausente = informação desconhecida (KNOWLEDGE.md §1). NUNCA 0 por default. */
  rir: number | null;
  pesoCorporalIncluso: boolean;
};

export type Treino = {
  id: string;
  data: string;
};

export type TreinoComSeries = Treino & {
  series: Serie[];
};

async function usuarioAutenticadoOuErro() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }
  return { supabase, user };
}

/** Lista os treinos do usuário logado, mais recente primeiro. */
export async function listarTreinos(): Promise<Treino[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("treino")
    .select("id, data")
    .order("data", { ascending: false });
  if (error) throw new Error(`Falha ao listar treinos: ${error.message}`);
  return data ?? [];
}

/** Busca um treino do usuário logado com as séries já registradas nele. */
export async function buscarTreino(
  treinoId: string,
): Promise<TreinoComSeries | null> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data: treino, error: erroTreino } = await supabase
    .from("treino")
    .select("id, data")
    .eq("id", treinoId)
    .maybeSingle();
  if (erroTreino) {
    throw new Error(`Falha ao buscar treino: ${erroTreino.message}`);
  }
  if (!treino) return null;

  const { data: series, error: erroSeries } = await supabase
    .from("serie")
    .select(
      "id, exercicio_id, tipo, reps, peso, rir, peso_corporal_incluso, exercicio:exercicio_id (nome, unilateral)",
    )
    .eq("treino_id", treinoId)
    .order("ordem", { ascending: true });
  if (erroSeries) {
    throw new Error(`Falha ao listar séries: ${erroSeries.message}`);
  }

  type LinhaSerie = {
    id: string;
    exercicio_id: string;
    tipo: "aquecimento" | "valendo";
    reps: number;
    peso: number;
    rir: number | null;
    peso_corporal_incluso: boolean;
    exercicio: { nome: string; unilateral: boolean } | null;
  };
  const linhasSeries = (series ?? []) as unknown as LinhaSerie[];

  return {
    id: treino.id,
    data: treino.data,
    series: linhasSeries.map((s) => ({
      id: s.id,
      exercicioId: s.exercicio_id,
      exercicioNome: s.exercicio?.nome ?? "",
      exercicioUnilateral: s.exercicio?.unilateral ?? false,
      tipo: s.tipo,
      reps: s.reps,
      peso: Number(s.peso),
      rir: s.rir,
      pesoCorporalIncluso: s.peso_corporal_incluso,
    })),
  };
}

/** Catálogo de exercícios disponíveis para o formulário (SDD §5.1). */
export async function listarExercicios(): Promise<Exercicio[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral")
    .order("nome", { ascending: true });
  if (error) throw new Error(`Falha ao listar exercícios: ${error.message}`);
  return (data ?? []).map((e) => ({
    id: e.id,
    nome: e.nome,
    grupoMuscularPrimario: e.grupo_muscular_primario,
    unilateral: e.unilateral,
  }));
}

/**
 * Inicia um treino novo para o usuário logado, com `data = hoje`.
 * Server Action — chamada direto do form de `src/app/treino/page.tsx`.
 */
export async function criarTreino(): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  // Calendário de Brasília, não UTC (src/lib/tempo.ts) — evita treino
  // noturno virar o dia seguinte e cair na semana ISO errada.
  const hoje = dataLocalBrasil();

  const { data, error } = await supabase
    .from("treino")
    .insert({ usuario_id: user.id, data: hoje })
    .select("id")
    .single();
  if (error) throw new Error(`Falha ao criar treino: ${error.message}`);

  revalidatePath("/treino");
  redirect(`/treino/${data.id}`);
}

export type NovaSerieInput = {
  id: string;
  treinoId: string;
  exercicioId: string;
  ordem: number;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoCorporalIncluso: boolean;
};

/**
 * Grava no servidor uma série já validada e com `id`/`ordem` decididos
 * pelo cliente (D6 — offline-first, `src/lib/offline/`). Chamada tanto
 * direto (se online) quanto pela fila de sincronização (se a rede caiu no
 * meio do treino) — por isso não faz `redirect`/`revalidatePath`: quem
 * chama já atualizou a UI de forma otimista antes desta chamada existir.
 *
 * `usuario_id` NÃO entra no insert: o trigger `serie_usuario_id_bi`
 * (SDD §3.2) preenche a partir de `treino_id`.
 */
export async function criarSerieRemoto(input: NovaSerieInput): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("serie").insert({
    id: input.id,
    treino_id: input.treinoId,
    exercicio_id: input.exercicioId,
    ordem: input.ordem,
    tipo: input.tipo,
    reps: input.reps,
    peso: input.peso,
    rir: input.rir,
    peso_corporal_incluso: input.pesoCorporalIncluso,
  });
  if (error) throw new Error(`Falha ao registrar série: ${error.message}`);
}
