// lastro · AN-08 M2-2 — perguntas 6 ("Como foi meu mês?") e 7 ("Como foi do
// primeiro treino até hoje?") na Análise, por lógica: sem Gemini, sem cota,
// no mesmo histórico de pareceres, com o cabeçalho de PERÍODO (não "Semana de").
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";
import { hojeNoBrasil, primeiroExercicio, print, semearTreino } from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j35-periodo");
  const cliente = await clienteAutenticado(aluno);
  await semearHistoricoParaAnalise(cliente, aluno.id);
  const exercicio = await primeiroExercicio(cliente);
  await semearTreino(cliente, aluno.id, hojeNoBrasil(), exercicio.id, { reps: 10, peso: 40 });
});

test.afterAll(async () => {
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

async function parecer(id: string) {
  const cliente = await clienteAutenticado(aluno);
  const { data, error } = await cliente
    .from("parecer")
    .select("status, texto, evidencia, aviso_falha_interpretativa")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(`Falha ao ler parecer: ${error?.message}`);
  return data as {
    status: string;
    texto: string;
    evidencia: { periodo: { tipo_periodo?: string }; blocos: unknown[] };
    aviso_falha_interpretativa: boolean;
  };
}

async function usosDeIa(): Promise<number> {
  const cliente = await clienteAutenticado(aluno);
  const { count } = await cliente.from("uso_ia").select("id", { count: "exact", head: true }).eq("usuario_id", aluno.id);
  return count ?? -1;
}

test("6 e 7 nascem prontas, por lógica, e a página mostra o cabeçalho de período", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await entrarComoUsuario(page, aluno);

  await page.goto("/analise");
  await expect(page.locator(".pergunta")).toHaveCount(7);

  const mes = await page.request.post("/api/analise", { data: { pergunta: 6 } });
  expect(mes.status()).toBe(202);
  const pMes = await parecer((await mes.json()).rascunhoId);
  expect(pMes.status).toBe("pronto");
  expect(pMes.aviso_falha_interpretativa).toBe(false);
  expect(pMes.texto).toMatch(/^\S+ \d{4}: \d+ treinos? até hoje\./);
  expect(pMes.evidencia.periodo.tipo_periodo).toBe("mes");
  expect(pMes.evidencia.blocos).toEqual([]);

  const desde = await page.request.post("/api/analise", { data: { pergunta: 7 } });
  expect(desde.status()).toBe(202);
  const idDesde = (await desde.json()).rascunhoId as string;
  const pDesde = await parecer(idDesde);
  expect(pDesde.texto).toMatch(/^Desde \d+ \S+ \d{4}: 5 treinos\./);
  expect(pDesde.evidencia.periodo.tipo_periodo).toBe("historico");

  expect(await usosDeIa(), "pergunta de período gastou cota de IA").toBe(0);

  await page.goto(`/ajustes/relatorios/parecer/${idDesde}`);
  await expect(page.locator(".doc__selo")).toHaveText("Relatório do período");
  await expect(page.locator(".doc__meta")).toContainText("Período");
  await expect(page.locator(".doc__veredito")).toHaveText(/^Desde \d+ \S+ \d{4}: 5 treinos\.$/);
  await print(page, "relatorio-desde-o-primeiro-treino");
});
