// lastro · UX-03 — as duas lacunas que a j26 deixou (2026-09-28): `/treino/[id]`
// com série esperando a rede e com erro de validação à vista, e o detalhe do
// catálogo de um exercício COM mídia (a j26 pegou um sem GIF).
//
// Mesmo contrato da j26: MEDE e grava (`helpers/medir-tela.ts`), não reprova
// por achado visual. Só falha se a tela não carregar ou o estado não se formar.
// Quem lê o resultado é `docs/qualidade/ux-03-auditoria-2026-09-26.md`.
import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import {
  apagarSemErro,
  esperarFilaAssentar,
  filaLocal,
  hojeNoBrasil,
  pesoUnico,
  primeiroExercicio,
  semearTreino,
} from "./helpers/caminho-triste";
import { registrarTela } from "./helpers/medir-tela";
import midia from "../src/lib/dados/exercicios-midia.json";

const VIEWPORT = { width: 375, height: 812 };

let aluno: UsuarioDescartavel;
let urlTreino = "";
let exercicioComMidiaId = "";

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j33-aluno");
  const cliente = await clienteAutenticado(aluno);
  const exercicio = await primeiroExercicio(cliente);
  const { treinoId } = await semearTreino(cliente, aluno.id, hojeNoBrasil(), exercicio.id, { reps: 8, peso: 40 });
  urlTreino = `/treino/${treinoId}`;

  // A migração 0021 casa mídia por nome, então o nome é a chave estável.
  const { data } = await cliente.from("exercicio").select("id").eq("nome", midia[0].nomePt).single();
  exercicioComMidiaId = data?.id ?? "";
});

test.afterAll(async () => {
  await apagarSemErro(aluno);
});

function anotar(nome: string, dados: unknown) {
  fs.writeFileSync(test.info().outputPath(`${nome}__estado.json`), JSON.stringify(dados, null, 2));
}

async function abrirFormulario(page: Page) {
  await page.setViewportSize(VIEWPORT);
  await entrarComoUsuario(page, aluno);
  await page.goto(urlTreino);
  await page.getByRole("button", { name: /^(Outra série|Adicionar exercício)$/ }).click();
  const reps = page.locator("#reps");
  const chip = page.locator("label.chip").first();
  await expect(reps.or(chip)).toBeVisible();
  if (!(await reps.isVisible())) {
    await chip.click();
    await page.getByRole("button", { name: "Continuar" }).click();
  }
  await expect(reps).toBeVisible();
}

async function preencher(page: Page, reps: string, peso: string) {
  await page.locator("#exercicio_id").selectOption({ index: 1 });
  await page.locator("#tipo").selectOption("valendo");
  await page.locator("#reps").fill(reps);
  await page.locator("#peso").fill(peso);
}

test("treino: série registrada sem rede, esperando sincronizar", async ({ page, context }) => {
  test.setTimeout(120_000);
  await abrirFormulario(page);
  await context.setOffline(true);
  try {
    await preencher(page, "10", pesoUnico(31));
    await page.getByRole("button", { name: "Registrar série" }).click();
    await expect(page.locator(".grade-series__linha").nth(1)).toBeVisible();
    await registrarTela(page, "/treino/[id]-offline-pendente", "pt-BR");
    anotar("offline-pendente", {
      fila: await filaLocal(page),
      indicador: (await page.locator(".sync").innerText().catch(() => "")).trim(),
    });
  } finally {
    await context.setOffline(false);
  }
  await esperarFilaAssentar(page, 40_000);
  await registrarTela(page, "/treino/[id]-depois-de-reconectar", "pt-BR");
});

test("treino: número fora do limite com o formulário aberto", async ({ page }) => {
  test.setTimeout(90_000);
  await abrirFormulario(page);
  await preencher(page, "201", pesoUnico(32));
  await page.getByRole("button", { name: "Registrar série" }).click();
  const erro = page.locator(".aviso-erro");
  await expect(erro.or(page.locator(".grade-series__linha").nth(1)).first()).toBeVisible({ timeout: 15_000 });
  const recusouNaTela = await erro.isVisible();
  if (!recusouNaTela) await esperarFilaAssentar(page, 15_000);
  await registrarTela(page, "/treino/[id]-erro", "pt-BR");
  anotar("erro", {
    recusouNaTela,
    aviso: recusouNaTela ? (await erro.innerText()).trim() : null,
    fila: await filaLocal(page),
    indicador: (await page.locator(".sync").innerText().catch(() => "")).trim(),
  });
});

for (const idioma of ["pt-BR", "en", "es"] as const) {
  test(`catálogo: detalhe de exercício com mídia (${idioma})`, async ({ page }) => {
    expect(exercicioComMidiaId, `exercício "${midia[0].nomePt}" não achado no catálogo`).not.toBe("");
    const cliente = await clienteAutenticado(aluno);
    await cliente.from("usuario").update({ idioma }).eq("id", aluno.id);
    try {
      await page.setViewportSize(VIEWPORT);
      await entrarComoUsuario(page, aluno);
      const resposta = await page.goto(`/catalogo/${exercicioComMidiaId}`);
      expect(resposta?.status() ?? 0).toBeLessThan(500);
      await page.waitForLoadState("networkidle").catch(() => {});
      const imagens = await page.evaluate(() =>
        [...document.querySelectorAll("img")]
          .filter((img) => /\.gif/i.test(img.currentSrc || img.src))
          .map((img) => ({ src: img.currentSrc || img.src, carregou: img.complete && img.naturalWidth > 0, w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height) })),
      );
      await registrarTela(page, "/catalogo/[id]-com-midia", idioma);
      anotar(`catalogo-midia-${idioma}`, { exercicio: midia[0].nomePt, imagens });
    } finally {
      await cliente.from("usuario").update({ idioma: "pt-BR" }).eq("id", aluno.id);
    }
  });
}
