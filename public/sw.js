// lastro · tarefa 2.4 — service worker mínimo, só para tornar o app
// instalável (critério do Chrome: precisa haver um SW ativo controlando o
// escopo). Passthrough puro — nenhuma estratégia de cache/offline aqui
// ainda, isso é a tarefa 2.3 (sincronização real).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (evento) => {
  evento.respondWith(fetch(evento.request));
});
