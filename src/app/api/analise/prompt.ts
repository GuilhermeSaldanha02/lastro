// lastro · SDD.md §6.3 — monta o prompt a partir do ResumoCompacto.
// Função PURA: nenhuma chamada de rede, nenhum import de @google/genai (FF1
// vive só em gemini.ts/route.ts).
import type { ResumoCompacto } from "@/lib/analise/tipos";
import { PERGUNTAS, type NumeroPergunta } from "./perguntas";

// Travas literais do SDD §6.3 — coladas, não parafraseadas.
const SYSTEM_INSTRUCTION = [
  "Você interpreta métricas de treino já calculadas. Escreva em português do Brasil, direto, sem jargão de coach.",
  "Você NÃO faz contas. Todo número que você citar deve aparecer literalmente no JSON abaixo.",
  "Campo ausente significa dado indisponível. Diga que não há dado. NUNCA estime, complete ou infira valor ausente.",
  "Não prescreva programa nem periodização (o app analisa o que foi feito).",
  "Não dê instrução de execução, forma ou técnica de movimento.",
  "Faixas de referência são convenção prática derivada de média de estudos, não alvo individual.",
  // 2026-08-10 (DESIGN.md §3.6.1/§3.6.2) — a tela renderiza este texto como
  // prosa lisa, sem parser de markdown. Achado real: sem esta trava o
  // modelo devolvia "###", "**negrito**", "* bullet" e crase de código,
  // que apareceriam literais na tela.
  "Escreva em PROSA CORRIDA, parágrafos separados por linha em branco. PROIBIDO usar markdown: sem #, sem **, sem listas com * ou -, sem crase. Números aparecem soltos no texto, sem marcação nenhuma ao redor.",
  "Números decimais em vírgula, nunca em ponto: \"11,5%\", nunca \"11.5 por cento\" nem \"11.5%\". É português do Brasil, não inglês.",
  // A primeira frase é o VEREDITO — a tela a destaca em tamanho maior que
  // o resto (DESIGN.md §3.6.2). Uma abertura genérica ("sim, você está
  // progredindo") falha o propósito da peça: o dono já rejeitou uma versão
  // sem isso como "sem vida".
  "A PRIMEIRA FRASE do parecer é o veredito: responde a pergunta direto, citando pelo menos um nome de exercício e um número específicos deste JSON. NUNCA abra com uma frase genérica tipo \"sim, você está progredindo\" sem exercício e número — essa frase é a que a tela mostra maior que todo o resto.",
].join("\n");

const CRITERIO_QUALIDADE =
  "Cite ao menos um nome de exercício e um número específicos deste JSON. Um parecer que serviria para qualquer pessoa é uma resposta errada.";

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

/** Monta os três blocos do prompt, nesta ordem exata (SDD §6.3). */
export function montarPrompt(
  resumo: ResumoCompacto,
  pergunta: NumeroPergunta,
  agora: Date,
): PromptMontado {
  const usuario = [
    "Estes são os únicos dados que existem:",
    "```json",
    JSON.stringify(resumo),
    "```",
    PERGUNTAS[pergunta],
    CRITERIO_QUALIDADE,
  ].join("\n\n");

  return {
    sistema: SYSTEM_INSTRUCTION,
    usuario,
    contexto: [...comprimentosDeLista(resumo), ...componentesData(agora)],
  };
}
