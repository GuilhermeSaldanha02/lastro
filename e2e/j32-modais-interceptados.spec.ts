// lastro · UX-03 (cobertura pendente, §4c do relatório) — os modais de
// `@modal` (H1, `DECISIONS.md` 2026-08-15) SÓ existem como sobreposição
// quando a navegação é por clique num `<Link>`, dentro do app (rota
// interceptada). Acesso direto por URL cai na página cheia de sempre — e
// é assim que TODO spec existente chega em `/ajustes/anilhas` e
// `/ajustes/modelos/novo` (`page.goto`), então a apresentação real de
// folha nunca tinha sido exercida. Este spec fecha essa lacuna para os
// três modais: `/ajustes/anilhas`, `/ajustes/modelos/novo` e `/perfil`.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j32-modais", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

async function abrir(page: Page, rota: string) {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto(rota);
}

/** Confere a folha: diálogo acessível, fundo (a página de trás) continua
 * montado, sem vazamento horizontal, e o botão de fechar tem alvo de
 * toque de verdade. */
async function conferirFolha(page: Page, tituloEsperado: string, rotaModal: string) {
  await expect(page).toHaveURL(new RegExp(`${rotaModal}$`));
  const dialogo = page.getByRole("dialog", { name: tituloEsperado });
  await expect(dialogo).toBeVisible();

  // A página de trás não foi substituída — é sobreposição, não navegação cheia.
  await expect(page.locator(".topo-pro__data-pill").first()).toBeVisible();

  const vazamento = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(vazamento, `ACHADO: a folha "${tituloEsperado}" vaza na horizontal a 375px`).toBe(0);

  const fechar = dialogo.getByRole("button", { name: new RegExp(`Fechar`, "i") });
  const caixa = await fechar.boundingBox();
  expect(caixa!.width, "botão de fechar menor que 44px").toBeGreaterThanOrEqual(44);
  expect(caixa!.height, "botão de fechar menor que 44px").toBeGreaterThanOrEqual(44);

  return { dialogo, fechar };
}

test("anilhas: abre como folha a partir de Ajustes, sem navegação cheia", async ({ page }) => {
  await abrir(page, "/ajustes");
  await page.getByRole("link", { name: "Calculadora de Anilhas" }).click();
  const { dialogo, fechar } = await conferirFolha(page, "Anilhas", "/ajustes/anilhas");

  await fechar.click();
  await expect(dialogo).toBeHidden();
  await expect(page).toHaveURL(/\/ajustes$/);
});

test("novo modelo: abre como folha a partir de Modelos de Treino", async ({ page }) => {
  await abrir(page, "/ajustes/modelos");
  await page.getByRole("link", { name: "Criar modelo" }).click();
  const { dialogo } = await conferirFolha(page, "Novo modelo", "/ajustes/modelos/novo");

  // Fechar por Esc é o outro caminho que `Folha` oferece (além do botão ✕
  // e do voltar do navegador) — vale cobrir pelo menos uma vez neste spec.
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(page).toHaveURL(/\/ajustes\/modelos$/);
});

test("perfil: abre como folha a partir do avatar do cabeçalho", async ({ page }) => {
  await abrir(page, "/ajustes");
  await page.getByRole("link", { name: "Perfil do atleta" }).click();
  const { dialogo, fechar } = await conferirFolha(page, "Perfil", "/perfil");

  await fechar.click();
  await expect(dialogo).toBeHidden();
  await expect(page).toHaveURL(/\/ajustes$/);
});
