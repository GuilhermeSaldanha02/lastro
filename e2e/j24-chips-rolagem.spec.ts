// lastro · UX3-07 — a fileira de filtros por grupo tem pista visual de rolagem
// (achado da auditoria de 2026-09-26: o último chip aparecia cortado sem pista).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j24-chips", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("catálogo: a fileira de chips que rola tem sombra de rolagem", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/catalogo");

  const fileira = page.locator(".chips-carrossel").first();
  await expect(fileira).toBeVisible();
  const { transborda, fundo, overflowX } = await fileira.evaluate((el) => ({
    transborda: el.scrollWidth > el.clientWidth,
    fundo: getComputedStyle(el).backgroundImage,
    overflowX: getComputedStyle(el).overflowX,
  }));
  expect(overflowX).toBe("auto");
  expect(transborda, "o catálogo tem chips de sobra: a fileira deveria rolar a 375px").toBe(true);
  expect(fundo, "ACHADO UX3-07: sem sombra de rolagem na fileira de chips").toMatch(/gradient/);
});
