// lastro · UX3-05 — o cabeçalho de Relatórios não é cortado e o texto do botão
// não mistura "Sticker Story" em inglês (achado da auditoria de 2026-09-26).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j22-relatorios", "aluno");
  await semearHistoricoParaAnalise(await clienteAutenticado(conta), conta.id);
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("relatórios: título inteiro na pílula do cabeçalho e botão em português de Stories", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes/relatorios");

  const pilula = page.locator(".topo-pro__data-pill");
  await expect(pilula).toBeVisible();
  const cortado = await pilula.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(cortado, "ACHADO UX3-05: o título do cabeçalho de Relatórios está cortado").toBe(false);

  await expect(page.getByText("Sticker Story")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Gerar imagem para Stories" }).first()).toBeVisible();
});
