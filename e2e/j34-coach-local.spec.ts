// lastro · AN-08 M1 — o Coach responde sozinho o que o lastro sabe calcular.
//
// Sem mock de /api/coach (ao contrário da j3): a prova é justamente a rota
// real responder com os números da conta SEM chamar a Gemini. O sinal de que
// não chamou é a tabela `uso_ia` continuar vazia — toda chamada à Gemini
// reserva cota ali antes de acontecer.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";
import { hojeNoBrasil, primeiroExercicio, semearTreino } from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j34-coach");
  const cliente = await clienteAutenticado(aluno);
  await semearHistoricoParaAnalise(cliente, aluno.id);
  const exercicio = await primeiroExercicio(cliente);
  await semearTreino(cliente, aluno.id, hojeNoBrasil(), exercicio.id, { reps: 10, peso: 40 });
});

test.afterAll(async () => {
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

async function usosDeIa(): Promise<number> {
  const cliente = await clienteAutenticado(aluno);
  const { count, error } = await cliente
    .from("uso_ia")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", aluno.id);
  if (error) throw new Error(`Falha ao contar uso_ia: ${error.message}`);
  return count ?? -1;
}

const respostas = (page: Page) => page.locator(".balao--dele .balao__texto");

test("chips e recusa respondem com os números da conta, sem gastar cota de IA", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, aluno);
  await page.goto("/coach");

  await page.getByRole("button", { name: "Como foi meu volume de treino nesta semana?" }).click();
  await expect(respostas(page).last()).toHaveText(/^Nesta semana, até hoje: [\d.]+ kg em 1 treino\./, {
    timeout: 20_000,
  });
  await expect(page.locator(".balao--dele .balao__quem").last()).toHaveText("Calculado pelo lastro");

  const campo = page.getByPlaceholder("Pergunte ao assistente…");
  await campo.fill("Qual grupo muscular estou treinando com menor frequência?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(respostas(page).nth(1)).toHaveText(/^Nas últimas 4 semanas, os grupos menos treinados foram: /, {
    timeout: 20_000,
  });

  await campo.fill("Devo aumentar a carga no próximo treino?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(respostas(page).nth(2)).toContainText("O lastro analisa o que foi feito", { timeout: 20_000 });

  expect(await usosDeIa(), "uma resposta local reservou cota da Gemini").toBe(0);
});
