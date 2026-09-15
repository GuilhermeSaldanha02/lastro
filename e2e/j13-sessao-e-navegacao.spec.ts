// lastro · SESSÃO, URL À MÃO E BOTÃO VOLTAR — QA independente, 2026-09-13.
//
// O que acontece quando a sessão acaba no meio de uma ação, quando alguém
// aperta voltar depois de sair, quando o login recebe lixo, quando o
// navegador guarda um tema corrompido e quando o nome da conta é HTML.
//
// Falha aqui é ACHADO: cada mensagem diz o dano se o app aceitar.
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito, nomear } from "./helpers/vinculo";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";
import {
  anotarAchado,
  apagarSemErro,
  contarLinhas,
  esperarDesfecho,
  excluirContaPelaTela,
  montarModelo,
  print,
  vazamentoHorizontal,
} from "./helpers/caminho-triste";

let conta: UsuarioDescartavel;
let cliente: SupabaseClient;

const IDIOMAS_SESSAO = [
  { opcao: "Português", salvo: "Idioma salvo.", acao: "Salvar meta", erro: "Sessão ausente — entre de novo." },
  { opcao: "English", salvo: "Language saved.", acao: "Save goal", erro: "Session expired — sign in again." },
  { opcao: "Español", salvo: "Idioma guardado.", acao: "Guardar meta", erro: "Sesión ausente — inicia sesión de nuevo." },
] as const;

async function trocarIdiomaPelaTela(page: Page, idioma: (typeof IDIOMAS_SESSAO)[number]): Promise<void> {
  await page.goto("/ajustes");
  await page.getByRole("radio", { name: idioma.opcao }).click();
  await expect(page.getByText(idioma.salvo, { exact: true })).toBeVisible();
}

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j13-sessao");
  cliente = await clienteAutenticado(conta);
  // Três semanas fechadas liberam as perguntas da Análise.
  await semearHistoricoParaAnalise(cliente, conta.id);
});

test.afterAll(async () => {
  await apagarSemErro(conta);
});

// ============================================================
// 1. BOTÃO VOLTAR
// ============================================================

test("voltar: depois de sair, o botão voltar não mostra dado da conta", async ({ page }) => {
  const nome = `Beatriz Voltar ${Date.now()}`;
  await nomear(cliente, conta.id, nome);
  await entrarComoUsuario(page, conta);
  await page.goto("/perfil");
  await expect(page.getByText(nome).first(), "preparação: o nome precisa aparecer no perfil").toBeVisible();
  await page.goto("/ajustes");
  await page.getByRole("button", { name: /Encerrar Sessão/ }).click();
  await page.waitForURL((url) => url.pathname === "/login", { timeout: 20_000 });

  for (const passo of ["ajustes", "perfil"]) {
    await page.goBack().catch(() => {});
    await page.waitForTimeout(2_000);
    await print(page, `voltar-depois-de-sair-${passo}`);
    const vazou = await page.getByText(nome).count();
    if (vazou) anotarAchado(`voltar até ${new URL(page.url()).pathname} mostrou o nome da conta depois de sair`);
    expect.soft(vazou, `ACHADO: voltar até ${passo} depois de sair mostrou dado da conta`).toBe(0);
  }
});

test("voltar: depois de excluir a conta, voltar não mostra nada e a senha antiga não entra", async ({ page }) => {
  const descartavel = await criarUsuarioDescartavel("j13-excluir");
  try {
    const nome = `Conta Excluida ${Date.now()}`;
    await nomear(await clienteAutenticado(descartavel), descartavel.id, nome);
    await entrarComoUsuario(page, descartavel);
    await page.goto("/perfil");
    await excluirContaPelaTela(page);

    await page.goBack().catch(() => {});
    await page.waitForTimeout(2_000);
    await print(page, "voltar-depois-de-excluir");
    expect.soft(await page.getByText(nome).count(), "ACHADO: voltar depois de excluir a conta mostrou dado dela").toBe(0);

    await page.goto("/login");
    await page.locator("#email").fill(descartavel.email);
    await page.locator("#senha").fill(descartavel.senha);
    await page.getByRole("button", { name: "Entrar no Lastro" }).click();
    await expect(page.locator(".aviso-erro"), "a conta excluída conseguiu entrar").toBeVisible({ timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/login");
  } finally {
    await apagarSemErro(descartavel);
  }
});

// ============================================================
// 2. SESSÃO QUE ACABA NO MEIO DA AÇÃO
// ============================================================
// Nenhuma destas ações passa pela fila offline: a pessoa tem de ser
// avisada, e a tela nunca pode dizer "salvo" ou seguir como se tivesse
// salvo.

test("sessão expirada: o coach avisa que a sessão acabou", async ({ page, context }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/coach");
  await context.clearCookies();
  await page.getByPlaceholder("Pergunte ao coach…").fill("Quanto descanso entre séries?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(page.locator(".aviso-erro"), "o coach não avisou da sessão expirada").toContainText(/sess/i, {
    timeout: 15_000,
  });
  await print(page, "coach-sessao-expirada");
});

test("sessão expirada: a Análise avisa que a sessão acabou", async ({ page, context }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/analise");
  await expect(page.locator(".pergunta--primaria")).toHaveAttribute("aria-disabled", "false");
  await context.clearCookies();
  await page.locator(".pergunta--primaria").click();
  await expect(page.locator(".aviso-erro"), "a Análise não avisou da sessão expirada").toContainText(/sess/i, {
    timeout: 15_000,
  });
  await print(page, "analise-sessao-expirada");
});

test("sessão expirada: a meta semanal não diz 'salva' sem ter salvo", async ({ page, context }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes");
  await context.clearCookies();
  await page.locator("#meta_treinos").fill("4");
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await page.waitForTimeout(5_000);
  await print(page, "meta-sessao-expirada");
  const disseSalva = await page.getByText(/Meta salva\./).count();
  const { data } = await cliente.from("usuario").select("meta_treinos_semana").eq("id", conta.id).single();
  if (disseSalva && data?.meta_treinos_semana !== 4) anotarAchado("a tela disse 'Meta salva.' e o banco não tem a meta");
  expect(disseSalva > 0 && data?.meta_treinos_semana !== 4, "ACHADO: 'Meta salva.' com a sessão expirada e nada no banco").toBe(false);
});

test("sessão expirada: salvar modelo não segue como se tivesse salvo", async ({ page, context }) => {
  await entrarComoUsuario(page, conta);
  const antes = await contarLinhas(cliente, "modelo_treino", { usuario_id: conta.id });
  await montarModelo(page, `QA sessão ${Date.now()}`);
  await context.clearCookies();
  await page.getByRole("button", { name: "Salvar modelo" }).click();
  await esperarDesfecho(page, "/ajustes/modelos");
  await print(page, "modelo-sessao-expirada");
  const criados = (await contarLinhas(cliente, "modelo_treino", { usuario_id: conta.id })) - antes;
  const seguiu = new URL(page.url()).pathname === "/ajustes/modelos";
  expect(seguiu && criados === 0, "ACHADO: a tela foi para a lista de modelos como se tivesse salvo, e nada foi salvo").toBe(false);
});

// ============================================================
// 3. LOGIN COM LIXO
// ============================================================

test("login: e-mail de 5 mil caracteres e senha vazia não quebram a tela", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill(`${"a".repeat(5_000)}@example.com`);
  // Oito caracteres de propósito: a primeira rodada usou "x" e o
  // `minLength` nativo do campo barrou o envio antes de o app ver o
  // e-mail (run 34784135645) — o teste media a senha, não o e-mail.
  await page.locator("#senha").fill("xxxxxxxx");
  await page.getByRole("button", { name: "Entrar no Lastro" }).click();
  await expect(page.locator(".aviso-erro"), "e-mail gigante não mostrou erro").toBeVisible({ timeout: 15_000 });
  await print(page, "login-email-gigante");

  await page.goto("/login");
  await page.locator("#email").fill(conta.email);
  await page.locator("#senha").fill("");
  await page.getByRole("button", { name: "Entrar no Lastro" }).click();
  await page.waitForTimeout(3_000);
  await print(page, "login-senha-vazia");
  expect.soft(new URL(page.url()).pathname, "entrou com senha vazia").toBe("/login");
  expect.soft(await page.getByText(/Application error/i).count()).toBe(0);
});

for (const proximo of ["//evil.example", "/\\evil.example", "https://evil.example/x"]) {
  test(`login: ?proximo=${proximo} não leva para fora do app`, async ({ page }) => {
    await page.goto(`/login?proximo=${encodeURIComponent(proximo)}`);
    await page.locator("#email").fill(conta.email);
    await page.locator("#senha").fill(conta.senha);
    await page.getByRole("button", { name: "Entrar no Lastro" }).click();
    await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    expect(new URL(page.url()).hostname, `ACHADO: o login redirecionou para ${page.url()}`).toBe("localhost");
  });
}

// ============================================================
// 4. DADO CORROMPIDO NO NAVEGADOR E NO PERFIL
// ============================================================

test("tema corrompido no navegador não quebra a Home nem executa script", async ({ page }) => {
  const erros: string[] = [];
  let dialogo = false;
  page.on("pageerror", (erro) => erros.push(erro.message));
  page.on("dialog", (d) => {
    dialogo = true;
    void d.dismiss();
  });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("lastro_tema", '"><img src=x onerror=alert(1)>');
    } catch {
      /* sem storage, sem caso */
    }
  });
  await entrarComoUsuario(page, conta);
  await page.goto("/");
  await page.waitForLoadState("networkidle").catch(() => {});
  await print(page, "home-tema-corrompido");
  expect.soft(dialogo, "ACHADO: o valor do tema no localStorage executou script").toBe(false);
  expect.soft(erros, "erro de JavaScript com o tema corrompido").toEqual([]);
  await expect(page.locator("main")).toBeVisible();
});

test("nome com HTML e milhares de caracteres não quebra Home, perfil nem a lista do personal", async ({ browser }) => {
  test.setTimeout(180_000);
  const aluno = await criarUsuarioDescartavel("j13-nome-aluno");
  const pers = await criarUsuarioDescartavel("j13-nome-personal", "personal");
  try {
    const nome = `<img src=x onerror="window.__nomeExecutou=1">${"Mariana".repeat(700)}`;
    const { error } = await (await clienteAutenticado(aluno)).from("usuario").update({ nome }).eq("id", aluno.id);
    if (error) {
      // Recusar nome gigante no banco também é comportamento correto.
      anotarAchado(`o banco recusou o nome gigante: ${error.message}`);
      return;
    }
    const v = await criarVinculoAceito({ browser, personal: pers, aluno });
    const telas = [
      { tela: v.telaAluno, rota: "/" },
      { tela: v.telaAluno, rota: "/perfil" },
      { tela: v.telaPersonal, rota: "/personal/alunos" },
    ];
    for (const { tela, rota } of telas) {
      await tela.setViewportSize({ width: 375, height: 812 });
      const resposta = await tela.goto(rota);
      await tela.waitForLoadState("networkidle").catch(() => {});
      await print(tela, `nome-gigante${rota.replace(/\//g, "_") || "_raiz"}`);
      const executou = await tela.evaluate(() => (window as unknown as { __nomeExecutou?: number }).__nomeExecutou);
      const vazamento = await vazamentoHorizontal(tela);
      if (vazamento > 1) anotarAchado(`${rota}: o nome gigante estourou ${vazamento}px a 375px`);
      expect.soft(resposta?.status() ?? 0, `${rota} com nome gigante`).toBeLessThan(500);
      expect.soft(executou, `ACHADO: ${rota} executou o HTML do nome`).toBeUndefined();
      expect.soft(vazamento, `ACHADO: ${rota} vazou ${vazamento}px com o nome gigante`).toBeLessThanOrEqual(1);
    }
    await v.contextoPersonal.close();
    await v.contextoAluno.close();
  } finally {
    await apagarSemErro(aluno);
    await apagarSemErro(pers);
  }
});

for (const idioma of IDIOMAS_SESSAO) {
  test(`sessão expirada: o erro de meta fica em ${idioma.opcao}`, async ({ page, context }) => {
    await entrarComoUsuario(page, conta);
    await trocarIdiomaPelaTela(page, idioma);
    await page.goto("/ajustes");
    await context.clearCookies();
    await page.locator("#meta_treinos").fill("4");
    await page.getByRole("button", { name: idioma.acao, exact: true }).click();
    await expect(page.locator(".aviso-erro")).toHaveText(idioma.erro);
  });
}
