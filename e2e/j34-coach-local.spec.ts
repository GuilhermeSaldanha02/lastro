// lastro · AN-08 M1 — o Coach responde sozinho o que o lastro sabe calcular.
//
// Sem mock de /api/coach (ao contrário da j3): a prova é justamente a rota
// real responder com os números da conta SEM chamar a Gemini. O sinal de que
// não chamou é a tabela `uso_ia` continuar vazia — toda chamada à Gemini
// reserva cota ali antes de acontecer.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAdmin,
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

/** Contador do dia (F0-CUSTO). É global, sem usuário: compara antes × depois. */
async function contadorDoDia(intent: string, destino: string): Promise<number> {
  const { data, error } = await clienteAdmin()
    .from("coach_contador_diario")
    .select("total")
    .eq("dia", hojeNoBrasil())
    .eq("intent", intent)
    .eq("destino", destino)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler coach_contador_diario: ${error.message}`);
  return (data?.total as number | undefined) ?? 0;
}

test("pergunta sobre UM grupo responde local e conta no contador do dia (AN-08 M3)", async ({ page }) => {
  test.setTimeout(90_000);
  const antes = await contadorDoDia("FREQUENCIA_GRUPO", "local");
  await entrarComoUsuario(page, aluno);
  await page.goto("/coach");

  await page.getByPlaceholder("Pergunte ao assistente…").fill("Quantas vezes treinei peito?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  // O grupo do exercício semeado não é fixo: vale a resposta de frequência ou a de "nunca treinou".
  await expect(respostas(page).last()).toHaveText(
    /^(Nas últimas 4 semanas, Peito (entrou em \d+ treinos?|não entrou em nenhum treino)\. Última série valendo: .+\.|Você ainda não registrou série valendo de Peito\.)$/,
    { timeout: 20_000 },
  );
  await expect(page.locator(".balao--dele .balao__quem").last()).toHaveText("Calculado pelo lastro");

  expect(await contadorDoDia("FREQUENCIA_GRUPO", "local"), "a resposta local não contou").toBeGreaterThan(antes);
  expect(await usosDeIa(), "a pergunta de grupo reservou cota da Gemini").toBe(0);
});

test("semanas seguidas e meta semanal respondem local (AN-08 M3, resto da C2)", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, aluno);
  await page.goto("/coach");
  const campo = page.getByPlaceholder("Pergunte ao assistente…");

  // O beforeAll semeia um treino hoje: a semana em andamento entra na conta.
  await campo.fill("Quantas semanas seguidas treinei?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(respostas(page).last()).toHaveText(
    /^(\d+ semanas seguidas com pelo menos 1 treino, contando esta\.|Esta semana já tem treino; a semana passada ficou sem\.)$/,
    { timeout: 20_000 },
  );

  await campo.fill("Bati minha meta esta semana?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(respostas(page).last()).toHaveText(
    /(Nesta semana, até hoje: \d+ de \d+\.|Você ainda não definiu uma meta semanal\. Ela fica em Ajustes\.)$/,
    { timeout: 20_000 },
  );
  expect(await usosDeIa(), "meta ou semanas reservaram cota da Gemini").toBe(0);
});

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

test("relatório do mês pelo Coach: responde, salva em Pareceres salvos e não gasta cota (AN-08 M2-3)", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, aluno);
  await page.goto("/coach");

  await page.getByPlaceholder("Pergunte ao assistente…").fill("Como foi meu mês?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(respostas(page).last()).toContainText("Relatório salvo em Pareceres salvos", { timeout: 20_000 });
  await expect(respostas(page).last()).toHaveText(/^\S+ \d{4}: \d+ treinos? até hoje\./);

  const cliente = await clienteAutenticado(aluno);
  const { data: salvos } = await cliente
    .from("parecer")
    .select("pergunta, status, confirmado")
    .eq("usuario_id", aluno.id)
    .eq("pergunta", 6);
  expect(salvos, "o relatório do Coach não foi salvo como parecer confirmado").toEqual([
    { pergunta: 6, status: "pronto", confirmado: true },
  ]);
  expect(await usosDeIa(), "o relatório do Coach gastou cota de IA").toBe(0);
});
