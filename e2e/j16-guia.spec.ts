// lastro · MANUAL EM AJUSTES (PU-09).
//
// O manual é consulta, sempre acessível: aparece em Ajustes, tem índice e uma
// seção por assunto, e as seções de personal só existem para conta de
// personal.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { vazamentoHorizontal } from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;
let personal: UsuarioDescartavel;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j16-aluno", "aluno");
  personal = await criarUsuarioDescartavel("j16-personal", "personal");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(aluno);
  await apagarUsuarioDescartavel(personal);
});

test("aluno: o manual abre por Ajustes, tem índice e não mostra seção de personal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, aluno);
  await page.goto("/ajustes");
  await page.getByRole("link", { name: /Como usar o lastro/ }).click();
  await expect(page).toHaveURL(/\/ajustes\/guia$/);

  await expect(page.getByRole("heading", { name: "Análise Semanal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Análise Semanal" }), "índice sem a Análise").toBeVisible();
  await expect(page.getByRole("heading", { name: "Convidar alunos" }), "usuário viu seção de personal").toHaveCount(0);

  // O índice leva à seção.
  await page.getByRole("link", { name: "Coach 24h" }).first().click();
  await expect(page).toHaveURL(/#coach$/);

  expect(await vazamentoHorizontal(page), "o manual vaza na horizontal a 375px").toBe(0);
});

test("personal: o manual traz as seções da área de trabalho", async ({ page }) => {
  await entrarComoUsuario(page, personal);
  await page.goto("/ajustes/guia");
  await expect(page.getByRole("heading", { name: "Convidar alunos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A fila de trabalho" })).toBeVisible();
});

test("sem sessão, o manual leva ao login", async ({ page }) => {
  await page.goto("/ajustes/guia");
  await expect(page).toHaveURL(/\/login/);
});
