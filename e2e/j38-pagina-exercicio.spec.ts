// lastro · AN-08 C1 — "Seu recorde" na página do exercício (direção C do
// portão de 2026-09-29). Recorde é o maior e1RM; a maior carga é outro dado.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { dataHaDias, print, semearTreino } from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;
let exercicioId: string;
let semHistoricoId: string;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j38-exercicio");
  const cliente = await clienteAutenticado(aluno);
  const { data, error } = await cliente
    .from("exercicio")
    .select("id")
    .eq("grupo_muscular_primario", "peito")
    .order("nome")
    .limit(2);
  if (error || !data || data.length < 2) throw new Error(`Preparação: exercícios de peito: ${error?.message}`);
  exercicioId = data[0].id;
  semHistoricoId = data[1].id;
  // e1RM: 10×50 = 66,7 · 5×60 = 70,0 · 10×55 = 73,3 (recorde, na última sessão).
  await semearTreino(cliente, aluno.id, dataHaDias(10), exercicioId, { reps: 10, peso: 50 });
  await semearTreino(cliente, aluno.id, dataHaDias(6), exercicioId, { reps: 5, peso: 60 });
  await semearTreino(cliente, aluno.id, dataHaDias(2), exercicioId, { reps: 10, peso: 55 });
});

test.afterAll(async () => {
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

test("recorde de e1RM em destaque, com maior carga e evolução ao lado", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, aluno);
  await page.goto(`/catalogo/${exercicioId}`);

  const secao = page.locator(".desempenho-exercicio");
  await expect(secao).toBeVisible();
  await expect(page.locator(".desempenho-exercicio__recorde")).toHaveText("73,3 kg");
  await expect(page.locator(".desempenho-exercicio__serie")).toContainText("10 × 55 kg");
  await expect(page.locator(".desempenho-exercicio__serie")).toContainText("batido na última sessão");
  await expect(secao).toContainText("Maior carga");
  await expect(secao).toContainText("60 kg");
  await expect(secao).toContainText("5 reps");
  // 1ª metade: 66,7; 2ª: 73,3 → +10%.
  await expect(page.locator(".desempenho-exercicio__fato-valor--alta")).toHaveText("+10%");
  await expect(page.getByText("Melhor marca:", { exact: false })).toHaveCount(0);
  await secao.scrollIntoViewIfNeeded();
  await print(page, "j38-pagina-exercicio-375");
});

test("exercício sem série da conta não mostra a seção", async ({ page }) => {
  await entrarComoUsuario(page, aluno);
  await page.goto(`/catalogo/${semHistoricoId}`);
  await expect(page.locator(".exercicio-hero-card")).toBeVisible();
  await expect(page.locator(".desempenho-exercicio")).toHaveCount(0);
});
