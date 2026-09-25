// lastro · ONBOARDING DO PRIMEIRO LOGIN (PU-08).
//
// Conta nova cai no passo a passo uma vez, na primeira Home; terminar ou
// pular grava a conclusão e a Home não pede de novo. Conta que já concluiu
// abre a Home direto e /onboarding devolve para ela.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let contaNova: UsuarioDescartavel;
let contaAntiga: UsuarioDescartavel;

test.beforeAll(async () => {
  contaNova = await criarUsuarioDescartavel("j15-nova", "aluno", { comOnboarding: true });
  contaAntiga = await criarUsuarioDescartavel("j15-antiga", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(contaNova);
  await apagarUsuarioDescartavel(contaAntiga);
});

test("conta nova: a primeira Home leva ao passo a passo, e pular grava a conclusão", async ({ page }) => {
  await entrarComoUsuario(page, contaNova);
  await page.goto("/");
  await expect(page, "a conta nova não caiu no onboarding").toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo ao lastro" })).toBeVisible();

  await page.getByRole("button", { name: "Próximo" }).click();
  await expect(page.getByRole("heading", { name: "Registre o treino" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao lastro" })).toBeVisible();

  await page.getByRole("button", { name: "Pular" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });

  // Concluído: a Home não pede de novo, nem por recarga, e a URL do passo a
  // passo devolve para a Home.
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/$/);
});

test("conta nova: percorrer até o fim (Começar) também conclui", async ({ page }) => {
  const outra = await criarUsuarioDescartavel("j15-fim", "aluno", { comOnboarding: true });
  try {
    await entrarComoUsuario(page, outra);
    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding$/);
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "Próximo" }).click();
    }
    await expect(page.getByRole("button", { name: "Pular" }), "o último passo ainda oferece Pular").toHaveCount(0);
    await page.getByRole("button", { name: "Começar" }).click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
    await page.reload();
    await expect(page).toHaveURL(/\/$/);
  } finally {
    await apagarUsuarioDescartavel(outra);
  }
});

test("conta que já concluiu abre a Home direto", async ({ page }) => {
  await entrarComoUsuario(page, contaAntiga);
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});

test("sem sessão, /onboarding leva ao login", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login/);
});
