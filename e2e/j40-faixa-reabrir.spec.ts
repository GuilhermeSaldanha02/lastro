// lastro · FAIXA-REABRIR (auditoria independente, 2026-10-01).
//
// O auditor mediu, num Chrome com a aba em segundo plano, a faixa de ações de
// `/treino/[id]` com 129 px e a reserva de espaço (`--lastro-acao-area-altura`)
// com 69 px depois de "Reabrir treino". Suspeita: artefato da aba oculta, onde
// o navegador não dispara o `ResizeObserver` que publica essa altura. Esta spec
// decide com a página VISÍVEL: a reserva tem de acompanhar a faixa em cada
// estado (aberto, finalizado, reaberto), e o último cartão não pode ficar
// atrás da faixa no fim da rolagem.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { hojeNoBrasil, print } from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;
let treinoId: string;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j40-faixa");
  const cliente = await clienteAutenticado(aluno);
  // Lista longa: 6 exercícios do mesmo grupo, uma série em cada. O fim da
  // rolagem só tem o que provar quando a lista passa da altura da tela.
  const { data: exercicios, error } = await cliente
    .from("exercicio")
    .select("id")
    .eq("grupo_muscular_primario", "peito")
    .order("nome")
    .limit(6);
  if (error || !exercicios || exercicios.length < 6) {
    throw new Error(`Preparação: 6 exercícios de peito: ${error?.message}`);
  }
  const { data: treino, error: erroTreino } = await cliente
    .from("treino")
    .insert({ usuario_id: aluno.id, data: hojeNoBrasil() })
    .select("id")
    .single();
  if (erroTreino || !treino) throw new Error(`Preparação: treino: ${erroTreino?.message}`);
  treinoId = treino.id;
  const { error: erroSeries } = await cliente.from("serie").insert(
    exercicios.map((e, i) => ({
      treino_id: treinoId,
      exercicio_id: e.id,
      ordem: i + 1,
      tipo: "valendo",
      reps: 10,
      peso: 40 + i,
    })),
  );
  if (erroSeries) throw new Error(`Preparação: séries: ${erroSeries.message}`);
});

test.afterAll(async () => {
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

/** Altura real da faixa × espaço que a tela reserva para ela. */
async function medir(page: Page): Promise<{ faixa: number; reservado: number }> {
  return page.evaluate(() => {
    const faixa = document.querySelector(".acao-area") as HTMLElement | null;
    return {
      faixa: faixa ? Math.ceil(faixa.getBoundingClientRect().height) : -1,
      reservado: parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--lastro-acao-area-altura"),
      ),
    };
  });
}

/** A reserva acompanha a faixa (tolerância de 1 px do arredondamento). */
async function esperarReservaAcompanhar(page: Page, estado: string): Promise<void> {
  await expect
    .poll(async () => {
      const { faixa, reservado } = await medir(page);
      return Math.abs(faixa - reservado) <= 1 && faixa > 0;
    }, { message: `${estado}: a reserva de espaço não acompanhou a faixa`, timeout: 10_000 })
    .toBe(true);
}

/** Rola até o fim e devolve quanto do último cartão fica atrás da faixa (px; <= 0 = nada). */
async function pixelsEscondidosNoFim(page: Page): Promise<number> {
  return page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      if (el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
        el.scrollTop = el.scrollHeight;
      }
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const faixa = document.querySelector(".acao-area") as HTMLElement;
    const cartoes = document.querySelectorAll(".grade-exercicio");
    const ultimo = cartoes[cartoes.length - 1] as HTMLElement;
    return Math.round(ultimo.getBoundingClientRect().bottom - faixa.getBoundingClientRect().top);
  });
}

test("a reserva de espaço da faixa acompanha a altura dela ao finalizar e ao reabrir", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, aluno);
  await page.goto(`/treino/${treinoId}`);
  await expect(page.locator(".grade-exercicio")).toHaveCount(6);

  // 1. Aberto, com séries: "Repetir série / Outra série" + "Finalizar Treino".
  await esperarReservaAcompanhar(page, "aberto");
  expect(await pixelsEscondidosNoFim(page), "aberto: último cartão atrás da faixa").toBeLessThanOrEqual(1);

  // 2. Finaliza.
  await page.getByRole("button", { name: "Finalizar Treino" }).click();
  await page.waitForTimeout(700); // TR-13: a confirmação ignora o toque que chega cedo demais
  await page.locator(".confirma").getByRole("button", { name: "Finalizar Treino" }).click();
  await expect(page.getByRole("button", { name: "Fechar", exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reabrir treino" })).toBeVisible();
  await esperarReservaAcompanhar(page, "finalizado");
  expect(await pixelsEscondidosNoFim(page), "finalizado: último cartão atrás da faixa").toBeLessThanOrEqual(1);

  // 3. Reabre SEM recarregar a página: é o caso do relato.
  await page.getByRole("button", { name: "Reabrir treino" }).click();
  await expect(page.getByRole("button", { name: "Repetir série" })).toBeVisible({ timeout: 20_000 });
  await esperarReservaAcompanhar(page, "reaberto");
  const escondidos = await pixelsEscondidosNoFim(page);
  await print(page, "j40-faixa-reaberta-375");
  expect(escondidos, `reaberto: ${escondidos} px do último cartão ficaram atrás da faixa`).toBeLessThanOrEqual(1);
});
