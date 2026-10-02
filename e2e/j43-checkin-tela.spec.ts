// lastro · AN-08 A1 — a folha do check-in na Home (decisão do dono, 2026-10-01):
// sobe sozinha ao abrir o app enquanto o dia não tem resposta; respondeu, não
// volta mais naquele dia, nem fechando e abrindo o app de novo.
//
// As outras specs rodam com a marca "já respondi hoje" (playwright.config.ts);
// esta é a que a desliga.
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { dataLocalBrasil } from "../src/lib/tempo";

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
async function abrirApp(browser: Browser, usuario: UsuarioDescartavel, estado?: Awaited<ReturnType<BrowserContext["storageState"]>>) {
  const contexto = await browser.newContext(estado ? { storageState: estado } : {});
  const page = await contexto.newPage();
  await entrarComoUsuario(page, usuario, { checkinAberto: true });
  // O login já cai na Home: é essa a "abertura do app". Recarregar na mesma aba
  // não a repete (sessionStorage), de propósito.
  if (new URL(page.url()).pathname !== "/") await page.goto("/");
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
  await expect(page.getByRole("tab", { name: "Check-in", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".checkin-resumo__linha")).toHaveCount(4);
  await page.getByRole("tab", { name: "Grupos", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toBeHidden();
  await page.getByRole("tab", { name: "Check-in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toBeVisible();
  await expect(FOLHA(page)).toHaveCount(0);

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

  // Os últimos 7 dias: hoje com as notas, os outros 6 como "sem check-in".
  await reaberto.page.getByRole("link", { name: "Ver últimos 7 dias" }).click();
  await expect(reaberto.page).toHaveURL(/\/checkin$/);
  await expect(reaberto.page.getByRole("listitem")).toHaveCount(7);
  await expect(reaberto.page.getByRole("img", { name: "Sono: nota 4 de 5" })).toBeVisible();
  await expect(reaberto.page.getByText("Sem check-in neste dia.")).toHaveCount(6);

  // Apagar meus check-ins: pede confirmação, apaga tudo e não deixa nada no banco.
  await reaberto.page.getByRole("button", { name: "Apagar meus check-ins" }).click();
  await reaberto.page.getByRole("button", { name: "Sim, apagar tudo" }).click();
  await expect(reaberto.page.getByText("Sem check-in neste dia.")).toHaveCount(7);
  await expect(reaberto.page.getByRole("button", { name: "Apagar meus check-ins" })).toHaveCount(0);
  await expect
    .poll(async () => (await cliente.from("checkin").select("dia")).data)
    .toEqual([]);
  await reaberto.contexto.close();
});

test("'Agora não' encerra a subida automática do dia: nem uma abertura nova do app a repete, e o cartão segue lá", async ({ browser }) => {
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

  // Abertura nova do app NESTE aparelho (o localStorage vem junto, o sessionStorage não):
  // a dispensa vale pelo dia, a folha não sobe e o cartão continua como porta.
  // Só o localStorage: sem os cookies, a nova abertura faz o login de novo.
  const { origins } = await contexto.storageState();
  const estado = { cookies: [], origins };
  await contexto.close();
  const novo = await abrirApp(browser, adiador, estado);
  await expect(novo.page.getByRole("button", { name: "Responder" })).toBeVisible({ timeout: 15_000 });
  await expect(FOLHA(novo.page)).toHaveCount(0);
  await novo.page.getByRole("button", { name: "Responder" }).click();
  await expect(FOLHA(novo.page)).toBeVisible();
  await novo.contexto.close();
});

test("duas contas no mesmo navegador não se misturam: a resposta de uma não aparece na outra", async ({ browser }) => {
  test.setTimeout(150_000);
  const a = await criarUsuarioDescartavel("j43-conta-a");
  const b = await criarUsuarioDescartavel("j43-conta-b");
  const contexto = await browser.newContext();
  try {
    const page = await contexto.newPage();

    // A responde (e fica gravado no localStorage deste navegador).
    await entrarComoUsuario(page, a, { checkinAberto: true });
    await expect(FOLHA(page)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Sono, nota 5 de 5" }).click();
    await FOLHA(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();

    // Mesmo navegador (mesmo localStorage), outra conta.
    await contexto.clearCookies();
    await entrarComoUsuario(page, b, { checkinAberto: true });
    // B nunca respondeu: a folha sobe e o cartão não traz a nota de A.
    await expect(FOLHA(page)).toBeVisible({ timeout: 15_000 });
    await FOLHA(page).getByRole("button", { name: "Agora não" }).click();
    await expect(page.getByRole("button", { name: "Responder" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  } finally {
    await contexto.close();
    await apagarUsuarioDescartavel(a);
    await apagarUsuarioDescartavel(b);
  }
});

function diasAtras(hoje: string, n: number): string {
  const [a, m, d] = hoje.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - n)).toISOString().slice(0, 10);
}

test("A2: com 4+ dias de histórico, o cartão compara hoje com a média da própria pessoa (e sem histórico não mostra nada)", async ({ browser }) => {
  test.setTimeout(150_000);
  const conta = await criarUsuarioDescartavel("j43-a2");
  try {
    // 5 dias anteriores: energia 2, sono 3, só isso (dor e estresse sem histórico).
    const cliente = await clienteAutenticado(conta);
    const hoje = dataLocalBrasil();
    const linhas = [1, 2, 3, 4, 5].map((n) => ({ usuario_id: conta.id, dia: diasAtras(hoje, n), sono: 3, energia: 2 }));
    const { error } = await cliente.from("checkin").insert(linhas);
    expect(error, "semear o histórico").toBeNull();

    const { contexto, page } = await abrirApp(browser, conta);
    await expect(FOLHA(page)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Sono, nota 3 de 5" }).click();
    await page.getByRole("button", { name: "Energia, nota 5 de 5" }).click();
    await page.getByRole("button", { name: "Dor muscular, nota 2 de 5" }).click();
    await FOLHA(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();

    // Energia 5 contra média 2: acima. Sono 3 contra média 3: na média.
    // Dor não tem histórico: nenhuma comparação.
    await expect(page.getByText("acima da sua média")).toHaveCount(1);
    await expect(page.getByText("na sua média")).toHaveCount(1);
    await expect(page.getByText("abaixo da sua média")).toHaveCount(0);
    await contexto.close();
  } finally {
    await apagarUsuarioDescartavel(conta);
  }
});
