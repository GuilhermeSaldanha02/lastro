// lastro · Fase 6 (E2E) — J2: Análise Semanal (PRD §6, A6/D5).
//
// A2 do ASKUSER original desta tarefa: /api/analise é interceptado no
// NAVEGADOR (page.route), a Gemini real nunca é chamada. Não é economia
// disfarçada de rigor — é o que o próprio PRD já decide: a chave da
// Gemini só existe atrás de src/app/api/ (FF1/FF2, A5), e o critério A6
// ("parecer cita número real") já está definido como leitura HUMANA de
// pareceres reais (o agente qa-treino), não automação de CI. E2E só
// consegue testar até a borda da rota mesmo.
//
// Desde a geração assíncrona (SDD.md §11), a rota devolve 202 na hora e
// o parecer é gerado depois via after() — nunca chega pro navegador que
// perguntou. Por isso dois testes: um prova que a tela chama a rota
// certa com a pergunta certa e reage ao 202 (trava botão + confirmação);
// o outro semeia um rascunho "pronto" direto no banco e prova que a
// tela de Pareceres salvos (SDD.md §11.4) mostra e confirma/descarta.
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

test("pede a Análise Semanal — botão dispara a pergunta certa e a tela devolve controle na hora (A6, SDD.md §11, sem gastar cota real da Gemini)", async ({
  page,
}) => {
  let corpoRecebido: unknown = null;

  // A geração real roda em after(), fora do ciclo HTTP (SDD.md §11.3) —
  // o parecer NUNCA mais chega pro navegador que perguntou, então este
  // teste não pode mais verificar o texto do parecer. O que ele prova:
  // a rota certa é chamada com a pergunta certa, e a tela reage ao 202
  // travando o botão e mostrando a mensagem de confirmação.
  await page.route("**/api/analise", async (route) => {
    corpoRecebido = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, rascunhoId: "00000000-0000-0000-0000-000000000000" }),
    });
  });

  await entrarComoUsuario(page, usuario);
  await page.goto("/analise");

  await expect(page.getByText(/semanas fechadas/)).toHaveCount(0);

  // Não existe mais um botão "Solicitar Análise" solto (removido em
  // 2026-09-02: duplicava a mesma ação do card primário — achado do
  // dono, DESIGN.md §3.5 "redundância zero"). O card primário da lista
  // de perguntas é quem dispara.
  const perguntaPrimaria = page.getByRole("button", { name: "O que mudar na próxima semana?" });
  await perguntaPrimaria.click();

  await expect(page.getByText("Confira em Ajustes > Relatórios em instantes.")).toBeVisible();
  await expect(perguntaPrimaria).toHaveAttribute("aria-disabled", "true");
  // PERGUNTA_PRIMARIA (src/app/api/analise/perguntas.ts) é 5, não 1 — o
  // card primário dispara essa pergunta por ser a primária.
  expect(corpoRecebido).toEqual({ pergunta: 5 });
});

test("rascunho pronto aparece em Pareceres salvos com Salvar/Descartar (SDD.md §11.4)", async ({
  page,
}) => {
  const cliente = await clienteAutenticado(usuario);
  const { data: rascunho, error } = await cliente
    .from("parecer")
    .insert({
      usuario_id: usuario.id,
      pergunta: 5,
      pergunta_texto: "O que mudar na próxima semana?",
      idioma: "pt-BR",
      status: "pronto",
      confirmado: false,
      texto: "Rascunho de teste — E2E semeou este parecer direto no banco.",
      evidencia: {
        periodo: { semana_atual_inicio: "2026-08-24", semana_atual_fim: "2026-08-30", janela_semanas: 4 },
        blocos: [],
      },
    })
    .select("id")
    .single();
  if (error || !rascunho) throw new Error(`Falha ao semear rascunho: ${error?.message}`);

  await entrarComoUsuario(page, usuario);
  await page.goto("/ajustes/relatorios");

  // O rascunho pousa como card compacto (achado do dono, 2026-09-02: o
  // parecer inteiro despejado na lista escondia o rascunho atrás do
  // histórico de treinos) — precisa abrir pra ver o texto.
  await page.getByRole("button", { name: "Revisar e salvar" }).click();
  await expect(page.getByText("Rascunho de teste — E2E semeou este parecer direto no banco.")).toBeVisible();

  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("button", { name: "Descartar" })).toHaveCount(0);

  const { data: linhaAtualizada } = await cliente
    .from("parecer")
    .select("confirmado")
    .eq("id", rascunho.id)
    .single();
  expect(linhaAtualizada?.confirmado).toBe(true);
});
