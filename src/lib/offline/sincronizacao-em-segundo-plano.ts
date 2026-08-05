// lastro · tarefa 2.3 — ponte entre o cliente e a Background Sync API do
// service worker (public/sw.js). A API é experimental — TypeScript não
// tipa `ServiceWorkerRegistration.sync` por padrão, e nem todo navegador
// suporta (Safari/Firefox não têm). Por isso tudo aqui é best-effort: se
// não suportar, o listener `online` já existente (treino-detalhe.tsx)
// continua sendo o mecanismo de fallback.
const TAG_OUTBOX = "sincronizar-outbox";

type RegistroComSync = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

/** Pede ao navegador para acordar o SW e sincronizar quando a rede voltar. */
export async function pedirSincronizacaoEmSegundoPlano(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registro = (await navigator.serviceWorker.ready) as RegistroComSync;
    await registro.sync?.register(TAG_OUTBOX);
  } catch {
    // Sem suporte à Background Sync API (Safari/Firefox) — o listener
    // `online` no cliente segue como mecanismo único, sem quebrar nada.
  }
}

/** Chama `aoSincronizar` toda vez que o SW avisar que a rede voltou. */
export function ouvirPedidosDeSincronizacao(
  aoSincronizar: () => void,
): () => void {
  if (!("serviceWorker" in navigator)) return () => {};

  function handler(evento: MessageEvent) {
    if (evento.data?.tipo === "sincronizar-outbox") {
      aoSincronizar();
    }
  }

  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}
