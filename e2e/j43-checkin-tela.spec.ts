// lastro · AN-08 A1 — a folha do check-in na Home (decisão do dono, 2026-10-01):
// sobe sozinha ao abrir o app enquanto o dia não tem resposta; respondeu, não
// volta mais naquele dia, nem fechando e abrindo o app de novo.
//
// As outras specs rodam com a marca "já respondi hoje" (playwright.config.ts);
// esta é a que a desliga.
import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { dataLocalBrasil } from "../src/lib/tempo";

test.use({ storageState: { cookies: [], origins: [] } });

let respondedor: UsuarioDescartavel;
let adiador: UsuarioDescartavel;

test.beforeAll(async () => {
  respondedor = await criarUsuarioDescartavel("j43-responde");
  adiador = await criarUsuarioDescartavel("j43-adia");
});

test.afterAll(async () => {
  for (const c of [respondedor, adiador]) if (c) await apagarUsuarioDescartavel(c);
});

const FOLHA = (page: Page) => page.getByRole("dialog", { name: "Como você está hoje?" });

/** Uma "abertura do app" nova: contexto limpo (sessionStorage zerado), mesma conta. */
async function abrirApp(browser: Browser, usuario: UsuarioDescartavel) {
  const contexto = await browser.newContext();
  const page = await contexto.newPage();
  await entrarComoUsuario(page, usuario, { checkinAberto: true });
  await page.goto("/");
  return { contexto, page };
}

test("a folha sobe sozinha, salvar grava e, respondido, ela não volta mais no dia", async ({ browser }) => {
  test.setTimeout(120_000);
  const { contexto, page } = await abrirApp(browser, respondedor);

  await expect(FOLHA(page)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Sono, nota 4 de 5" }).click();
  await expect(FOLHA(page).getByText("1 de 4")).toBeVisible();
  await FOLHA(page).getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(FOLHA(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();

  const hoje = dataLocalBrasil();
  const cliente = await clienteAutenticado(respondedor);
  await expect
    .poll(async () => {
      const { data } = await cliente.from("checkin").select("sono, energia").eq("dia", hoje).maybeSingle();
      return data;
    })
    .toEqual({ sono: 4, energia: null });

  // Fechou o app e abriu de novo (contexto novo, sem nada do navegador anterior).
  await contexto.close();
  const reaberto = await abrirApp(browser, respondedor);
  await expect(reaberto.page.getByRole("button", { name: "Editar" })).toBeVisible({ timeout: 15_000 });
  await expect(FOLHA(reaberto.page)).toHaveCount(0);
  await reaberto.contexto.close();
});

test("'Agora não' não repete na mesma abertura, mas volta na próxima enquanto o dia está sem resposta", async ({ browser }) => {
  test.setTimeout(120_000);
  const { contexto, page } = await abrirApp(browser, adiador);

  await expect(FOLHA(page)).toBeVisible({ timeout: 15_000 });
  await FOLHA(page).getByRole("button", { name: "Agora não" }).click();
  await expect(FOLHA(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Responder" })).toBeVisible();

  // Voltar à Home na mesma abertura não a faz subir de novo.
  await page.goto("/ajustes");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Responder" })).toBeVisible();
  await expect(FOLHA(page)).toHaveCount(0);

  // Nada foi gravado.
  const cliente = await clienteAutenticado(adiador);
  const { data } = await cliente.from("checkin").select("dia").eq("dia", dataLocalBrasil());
  expect(data).toEqual([]);
  await contexto.close();

  // Abertura nova do app: sobe de novo.
  const novo = await abrirApp(browser, adiador);
  await expect(FOLHA(novo.page)).toBeVisible({ timeout: 15_000 });
  await novo.contexto.close();
});
