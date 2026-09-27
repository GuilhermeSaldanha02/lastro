// lastro · UX3-13 e UX3-14 (cobertura de 2026-09-26).
//  · /redefinir-senha mostra a marca, como o login;
//  · a 404 de quem não tem sessão não mostra avatar "AT" ligado ao perfil.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j30-marca", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("redefinir senha: a marca aparece acima do cartão", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/redefinir-senha");
  const logo = page.getByRole("img", { name: "LASTRO" });
  await expect(logo, "ACHADO UX3-13: /redefinir-senha sem a marca").toBeVisible();
  const caixaLogo = await logo.boundingBox();
  const caixaCartao = await page.locator(".cartao").first().boundingBox();
  expect(caixaLogo!.y + caixaLogo!.height, "a marca deveria ficar acima do cartão").toBeLessThanOrEqual(caixaCartao!.y);
});

test("404 sem sessão: sem avatar ligado ao perfil", async ({ page }) => {
  await page.goto("/rota-que-nao-existe");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.locator(".topo-pro__avatar-link"), "ACHADO UX3-14: avatar fantasma na 404 anônima").toHaveCount(0);
});

test("404 com sessão: o avatar da pessoa continua lá", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/rota-que-nao-existe");
  await expect(page.locator(".topo-pro__avatar-link")).toHaveCount(1);
});
