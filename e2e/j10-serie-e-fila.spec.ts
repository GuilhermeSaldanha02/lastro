// lastro · O CAMINHO TRISTE da série e da fila offline — QA independente,
// 2026-09-13. A j1 prova o registro quando a pessoa faz o certo; esta prova
// o que acontece quando ela erra o número, toca duas vezes, perde a rede,
// perde a sessão ou empresta o celular.
//
// COMO LER UMA FALHA AQUI: cada asserção descreve o comportamento CORRETO,
// e a mensagem diz o dano se o app aceitar. Falha é ACHADO.
//
// Por que tanto `expect.soft`: um caso de tela tem várias afirmações
// independentes (a tela recusou? a série sumiu? o indicador mentiu?), e a
// primeira não pode esconder as outras. Sem `describe.serial` pelo mesmo
// motivo, entre testes.
//
// Severidades já decididas pelo dono em 2026-09-13: peso vazio gravando
// 0 kg = BAIXA; dois toques rápidos em "Repetir série" criando 2 = MÉDIA.
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import {
  anotarAchado,
  apagarSemErro,
  esperarFilaAssentar,
  filaLocal,
  hojeNoBrasil,
  pesoUnico,
  primeiroExercicio,
  print,
  semearTreino,
  seriesDoTreino,
} from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;
let comoAluno: SupabaseClient;
let treinoId: string;
let urlTreino: string;

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j10-aluno");
  comoAluno = await clienteAutenticado(aluno);
  const exercicio = await primeiroExercicio(comoAluno);
  // Treino de HOJE com uma série: a tela abre direto em "Outra série" e o
  // grupo muscular já vem escolhido — cada caso chega ao formulário igual.
  const semeado = await semearTreino(comoAluno, aluno.id, hojeNoBrasil(), exercicio.id, {
    reps: 8,
    peso: 40,
  });
  treinoId = semeado.treinoId;
  urlTreino = `/treino/${treinoId}`;
});

test.afterAll(async () => {
  await apagarSemErro(aluno);
});

/** Formulário de série aberto, numa tela recarregada (sem erro de caso anterior). */
async function abrirFormulario(page: Page, url = urlTreino): Promise<void> {
  await page.goto(url);
  await page.getByRole("button", { name: /^(Outra série|Adicionar exercício)$/ }).click();
  const reps = page.locator("#reps");
  const chip = page.locator("label.chip").first();
  await expect(reps.or(chip)).toBeVisible();
  if (!(await reps.isVisible())) {
    await chip.click();
    await page.getByRole("button", { name: "Continuar" }).click();
  }
  await expect(reps).toBeVisible();
}

async function preencher(page: Page, caso: { reps: string; peso: string; rir?: string }): Promise<void> {
  await page.locator("#exercicio_id").selectOption({ index: 1 });
  await page.locator("#tipo").selectOption("valendo");
  await page.locator("#reps").fill(caso.reps);
  await page.locator("#peso").fill(caso.peso);
  if (caso.rir !== undefined) await page.locator("#rir").fill(caso.rir);
}

const registrar = (page: Page) => page.getByRole("button", { name: "Registrar série" });
const linhaCom = (page: Page, texto: string) => page.locator(".linha-serie-pro", { hasText: texto });

// ============================================================
// 1. NÚMERO FORA DO LIMITE — o banco recusa o que a tela deixou passar?
// ============================================================
// O formulário valida só "positivo" e "finito". O banco tem
// `reps <= 200`, `peso <= 1000`, `numeric(6,2)` e `smallint` para reps e
// RIR. O que passar pela tela e bater nisso vira erro PERMANENTE na fila
// (`erro-permanente.ts`) e vai para `db.falhas`.

const FORA_DO_LIMITE = [
  { nome: "reps 201", reps: "201", peso: pesoUnico(41) },
  { nome: "reps 2,5", reps: "2.5", peso: pesoUnico(42) },
  { nome: "peso 1000,01", reps: "5", peso: "1000.01" },
  { nome: "peso 99999999", reps: "6", peso: "99999999" },
  { nome: "RIR 1,5", reps: "7", peso: pesoUnico(43), rir: "1.5" },
];

for (const caso of FORA_DO_LIMITE) {
  test(`série: ${caso.nome} não pode aparecer registrada e sumir em silêncio`, async ({ page }) => {
    test.setTimeout(90_000);
    await entrarComoUsuario(page, aluno);
    await abrirFormulario(page);
    await preencher(page, caso);
    await registrar(page).click();

    const recusou = page.locator(".aviso-erro");
    const aceitou = linhaCom(page, caso.peso);
    await expect(recusou.or(aceitou).first()).toBeVisible({ timeout: 15_000 });
    const telaRecusou = await recusou.isVisible();

    if (telaRecusou) {
      await print(page, "recusada-na-tela");
    } else {
      const fila = await esperarFilaAssentar(page);
      const noBanco = (await seriesDoTreino(comoAluno, treinoId)).some((s) => s.peso === Number(caso.peso));
      const indicador = (await page.locator(".sync").innerText()).trim();
      await print(page, "aceita-depois-da-fila");
      await page.reload();
      const depoisDeRecarregar = await linhaCom(page, caso.peso).count();
      await print(page, "aceita-depois-de-recarregar");
      anotarAchado(
        `${caso.nome}: a tela aceitou; no banco: ${noBanco ? "sim" : "NÃO"}; fila local: ${fila.pendentes} pendente(s), ${fila.falhas} descartada(s); indicador: "${indicador}"; na tela depois de recarregar: ${depoisDeRecarregar}`,
      );
      expect
        .soft(noBanco || !/sincronizado/i.test(indicador), "ACHADO: o indicador diz 'sincronizado' com a série fora do banco")
        .toBe(true);
      expect
        .soft(noBanco || depoisDeRecarregar > 0, `ACHADO: perda silenciosa — a série com ${caso.nome} apareceu registrada e sumiu ao recarregar`)
        .toBe(true);
    }
    expect
      .soft(telaRecusou, `ACHADO: a tela aceitou ${caso.nome}, valor que a tabela serie recusa`)
      .toBe(true);
  });
}

test("série: editar para reps 999 não pode mostrar um valor que o banco não guardou", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, aluno);
  await page.goto(urlTreino);
  await page.locator(".linha-serie-pro").first().click();
  const campo = page.locator('input[id^="reps-"]');
  await expect(campo).toBeVisible();
  const serieId = (await campo.getAttribute("id"))!.replace("reps-", "");
  await campo.fill("999");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  const recusou = page.locator(".aviso-erro");
  await expect
    .poll(async () => (await recusou.isVisible()) || (await campo.count()) === 0, { timeout: 15_000 })
    .toBe(true);
  const telaRecusou = await recusou.isVisible();

  if (telaRecusou) {
    await print(page, "edicao-recusada");
  } else {
    await print(page, "edicao-aceita-antes-da-fila");
    const fila = await esperarFilaAssentar(page);
    const noBanco = (await seriesDoTreino(comoAluno, treinoId)).find((s) => s.id === serieId);
    await page.reload();
    await print(page, "edicao-aceita-depois-de-recarregar");
    anotarAchado(
      `a tela mostrou reps 999; o banco ficou com ${noBanco?.reps ?? "?"}; fila: ${fila.falhas} descartada(s)`,
    );
  }
  expect.soft(telaRecusou, "ACHADO: a edição para reps 999 foi aceita na tela e o banco manteve o valor antigo sem aviso").toBe(true);
});

// ============================================================
// 2. VAZIO, NEGATIVO, ZERO, LETRA
// ============================================================

test("série: reps vazio, negativo, zero, com letras e peso negativo são recusados", async ({ page }) => {
  test.setTimeout(120_000);
  await entrarComoUsuario(page, aluno);
  const casos: { nome: string; reps: string; peso: string; letras?: boolean }[] = [
    { nome: "reps vazio", reps: "", peso: "40" },
    { nome: "reps negativo", reps: "-3", peso: "40" },
    { nome: "reps zero", reps: "0", peso: "40" },
    { nome: "peso negativo", reps: "8", peso: "-1" },
    { nome: "reps com letras", reps: "", peso: "40", letras: true },
  ];
  for (const caso of casos) {
    await abrirFormulario(page);
    const antes = await page.locator(".linha-serie-pro").count();
    await preencher(page, caso);
    // Campo numérico ignora letra digitada: é o que o teclado do celular faz.
    if (caso.letras) await page.locator("#reps").pressSequentially("abc");
    await registrar(page).click();
    await expect(page.locator(".aviso-erro").or(page.locator(".linha-serie-pro").nth(antes))).toBeVisible({
      timeout: 10_000,
    });
    expect.soft(await page.locator(".aviso-erro").isVisible(), `${caso.nome} não foi recusado`).toBe(true);
    expect.soft(await page.locator(".linha-serie-pro").count(), `${caso.nome} virou série`).toBe(antes);
    await print(page, caso.nome.replace(/\s/g, "-"));
  }
});

test("série: peso vazio não pode gravar 0 kg em silêncio (achado BAIXA pelo dono)", async ({ page }) => {
  await entrarComoUsuario(page, aluno);
  await abrirFormulario(page);
  const antes = await page.locator(".linha-serie-pro").count();
  await preencher(page, { reps: "9", peso: "" });
  await registrar(page).click();
  await expect(page.locator(".aviso-erro").or(page.locator(".linha-serie-pro").nth(antes))).toBeVisible({
    timeout: 10_000,
  });
  await print(page, "peso-vazio");
  const recusou = await page.locator(".aviso-erro").isVisible();
  if (!recusou) anotarAchado("peso vazio virou série de 0 kg sem aviso");
  expect(recusou, "ACHADO (BAIXA): peso em branco foi gravado como 0 kg").toBe(true);
});

// ============================================================
// 3. DUPLO TOQUE
// ============================================================

test("série: duplo clique em 'Registrar série' grava uma série só", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, aluno);
  await abrirFormulario(page);
  const peso = pesoUnico(33);
  await preencher(page, { reps: "11", peso });
  await registrar(page).dblclick();
  await expect(linhaCom(page, peso).first()).toBeVisible({ timeout: 15_000 });
  await esperarFilaAssentar(page);
  await page.waitForTimeout(1_000);

  const naTela = await linhaCom(page, peso).count();
  const noBanco = (await seriesDoTreino(comoAluno, treinoId)).filter((s) => s.peso === Number(peso)).length;
  await print(page, "duplo-clique-registrar");
  if (noBanco !== 1 || naTela !== 1) anotarAchado(`duplo clique: ${naTela} na tela, ${noBanco} no banco`);
  expect.soft(noBanco, `ACHADO: o duplo clique gravou ${noBanco} séries iguais`).toBe(1);
  expect.soft(naTela, `ACHADO: o duplo clique mostrou ${naTela} séries iguais`).toBe(1);
});

test("série: dois toques rápidos em 'Repetir série' criam uma série só (achado MÉDIA pelo dono)", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, aluno);
  await page.goto(urlTreino);
  const antesNoBanco = (await seriesDoTreino(comoAluno, treinoId)).length;
  const antesNaTela = await page.locator(".linha-serie-pro").count();

  await page.getByRole("button", { name: "Repetir série" }).dblclick();
  await expect(page.locator(".linha-serie-pro").nth(antesNaTela)).toBeVisible({ timeout: 15_000 });
  await esperarFilaAssentar(page);
  await page.waitForTimeout(1_000);

  const criadasNoBanco = (await seriesDoTreino(comoAluno, treinoId)).length - antesNoBanco;
  await print(page, "duplo-toque-repetir");
  if (criadasNoBanco !== 1) anotarAchado(`dois toques em 'Repetir série' criaram ${criadasNoBanco} séries`);
  expect(criadasNoBanco, `ACHADO (MÉDIA): dois toques em menos de 500 ms criaram ${criadasNoBanco} séries`).toBe(1);
});

// ============================================================
// 4. REDE CAINDO NO MEIO
// ============================================================

test("offline: criar, editar e excluir sem rede chega ao banco exatamente assim", async ({ page, context }) => {
  test.setTimeout(150_000);
  await entrarComoUsuario(page, aluno);
  await abrirFormulario(page);
  const pesoEditado = pesoUnico(17);
  const pesoExcluido = pesoUnico(18);

  await context.setOffline(true);
  await preencher(page, { reps: "3", peso: pesoEditado });
  await registrar(page).click();
  const editada = linhaCom(page, pesoEditado);
  await expect(editada).toBeVisible();

  await page.getByRole("button", { name: "Outra série" }).click();
  await expect(page.locator("#reps")).toBeVisible();
  await preencher(page, { reps: "3", peso: pesoExcluido });
  await registrar(page).click();
  const excluida = linhaCom(page, pesoExcluido);
  await expect(excluida).toBeVisible();

  await editada.click();
  const campo = page.locator('input[id^="reps-"]');
  await campo.fill("4");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(campo).toHaveCount(0, { timeout: 15_000 });

  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await excluida.getByRole("button", { name: /Excluir série/ }).click();
  await page.locator(".confirma").getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(excluida).toHaveCount(0);
  await print(page, "offline-antes-de-reconectar");

  await context.setOffline(false);
  const fila = await esperarFilaAssentar(page, 40_000);
  await print(page, "offline-depois-de-reconectar");
  const linhas = await seriesDoTreino(comoAluno, treinoId);

  expect.soft(fila.pendentes, "a fila não drenou depois de a rede voltar").toBe(0);
  expect.soft(fila.falhas, "item válido foi descartado como permanente").toBe(0);
  expect
    .soft(linhas.filter((s) => s.peso === Number(pesoEditado)).map((s) => s.reps), "a série editada sem rede tem de estar no banco com reps 4")
    .toEqual([4]);
  expect
    .soft(linhas.filter((s) => s.peso === Number(pesoExcluido)).length, "a série excluída sem rede não pode existir no banco")
    .toBe(0);
});

test("offline: 'Iniciar treino' sem rede não derruba a tela, e duplo clique com rede cria um treino só", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const conta = await criarUsuarioDescartavel("j10-inicio");
  try {
    await entrarComoUsuario(page, conta);
    await page.goto("/treino");
    const iniciar = page.getByRole("button", { name: "Iniciar treino de hoje" });
    await expect(iniciar).toBeVisible();

    await context.setOffline(true);
    await iniciar.click();
    await page.waitForTimeout(5_000);
    await print(page, "iniciar-sem-rede");
    const quebrou = await page.getByText(/Application error|client-side exception/i).count();
    if (quebrou) anotarAchado("sem rede, 'Iniciar treino de hoje' trocou a tela pela página de erro do Next");
    expect.soft(quebrou, "ACHADO: sem rede, 'Iniciar treino' derrubou a tela inteira").toBe(0);

    await context.setOffline(false);
    await page.goto("/treino");
    await page.getByRole("button", { name: "Iniciar treino de hoje" }).dblclick();
    await page.waitForURL(/\/treino\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await page.waitForTimeout(3_000);

    const cliente = await clienteAutenticado(conta);
    const { data } = await cliente.from("treino").select("id").eq("usuario_id", conta.id).eq("data", hojeNoBrasil());
    const treinos = data?.length ?? 0;
    if (treinos !== 1) anotarAchado(`duplo clique em 'Iniciar treino de hoje' deixou ${treinos} treinos no mesmo dia`);
    expect.soft(treinos, "ACHADO: duplo clique em 'Iniciar treino de hoje' criou mais de um treino no dia").toBe(1);
  } finally {
    await apagarSemErro(conta);
  }
});

// ============================================================
// 5. SESSÃO E APARELHO COMPARTILHADO
// ============================================================

test("sessão: expirar no meio do treino não perde a série — ela chega ao banco depois do novo login", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await entrarComoUsuario(page, aluno);
  await abrirFormulario(page);
  const peso = pesoUnico(44);
  await preencher(page, { reps: "13", peso });

  await context.clearCookies();
  await registrar(page).click();
  await page.waitForTimeout(5_000);
  await print(page, "sessao-expirada-depois-de-registrar");
  const filaSemSessao = await filaLocal(page);

  await entrarComoUsuario(page, aluno);
  // Sem recarregar: o login é navegação de cliente. Se a fila não drenar
  // aqui, a série espera a próxima vez que o app for aberto do zero.
  await page.waitForTimeout(8_000);
  const semRecarregar = (await seriesDoTreino(comoAluno, treinoId)).some((s) => s.peso === Number(peso));
  if (!semRecarregar) {
    anotarAchado("depois do novo login a fila não drenou sozinha; só drena ao recarregar o app ou abrir o treino");
  }

  await page.goto("/");
  await expect
    .poll(async () => (await seriesDoTreino(comoAluno, treinoId)).filter((s) => s.peso === Number(peso)).length, {
      message: `ACHADO: a série registrada com a sessão expirada se perdeu (fila sem sessão: ${filaSemSessao.pendentes} pendente(s), ${filaSemSessao.falhas} descartada(s))`,
      timeout: 30_000,
    })
    .toBe(1);
  expect.soft((await filaLocal(page)).falhas, "a série da sessão expirada foi descartada como permanente").toBe(0);
});

test("aparelho compartilhado: série pendente de uma conta não trava a fila da conta seguinte", async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  const outra = await criarUsuarioDescartavel("j10-outra");
  try {
    // Conta A registra sem rede e sai (a sessão acaba) antes de a fila drenar.
    await entrarComoUsuario(page, aluno);
    await abrirFormulario(page);
    await context.setOffline(true);
    const pesoA = pesoUnico(45);
    await preencher(page, { reps: "14", peso: pesoA });
    await registrar(page).click();
    await expect(linhaCom(page, pesoA)).toBeVisible();
    await context.clearCookies();
    await context.setOffline(false);

    // Conta B, no MESMO navegador, treina normalmente.
    await entrarComoUsuario(page, outra);
    await page.goto("/treino");
    await page.getByRole("button", { name: "Iniciar treino de hoje" }).click();
    await page.waitForURL(/\/treino\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const treinoOutra = new URL(page.url()).pathname.split("/").pop()!;
    await abrirFormulario(page, `/treino/${treinoOutra}`);
    const pesoB = pesoUnico(46);
    await preencher(page, { reps: "15", peso: pesoB });
    await registrar(page).click();
    await expect(linhaCom(page, pesoB)).toBeVisible();

    const comoOutra = await clienteAutenticado(outra);
    const fim = Date.now() + 30_000;
    let chegou = false;
    while (!chegou && Date.now() < fim) {
      chegou = (await seriesDoTreino(comoOutra, treinoOutra)).some((s) => s.peso === Number(pesoB));
      if (!chegou) await page.waitForTimeout(1_000);
    }
    const fila = await filaLocal(page);
    await print(page, "conta-b-depois-da-fila");
    if (!chegou) {
      anotarAchado(
        `a série da conta B não chegou ao banco: fila local com ${fila.pendentes} pendente(s), ${fila.falhas} descartada(s) — a pendente da conta A está na frente`,
      );
    }
    expect(chegou, "ACHADO: a série da segunda conta ficou presa atrás da série pendente da primeira").toBe(true);
  } finally {
    await apagarSemErro(outra);
  }
});
