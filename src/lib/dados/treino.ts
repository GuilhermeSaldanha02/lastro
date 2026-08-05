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
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("treino")
    .insert({ usuario_id: user.id, data: hoje })
    .select("id")
    .single();
  if (error) throw new Error(`Falha ao criar treino: ${error.message}`);

  revalidatePath("/treino");
  redirect(`/treino/${data.id}`);
}

/**
 * Registra uma série valendo/aquecimento no treino.
 * Server Action — chamada do form de `formulario-serie.tsx`.
 *
 * `usuario_id` NÃO entra no insert: o trigger `serie_usuario_id_bi`
 * (SDD §3.2) preenche a partir de `treino_id`.
 */
export async function criarSerie(
  treinoId: string,
  formData: FormData,
): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const exercicioId = String(formData.get("exercicio_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "valendo") as
    | "aquecimento"
    | "valendo";
  const reps = Number(formData.get("reps"));
  const peso = Number(formData.get("peso"));
  const rirBruto = formData.get("rir");
  const pesoCorporalIncluso = formData.get("peso_corporal_incluso") === "on";

  if (!exercicioId) throw new Error("Exercício é obrigatório.");
  if (!Number.isFinite(reps) || reps <= 0) {
    throw new Error("Reps precisa ser um número positivo.");
  }
  if (!Number.isFinite(peso) || peso < 0) {
    throw new Error("Peso precisa ser um número válido.");
  }

  // RIR é campo de série valendo (SDD §3.2, constraint serie_rir_so_valendo).
  // Ausência é `null`, nunca `0` — RIR 0 é valor válido e diferente de
  // ausente (KNOWLEDGE.md §1). Aquecimento nunca carrega RIR.
  let rir: number | null = null;
  if (tipo === "valendo" && rirBruto !== null && rirBruto !== "") {
    const rirNumero = Number(rirBruto);
    if (!Number.isFinite(rirNumero)) {
      throw new Error("RIR precisa ser um número válido.");
    }
    rir = rirNumero;
  }

  const { count, error: erroContagem } = await supabase
    .from("serie")
    .select("id", { count: "exact", head: true })
    .eq("treino_id", treinoId);
  if (erroContagem) {
    throw new Error(`Falha ao calcular ordem da série: ${erroContagem.message}`);
  }
  const ordem = (count ?? 0) + 1;

  const { error } = await supabase.from("serie").insert({
    treino_id: treinoId,
    exercicio_id: exercicioId,
    ordem,
    tipo,
    reps,
    peso,
    rir,
    peso_corporal_incluso: pesoCorporalIncluso,
  });
  if (error) throw new Error(`Falha ao registrar série: ${error.message}`);

  revalidatePath(`/treino/${treinoId}`);
}
