// lastro · tarefa 2.4 (instalabilidade) + 2.3 (sincronização real).
//
// Achado real (dono testou no celular, 2026-08-06): abrir o app instalado
// em modo avião quebrava com "FetchEvent.respondWith received" — o fetch
// handler original fazia só `respondWith(fetch(...))`, sem `catch`. Sem
// rede, essa promise rejeita e o navegador não tem o que exibir: crash,
// não uma tela de erro.
//
// Isto NÃO é cache de app shell completo (as páginas do lastro são quase
// todas dinâmicas — precisam de sessão/dados reais, não fazem sentido
// cacheadas). É só a rede de segurança mínima: se a navegação falhar por
// falta de rede, mostra uma página offline própria em vez de travar.
const CACHE_OFFLINE = "lastro-offline-v1";
const PAGINA_OFFLINE = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_OFFLINE).then((cache) => cache.add(PAGINA_OFFLINE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.mode === "navigate") {
    evento.respondWith(
      fetch(evento.request).catch(() => caches.match(PAGINA_OFFLINE)),
    );
    return;
  }

  evento.respondWith(
    fetch(evento.request).catch(
      () => new Response(null, { status: 504, statusText: "Sem rede" }),
    ),
  );
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
