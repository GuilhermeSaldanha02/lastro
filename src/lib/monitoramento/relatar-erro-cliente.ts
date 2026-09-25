// lastro · PU-07 — lado do navegador. Sem "use client": é função comum,
// chamada por componentes de cliente. Nunca lança e nunca espera resposta.
const MAXIMO_POR_CARREGAMENTO = 5;
const jaRelatados = new Set<string>();

export function relatarErroCliente(erro: unknown, digest?: string): void {
  try {
    if (jaRelatados.size >= MAXIMO_POR_CARREGAMENTO) return;
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (jaRelatados.has(mensagem)) return;
    jaRelatados.add(mensagem);

    void fetch("/api/erros", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        mensagem,
        pilha: erro instanceof Error ? erro.stack : undefined,
        rota: window.location.pathname,
        digest,
      }),
    }).catch(() => {});
  } catch {
    // monitorar não pode quebrar a tela
  }
}
