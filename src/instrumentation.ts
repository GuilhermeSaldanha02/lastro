// lastro · PU-07 — o Next chama `onRequestError` para todo erro não tratado
// no servidor (render, rota de API, server action, proxy). Grava em
// `erro_app`; ver `lib/monitoramento/registrar-erro.ts`.
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  erro,
  requisicao,
  contexto,
) => {
  // O cliente admin usa APIs de Node; no edge (proxy) não roda.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registrarErro } = await import("@/lib/monitoramento/registrar-erro");
  const digest = (erro as { digest?: unknown })?.digest;
  await registrarErro("servidor", {
    mensagem: erro instanceof Error ? erro.message : String(erro),
    pilha: erro instanceof Error ? erro.stack : null,
    rota: requisicao.path,
    digest,
    tipoRota: contexto.routeType,
  });
};
