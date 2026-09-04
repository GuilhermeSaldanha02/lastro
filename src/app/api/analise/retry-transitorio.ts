// lastro · política de repetição para falha TRANSITÓRIA da Gemini.
//
// POR QUE ISTO EXISTE. Medição no console do AI Studio em 2026-09-04
// (DECISIONS.md): num único dia, 11 das 15 chamadas voltaram
// `503 ServiceUnavailable` — 26,7% de sucesso. Cada 503 perdia o parecer
// inteiro e queimava a trava de 10 minutos (SDD §11.2), e o dono via o
// fallback determinístico sem nenhuma pista de que a API é que não tinha
// respondido. 503 é sobrecarga do lado do Google: passa sozinha.
//
// A política NÃO é simétrica, e isso é o ponto:
//   · 503 / 500 / 502 / 504 → repete UMA vez. Transitório.
//   · 429                   → NÃO repete. É teto de cota (5 RPM / 20 RPD no
//                             nível gratuito, KNOWLEDGE §3.2). Repetir
//                             queima cota e falha de novo.
//   · 404 e demais 4xx      → NÃO repete. Determinístico; retry só esconde.
//
// Fica separado de `gemini.ts` para ser testável sem SDK e sem rede: a
// operação é uma função qualquer que devolve Promise.

/** Códigos que valem uma segunda tentativa. */
const TRANSITORIOS = new Set([500, 502, 503, 504]);

/**
 * Status HTTP de um erro do SDK. `ApiError` do `@google/genai` expõe
 * `status: number`; se um dia deixar de expor, o fallback lê o código da
 * mensagem em vez de assumir que é transitório (o padrão seguro aqui é
 * NÃO repetir).
 */
export function statusDoErro(erro: unknown): number | undefined {
  if (typeof erro === "object" && erro !== null && "status" in erro) {
    const status = (erro as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? "");
  const achado = mensagem.match(/\b(4\d{2}|5\d{2})\b/);
  return achado ? Number(achado[1]) : undefined;
}

export function ehTransitorio(erro: unknown): boolean {
  const status = statusDoErro(erro);
  return status !== undefined && TRANSITORIOS.has(status);
}

export type OpcoesRetry = {
  /** Espera antes da segunda tentativa. Curta de propósito: a rota roda dentro do teto de duração de uma function serverless. */
  esperaMs?: number;
  /** Injetável pra o teste não dormir de verdade. */
  dormir?: (ms: number) => Promise<void>;
};

const ESPERA_PADRAO_MS = 1_200;

const dormirDeVerdade = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Executa `operacao`; se ela falhar com erro transitório, tenta **uma**
 * segunda vez. Qualquer outro erro sobe na hora, sem espera.
 *
 * Uma repetição só, não um laço: o teto de duração da function é curto e
 * duas falhas seguidas de 503 já indicam indisponibilidade real, não um
 * soluço.
 */
export async function comRetryTransitorio<T>(
  operacao: () => Promise<T>,
  opcoes: OpcoesRetry = {},
): Promise<T> {
  const { esperaMs = ESPERA_PADRAO_MS, dormir = dormirDeVerdade } = opcoes;
  try {
    return await operacao();
  } catch (erro) {
    if (!ehTransitorio(erro)) throw erro;
    await dormir(esperaMs);
    return operacao();
  }
}
