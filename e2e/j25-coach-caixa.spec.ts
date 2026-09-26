// lastro · UX3-08 — a caixa de pergunta do Coach não fica colada na barra
// inferior e o campo não tem moldura dentro da moldura (auditoria de 2026-09-26).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j25-coach", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("coach: folga de 12px ou mais entre a caixa e a barra inferior, e campo sem contorno em repouso", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/coach");

  const caixa = await page.locator(".barra-conversa").boundingBox();
  const nav = await page.locator(".nav").boundingBox();
  expect(caixa && nav, "caixa ou barra inferior não apareceu").toBeTruthy();
  const folga = nav!.y - (caixa!.y + caixa!.height);
  expect(folga, `ACHADO UX3-08: só ${folga}px entre a caixa e a barra inferior`).toBeGreaterThanOrEqual(12);

  const contorno = await page
    .locator(".barra-conversa__input")
    .evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(contorno, "o campo voltou a ter moldura própria").toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
});
