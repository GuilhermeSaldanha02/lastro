// lastro · UX3-11 e UX3-12 (cobertura de 2026-09-26).
//  · texto legal com espaço entre parágrafos e entre seções;
//  · título do passo do onboarding maior que um rótulo.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let novo: UsuarioDescartavel;

test.beforeAll(async () => {
  novo = await criarUsuarioDescartavel("j29-onboarding", "aluno", { comOnboarding: true });
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(novo);
});

test("/termos: parágrafos e seções têm espaço entre si", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/termos");

  const espacos = await page.evaluate(() => {
    const ps = [...document.querySelectorAll(".documento-legal section p")];
    let entreParagrafos = Infinity;
    for (let i = 1; i < ps.length; i++) {
      if (ps[i].parentElement !== ps[i - 1].parentElement) continue;
      const a = ps[i - 1].getBoundingClientRect();
      const b = ps[i].getBoundingClientRect();
      entreParagrafos = Math.min(entreParagrafos, b.top - a.bottom);
    }
    const secoes = [...document.querySelectorAll(".documento-legal section")];
    const entreSecoes = secoes[1].getBoundingClientRect().top - secoes[0].getBoundingClientRect().bottom;
    return { entreParagrafos, entreSecoes };
  });
  expect(espacos.entreParagrafos, `ACHADO UX3-11: parágrafos colados (${espacos.entreParagrafos}px)`).toBeGreaterThanOrEqual(8);
  expect(espacos.entreSecoes, `ACHADO UX3-11: seções coladas (${espacos.entreSecoes}px)`).toBeGreaterThanOrEqual(16);
});

test("onboarding: o título do passo é maior que um rótulo", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, novo);
  await page.goto("/onboarding");
  const tamanho = await page.locator("h1").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(tamanho, `ACHADO UX3-12: título do passo com ${tamanho}px, do tamanho de um rótulo`).toBeGreaterThanOrEqual(18);
});
