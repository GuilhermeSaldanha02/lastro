// lastro · Fase 6 (escopo reduzido) — E2E das 3 jornadas do PRD §6.
//
// `webServer` sobe `next start` contra um build de produção real — as 3
// specs rodam contra o Supabase HOSPEDADO (não há stack local, ver
// KNOWLEDGE.md), cada uma criando/apagando seu próprio usuário
// descartável (ver e2e/helpers/usuario-descartavel.ts). Precisa de
// `.env.local` preenchido (dev) ou dos secrets do GitHub Actions (CI).
import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Next carrega `.env.local` sozinho para o servidor (dev/build), mas o
// PROCESSO do Playwright (que roda os helpers em e2e/helpers/*.ts fora do
// Next, para criar/apagar o usuário QA via admin) não — precisa ser
// carregado aqui também. Sem `dotenv` como dependência: o formato do
// arquivo já é simples o bastante (KEY=valor, uma por linha) e no CI as
// mesmas variáveis já chegam como env reais (secrets do workflow), então
// isto só faz algo em desenvolvimento local.
const envLocal = path.resolve(__dirname, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split("\n")) {
    const semComentario = linha.trim();
    if (!semComentario || semComentario.startsWith("#")) continue;
    const igual = semComentario.indexOf("=");
    if (igual === -1) continue;
    const chave = semComentario.slice(0, igual).trim();
    const valor = semComentario.slice(igual + 1).trim();
    if (chave && process.env[chave] === undefined) {
      process.env[chave] = valor;
    }
  }
}

const PORTA = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // O service worker (public/sw.js) responde a TODO fetch não-navegação
    // refazendo a chamada dentro do próprio SW (`respondWith(fetch(...))`)
    // — isso reemite a requisição fora do contexto de rede da página, e
    // `page.route()` não intercepta o fetch de dentro do SW (achado real
    // rodando J2/J3 pela primeira vez: o mock nunca era chamado e a
    // Gemini de verdade respondia — nada bom pra cota de 20 req/dia).
    // Bloquear o SW nos testes não tira cobertura de J1 (a resiliência
    // offline dele é o outbox no Dexie, client-side, não depende do SW).
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
