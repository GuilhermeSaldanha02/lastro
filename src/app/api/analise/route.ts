// lastro · SDD.md §6.2 — route handler da Gemini (D5).
// ÚNICO lugar do repo (com gemini.ts, mesma pasta) que importa
// @google/genai (FF1).
//
// Contrato: POST /api/analise · corpo { pergunta: 1|2|3|4|5 } — e nada mais.
// O cliente NUNCA envia resumo nem séries: o handler autentica, lê as
// séries do usuário no Supabase, chama `montarResumoCompacto` e só então
// monta o prompt. Isso torna estruturalmente impossível o cliente injetar
// dado cru no prompt.
import { NextResponse, after } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { montarResumoCompacto } from "@/lib/analise/agregar";
import { paraDataUTC } from "@/lib/analise/semanas";
import type {
  ExercicioBruto,
  ResumoCompacto,
  TreinoBruto,
} from "@/lib/analise/tipos";
import { dataLocalBrasil } from "@/lib/tempo";
import { ClienteParecerGemini } from "./gemini";
import { montarEvidenciaParaTela } from "./evidencia";
import type { EvidenciaParaTela } from "./evidencia";
import { montarPrompt } from "./prompt";
import { validarNumeros } from "./validador";
import { perguntaValida, perguntasDoIdioma, type NumeroPergunta } from "./perguntas";
import { obterIdioma, type Idioma } from "@/lib/dados/idioma";
import { mapaTraducaoExercicios, mapaTraducaoGrupos } from "@/lib/dados/traducao";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import {
  LIMITE_GERACAO_TRAVADA_MINUTOS,
  EXPIRA_RASCUNHO_HORAS,
} from "@/lib/dados/parecer";

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

type LinhaSerie = {
  id: string;
  exercicio_id: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  peso_por_lado: boolean;
};

type LinhaTreino = {
  id: string;
  data: string;
  serie: LinhaSerie[] | null;
};

type LinhaExercicio = {
  id: string;
  nome: string;
  grupo_muscular_primario: string;
  unilateral: boolean;
  peso_por_lado: boolean;
};

/** Todos os treinos do usuário logado (RLS filtra), já com as séries. */
async function carregarTreinosDoUsuario(
  supabase: ClienteSupabaseServidor,
): Promise<TreinoBruto[]> {
  const { data, error } = await supabase
    .from("treino")
    .select(
      "id, data, serie (id, exercicio_id, tipo, reps, peso, rir, peso_por_lado)",
    );
  if (error) throw new Error(`Falha ao carregar treinos: ${error.message}`);

  return ((data ?? []) as unknown as LinhaTreino[]).map((t) => ({
    id: t.id,
    data: t.data,
    series: (t.serie ?? []).map((s) => ({
      id: s.id,
      exercicioId: s.exercicio_id,
      tipo: s.tipo,
      reps: s.reps,
      peso: Number(s.peso),
      rir: s.rir ?? undefined,
      pesoPorLado: s.peso_por_lado,
    })),
  }));
}

/**
 * Catálogo de exercícios — dado compartilhado, não filtrado por usuário.
 *
 * Nome e grupo muscular JÁ CHEGAM traduzidos pro idioma da pessoa
 * (módulo de idiomas, etapa 3/4, decisão tomada com o dono 2026-08-24):
 * o parecer da Gemini cita nome de exercício na primeira frase (trava
 * do `prompt.ts`), e se o modelo tivesse que traduzir "Supino reto com
 * halteres" na hora, sairia um nome diferente a cada chamada —
 * inconsistente entre pareceres. Traduzindo aqui, ANTES do agregador,
 * o resumo que chega no JSON do prompt já é a única fonte, em qualquer
 * idioma — o LLM só cita o que está lá, nunca inventa nome.
 */
async function carregarExercicios(
  supabase: ClienteSupabaseServidor,
  idioma: Idioma,
): Promise<ExercicioBruto[]> {
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral, peso_por_lado");
  if (error) throw new Error(`Falha ao carregar exercícios: ${error.message}`);

  const [traducaoExercicios, traducaoGrupos] = await Promise.all([
    mapaTraducaoExercicios(idioma),
    mapaTraducaoGrupos(idioma),
  ]);

  return ((data ?? []) as LinhaExercicio[]).map((e) => ({
    id: e.id,
    nome: traducaoExercicios.get(e.id) ?? e.nome,
    // O mais caro dos três vazamentos da mesma raiz (2026-08-27): em pt-BR
    // `mapaTraducaoGrupos` devolve mapa vazio, então este `??` disparava
    // SEMPRE no idioma padrão e a CHAVE DO BANCO (`posterior_coxa`) entrava
    // no resumo que vai pro prompt — saindo impressa no parecer, que é a
    // peça-assinatura. Mesma razão do comentário acima sobre traduzir ANTES
    // do agregador: o resumo é a única fonte que o LLM pode citar, então
    // precisa chegar legível, não com identificador de tabela.
    grupoMuscularPrimario:
      traducaoGrupos.get(e.grupo_muscular_primario) ??
      formatarGrupoMuscular(e.grupo_muscular_primario, idioma),
    unilateral: e.unilateral,
    pesoPorLado: e.peso_por_lado,
  }));
}

/** Rótulo de `posicao_na_faixa` — enum de contrato em PT-BR (tipos.ts), traduzido só pra exibição. */
const POSICAO_FAIXA_POR_IDIOMA: Record<Idioma, Record<ResumoCompacto["volume_por_grupo_muscular"][number]["posicao_na_faixa"], string>> = {
  "pt-BR": { abaixo: "abaixo", dentro: "dentro", acima: "acima" },
  en: { abaixo: "below", dentro: "within", acima: "above" },
  es: { abaixo: "por debajo de", dentro: "dentro de", acima: "por encima de" },
};

/**
 * Fallback determinístico (SDD §6.4, política de retry, 2ª falha):
 * template em código, sem prosa do LLM, montado só do resumo. Sem LLM
 * envolvido aqui — precisa do próprio idioma-aware, não só o prompt
 * (achado do dono ao decidir a etapa, 2026-08-24: "tudo", inclusive o
 * caminho que não passa pela Gemini).
 */
function fallbackDeterministico(resumo: ResumoCompacto, idioma: Idioma): string {
  const posicaoFaixa = POSICAO_FAIXA_POR_IDIOMA[idioma];
  const linhas: string[] = [];

  if (idioma === "en") {
    linhas.push(
      `Week of ${resumo.periodo.semana_atual_inicio} — ${resumo.periodo.semanas_com_dados} of ${resumo.periodo.janela_semanas} weeks in the window have data.`,
    );
    for (const v of resumo.volume_semanal) {
      linhas.push(`Total volume on ${v.semana_inicio}: ${v.volume_total}.`);
    }
    for (const g of resumo.volume_por_grupo_muscular) {
      const delta =
        g.delta_volume_pct !== undefined ? ` (${g.delta_volume_pct}% vs. previous week)` : "";
      linhas.push(
        `${g.grupo_muscular}: ${g.series_valendo} working sets, volume ${g.volume}${delta} — ${posicaoFaixa[g.posicao_na_faixa]} the reference range.`,
      );
    }
    for (const t of resumo.tendencia_e1rm) {
      linhas.push(
        `${t.exercicio}: e1RM from ${t.e1rm_inicial} to ${t.e1rm_atual} (${t.delta_pct}%), over ${t.sessoes} sessions.`,
      );
    }
    for (const e of resumo.estagnacoes) {
      linhas.push(`${e.exercicio}: ${e.semanas_sem_progresso} weeks without progress.`);
    }
    for (const p of resumo.prs) {
      linhas.push(`PR in ${p.exercicio} (${p.tipo}): ${p.valor} (previous ${p.valor_anterior}).`);
    }
    linhas.push(`Frequency this week: ${resumo.frequencia.treinos_semana_atual} workout(s).`);
    if (resumo.frequencia.grupos_sem_estimulo.length > 0) {
      linhas.push(`No stimulus this week: ${resumo.frequencia.grupos_sem_estimulo.join(", ")}.`);
    }
    return linhas.join("\n");
  }

  if (idioma === "es") {
    linhas.push(
      `Semana del ${resumo.periodo.semana_atual_inicio} — ${resumo.periodo.semanas_com_dados} de ${resumo.periodo.janela_semanas} semanas de la ventana con datos.`,
    );
    for (const v of resumo.volume_semanal) {
      linhas.push(`Volumen total en ${v.semana_inicio}: ${v.volume_total}.`);
    }
    for (const g of resumo.volume_por_grupo_muscular) {
      const delta =
        g.delta_volume_pct !== undefined ? ` (${g.delta_volume_pct}% vs. semana anterior)` : "";
      linhas.push(
        `${g.grupo_muscular}: ${g.series_valendo} series válidas, volumen ${g.volume}${delta} — ${posicaoFaixa[g.posicao_na_faixa]} rango de referencia.`,
      );
    }
    for (const t of resumo.tendencia_e1rm) {
      linhas.push(
        `${t.exercicio}: e1RM de ${t.e1rm_inicial} a ${t.e1rm_atual} (${t.delta_pct}%), en ${t.sessoes} sesiones.`,
      );
    }
    for (const e of resumo.estagnacoes) {
      linhas.push(`${e.exercicio}: ${e.semanas_sem_progresso} semanas sin progreso.`);
    }
    for (const p of resumo.prs) {
      linhas.push(`PR en ${p.exercicio} (${p.tipo}): ${p.valor} (anterior ${p.valor_anterior}).`);
    }
    linhas.push(`Frecuencia esta semana: ${resumo.frequencia.treinos_semana_atual} entrenamiento(s).`);
    if (resumo.frequencia.grupos_sem_estimulo.length > 0) {
      linhas.push(`Sin estímulo esta semana: ${resumo.frequencia.grupos_sem_estimulo.join(", ")}.`);
    }
    return linhas.join("\n");
  }

  linhas.push(
    `Semana de ${resumo.periodo.semana_atual_inicio} — ${resumo.periodo.semanas_com_dados} de ${resumo.periodo.janela_semanas} semanas da janela com dados.`,
  );

  for (const v of resumo.volume_semanal) {
    linhas.push(`Volume total em ${v.semana_inicio}: ${v.volume_total}.`);
  }

  for (const g of resumo.volume_por_grupo_muscular) {
    const delta =
      g.delta_volume_pct !== undefined ? ` (${g.delta_volume_pct}% vs. semana anterior)` : "";
    linhas.push(
      `${g.grupo_muscular}: ${g.series_valendo} séries valendo, volume ${g.volume}${delta} — ${posicaoFaixa[g.posicao_na_faixa]} da faixa de referência.`,
    );
  }

  for (const t of resumo.tendencia_e1rm) {
    linhas.push(
      `${t.exercicio}: e1RM de ${t.e1rm_inicial} para ${t.e1rm_atual} (${t.delta_pct}%), em ${t.sessoes} sessões.`,
    );
  }

  if (resumo.estagnacoes.length > 0) {
    for (const e of resumo.estagnacoes) {
      linhas.push(`${e.exercicio}: ${e.semanas_sem_progresso} semanas sem progresso.`);
    }
  }

  for (const p of resumo.prs) {
    linhas.push(
      `PR em ${p.exercicio} (${p.tipo}): ${p.valor} (anterior ${p.valor_anterior}).`,
    );
  }

  linhas.push(
    `Frequência na semana atual: ${resumo.frequencia.treinos_semana_atual} treino(s).`,
  );
  if (resumo.frequencia.grupos_sem_estimulo.length > 0) {
    linhas.push(
      `Sem estímulo esta semana: ${resumo.frequencia.grupos_sem_estimulo.join(", ")}.`,
    );
  }

  return linhas.join("\n");
}

/** Instruções de retry (SDD §6.4, 1ª falha) — também viram texto que o modelo lê, seguem o idioma da resposta. */
const REJEITADA_POR_IDIOMA: Record<Idioma, (resposta: string) => string> = {
  "pt-BR": (r) => `Sua resposta anterior foi rejeitada: "${r}"`,
  en: (r) => `Your previous answer was rejected: "${r}"`,
  es: (r) => `Tu respuesta anterior fue rechazada: "${r}"`,
};

const INSTRUCAO_RETRY_INTRUSOS_POR_IDIOMA: Record<Idioma, (intrusos: number[]) => string> = {
  "pt-BR": (intrusos) =>
    `Os números ${intrusos.join(", ")} não existem nos dados. Reescreva usando apenas números do JSON.`,
  en: (intrusos) =>
    `The numbers ${intrusos.join(", ")} do not exist in the data. Rewrite using only numbers from the JSON.`,
  es: (intrusos) =>
    `Los números ${intrusos.join(", ")} no existen en los datos. Reescribe usando solo números del JSON.`,
};

const INSTRUCAO_RETRY_SEM_NUMERO_POR_IDIOMA: Record<Idioma, string> = {
  "pt-BR":
    "Sua resposta anterior não citou nenhum número específico do JSON. Reescreva citando ao menos um número real do JSON.",
  en: "Your previous answer did not cite any specific number from the JSON. Rewrite citing at least one real number from the JSON.",
  es: "Tu respuesta anterior no citó ningún número específico del JSON. Reescribe citando al menos un número real del JSON.",
};

async function gerarESalvarParecer({
  supabase,
  rascunhoId,
  pergunta,
  idioma,
}: {
  supabase: ClienteSupabaseServidor;
  rascunhoId: string;
  pergunta: NumeroPergunta;
  idioma: Idioma;
}): Promise<void> {
  async function salvar(campos: {
    texto: string;
    avisoFalhaInterpretativa: boolean;
    evidencia: EvidenciaParaTela;
  }) {
    const { error } = await supabase
      .from("parecer")
      .update({
        status: "pronto",
        texto: campos.texto,
        evidencia: campos.evidencia,
        aviso_falha_interpretativa: campos.avisoFalhaInterpretativa,
      })
      .eq("id", rascunhoId);
    if (error) {
      console.error("[analise] falha ao salvar parecer gerado:", error.message);
    }
  }

  try {
    const [treinos, exercicios] = await Promise.all([
      carregarTreinosDoUsuario(supabase),
      carregarExercicios(supabase, idioma),
    ]);

    const agora = paraDataUTC(dataLocalBrasil());
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });

    if (resumo.versao !== 1) {
      throw new Error(`resumo em versão inesperada: ${resumo.versao}`);
    }

    const { sistema, usuario, contexto } = montarPrompt(resumo, pergunta, agora, idioma);
    const cliente = new ClienteParecerGemini();
    const evidencia = montarEvidenciaParaTela(resumo);

    let respostaUm: string | null = null;
    try {
      respostaUm = await cliente.gerar(sistema, usuario);
    } catch (erroGiac) {
      console.error("[analise] falha na chamada inicial da Gemini:", erroGiac);
    }

    if (respostaUm) {
      let resultado = validarNumeros(respostaUm, resumo, contexto, idioma);
      console.log("[analise] tentativa 1", { pergunta, resultado, respostaBruta: respostaUm });

      if (resultado.ok) {
        await salvar({ texto: respostaUm, avisoFalhaInterpretativa: false, evidencia });
        return;
      }

      const instrucaoRetry =
        resultado.motivo === "intrusos"
          ? INSTRUCAO_RETRY_INTRUSOS_POR_IDIOMA[idioma](resultado.intrusos)
          : INSTRUCAO_RETRY_SEM_NUMERO_POR_IDIOMA[idioma];
      const usuarioRetry = [
        usuario,
        "",
        REJEITADA_POR_IDIOMA[idioma](respostaUm),
        instrucaoRetry,
      ].join("\n\n");

      try {
        const respostaDois = await cliente.gerar(sistema, usuarioRetry);
        resultado = validarNumeros(respostaDois, resumo, contexto, idioma);
        console.log("[analise] tentativa 2", { pergunta, resultado, respostaBruta: respostaDois });

        if (resultado.ok) {
          await salvar({ texto: respostaDois, avisoFalhaInterpretativa: false, evidencia });
          return;
        }
      } catch (erroRetry) {
        console.error("[analise] falha no retry da Gemini:", erroRetry);
      }
    }

    // 2ª falha ou indisponibilidade da API: Fallback determinístico + aviso
    // (SDD.md §6.4) — a evidência estruturada continua íntegra.
    await salvar({
      texto: fallbackDeterministico(resumo, idioma),
      avisoFalhaInterpretativa: true,
      evidencia,
    });
  } catch (erroGeral) {
    // Sem HTTP response pra devolver aqui (o cliente já recebeu o 202).
    // A linha fica em 'gerando' — a trava de LIMITE_GERACAO_TRAVADA_MINUTOS
    // (SDD.md §11.2) libera sozinha, sem intervenção.
    console.error("[analise] erro inesperado ao gerar parecer:", erroGeral);
  }
}

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();
  if (erroAuth || !user) {
    return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const pergunta = (corpo as { pergunta?: unknown } | null)?.pergunta;
  if (!perguntaValida(pergunta)) {
    return NextResponse.json(
      { erro: "pergunta precisa ser 1, 2, 3, 4 ou 5." },
      { status: 400 },
    );
  }

  const idioma = await obterIdioma();

  // Limpeza preguiçosa (SDD.md §11.2) antes de checar a trava.
  const geracaoTravadaDesde = new Date(
    Date.now() - LIMITE_GERACAO_TRAVADA_MINUTOS * 60_000,
  ).toISOString();
  const rascunhoExpiradoDesde = new Date(
    Date.now() - EXPIRA_RASCUNHO_HORAS * 3_600_000,
  ).toISOString();
  await supabase
    .from("parecer")
    .delete()
    .eq("usuario_id", user.id)
    .or(
      `and(status.eq.gerando,criado_em.lt.${geracaoTravadaDesde}),and(status.eq.pronto,confirmado.eq.false,criado_em.lt.${rascunhoExpiradoDesde})`,
    );

  const { data: emAndamento } = await supabase
    .from("parecer")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("status", "gerando")
    .limit(1)
    .maybeSingle();
  if (emAndamento) {
    return NextResponse.json({ erro: "geracao_em_andamento" }, { status: 409 });
  }

  const PERGUNTAS = perguntasDoIdioma(idioma);
  const { data: rascunho, error: erroInsert } = await supabase
    .from("parecer")
    .insert({
      usuario_id: user.id,
      pergunta,
      pergunta_texto: PERGUNTAS[pergunta as NumeroPergunta],
      idioma,
      status: "gerando",
      confirmado: false,
    })
    .select("id")
    .single();
  if (erroInsert || !rascunho) {
    console.error("[analise] falha ao criar rascunho:", erroInsert?.message);
    return NextResponse.json({ erro: "Falha ao iniciar a análise." }, { status: 500 });
  }

  after(() =>
    gerarESalvarParecer({
      supabase,
      rascunhoId: rascunho.id,
      pergunta: pergunta as NumeroPergunta,
      idioma,
    }),
  );

  return NextResponse.json({ ok: true, rascunhoId: rascunho.id }, { status: 202 });
}
