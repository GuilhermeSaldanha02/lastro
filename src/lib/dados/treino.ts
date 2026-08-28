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
import { obterIdioma } from "@/lib/dados/idioma";
import { mapaTraducaoExercicios, mapaTraducaoGrupos } from "@/lib/dados/traducao";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import { ehErroPermanenteDoPostgres, marcarComoPermanente } from "@/lib/offline/erro-permanente";

export type Exercicio = {
  id: string;
  nome: string;
  grupoMuscularPrimario: string;
  unilateral: boolean;
  /** Peso registrado é de UM implemento (ex.: um halter) — dobra volume, igual unilateral (D3.5). */
  pesoPorLado: boolean;
};

export type Serie = {
  id: string;
  exercicioId: string;
  exercicioNome: string;
  exercicioUnilateral: boolean;
  /** Valor-padrão do catálogo — pré-marca o interruptor, não decide o volume. */
  exercicioPesoPorLado: boolean;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  /** RIR ausente = informação desconhecida (KNOWLEDGE.md §1). NUNCA 0 por default. */
  rir: number | null;
  /** Valor REAL desta série (interruptor do formulário) — é isto que o agregador usa para dobrar volume (D3.5). */
  pesoPorLado: boolean;
  criadoEm: string;
};

export type Treino = {
  id: string;
  data: string;
  /** Quantas séries este treino tem, contando aquecimento. */
  totalSeries: number;
  gruposMusculares?: string[];
  volumeKg?: number;
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
 * contagem de séries, grupos musculares e volume de cada um.
 */
export async function listarTreinos(): Promise<Treino[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const [{ data, error }, idioma] = await Promise.all([
    supabase
      .from("treino")
      .select(
        "id, data, serie (tipo, reps, peso, peso_por_lado, exercicio:exercicio_id (grupo_muscular_primario, unilateral))",
      )
      .order("data", { ascending: false }),
    obterIdioma(),
  ]);
  if (error) throw new Error(`Falha ao listar treinos: ${error.message}`);
  const traducaoGrupos = await mapaTraducaoGrupos(idioma);

  type LinhaSerie = {
    tipo: "aquecimento" | "valendo";
    reps: number;
    peso: number;
    peso_por_lado: boolean;
    exercicio: { grupo_muscular_primario: string; unilateral: boolean } | null;
  };

  type Linha = {
    id: string;
    data: string;
    serie: LinhaSerie[] | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((t) => {
    const series = t.serie ?? [];
    const valendo = series.filter((s) => s.tipo === "valendo");
    let vol = 0;
    for (const s of valendo) {
      const peso = Number(s.peso);
      const reps = s.reps;
      // Fonte do multiplicador é a SÉRIE (peso_por_lado) e o EXERCÍCIO
      // (unilateral) — nunca compostos (D3.5).
      const mult = s.exercicio?.unilateral || s.peso_por_lado ? 2 : 1;
      vol += peso * reps * mult;
    }
    const grupos = Array.from(
      new Set(
        series
          .map((s) => s.exercicio?.grupo_muscular_primario)
          .filter((g): g is string => Boolean(g)),
      ),
      // `?? id` cravava a CHAVE DO BANCO na tela: `mapaTraducaoGrupos`
      // devolve mapa vazio para pt-BR (é o idioma de origem), então o
      // fallback disparava SEMPRE no idioma padrão — os chips do histórico
      // liam "posterior_coxa", "abdomen", "biceps" (achado do dono,
      // 2026-08-27). Esta consulta não traz `grupo_muscular(nome)`, então
      // quem sabe o rótulo em pt-BR é `formatarGrupoMuscular`, que já
      // existia justamente para isso.
    ).map((id) => traducaoGrupos.get(id) ?? formatarGrupoMuscular(id, idioma));

    return {
      id: t.id,
      data: t.data,
      totalSeries: series.length,
      gruposMusculares: grupos,
      volumeKg: Math.round(vol),
    };
  });
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
      "id, exercicio_id, tipo, reps, peso, rir, peso_por_lado, criado_em, exercicio:exercicio_id (nome, unilateral, peso_por_lado)",
    )
    .eq("treino_id", treinoId)
    .order("ordem", { ascending: true });
  if (erroSeries) {
    throw new Error(`Falha ao listar séries: ${erroSeries.message}`);
  }

  const idioma = await obterIdioma();
  const traducaoExercicios = await mapaTraducaoExercicios(idioma);

  type LinhaSerie = {
    id: string;
    exercicio_id: string;
    tipo: "aquecimento" | "valendo";
    reps: number;
    peso: number;
    rir: number | null;
    peso_por_lado: boolean;
    criado_em: string;
    exercicio: { nome: string; unilateral: boolean; peso_por_lado: boolean } | null;
  };
  const linhasSeries = (series ?? []) as unknown as LinhaSerie[];

  return {
    id: treino.id,
    data: treino.data,
    totalSeries: linhasSeries.length,
    series: linhasSeries.map((s) => ({
      id: s.id,
      exercicioId: s.exercicio_id,
      exercicioNome: traducaoExercicios.get(s.exercicio_id) ?? s.exercicio?.nome ?? "",
      exercicioUnilateral: s.exercicio?.unilateral ?? false,
      exercicioPesoPorLado: s.exercicio?.peso_por_lado ?? false,
      tipo: s.tipo,
      reps: s.reps,
      peso: Number(s.peso),
      rir: s.rir,
      pesoPorLado: s.peso_por_lado,
      criadoEm: s.criado_em,
    })),
  };
}

export type SerieHistorica = {
  reps: number;
  peso: number;
  rir: number | null;
  pesoPorLado: boolean;
  criadoEm: string;
  /** Data NOMINAL do treino a que a série pertence (`treino.data`) — é o
   * que ordena e o que a UI mostra, não `criadoEm` (achado de auditoria,
   * 2026-08-17: uma série lançada/editada num momento diferente da data
   * do treino — completar o registro depois, editar um treino passado —
   * fazia a ordem e a etiqueta de data ficarem erradas). */
  dataTreino: string;
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
 *
 * Ordenado por `treino.data` (a data NOMINAL do treino), não por
 * `serie.criado_em` — ver nota em `SerieHistorica.dataTreino`.
 */
export async function historicoDoExercicio(
  exercicioId: string,
): Promise<SerieHistorica[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  // Sem `.order()` na tabela relacionada — PostgREST não ordena as linhas
  // de `serie` por uma coluna da tabela embutida (`treino.data`) de forma
  // confiável (testado: saiu ascendente mesmo pedindo `ascending: false`).
  // Busca as 200 mais recentes por `criado_em` (heurística de janela,
  // igual antes) e reordena no lado do JS pela data real do treino.
  const { data, error } = await supabase
    .from("serie")
    .select(
      "reps, peso, rir, peso_por_lado, criado_em, treino_id, treino:treino_id(data)",
    )
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
    peso_por_lado: boolean;
    criado_em: string;
    treino_id: string;
    treino: { data: string } | { data: string }[] | null;
  };

  const historico = ((data ?? []) as Linha[]).map((s) => {
    const treino = Array.isArray(s.treino) ? s.treino[0] : s.treino;
    return {
      reps: s.reps,
      peso: Number(s.peso),
      rir: s.rir,
      pesoPorLado: s.peso_por_lado,
      criadoEm: s.criado_em,
      dataTreino: treino?.data ?? s.criado_em,
      treinoId: s.treino_id,
    };
  });

  historico.sort((a, b) => {
    const porData = b.dataTreino.localeCompare(a.dataTreino);
    return porData !== 0 ? porData : b.criadoEm.localeCompare(a.criadoEm);
  });

  return historico;
}

/** Catálogo de exercícios disponíveis para o formulário (SDD §5.1). */
export async function listarExercicios(): Promise<Exercicio[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral, peso_por_lado")
    .order("nome", { ascending: true });
  if (error) throw new Error(`Falha ao listar exercícios: ${error.message}`);

  const idioma = await obterIdioma();
  const traducaoExercicios = await mapaTraducaoExercicios(idioma);

  const exercicios = (data ?? []).map((e) => ({
    id: e.id,
    nome: traducaoExercicios.get(e.id) ?? e.nome,
    grupoMuscularPrimario: e.grupo_muscular_primario,
    unilateral: e.unilateral,
    pesoPorLado: e.peso_por_lado,
  }));

  // A ordem alfabética vem do banco em PT-BR (`order("nome")`); com nome
  // traduzido no idioma escolhido, reordena aqui pra não misturar
  // alfabetos (achado do 2/4: "Abdominal..." em PT-BR não é onde
  // "Bulgarian Split Squat" cairia em inglês).
  if (idioma !== "pt-BR") {
    exercicios.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  return exercicios;
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

/** Um exercício específico — cabeçalho da tela de histórico (backlog C4 parte 2). */
export async function buscarExercicio(
  id: string,
): Promise<ExercicioDoCatalogo | null> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("exercicio")
    .select(
      "id, nome, grupo_muscular_primario, unilateral, peso_por_lado, dica_execucao, grupo_muscular (nome)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar exercício: ${error.message}`);
  if (!data) return null;

  const idioma = await obterIdioma();
  const [traducaoExercicios, traducaoGrupos] = await Promise.all([
    mapaTraducaoExercicios(idioma),
    mapaTraducaoGrupos(idioma),
  ]);

  type Linha = {
    id: string;
    nome: string;
    grupo_muscular_primario: string;
    unilateral: boolean;
    peso_por_lado: boolean;
    dica_execucao: string | null;
    grupo_muscular: { nome: string } | { nome: string }[] | null;
  };

  const linha = data as unknown as Linha;
  const grupo = Array.isArray(linha.grupo_muscular)
    ? linha.grupo_muscular[0]
    : linha.grupo_muscular;

  return {
    id: linha.id,
    nome: traducaoExercicios.get(linha.id) ?? linha.nome,
    grupoMuscularPrimario: linha.grupo_muscular_primario,
    grupoMuscularNome:
      traducaoGrupos.get(linha.grupo_muscular_primario) ??
      grupo?.nome ??
      linha.grupo_muscular_primario,
    unilateral: linha.unilateral,
    pesoPorLado: linha.peso_por_lado,
    dicaExecucao: linha.dica_execucao,
  };
}

/** Catálogo completo, agrupável por grupo muscular. */
export async function listarCatalogo(): Promise<ExercicioDoCatalogo[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("exercicio")
    .select(
      "id, nome, grupo_muscular_primario, unilateral, peso_por_lado, dica_execucao, grupo_muscular (nome)",
    )
    .order("nome", { ascending: true });
  if (error) throw new Error(`Falha ao listar o catálogo: ${error.message}`);

  const idioma = await obterIdioma();
  const [traducaoExercicios, traducaoGrupos] = await Promise.all([
    mapaTraducaoExercicios(idioma),
    mapaTraducaoGrupos(idioma),
  ]);

  type Linha = {
    id: string;
    nome: string;
    grupo_muscular_primario: string;
    unilateral: boolean;
    peso_por_lado: boolean;
    dica_execucao: string | null;
    grupo_muscular: { nome: string } | { nome: string }[] | null;
  };

  const catalogo = ((data ?? []) as unknown as Linha[]).map((e) => {
    const grupo = Array.isArray(e.grupo_muscular)
      ? e.grupo_muscular[0]
      : e.grupo_muscular;
    return {
      id: e.id,
      nome: traducaoExercicios.get(e.id) ?? e.nome,
      grupoMuscularPrimario: e.grupo_muscular_primario,
      grupoMuscularNome:
        traducaoGrupos.get(e.grupo_muscular_primario) ??
        grupo?.nome ??
        e.grupo_muscular_primario,
      unilateral: e.unilateral,
      pesoPorLado: e.peso_por_lado,
      dicaExecucao: e.dica_execucao,
    };
  });

  if (idioma !== "pt-BR") {
    catalogo.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  return catalogo;
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
  pesoPorLado: boolean;
};

/**
 * Grava no servidor uma série já validada e com `id`/`ordem` decididos
 * pelo cliente (D6 — offline-first, `src/lib/offline/`). Chamada tanto
 * direto (se online) quanto pela fila de sincronização (se a rede caiu no
 * meio do treino) — por isso não faz `redirect`: quem chama já atualizou
 * a UI de forma otimista antes desta chamada existir.
 *
 * `revalidatePath` AQUI (achado TR-02, QA.md 2026-08-28): sem isso, o
 * cache de dados do Next não sabia que a página mudou, e recarregar
 * `/treino/[id]` logo depois de sincronizar podia mostrar "nenhuma série"
 * por alguns minutos mesmo com a série já confirmada no Postgres — a
 * série nunca se perdia, só a tela mentia por um tempo. Não é await de
 * rede (FF6): é só marcar o cache do servidor como velho, síncrono,
 * mesma chamada que já grava a série; nunca força um re-render de quem
 * está no meio do treino agora — só garante que a PRÓXIMA navegação
 * (recarregar, voltar depois, abrir em outro aparelho) vê o dado real.
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
    peso_por_lado: input.pesoPorLado,
  });
  if (error) {
    const mensagem = `Falha ao registrar série: ${error.message}`;
    throw new Error(ehErroPermanenteDoPostgres(error.code) ? marcarComoPermanente(mensagem) : mensagem);
  }
  revalidatePath("/treino/[id]", "page");
  revalidatePath("/");
}

/* ====================================================================
   CORREÇÃO — editar e excluir.

   Adicionado em 2026-08-06 (ver DECISIONS.md). O banco já previa isto
   desde o schema inicial (`grant ... update, delete` no SDD §3.4, e
   `on delete cascade` de série para treino), mas nenhuma função de
   aplicação existia: dava para registrar e nunca para corrigir.

   Nenhuma destas funções faz `redirect` — quem chama já atualizou a UI
   de forma otimista, online ou pela fila offline. Todas fazem
   `revalidatePath` (achado TR-02, QA.md 2026-08-28: ver o comentário de
   `criarSerieRemoto` acima para o porquê — sem isso, o cache do Next
   ficava desatualizado até expirar sozinho, e uma tela recarregada logo
   depois de editar/excluir podia mostrar o estado antigo por minutos).
   ==================================================================== */

export type AtualizacaoSerieInput = {
  id: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoPorLado: boolean;
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
      peso_por_lado: input.pesoPorLado,
    })
    .eq("id", input.id);
  if (error) {
    const mensagem = `Falha ao atualizar série: ${error.message}`;
    throw new Error(ehErroPermanenteDoPostgres(error.code) ? marcarComoPermanente(mensagem) : mensagem);
  }
  revalidatePath("/treino/[id]", "page");
  revalidatePath("/");
}

/** Exclui uma série. A RLS impede excluir série de outro usuário. */
export async function excluirSerieRemoto(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("serie").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir série: ${error.message}`);
  revalidatePath("/treino/[id]", "page");
  revalidatePath("/");
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
