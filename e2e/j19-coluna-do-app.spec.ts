// lastro · UX3-01 — a coluna do app tem largura máxima.
//
// Em janela larga (PC) o app esticava cartões e barras até a largura inteira.
// Agora o conteúdo fica numa coluna de no máximo 48rem (768px) centralizada, e
// a barra inferior acompanha. No celular nada muda: a coluna é a janela.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

const LARGURA_MAXIMA = 768;
let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j19-coluna", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

for (const rota of ["/", "/treino", "/analise", "/ajustes"]) {
  test(`desktop 1440: ${rota} fica numa coluna centralizada`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await entrarComoUsuario(page, conta);
    await page.goto(rota);

    const corpo = await page.locator(".corpo").first().boundingBox();
    expect(corpo, "sem .corpo").not.toBeNull();
    expect(corpo!.width, `ACHADO UX3-01: o corpo de ${rota} estica até ${corpo!.width}px`).toBeLessThanOrEqual(LARGURA_MAXIMA + 1);
    const folgaEsq = corpo!.x;
    const folgaDir = 1440 - (corpo!.x + corpo!.width);
    expect(Math.abs(folgaEsq - folgaDir), "a coluna não está centralizada").toBeLessThanOrEqual(20);

    const nav = await page.locator(".nav").first().boundingBox();
    expect(nav, "sem barra inferior").not.toBeNull();
    expect(nav!.width, "a barra inferior ainda vai de ponta a ponta").toBeLessThanOrEqual(LARGURA_MAXIMA + 1);
  });
}

test("celular 390: a coluna é a janela inteira, nada muda", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes");
  const corpo = await page.locator(".corpo").first().boundingBox();
  expect(corpo!.width).toBeGreaterThanOrEqual(388);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "vazamento horizontal").toBe(0);
});
