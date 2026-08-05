/**
 * lastro · SDD.md §6.1 — as 5 perguntas padrão da Análise Semanal (PRD §3).
 * Texto fixo, sem lógica — a pergunta escolhida indexa este array.
 */

export type NumeroPergunta = 1 | 2 | 3 | 4 | 5;

export const PERGUNTAS: Record<NumeroPergunta, string> = {
  1: "Estou progredindo?",
  2: "Onde eu empaquei?",
  3: "Meu volume está equilibrado?",
  4: "Estou treinando demais ou de menos?",
  5: "O que mudar na próxima semana?",
};

export function perguntaValida(valor: unknown): valor is NumeroPergunta {
  return valor === 1 || valor === 2 || valor === 3 || valor === 4 || valor === 5;
}
