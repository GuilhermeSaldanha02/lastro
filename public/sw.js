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
// v2/v3 (OF-09, 2026-09-23): a página offline passou a recarregar sozinha
// quando a rede volta (v3: só depois que uma sonda à rede responde). O nome
// novo força o aparelho a baixar a página nova em vez de servir a antiga do
// cache; o `activate` apaga as versões velhas.
const CACHE_OFFLINE = "lastro-offline-v3";
const PAGINA_OFFLINE = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_OFFLINE).then((cache) => cache.add(PAGINA_OFFLINE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => nome.startsWith("lastro-offline-") && nome !== CACHE_OFFLINE)
            .map((nome) => caches.delete(nome)),
        ),
      )
      .then(() => self.clients.claim()),
  );
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

// Aviso de fim de descanso (pedido do dono, 2026-09-23). Quem manda é o
// servidor (`/api/push/disparar`, chamado pelo pg_cron). O iPhone exige que
// TODO push mostre notificação — push silencioso pode cancelar a inscrição —,
// então mostra sempre, mesmo com o app aberto. A `tag` faz um aviso novo
// substituir o anterior em vez de empilhar.
self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = {};
  }
  evento.waitUntil(
    self.registration.showNotification(dados.titulo || "Descanso acabou", {
      body: dados.corpo || "Hora da próxima série.",
      tag: "lastro-descanso",
      renotify: true,
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      data: { url: dados.url || "/treino" },
    }),
  );
});

// Tocar na notificação volta para o treino: reaproveita a janela aberta do
// app quando existe, senão abre uma.
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const alvo = new URL((evento.notification.data && evento.notification.data.url) || "/treino", self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ("focus" in janela) {
          return janela.navigate(alvo).then((j) => (j || janela).focus());
        }
      }
      return self.clients.openWindow(alvo);
    }),
  );
});
