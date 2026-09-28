// lastro · UX-02 (2026-09-28) — histórico de /treino: treino de hoje
// separado, histórico agrupado por mês, calendário que filtra por dia e
// botão de gerar relatório por linha, sem sair da tela.
//
// Cada teste semeia via admin (sem passar pela UI) para controlar a data
// exata — os testes de agrupamento por mês e calendário exigem datas em
// meses diferentes, o que `semear-historico.ts` (Análise) não garante.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

function hojeSaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function dataHaDias(dias: number): string {
  const d = new Date(`${hojeSaoPaulo()}T12:00:00-03:00`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

async function exercicioQualquer(cliente: Awaited<ReturnType<typeof clienteAutenticado>>) {
  const { data, error } = await cliente.from("exercicio").select("id").limit(1).single();
  if (error || !data) throw new Error(`sem exercício: ${error?.message}`);
  return data.id as string;
}

async function semearTreino(
  cliente: Awaited<ReturnType<typeof clienteAutenticado>>,
  usuarioId: string,
  exercicioId: string,
  data: string,
) {
  const { data: treino, error } = await cliente
    .from("treino")
    .insert({ usuario_id: usuarioId, data })
    .select("id")
    .single();
  if (error || !treino) throw new Error(`falha ao semear treino ${data}: ${error?.message}`);
  const { error: erroSerie } = await cliente
    .from("serie")
    .insert({ usuario_id: usuarioId, treino_id: treino.id, exercicio_id: exercicioId, ordem: 1, tipo: "valendo", reps: 8, peso: 40 });
  if (erroSerie) throw new Error(`falha ao semear série ${data}: ${erroSerie.message}`);
  return treino.id as string;
}

async function abrirTreino(page: Page, conta: UsuarioDescartavel) {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, conta);
  await page.goto("/treino");
}

test.describe("estado vazio", () => {
  let conta: UsuarioDescartavel;
  test.beforeAll(async () => {
    conta = await criarUsuarioDescartavel("j31-vazio", "aluno");
  });
  test.afterAll(async () => {
    await apagarUsuarioDescartavel(conta);
  });

  test("conta sem treino: sem calendário, com a mensagem de vazio", async ({ page }) => {
    await abrirTreino(page, conta);
    await expect(page.locator(".calendario-mes")).toHaveCount(0);
    await expect(page.getByText("Nenhum treino registrado ainda")).toBeVisible();
  });
});

test.describe("treino de hoje", () => {
  let conta: UsuarioDescartavel;
  let idExercicio: string;

  test.beforeAll(async () => {
    conta = await criarUsuarioDescartavel("j31-hoje", "aluno");
    const cliente = await clienteAutenticado(conta);
    idExercicio = await exercicioQualquer(cliente);
    await semearTreino(cliente, conta.id, idExercicio, hojeSaoPaulo());
    await semearTreino(cliente, conta.id, idExercicio, hojeSaoPaulo());
  });

  test.afterAll(async () => {
    await apagarUsuarioDescartavel(conta);
  });

  test("dois treinos de hoje aparecem na seção HOJE, separados do histórico por mês", async ({ page }) => {
    await abrirTreino(page, conta);
    const secaoHoje = page.locator(".historico-hoje");
    await expect(secaoHoje).toBeVisible();
    await expect(secaoHoje.locator(".cartao-treino-item-wrap")).toHaveCount(2);
    // Não deve haver cabeçalho de mês para hoje: a seção HOJE é separada.
    await expect(page.locator(".historico-mes-cabecalho")).toHaveCount(0);
  });

  test("gerar relatório de uma linha abre o diálogo sem sair de /treino", async ({ page }) => {
    await abrirTreino(page, conta);
    await page.getByRole("button", { name: "Gerar relatório deste treino" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/treino$/);
  });
});

test.describe("histórico em meses diferentes, calendário e filtro por dia", () => {
  let conta: UsuarioDescartavel;
  let dataMesPassado: string;
  let dataMesAtual: string;

  test.beforeAll(async () => {
    conta = await criarUsuarioDescartavel("j31-meses", "aluno");
    const cliente = await clienteAutenticado(conta);
    const idExercicio = await exercicioQualquer(cliente);
    dataMesAtual = dataHaDias(2);
    dataMesPassado = dataHaDias(40);
    await semearTreino(cliente, conta.id, idExercicio, dataMesAtual);
    await semearTreino(cliente, conta.id, idExercicio, dataMesPassado);
  });

  test.afterAll(async () => {
    await apagarUsuarioDescartavel(conta);
  });

  test("dois treinos em meses diferentes viram dois grupos, cada um com seu cabeçalho de mês", async ({ page }) => {
    await abrirTreino(page, conta);
    await expect(page.locator(".historico-mes-cabecalho")).toHaveCount(2);
  });

  test("o calendário abre colapsado; ao abrir, mostra a grade; tocar um dia marcado filtra a lista", async ({ page }) => {
    await abrirTreino(page, conta);
    const gatilho = page.locator(".calendario-mes__gatilho");
    await expect(gatilho).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".calendario-mes__grade")).toHaveCount(0);

    await gatilho.click();
    await expect(gatilho).toHaveAttribute("aria-expanded", "true");
    const grade = page.locator(".calendario-mes__grade");
    await expect(grade).toBeVisible();

    const diaMarcado = page.locator(".calendario-dia--com-treino").first();
    await expect(diaMarcado).toBeVisible();
    await diaMarcado.click();

    // Selecionar um dia fecha o calendário e mostra o chip de filtro.
    await expect(gatilho).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".filtro-dia-ativo__chip")).toBeVisible();
    await expect(page.locator(".historico-mes-cabecalho")).toHaveCount(0);
    await expect(page.locator(".cartao-treino-item-wrap")).toHaveCount(1);

    await page.locator(".filtro-dia-ativo__limpar").click();
    await expect(page.locator(".filtro-dia-ativo__chip")).toHaveCount(0);
    await expect(page.locator(".historico-mes-cabecalho")).toHaveCount(2);
  });

  test("navegar para o mês anterior mostra o cabeçalho do mês certo", async ({ page }) => {
    await abrirTreino(page, conta);
    await page.locator(".calendario-mes__gatilho").click();
    await page.getByRole("button", { name: "Mês anterior" }).click();
    const mesPassadoNome = new Date(`${dataMesPassado}T12:00:00Z`).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const rotulo = mesPassadoNome.charAt(0).toUpperCase() + mesPassadoNome.slice(1);
    await expect(page.locator(".calendario-mes__gatilho")).toContainText(rotulo);
  });
});
