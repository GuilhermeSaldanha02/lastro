// lastro · tarefa 2.4 (instalabilidade) + 2.3 (sincronização real).
// Passthrough puro em fetch — nenhuma estratégia de cache/offline de
// conteúdo aqui, só a fila de mutações (D6).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (evento) => {
  evento.respondWith(fetch(evento.request));
});

// Tarefa 2.3 — Background Sync: o listener `online` no cliente (usado desde
// a 2.2) só funciona com a aba em primeiro plano. A Background Sync API
// deixa o NAVEGADOR acordar o service worker quando a rede volta, mesmo com
// a aba em segundo plano — mais confiável em celular. O SW não tem como
// chamar a Server Action `criarSerieRemoto` diretamente (não tem acesso ao
// runtime de Server Actions do Next), então avisa qualquer aba aberta via
// `postMessage`; quem sincroniza de fato é o cliente (treino-detalhe.tsx).
self.addEventListener("sync", (evento) => {
  if (evento.tag === "sincronizar-outbox") {
    evento.waitUntil(avisarClientes());
  }
});

async function avisarClientes() {
  const clientes = await self.clients.matchAll({ type: "window" });
  for (const cliente of clientes) {
    cliente.postMessage({ tipo: "sincronizar-outbox" });
  }
}
