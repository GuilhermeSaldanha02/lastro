// lastro · Fase 6 (E2E) — J2: Análise Semanal (PRD §6, A6/D5).
//
// A2 do ASKUSER original desta tarefa: /api/analise é interceptado no
// NAVEGADOR (page.route), a Gemini real nunca é chamada. Não é economia
// disfarçada de rigor — é o que o próprio PRD já decide: a chave da
// Gemini só existe atrás de src/app/api/ (FF1/FF2, A5), e o critério A6
// ("parecer cita número real") já está definido como leitura HUMANA de
// pareceres reais (o agente qa-treino), não automação de CI. E2E só
// consegue testar até a borda da rota mesmo — então testa exatamente
// isso: que a tela chama a rota certa, manda a pergunta certa, e renderiza
// o que a rota devolve.
import { test, expect } from "@playwright/test";
import {
  criarUsuarioDescartavel,
  apagarUsuarioDescartavel,
  entrarComoUsuario,
  clienteAutenticado,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";

let usuario: UsuarioDescartavel;

test.beforeAll(async () => {
  usuario = await criarUsuarioDescartavel("j2");
  const cliente = await clienteAutenticado(usuario);
  await semearHistoricoParaAnalise(cliente, usuario.id);
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(usuario);
});

const PARECER_MOCADO =
  "Seu volume total na última semana foi de 320 kg, dentro da faixa de referência.";

test("pede a Análise Semanal e mostra o parecer da rota (A6, sem gastar cota real da Gemini)", async ({
  page,
}) => {
  let corpoRecebido: unknown = null;

  await page.route("**/api/analise", async (route) => {
    corpoRecebido = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        parecer: PARECER_MOCADO,
        evidencia: {
          periodo: {
            semana_atual_inicio: "2026-08-24",
            semana_atual_fim: "2026-08-30",
            janela_semanas: 4,
          },
          blocos: [],
        },
      }),
    });
  });

  await entrarComoUsuario(page, usuario);
  await page.goto("/analise");

  // As 4 semanas semeadas (28/21/14/7 dias atrás) precisam ter destravado
  // o botão — se o aviso "faltam N semanas" ainda aparecer, o seed falhou
  // silenciosamente e é melhor este teste quebrar aqui, não mais adiante.
  await expect(page.getByText(/semanas fechadas/)).toHaveCount(0);

  await page.getByRole("button", { name: "Solicitar Análise" }).click();

  await expect(page.getByText(PARECER_MOCADO)).toBeVisible({ timeout: 15_000 });
  // PERGUNTA_PRIMARIA (src/app/api/analise/perguntas.ts) é 5, não 1 — o
  // botão "Solicitar Análise" dispara essa pergunta por ser a primária.
  expect(corpoRecebido).toEqual({ pergunta: 5 });
});
