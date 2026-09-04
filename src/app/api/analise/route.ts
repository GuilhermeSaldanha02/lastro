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
import { leituraDeterministica } from "@/lib/analise/leitura-deterministica";
import { motivoDoErro } from "./retry-transitorio";
import type { FalhaMotivo } from "@/lib/dados/parecer";
import { perguntaValida, perguntasDoIdioma, type NumeroPergunta } from "./perguntas";
import { obterIdioma, type Idioma } from "@/lib/dados/idioma";
import { mapaTraducaoExercicios, mapaTraducaoGrupos } from "@/lib/dados/traducao";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import { limparRascunhosExpirados } from "@/lib/dados/parecer";

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


/**
 * Fallback determinístico (SDD §6.4, política de retry, 2ª falha) — sem LLM.
 *
 * Delegado a `leitura-deterministica.ts` desde 2026-09-04. O template que
 * vivia aqui era um despejo de fatos, uma linha por número ("Volume total
 * em 2026-08-24: 60751."). Honesto, e o pior rosto possível para a
 * peça-assinatura de um produto cuja tese é "o log e o gráfico são
 * infraestrutura; o produto é a LEITURA" (PRD §1): quando a IA falhava, o
 * app entregava um extrato bancário.
 *
 * E a IA falha com frequência real — 503 em três dias distintos, medição em
 * DECISIONS.md 2026-09-04. Não é caminho de exceção.
 */
function fallbackDeterministico(resumo: ResumoCompacto, idioma: Idioma): string {
  return leituraDeterministica(resumo, idioma);
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
    /** Por que a IA não saiu. `null` quando saiu (migration 0019). */
    falhaMotivo?: FalhaMotivo | null;
    evidencia: EvidenciaParaTela;
  }) {
    const { error } = await supabase
      .from("parecer")
      .update({
        status: "pronto",
        texto: campos.texto,
        evidencia: campos.evidencia,
        aviso_falha_interpretativa: campos.avisoFalhaInterpretativa,
        falha_motivo: campos.falhaMotivo ?? null,
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

    // Ancorado no calendário de Brasília (src/lib/tempo.ts), não UTC —
    // `semanas.ts` trata todo Date recebido como calendário Y-M-D via
    // getUTC*; sem essa conversão, checar a Análise à noite podia calcular
    // a semana errada perto da virada do dia.
    const agora = paraDataUTC(dataLocalBrasil());
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });

    if (resumo.versao !== 1) {
      throw new Error(`resumo em versão inesperada: ${resumo.versao}`);
    }

    const { sistema, usuario, contexto } = montarPrompt(resumo, pergunta, agora, idioma);
    const cliente = new ClienteParecerGemini();
    const evidencia = montarEvidenciaParaTela(resumo);

    // Guarda a causa de cada falha para gravar em `falha_motivo` (0019).
    // Sem isto, 503, 429, 404 e "validador rejeitou" viravam o mesmo
    // booleano e ninguém conseguia responder, depois do fato, por que o
    // parecer saiu sem prosa — o log da Vercel dura 1 hora.
    let motivo: FalhaMotivo = "validador_rejeitou";

    let respostaUm: string | null = null;
    try {
      respostaUm = await cliente.gerar(sistema, usuario);
    } catch (erroGiac) {
      motivo = motivoDoErro(erroGiac);
      console.error("[analise] falha na chamada inicial da Gemini:", motivo, erroGiac);
    }

    if (respostaUm) {
      let resultado = validarNumeros(respostaUm, resumo, contexto, idioma);
      console.log("[analise] tentativa 1", { pergunta, resultado, respostaBruta: respostaUm });

      if (resultado.ok) {
        await salvar({ texto: respostaUm, avisoFalhaInterpretativa: false, evidencia });
        return;
      }

      // 1ª falha (SDD §6.4, tabela): uma nova chamada, com o parecer rejeitado
      // e os intrusos anexados. Instrução de retry também é lida pelo modelo.
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
        motivo = motivoDoErro(erroRetry);
        console.error("[analise] falha no retry da Gemini:", motivo, erroRetry);
      }
    }

    // 2ª falha ou indisponibilidade da API: Fallback determinístico + aviso
    // (SDD.md §6.4) — a evidência estruturada continua íntegra.
    await salvar({
      texto: fallbackDeterministico(resumo, idioma),
      avisoFalhaInterpretativa: true,
      falhaMotivo: motivo,
      evidencia,
    });
  } catch (erroGeral) {
    // Sem HTTP response pra devolver aqui (o cliente já recebeu o 202).
    // A linha fica em 'gerando' — a trava de LIMITE_GERACAO_TRAVADA_MINUTOS
    // (SDD.md §11.2) libera sozinha, sem intervenção.
    console.error("[analise] erro inesperado ao gerar parecer:", erroGeral);
  }
}

/**
 * Teto de gerações por dia, por usuário.
 *
 * POR QUE EXISTE. A cota do nível gratuito da Gemini é de **20 requisições
 * por dia** (`KNOWLEDGE.md` §3.2) e ela é COMPARTILHADA com o Coach 24h —
 * é o mesmo cliente, a mesma chave. Sem teto, uma tarde de curiosidade
 * consome a cota inteira e o Coach para junto.
 *
 * POR QUE 5, E NÃO UM INTERVALO ENTRE GERAÇÕES. O `PRD.md` §3 define 5
 * perguntas padrão: sentar e fazer duas ou três numa sessão é o uso
 * pretendido, e um cooldown de horas puniria exatamente isso. O teto
 * diário protege a cota sem quebrar a sessão — e 5 é o número que deixa
 * fazer todas as cinco perguntas no mesmo dia.
 *
 * Custo real por geração: 1 chamada quando o validador aprova de primeira,
 * 2 quando rejeita, 3 no pior caso (retry de 503). Com 5, o pior caso é 15
 * e sobram 5 para o Coach.
 *
 * LIMITE CONHECIDO: a contagem é de linhas em `parecer` criadas hoje, e
 * descartar um rascunho apaga a linha — quem descartar recupera a vaga sem
 * recuperar a cota já gasta na Gemini. Aceito por ora (app de um usuário);
 * fechar isso exigiria uma tabela de log de consumo, que é peso demais
 * para o problema. Revisitar quando o módulo Personal (PRD §11) colocar
 * mais gente na MESMA chave — aí o teto por usuário deixa de proteger o
 * teto global.
 */
const LIMITE_GERACOES_POR_DIA = 5;

/**
 * Teto de duração EXPLÍCITO, não herdado do padrão da plataforma.
 *
 * A geração roda dentro de `after()` — a function segue viva depois da
 * resposta HTTP (SDD §11) — e desde 2026-09-04 pode fazer até 3 chamadas à
 * Gemini num caminho ruim (primária, repetição, modelo alternativo). Uma
 * geração normal já leva 30-50s. Depender de um default não verificado
 * significa que, se ele mudar ou for menor do que supomos, a geração é
 * cortada no meio e o parecer some sem erro nenhum — mesmo raciocínio do
 * `runtime = nodejs` fixado em /api/parecer/[id]/pdf.
 */
export const maxDuration = 60;

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
  await limparRascunhosExpirados(supabase, user.id);

  const { data: emAndamento, error: erroChecagem } = await supabase
    .from("parecer")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("status", "gerando")
    .limit(1)
    .maybeSingle();
  if (erroChecagem) {
    console.error("[analise] falha ao checar geração em andamento:", erroChecagem.message);
  }
  if (emAndamento) {
    return NextResponse.json({ erro: "geracao_em_andamento" }, { status: 409 });
  }

  // Teto diário (ver LIMITE_GERACOES_POR_DIA). O corte é o DIA LOCAL do
  // Brasil, não UTC: às 22h de Brasília já é o dia seguinte em UTC, e o
  // dono teria a cota renovada três horas antes da meia-noite dele.
  const inicioDoDiaLocal = `${dataLocalBrasil()}T00:00:00-03:00`;
  const { count: geracoesHoje, error: erroContagem } = await supabase
    .from("parecer")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id)
    .gte("criado_em", inicioDoDiaLocal);
  if (erroContagem) {
    // Falha de contagem não bloqueia: negar por causa de um erro nosso é
    // pior do que deixar passar uma geração a mais.
    console.error("[analise] falha ao contar gerações do dia:", erroContagem.message);
  } else if ((geracoesHoje ?? 0) >= LIMITE_GERACOES_POR_DIA) {
    return NextResponse.json(
      { erro: "limite_diario", limite: LIMITE_GERACOES_POR_DIA },
      { status: 429 },
    );
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
