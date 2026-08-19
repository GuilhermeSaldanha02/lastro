// lastro · tradução de falha do provedor para resposta ao cliente.
//
// Mora fora de `route.ts` porque route handler do App Router só exporta
// os métodos HTTP — e porque isto é decisão pura (erro entra, resposta
// sai), do tipo que se testa sem subir servidor nem chamar a Gemini.

export type RespostaDeFalha = {
  erro: string;
  status: number;
};

/**
 * Sobrecarga do provedor (503) e limite de requisição (429) são
 * transitórios: tentar de novo resolve. Tratá-los com a mesma mensagem
 * de uma falha permanente faz o dono achar que o app quebrou e desistir
 * — foi exatamente o que aconteceu no teste de aparelho de 2026-08-17,
 * quando a Gemini devolveu 503 "high demand" e a tela só disse "Falha ao
 * consultar o coach".
 *
 * Qualquer outro erro continua genérico de propósito: a mensagem do
 * provedor pode carregar detalhe de infraestrutura, e isso não desce pro
 * cliente (ADR-002).
 */
export function respostaDeFalha(erro: unknown): RespostaDeFalha {
  const status = (erro as { status?: number })?.status;

  if (status === 503 || status === 429) {
    return {
      erro: "O coach está sobrecarregado agora. Tente de novo em instantes.",
      status: 503,
    };
  }

  return { erro: "Falha ao consultar o coach.", status: 502 };
}

/** Só status e mensagem — a chave vive em header, nunca no corpo do erro. */
export function detalheParaLog(erro: unknown): {
  status?: number;
  mensagem: string;
} {
  return {
    status: (erro as { status?: number })?.status,
    mensagem: erro instanceof Error ? erro.message.slice(0, 300) : String(erro),
  };
}
