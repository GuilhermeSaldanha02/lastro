// lastro · UX3-04 — /ajustes/personal usa o botão de voltar do cabeçalho, como
// as outras subtelas de Ajustes (antes: um botão flutuante cortado sob o topo).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j21-voltar", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("personal: o voltar do cabeçalho existe, está inteiro na tela e leva a Ajustes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes/personal");

  await expect(page.locator(".voltar-flutuante"), "sobrou o botão flutuante cortado").toHaveCount(0);
  const voltar = page.locator(".topo-pro__voltar");
  await expect(voltar).toBeVisible();
  const caixa = await voltar.boundingBox();
  expect(caixa!.x, "o voltar está cortado à esquerda").toBeGreaterThanOrEqual(0);
  expect(caixa!.y, "o voltar está cortado em cima").toBeGreaterThanOrEqual(0);
  expect(caixa!.width, "alvo de toque menor que 44px").toBeGreaterThanOrEqual(44);

  await voltar.click();
  await expect(page).toHaveURL(/\/ajustes$/);
});
