// lastro · AN-08 B1 — ao finalizar uma sessão fora do padrão, a tela de
// compartilhar mostra o volume contra o padrão do próprio usuário, FORA do
// cartão que vira imagem (direção C do portão de 2026-09-29).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { dataHaDias, hojeNoBrasil, print, semearTreino } from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;
let treinoDeHoje: string;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j37-pos-treino");
  const cliente = await clienteAutenticado(aluno);
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
    await semearTreino(cliente, aluno.id, dataHaDias(dias), peito.id, { reps: 10, peso: 50 });
  }
  // Hoje, em aberto: 10 × 80 = 800 kg contra a mediana de 500 (+60%).
  ({ treinoId: treinoDeHoje } = await semearTreino(cliente, aluno.id, hojeNoBrasil(), peito.id, { reps: 10, peso: 80 }));
});

test.afterAll(async () => {
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

test("finalizar uma sessão fora do padrão mostra o bloco fora do cartão compartilhável", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, aluno);
  await page.goto(`/treino/${treinoDeHoje}`);

  await page.getByRole("button", { name: "Finalizar Treino" }).click();
  // A confirmação ignora o toque que chega cedo demais (TR-13): espera antes do 2º toque.
  await page.waitForTimeout(700);
  await page.locator(".confirma").getByRole("button", { name: "Finalizar Treino" }).click();

  const bloco = page.locator(".pos-treino-padrao");
  await expect(bloco).toBeVisible({ timeout: 20_000 });
  await expect(bloco).toContainText("Lastro percebeu · volume vs. seu padrão", { ignoreCase: true });
  await expect(page.locator(".pos-treino-padrao__volume")).toHaveText("0,8 t");
  await expect(page.locator(".pos-treino-padrao__pct--acima")).toHaveText("+60%");
  await expect(bloco).toContainText("seu padrão de empurrar: 0,5 t");
  // Fora do cartão que vira imagem.
  await expect(page.locator(".pos-treino-card-transparente-wrapper .pos-treino-padrao")).toHaveCount(0);
  await print(page, "j37-pos-treino-padrao-375");
});
