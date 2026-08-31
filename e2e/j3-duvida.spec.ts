// lastro · Fase 6 (E2E) — J3: Dúvida (consulta ao catálogo + fallback pro
// coach 24h, PRD §6). O catálogo é dado compartilhado (não filtrado por
// usuário — ver src/app/api/analise/route.ts), então não precisa de seed;
// o coach, como a Análise (J2), tem /api/coach interceptado no navegador
// pelo mesmo motivo (A5/FF1/FF2 — a Gemini real fica atrás da rota, cota
// de 20 req/dia não é pra queimar em CI).
import { test, expect } from "@playwright/test";
import {
  criarUsuarioDescartavel,
  apagarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let usuario: UsuarioDescartavel;

test.beforeAll(async () => {
  usuario = await criarUsuarioDescartavel("j3");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(usuario);
});

test("consulta um exercício no catálogo e cai no coach quando o catálogo não basta", async ({
  page,
}) => {
  await entrarComoUsuario(page, usuario);

  // Parte 1 — consulta direta ao catálogo, dado real, sem mock.
  await page.goto("/catalogo");
  const primeiroExercicio = page.locator('a[href^="/catalogo/"]').first();
  const nomeExercicio = (await primeiroExercicio.textContent())?.trim();
  expect(nomeExercicio).toBeTruthy();
  await primeiroExercicio.click();

  await page.waitForURL(/\/catalogo\/[^/]+$/);
  // O nome do exercício não é um <heading> ARIA nesta tela (achado ao
  // investigar — só "Histórico de Séries" é heading de verdade aqui);
  // aparece como texto simples no cabeçalho.
  await expect(page.getByText(nomeExercicio!, { exact: false }).first()).toBeVisible();

  // Parte 2 — dúvida que o catálogo não cobre, cai no coach.
  const RESPOSTA_MOCADA =
    "Seu volume de peito nesta semana está dentro da faixa de referência, sem sinal de estagnação.";

  await page.route("**/api/coach", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ resposta: RESPOSTA_MOCADA }),
    });
  });

  await page.goto("/coach");
  await page.locator(".chip-sugestao").first().click();

  await expect(page.locator(".balao--dele .balao__texto")).toHaveText(
    RESPOSTA_MOCADA,
    { timeout: 15_000 },
  );
});
