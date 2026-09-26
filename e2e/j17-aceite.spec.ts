// lastro · ACEITE DOS TERMOS E DA POLÍTICA (PU-06).
//
// Conta que ainda não aceitou a versão vigente cai em /aceite antes de
// qualquer tela; o aceite fica no FIM do texto, registra e segue. Depois,
// os documentos ficam em Ajustes. Os textos públicos abrem sem conta.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j17-aceite", "aluno", { comAceitePendente: true });
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("conta sem aceite: qualquer tela leva a /aceite, e o aceite no fim do texto libera o app", async ({ page }) => {
  await entrarComoUsuario(page, conta);

  await page.goto("/");
  await expect(page, "a Home abriu sem o aceite").toHaveURL(/\/aceite$/);
  await page.goto("/treino");
  await expect(page, "/treino abriu sem o aceite").toHaveURL(/\/aceite$/);
  await page.goto("/ajustes");
  await expect(page, "/ajustes abriu sem o aceite").toHaveURL(/\/aceite$/);

  await expect(page.getByRole("heading", { name: "Termos de Uso", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Política de Privacidade", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Aceito e continuar" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });

  // Aceito: a Home abre, e /aceite devolve para ela.
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/aceite");
  await expect(page).toHaveURL(/\/$/);
});

test("depois do aceite, Ajustes mostra os documentos e a data do aceite", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes");
  await page.getByRole("link", { name: /Termos e privacidade/ }).click();
  await expect(page).toHaveURL(/\/ajustes\/politicas$/);
  await expect(page.getByText("Você aceitou estes documentos em")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Política de Privacidade", level: 1 })).toBeVisible();
});

test("os textos públicos abrem sem conta", async ({ page }) => {
  await page.goto("/termos");
  await expect(page.getByRole("heading", { name: "Termos de Uso", level: 1 })).toBeVisible();
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: "Política de Privacidade", level: 1 })).toBeVisible();
});

test("sem sessão, /aceite leva ao login", async ({ page }) => {
  await page.goto("/aceite");
  await expect(page).toHaveURL(/\/login/);
});
