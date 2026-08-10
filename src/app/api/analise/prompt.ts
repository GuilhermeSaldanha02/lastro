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
