// lastro · AN-08 B2 — "Lastro percebeu" na Home (direção B do portão de
// 2026-09-29): uma sessão 60% acima do padrão de empurrar aparece dentro do
// cartão da Análise, e a conta sem padrão continua vendo o convite de sempre.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { dataHaDias, hojeNoBrasil, print, semearTreino } from "./helpers/caminho-triste";

let comPadrao: UsuarioDescartavel;
let semPadrao: UsuarioDescartavel;

test.beforeAll(async () => {
  comPadrao = await criarUsuarioDescartavel("j36-percebeu");
  semPadrao = await criarUsuarioDescartavel("j36-sem-padrao");
  const cliente = await clienteAutenticado(comPadrao);
  // Exercício de peito sem dobra de volume: 10 × 50 = 500 kg por sessão.
  const { data: peito, error } = await cliente
    .from("exercicio")
    .select("id")
    .eq("grupo_muscular_primario", "peito")
    .eq("unilateral", false)
    .eq("peso_por_lado", false)
    .order("nome")
    .limit(1)
    .single();
  if (error || !peito) throw new Error(`Preparação: exercício de peito: ${error?.message}`);
  for (const dias of [12, 10, 8, 6]) {
    await semearTreino(cliente, comPadrao.id, dataHaDias(dias), peito.id, { reps: 10, peso: 50 });
  }
  // Hoje: 10 × 80 = 800 kg, 60% acima da mediana de 500.
  await semearTreino(cliente, comPadrao.id, hojeNoBrasil(), peito.id, { reps: 10, peso: 80 });
});

test.afterAll(async () => {
  if (comPadrao) await apagarUsuarioDescartavel(comPadrao);
  if (semPadrao) await apagarUsuarioDescartavel(semPadrao);
});

test("sessão fora do padrão aparece no cartão da Análise, com o número e o link", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, comPadrao);
  await page.goto("/");

  const itens = page.locator(".percebeu__item");
  await expect(itens).toHaveCount(1);
  await expect(itens.first()).toHaveText(/^No treino de empurrar de .+ você moveu 0,8 t, 60% acima do seu padrão\.$/);
  await expect(page.locator(".percebeu__numero--acima")).toHaveText("0,8 t");
  await expect(page.locator(".percebeu__rotulo")).toContainText("Lastro percebeu");
  await expect(page.locator(".percebeu__lista")).toHaveAttribute("href", "/analise");
  await expect(page.getByText("Toque para ver a leitura da sua semana.")).toHaveCount(0);
  await page.locator(".ai-coach-card").scrollIntoViewIfNeeded();
  await print(page, "j36-home-percebeu-375");
});

test("sem padrão (menos de 4 sessões do mesmo tipo), o cartão fica como era", async ({ page }) => {
  await entrarComoUsuario(page, semPadrao);
  await page.goto("/");
  await expect(page.locator(".ai-coach-card")).toBeVisible();
  await expect(page.locator(".percebeu__item")).toHaveCount(0);
  await expect(page.getByText("Ainda sem treinos nesta semana.", { exact: false })).toBeVisible();
});
