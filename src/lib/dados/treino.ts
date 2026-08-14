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
  /** Quantas séries este treino tem, contando aquecimento. */
  totalSeries: number;
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

/**
 * Lista os treinos do usuário logado, mais recente primeiro, com a
 * contagem de séries de cada um. A contagem não é enfeite: a confirmação
 * de exclusão precisa dizer quantas séries somem junto, senão o dono
 * confirma sem saber o tamanho do estrago.
 */
export async function listarTreinos(): Promise<Treino[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("treino")
    .select("id, data, serie(count)")
    .order("data", { ascending: false });
  if (error) throw new Error(`Falha ao listar treinos: ${error.message}`);

  type Linha = {
    id: string;
    data: string;
    serie: { count: number }[] | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((t) => ({
    id: t.id,
    data: t.data,
    totalSeries: t.serie?.[0]?.count ?? 0,
  }));
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
    totalSeries: linhasSeries.length,
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

export type SerieHistorica = {
  reps: number;
  peso: number;
  rir: number | null;
  pesoCorporalIncluso: boolean;
  criadoEm: string;
  /** Pra contar SESSÕES distintas (piso de PR), não só séries — um treino
   * pode ter várias séries do mesmo exercício e ainda ser uma sessão só. */
  treinoId: string;
};

/**
 * Histórico de séries VALENDO de um exercício específico, mais recente
 * primeiro — fonte única pra três funcionalidades (backlog C1/C2/C4,
 * 2026-08-13): "última vez" na linha de registro, "repetir" por exercício
 * (não a última série do treino inteiro), e detecção de PR em tempo real.
 * Aquecimento nunca entra (FF4) — não é "o que a pessoa fez de verdade" pra
 * fins de comparação, é preparação.
 */
export async function historicoDoExercicio(
  exercicioId: string,
): Promise<SerieHistorica[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("serie")
    .select("reps, peso, rir, peso_corporal_incluso, criado_em, treino_id")
    .eq("exercicio_id", exercicioId)
    .eq("tipo", "valendo")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (error) {
    throw new Error(`Falha ao buscar histórico do exercício: ${error.message}`);
  }

  type Linha = {
    reps: number;
    peso: number;
    rir: number | null;
    peso_corporal_incluso: boolean;
    criado_em: string;
    treino_id: string;
  };

  return ((data ?? []) as Linha[]).map((s) => ({
    reps: s.reps,
    peso: Number(s.peso),
    rir: s.rir,
    pesoCorporalIncluso: s.peso_corporal_incluso,
    criadoEm: s.criado_em,
    treinoId: s.treino_id,
  }));
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

/** Um exercício específico — cabeçalho da tela de histórico (backlog C4 parte 2). */
export async function buscarExercicio(id: string): Promise<Exercicio | null> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar exercício: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    nome: data.nome,
    grupoMuscularPrimario: data.grupo_muscular_primario,
    unilateral: data.unilateral,
  };
}

export type ExercicioDoCatalogo = Exercicio & {
  grupoMuscularNome: string;
  /**
   * CURADA por humano, nunca gerada por IA (FF7, PRD §4.5) — é assunto de
   * saúde. `null` significa "ainda não foi escrita", e a UI diz isso em
   * vez de esconder: o vazio honesto é melhor que texto inventado.
   */
  dicaExecucao: string | null;
};

/** Catálogo completo, agrupável por grupo muscular. */
export async function listarCatalogo(): Promise<ExercicioDoCatalogo[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("exercicio")
    .select(
      "id, nome, grupo_muscular_primario, unilateral, dica_execucao, grupo_muscular (nome)",
    )
    .order("nome", { ascending: true });
  if (error) throw new Error(`Falha ao listar o catálogo: ${error.message}`);

  type Linha = {
    id: string;
    nome: string;
    grupo_muscular_primario: string;
    unilateral: boolean;
    dica_execucao: string | null;
    grupo_muscular: { nome: string } | { nome: string }[] | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((e) => {
    const grupo = Array.isArray(e.grupo_muscular)
      ? e.grupo_muscular[0]
      : e.grupo_muscular;
    return {
      id: e.id,
      nome: e.nome,
      grupoMuscularPrimario: e.grupo_muscular_primario,
      grupoMuscularNome: grupo?.nome ?? e.grupo_muscular_primario,
      unilateral: e.unilateral,
      dicaExecucao: e.dica_execucao,
    };
  });
}

/**
 * Inicia um treino para o usuário logado, com `data = hoje` — ou reaproveita
 * o de hoje se já existir. Server Action, chamada tanto de `src/app/page.tsx`
 * quanto de `src/app/treino/page.tsx`.
 *
 * Sem a checagem de reaproveitamento, cada clique em "Iniciar treino de
 * hoje" criava uma linha nova em `treino` — inclusive sem nenhuma série
 * dentro. Clicar de novo (ex.: voltar pra tela sem ter adicionado nada
 * ainda) empilhava treinos vazios que nunca desaparecem sozinhos (achado
 * do dono, 2026-08-07).
 */
export async function criarTreino(): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  // Calendário de Brasília, não UTC (src/lib/tempo.ts) — evita treino
  // noturno virar o dia seguinte e cair na semana ISO errada.
  const hoje = dataLocalBrasil();

  const { data: existente, error: erroConsulta } = await supabase
    .from("treino")
    .select("id")
    .eq("data", hoje)
    .maybeSingle();
  if (erroConsulta) {
    throw new Error(`Falha ao verificar treino de hoje: ${erroConsulta.message}`);
  }
  if (existente) {
    redirect(`/treino/${existente.id}`);
  }

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
 * Mesma coisa que `criarTreino`, mas o destino carrega o modelo escolhido
 * na querystring (SDD §9.3) — a tela de treino usa isso só pra pré-listar
 * os exercícios do modelo (`buscarModelo`, `src/lib/dados/modelo-treino.ts`),
 * nunca grava nada em `modelo_treino*`. `modeloId` não é validado aqui
 * (RLS de `modelo_treino` cuida disso na leitura, na tela de destino) —
 * esta função só decide PARA ONDE redirecionar.
 */
export async function criarTreinoComModelo(modeloId: string): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  const hoje = dataLocalBrasil();

  const { data: existente, error: erroConsulta } = await supabase
    .from("treino")
    .select("id")
    .eq("data", hoje)
    .maybeSingle();
  if (erroConsulta) {
    throw new Error(`Falha ao verificar treino de hoje: ${erroConsulta.message}`);
  }
  if (existente) {
    redirect(`/treino/${existente.id}?modelo=${modeloId}`);
  }

  const { data, error } = await supabase
    .from("treino")
    .insert({ usuario_id: user.id, data: hoje })
    .select("id")
    .single();
  if (error) throw new Error(`Falha ao criar treino: ${error.message}`);

  revalidatePath("/treino");
  redirect(`/treino/${data.id}?modelo=${modeloId}`);
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

/* ====================================================================
   CORREÇÃO — editar e excluir.

   Adicionado em 2026-08-06 (ver DECISIONS.md). O banco já previa isto
   desde o schema inicial (`grant ... update, delete` no SDD §3.4, e
   `on delete cascade` de série para treino), mas nenhuma função de
   aplicação existia: dava para registrar e nunca para corrigir.

   Nenhuma destas funções faz `redirect`/`revalidatePath` quando é
   chamada pela fila offline — quem chama já atualizou a UI de forma
   otimista. As variantes de página fazem o `revalidatePath`.
   ==================================================================== */

export type AtualizacaoSerieInput = {
  id: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoCorporalIncluso: boolean;
};

/**
 * Corrige uma série já registrada. Mudar `reps`/`peso`/`tipo` muda o que
 * o agregador calcula (volume, e1RM, contagem de séries valendo) — é
 * exatamente o ponto: um peso digitado errado contamina a Análise
 * Semanal até ser corrigido.
 *
 * A RLS filtra por `usuario_id`, então um id de outra pessoa não atualiza
 * nada. `treino_id` e `exercicio_id` NÃO são atualizáveis aqui: mudar a
 * que treino uma série pertence é outra operação, não uma correção.
 */
export async function atualizarSerieRemoto(
  input: AtualizacaoSerieInput,
): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase
    .from("serie")
    .update({
      tipo: input.tipo,
      reps: input.reps,
      peso: input.peso,
      rir: input.rir,
      peso_corporal_incluso: input.pesoCorporalIncluso,
    })
    .eq("id", input.id);
  if (error) throw new Error(`Falha ao atualizar série: ${error.message}`);
}

/** Exclui uma série. A RLS impede excluir série de outro usuário. */
export async function excluirSerieRemoto(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("serie").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir série: ${error.message}`);
}

/**
 * Exclui um treino inteiro. O `on delete cascade` do schema (SDD §3.2)
 * leva junto todas as séries dele — é destrutivo e irreversível, então a
 * UI que chama isto pede confirmação explícita antes.
 */
export async function excluirTreinoRemoto(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("treino").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir treino: ${error.message}`);
}

/**
 * Server Action da lista de treinos: exclui e revalida a página.
 * Separada de `excluirTreinoRemoto` porque a fila offline chama a versão
 * sem `revalidatePath` (não há página para revalidar num service worker).
 */
export async function excluirTreino(id: string): Promise<void> {
  await excluirTreinoRemoto(id);
  revalidatePath("/treino");
}
