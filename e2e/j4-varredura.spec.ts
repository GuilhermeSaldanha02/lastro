// lastro · varredura de navegação completa — pedido do dono em 2026-09-10.
//
// O QUE ISTO É, E POR QUE NÃO É MAIS UMA JORNADA. J1/J2/J3 provam que os
// três caminhos do PRD §6 funcionam. Esta spec não prova caminho nenhum:
// ela ANDA por todas as telas do app com um usuário recém-criado e
// reprova se alguma delas emitir erro de console, quebrar requisição,
// vazar horizontalmente ou renderizar vazia. É rede de arrasto, não
// jornada — pega o que as três jornadas não olham porque não passam ali.
//
// USUÁRIO NOVO DE VERDADE, E DE PROPÓSITO. O dono pediu explicitamente
// para não usar a conta dele. Cada execução cria o próprio usuário via
// admin e apaga no fim (cascade cuida de treino/série). Isso também
// cobre o que a conta dele NÃO cobre mais: como o app se comporta com
// histórico zerado, que é o primeiro minuto de qualquer pessoa nova.
//
// TRÊS LARGURAS. 390 (celular real, iPhone 14), 768 (tablet / limiar dos
// media queries em `sistema.css`) e 1440 (desktop). O dono já reportou
// problema de responsividade em 2026-09-05 vendo no celular — largura
// única não teria pego.
//
// O QUE FAZ FALHAR, e por que cada um:
//   · erro de console → é defeito mesmo quando a tela "parece" certa;
//   · requisição 4xx/5xx → tela montada sobre chamada quebrada;
//   · vazamento horizontal → o corpo nunca deve rolar de lado (regra do
//     próprio projeto: conteúdo largo rola dentro do container dele);
//   · tela vazia → rota que renderiza casca sem conteúdo.
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let usuario: UsuarioDescartavel;

test.beforeAll(async () => {
  usuario = await criarUsuarioDescartavel("varredura");
});

test.afterAll(async () => {
  if (usuario) await apagarUsuarioDescartavel(usuario);
});

/** Larguras conferidas. A altura é a real do aparelho, não um número redondo. */
const LARGURAS = [
  { nome: "celular", largura: 390, altura: 844 },
  { nome: "tablet", largura: 768, altura: 1024 },
  { nome: "desktop", largura: 1440, altura: 900 },
] as const;

/**
 * Rotas fixas. As dinâmicas (`/treino/[id]`, `/catalogo/[id]`) entram
 * depois, com id real colhido da própria navegação — id inventado testaria
 * a tela de "não encontrado", não a tela.
 */
const ROTAS_FIXAS = [
  "/",
  "/treino",
  "/catalogo",
  "/analise",
  "/coach",
  "/perfil",
  "/ajustes",
  "/ajustes/temas",
  "/ajustes/anilhas",
  "/ajustes/modelos",
  "/ajustes/modelos/novo",
  "/ajustes/relatorios",
];

type Achado = { rota: string; largura: string; tipo: string; detalhe: string };

/**
 * Ruído conhecido que não é defeito do app. Lista curta e justificada de
 * propósito: filtro largo aqui transforma a varredura em teatro.
 */
function ehRuidoConhecido(texto: string): boolean {
  return (
    // O SW é bloqueado no config (`serviceWorkers: "block"`); o registro
    // falhar é consequência DA configuração de teste, não do app.
    texto.includes("ServiceWorker") ||
    texto.includes("serviceWorker") ||
    // Extensões/devtools do runner, fora do controle da página.
    texto.includes("chrome-extension://") ||
    // Vídeo/GIF do catálogo depende de CDN externa; indisponibilidade dela
    // não é defeito de tela e já tem fallback próprio (`erroMidia`).
    texto.includes("net::ERR_BLOCKED_BY_CLIENT")
  );
}

/** Liga os coletores. Devolve a lista viva, que a rota inspeciona depois. */
function coletar(page: Page, achados: Achado[], rotulo: () => { rota: string; largura: string }) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const texto = msg.text();
    if (ehRuidoConhecido(texto)) return;
    achados.push({ ...rotulo(), tipo: "console", detalhe: texto.slice(0, 300) });
  });

  page.on("pageerror", (erro) => {
    if (ehRuidoConhecido(erro.message)) return;
    achados.push({ ...rotulo(), tipo: "exceção", detalhe: erro.message.slice(0, 300) });
  });

  page.on("response", (resposta) => {
    if (resposta.status() < 400) return;
    const url = resposta.url();
    if (ehRuidoConhecido(url)) return;
    achados.push({
      ...rotulo(),
      tipo: `http ${resposta.status()}`,
      detalhe: url.slice(0, 200),
    });
  });
}

/** O corpo da página nunca deve rolar de lado. Conteúdo largo rola no container dele. */
async function vazamentoHorizontal(page: Page): Promise<number> {
  return page.evaluate(() => {
    const d = document.documentElement;
    return Math.max(0, d.scrollWidth - d.clientWidth);
  });
}

/** Texto visível suficiente para a rota não ser uma casca vazia. */
async function temConteudo(page: Page): Promise<number> {
  return page.evaluate(() => (document.body.innerText ?? "").trim().length);
}

test("varre todas as telas com usuário novo, em três larguras", async ({ page }) => {
  test.setTimeout(300_000);

  const achados: Achado[] = [];
  let rotaAtual = "(login)";
  let larguraAtual = "desktop";
  coletar(page, achados, () => ({ rota: rotaAtual, largura: larguraAtual }));

  await entrarComoUsuario(page, usuario);

  // Um treino real, para `/treino/[id]` existir e para as telas que
  // dependem de dado não serem julgadas só no estado vazio.
  await page.goto("/treino");
  await page.getByRole("button", { name: /iniciar treino/i }).click();
  await page.waitForURL(/\/treino\/[^/]+$/, { timeout: 20_000 });
  const urlTreino = new URL(page.url()).pathname;

  // Um exercício real do catálogo, para `/catalogo/[id]`.
  await page.goto("/catalogo");
  const primeiroCard = page.locator('a[href^="/catalogo/"]').first();
  await expect(primeiroCard).toBeVisible({ timeout: 20_000 });
  const urlExercicio = await primeiroCard.getAttribute("href");
  expect(urlExercicio).toBeTruthy();

  const rotas = [...ROTAS_FIXAS, urlTreino, urlExercicio!];

  for (const { nome, largura, altura } of LARGURAS) {
    larguraAtual = nome;
    await page.setViewportSize({ width: largura, height: altura });

    for (const rota of rotas) {
      rotaAtual = rota;
      await page.goto(rota, { waitUntil: "domcontentloaded" });
      // Dá tempo de hidratar e de as chamadas de dado voltarem antes de
      // medir — medir cedo demais acusa vazamento que não existe.
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const vazamento = await vazamentoHorizontal(page);
      if (vazamento > 1) {
        achados.push({
          rota,
          largura: nome,
          tipo: "vazamento horizontal",
          detalhe: `${vazamento}px além da largura da viewport (${largura}px)`,
        });
      }

      const tamanhoTexto = await temConteudo(page);
      if (tamanhoTexto < 20) {
        achados.push({
          rota,
          largura: nome,
          tipo: "tela vazia",
          detalhe: `só ${tamanhoTexto} caracteres visíveis`,
        });
      }

      await page.screenshot({
        path: `test-results/varredura/${nome}${rota.replace(/\//g, "_") || "_raiz"}.png`,
        fullPage: true,
      });
    }
  }

  // Relatório legível ANTES do assert: quando falha, o log já diz o quê e
  // onde, sem precisar abrir trace.
  if (achados.length > 0) {
    console.log("\n=== ACHADOS DA VARREDURA ===");
    for (const a of achados) {
      console.log(`[${a.largura}] ${a.rota} · ${a.tipo}\n    ${a.detalhe}`);
    }
    console.log(`=== total: ${achados.length} ===\n`);
  }

  expect(
    achados,
    `varredura encontrou ${achados.length} problema(s) — ver lista acima`,
  ).toEqual([]);
});
