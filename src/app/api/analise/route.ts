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
import { registrarUso, tetoAtingido, TETO_DIARIO } from "@/lib/dados/uso-ia";
import type { FalhaMotivo } from "@/lib/dados/parecer";
import {
  perguntaValida,
  perguntasDoIdioma,
  PERGUNTA_PRESCRICAO,
  type NumeroPergunta,
} from "./perguntas";
import { obterIdioma, type Idioma } from "@/lib/dados/idioma";
import { mapaTraducaoExercicios, mapaTraducaoGrupos } from "@/lib/dados/traducao";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import { limparRascunhosExpirados } from "@/lib/dados/parecer";
import { carregarVinculoDoAluno } from "@/lib/dados/personal";

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

/**
 * Todos os treinos do usuário informado, já com as séries.
 *
 * O FILTRO É EXPLÍCITO, e o comentário antigo desta função ("RLS filtra")
 * deixou de ser verdade na migração 0022: um personal com vínculo aceito
 * enxerga treino e série do aluno, então a consulta sem filtro traria as
 * duas pessoas — e este é o caminho da PEÇA-ASSINATURA. O parecer do
 * personal sairia somando o treino do aluno ao dele, citando exercício que
 * ele nunca fez, sem erro nenhum em lugar nenhum.
 */
async function carregarTreinosDoUsuario(
  supabase: ClienteSupabaseServidor,
  usuarioId: string,
): Promise<TreinoBruto[]> {
  const { data, error } = await supabase
    .from("treino")
    .select(
      "id, data, serie (id, exercicio_id, tipo, reps, peso, rir, peso_por_lado)",
    )
    .eq("usuario_id", usuarioId);
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
  usuarioId,
  rascunhoId,
  pergunta,
  idioma,
}: {
  supabase: ClienteSupabaseServidor;
  /** Dono do parecer. Explícito desde a 0022 — ver `carregarTreinosDoUsuario`. */
  usuarioId: string;
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
      carregarTreinosDoUsuario(supabase, usuarioId),
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

  // A TRAVA DA PRESCRIÇÃO (PRD §11.2 e §11.4.1), e por que ela mora AQUI.
  //
  // Esconder o card da pergunta 5 na tela não fecha nada: este endpoint
  // aceita `{ pergunta: 5 }` de qualquer cliente autenticado — aba antiga
  // aberta antes do vínculo, service worker com HTML em cache, ou curl. A
  // linha "aluno vinculado não vê a prescrição" da §11.2 só é verdade se o
  // servidor recusar; a tela é a parte decorativa desta dupla.
  //
  // POSIÇÃO NÃO É ARBITRÁRIA — três coisas acontecem logo abaixo e nenhuma
  // pode acontecer num pedido que vai ser recusado:
  //   1. `registrarUso` grava consumo IMUTÁVEL (a cota de 20/dia é gasta
  //      pela tentativa, por decisão de 2026-09-05). Recusar depois dele
  //      cobraria do aluno uma pergunta que o app nunca responde.
  //   2. o rascunho de `parecer` é inserido com status "gerando" — recusar
  //      depois deixaria linha órfã presa no teto de geração em andamento.
  //   3. `limparRascunhosExpirados` escreve no banco; pedido recusado não
  //      tem por que disparar efeito nenhum.
  //
  // Falha na leitura do vínculo RECUSA (fecha), não libera: liberar em erro
  // transforma instabilidade de rede em vazamento de escopo.
  if (pergunta === PERGUNTA_PRESCRICAO) {
    let temPersonal: boolean;
    try {
      temPersonal = (await carregarVinculoDoAluno()) !== null;
    } catch (erro) {
      console.error(
        "[analise] falha ao ler vínculo para a trava da prescrição:",
        erro instanceof Error ? erro.message : erro,
      );
      return NextResponse.json(
        { erro: "Não foi possível verificar seu vínculo. Tente de novo." },
        { status: 503 },
      );
    }
    if (temPersonal) {
      return NextResponse.json({ erro: "prescricao_do_personal" }, { status: 403 });
    }
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

  // Teto diário (migration 0020). A contagem saiu da tabela `parecer` e
  // veio para `uso_ia`, o que fecha o furo documentado em DECISIONS
  // 2026-09-05: contar linhas de `parecer` deixava quem DESCARTAVA um
  // rascunho recuperar a vaga sem recuperar a cota já gasta na Gemini.
  // Consumo é imutável — a chamada foi feita, ponto.
  if (await tetoAtingido(supabase, user.id, "parecer")) {
    return NextResponse.json(
      { erro: "limite_diario", limite: TETO_DIARIO.parecer },
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

  // DESEMPATE entre pedidos simultâneos (achado M5, QA, 2026-09-13).
  //
  // A checagem de "geração em andamento" lá em cima não é atômica com o
  // insert: dois POST ao mesmo tempo passavam os dois por ela, criavam dois
  // rascunhos e gastavam duas vagas da cota de 5/dia. Agora cada pedido
  // grava o PRÓPRIO rascunho primeiro e só então olha quem está gerando: o
  // mais antigo (criado_em, depois id) segue; os outros apagam o rascunho
  // que criaram e respondem o mesmo 409. Como a ordem é a mesma para todos,
  // os dois pedidos concordam sobre quem venceu.
  //
  // `registrarUso` veio para DEPOIS do desempate: só o vencedor chama a
  // Gemini, então só ele gasta cota.
  //
  // Limite honesto: sem transação, um pedido pode ler antes de o outro
  // gravar (janela de milissegundos, leitura "read committed"). A garantia
  // total é um índice único parcial em `parecer (usuario_id) where status =
  // 'gerando'` — migração, decisão do dono (DECISIONS 2026-09-13 (4)).
  const { data: primeiro, error: erroDesempate } = await supabase
    .from("parecer")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("status", "gerando")
    .order("criado_em", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (erroDesempate) {
    console.error("[analise] falha no desempate de geração:", erroDesempate.message);
  }
  if (primeiro && primeiro.id !== rascunho.id) {
    const { error: erroDesfazer } = await supabase.from("parecer").delete().eq("id", rascunho.id);
    if (erroDesfazer) {
      console.error("[analise] não apagou o rascunho perdedor:", erroDesfazer.message);
    }
    return NextResponse.json({ erro: "geracao_em_andamento" }, { status: 409 });
  }

  await registrarUso(supabase, user.id, "parecer");

  after(() =>
    gerarESalvarParecer({
      supabase,
      usuarioId: user.id,
      rascunhoId: rascunho.id,
      pergunta: pergunta as NumeroPergunta,
      idioma,
    }),
  );

  return NextResponse.json({ ok: true, rascunhoId: rascunho.id }, { status: 202 });
}
