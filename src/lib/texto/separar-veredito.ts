/**
 * lastro · DESIGN.md §3.6.2 — a PRIMEIRA FRASE do parecer é o veredito, e a
 * tela o destaca em tamanho maior que o resto (`--lastro-papel-numero-heroi`).
 * O prompt
 * (`src/app/api/analise/prompt.ts`) instrui o modelo a abrir com uma frase
 * específica — verificado empiricamente contra `/api/analise` real
 * (DECISIONS.md 2026-08-10). Esta função só faz o corte, não julga
 * qualidade do texto: se o prompt falhar, a "frase" pode sair genérica,
 * mas ainda assim é só a primeira frase, nunca um resumo inventado.
 */
export function separarVeredito(texto: string): {
  veredito: string;
  corpo: string;
} {
  const bruto = texto.trim();
  const match = bruto.match(/^(.+?[.!?])(?:\s+|$)([\s\S]*)$/);
  if (!match) return { veredito: bruto, corpo: "" };
  return { veredito: match[1].trim(), corpo: match[2].trim() };
}
