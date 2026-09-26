// lastro · UX3-03 — em "Novo modelo", o campo do nome e o botão Continuar não
// ficam colados (achado da auditoria de 2026-09-26: 0 px entre os dois).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j20-modelo-espaco", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("novo modelo: há folga entre o campo do nome e o botão Continuar", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes/modelos/novo");

  const campo = await page.locator("#nome_modelo").boundingBox();
  const botao = await page.getByRole("button", { name: "Continuar" }).boundingBox();
  expect(campo && botao, "campo ou botão não apareceu").toBeTruthy();
  const folga = botao!.y - (campo!.y + campo!.height);
  expect(folga, `ACHADO UX3-03: só ${folga}px entre o campo e o botão`).toBeGreaterThanOrEqual(8);
});
