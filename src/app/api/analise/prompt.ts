// lastro · SDD.md §6.3 — monta o prompt a partir do ResumoCompacto.
// Função PURA: nenhuma chamada de rede, nenhum import de @google/genai (FF1
// vive só em gemini.ts/route.ts).
import type { ResumoCompacto } from "@/lib/analise/tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { perguntasDoIdioma, type NumeroPergunta } from "./perguntas";

/**
 * SYSTEM_INSTRUCTION por idioma (módulo de idiomas, etapa 3/4). As
 * travas do SDD §6.3 são as mesmas em qualquer idioma — só o texto
 * muda. Duas travas mudam de CONTEÚDO, não só de tradução:
 *
 * - Idioma de escrita: cada bloco troca "português do Brasil" pelo
 *   nome do idioma alvo.
 * - Convenção numérica (achado do dono ao decidir a etapa, 2026-08-24):
 *   PT-BR e ES usam vírgula decimal ("11,5%"); EN usa ponto decimal
 *   ("11.5%") — são convenções OPOSTAS. Sem esta trava por idioma, o
 *   parecer em inglês escreveria "11,5%" (formato errado no idioma) e o
 *   validador (`validador.ts`) — que também precisa saber qual
 *   convenção esperar — rejeitaria "11.5" como intruso mesmo quando o
 *   número bate.
 *
 * Nomes de campo do JSON (`volume_por_grupo_muscular`, `series_valendo`,
 * `posicao_na_faixa: "abaixo"|"dentro"|"acima"` etc.) continuam em
 * PT-BR em QUALQUER idioma — são termos de contrato do domínio
 * (KNOWLEDGE.md §1, "sem tradução"), não texto pra pessoa ler. A
 * instrução final de cada idioma diz ao modelo pra interpretar esses
 * códigos e escrever a PROSA no idioma certo, nunca citar a chave
 * PT-BR literal.
 */
const SYSTEM_INSTRUCTION_POR_IDIOMA: Record<Idioma, string> = {
  "pt-BR": [
    "Você interpreta métricas de treino já calculadas. Escreva em português do Brasil, direto, sem jargão de coach.",
    "Você NÃO faz contas. Todo número que você citar deve aparecer literalmente no JSON abaixo.",
    "Campo ausente significa dado indisponível. Diga que não há dado. NUNCA estime, complete ou infira valor ausente.",
    "Não prescreva programa nem periodização (o app analisa o que foi feito).",
    "Não dê instrução de execução, forma ou técnica de movimento.",
    "Faixas de referência são convenção prática derivada de média de estudos, não alvo individual.",
    "Escreva em PROSA CORRIDA, parágrafos separados por linha em branco. PROIBIDO usar markdown: sem #, sem **, sem listas com * ou -, sem crase. Números aparecem soltos no texto, sem marcação nenhuma ao redor.",
    "Números decimais em vírgula, nunca em ponto: \"11,5%\", nunca \"11.5 por cento\" nem \"11.5%\". É português do Brasil, não inglês.",
    "As chaves do JSON (ex.: \"posicao_na_faixa\": \"abaixo\") são códigos internos do sistema, nunca cite a chave literal — traduza o SENTIDO para prosa natural.",
    "A PRIMEIRA FRASE do parecer é o veredito: responde a pergunta direto, citando pelo menos um nome de exercício e um número específicos deste JSON. NUNCA abra com uma frase genérica tipo \"sim, você está progredindo\" sem exercício e número — essa frase é a que a tela mostra maior que todo o resto.",
  ].join("\n"),
  en: [
    "You interpret already-calculated workout metrics. Write in English, direct, no coach jargon.",
    "You do NOT do math. Every number you cite must appear literally in the JSON below.",
    "A missing field means the data is unavailable. Say there is no data. NEVER estimate, complete, or infer a missing value.",
    "Do not prescribe a program or periodization (the app analyzes what was already done).",
    "Do not give execution, form, or movement-technique instructions.",
    "Reference ranges are a practical convention derived from study averages, not an individual target.",
    "Write in FLOWING PROSE, paragraphs separated by a blank line. NO markdown allowed: no #, no **, no * or - lists, no backticks. Numbers appear plain in the text, with no markup around them.",
    "Decimal numbers use a period, never a comma: \"11.5%\", never \"11,5 percent\" nor \"11,5%\". This is English, not Portuguese or Spanish.",
    "The JSON keys (e.g. \"posicao_na_faixa\": \"abaixo\") are internal system codes in Portuguese — never quote the literal key, translate the MEANING into natural English prose (\"abaixo\" = below, \"dentro\" = within, \"acima\" = above the reference range).",
    "The FIRST SENTENCE of the report is the verdict: it answers the question directly, citing at least one exercise name and one specific number from this JSON. NEVER open with a generic line like \"yes, you're progressing\" without an exercise and a number — the screen displays this sentence larger than everything else.",
  ].join("\n"),
  es: [
    "Interpretas métricas de entrenamiento ya calculadas. Escribe en español, directo, sin jerga de coach.",
    "NO haces cuentas. Todo número que cites debe aparecer literalmente en el JSON de abajo.",
    "Campo ausente significa dato no disponible. Di que no hay dato. NUNCA estimes, completes o infieras un valor ausente.",
    "No prescribas programa ni periodización (la app analiza lo que ya se hizo).",
    "No des instrucciones de ejecución, forma o técnica de movimiento.",
    "Los rangos de referencia son una convención práctica derivada de promedios de estudios, no un objetivo individual.",
    "Escribe en PROSA CORRIDA, párrafos separados por línea en blanco. PROHIBIDO usar markdown: sin #, sin **, sin listas con * o -, sin comillas invertidas. Los números aparecen sueltos en el texto, sin marcado alrededor.",
    "Números decimales con coma, nunca con punto: \"11,5%\", nunca \"11.5 por ciento\" ni \"11.5%\". Es español, no inglés.",
    "Las claves del JSON (ej.: \"posicao_na_faixa\": \"abaixo\") son códigos internos del sistema en portugués — nunca cites la clave literal, traduce el SENTIDO a prosa natural en español (\"abaixo\" = por debajo, \"dentro\" = dentro, \"acima\" = por encima del rango de referencia).",
    "La PRIMERA FRASE del informe es el veredicto: responde la pregunta directamente, citando al menos un nombre de ejercicio y un número específicos de este JSON. NUNCA abras con una frase genérica tipo \"sí, estás progresando\" sin ejercicio ni número — esa frase es la que la pantalla muestra más grande que todo el resto.",
  ].join("\n"),
};

const CRITERIO_QUALIDADE_POR_IDIOMA: Record<Idioma, string> = {
  "pt-BR":
    "Cite ao menos um nome de exercício e um número específicos deste JSON. Um parecer que serviria para qualquer pessoa é uma resposta errada.",
  en: "Cite at least one exercise name and one specific number from this JSON. A report that could apply to anyone is a wrong answer.",
  es: "Cita al menos un nombre de ejercicio y un número específicos de este JSON. Un informe que serviría para cualquier persona es una respuesta incorrecta.",
};

export type PromptMontado = {
  sistema: string;
  usuario: string;
  /**
   * Inteiros ESTRUTURAIS injetados no prompt além do que já vive em
   * `resumo` — comprimento de listas e a data de emissão (`agora`).
   * SDD §6.4: nunca prova especificidade, só evita falso intruso.
   */
  contexto: number[];
};

function componentesData(data: Date): number[] {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth() + 1;
  const dia = data.getUTCDate();
  return [ano, mes, dia, ano % 100];
}

function comprimentosDeLista(resumo: ResumoCompacto): number[] {
  return [
    resumo.volume_semanal.length,
    resumo.volume_por_grupo_muscular.length,
    resumo.volume_por_exercicio.length,
    resumo.tendencia_e1rm.length,
    resumo.estagnacoes.length,
    resumo.prs.length,
  ];
}

const PREAMBULO_DADOS_POR_IDIOMA: Record<Idioma, string> = {
  "pt-BR": "Estes são os únicos dados que existem:",
  en: "This is the only data that exists:",
  es: "Estos son los únicos datos que existen:",
};

/** Monta os três blocos do prompt, nesta ordem exata (SDD §6.3). */
export function montarPrompt(
  resumo: ResumoCompacto,
  pergunta: NumeroPergunta,
  agora: Date,
  idioma: Idioma,
): PromptMontado {
  const usuario = [
    PREAMBULO_DADOS_POR_IDIOMA[idioma],
    "```json",
    JSON.stringify(resumo),
    "```",
    perguntasDoIdioma(idioma)[pergunta],
    CRITERIO_QUALIDADE_POR_IDIOMA[idioma],
  ].join("\n\n");

  return {
    sistema: SYSTEM_INSTRUCTION_POR_IDIOMA[idioma],
    usuario,
    contexto: [...comprimentosDeLista(resumo), ...componentesData(agora)],
  };
}
