// lastro · As DUAS CASCAS (PRD §11, emendas de 2026-09-11 e 2026-09-12 (2))
// — `QA.md` PE-09.
//
// O que este spec protege: desde a emenda de 2026-09-12 (2) as cascas são
// MODOS da mesma conta. "O modo trabalho não alcança as telas de treino" é
// arquitetura, não estética. Trocar a barra inferior é PISTA; a porta é o
// guarda de rota (`casca.ts`). Sem ele, `/treino` continua respondendo por
// URL digitada, por link velho no histórico e pelo HTML que o service
// worker guardou.
//
// As asserções de REDIRECIONAMENTO são, por isso, mais importantes que as
// de navegação: uma barra sem "Treinos" com a rota aberta é pior do que
// nenhuma das duas coisas, porque parece resolvido.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito, nomear } from "./helpers/vinculo";

const IDIOMAS_PERSONAL = [
  { opcao: "Português", salvo: "Idioma salvo.", fila: "Fila", alunos: "Alunos" },
  { opcao: "English", salvo: "Language saved.", fila: "Queue", alunos: "Clients" },
  { opcao: "Español", salvo: "Idioma guardado.", fila: "Pendientes", alunos: "Alumnos" },
] as const;

async function trocarIdiomaPelaTela(page: Page, idioma: (typeof IDIOMAS_PERSONAL)[number]): Promise<void> {
  await page.goto("/ajustes");
  await page.getByRole("radio", { name: idioma.opcao }).click();
  await expect(page.getByText(idioma.salvo, { exact: true })).toBeVisible();
}

let personal: UsuarioDescartavel;
let aluno: UsuarioDescartavel;

test.beforeAll(async () => {
  personal = await criarUsuarioDescartavel("j8-personal", "personal");
  aluno = await criarUsuarioDescartavel("j8-aluno");
  await nomear(await clienteAutenticado(personal), personal.id, "Marina Alencar");
  await nomear(await clienteAutenticado(aluno), aluno.id, "Ana Ribeiro");
});

test.afterAll(async () => {
  if (personal) await apagarUsuarioDescartavel(personal);
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

test("em modo trabalho a conta mora na fila e não alcança as telas de quem treina", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  const { contextoPersonal, telaPersonal, contextoAluno, telaAluno } =
    await criarVinculoAceito({ browser, personal, aluno });

  // ---- a casca de trabalho ----
  const nav = telaPersonal.locator("nav.nav");
  await telaPersonal.goto("/personal");
  await expect(nav.getByText("Fila")).toBeVisible();
  await expect(nav.getByText("Alunos")).toBeVisible();
  await expect(nav.getByText("Catálogo"), "direção B do gate: o catálogo fica").toBeVisible();
  await expect(nav.getByText("Ajustes")).toBeVisible();
  // As três que pressupõem quem treina não existem aqui.
  await expect(nav.getByText("Início")).toHaveCount(0);
  await expect(nav.getByText("Treinos")).toHaveCount(0);
  await expect(nav.getByText("Análise")).toHaveCount(0);

  // A PORTA, não a pista: cada uma destas é uma rota que um link antigo ou
  // um cache do service worker ainda alcança.
  for (const rota of ["/", "/treino", "/analise", "/coach"]) {
    await telaPersonal.goto(rota, { waitUntil: "domcontentloaded" });
    expect(
      new URL(telaPersonal.url()).pathname,
      `modo trabalho não pode ficar em ${rota}`,
    ).toBe("/personal");
  }

  // A lista de alunos existe e mostra quem aceitou — é a tela que impede
  // o aluno que vai bem de sumir do app do personal.
  await telaPersonal.goto("/personal/alunos");
  await expect(telaPersonal.getByText("Ana Ribeiro")).toBeVisible();

  // Em Ajustes > Personal, o modo trabalho vê o lado de convidar.
  await telaPersonal.goto("/ajustes/personal");
  await expect(telaPersonal.locator("#codigo_convite")).toHaveCount(0);
  await expect(
    telaPersonal.getByRole("button", { name: "Gerar convite", exact: true }),
  ).toBeVisible();

  // ---- a casca do aluno, que não pode ter mudado ----
  const navAluno = telaAluno.locator("nav.nav");
  await telaAluno.goto("/");
  await expect(navAluno.getByText("Início")).toBeVisible();
  await expect(navAluno.getByText("Treinos")).toBeVisible();
  await expect(navAluno.getByText("Análise")).toBeVisible();
  await expect(navAluno.getByText("Fila")).toHaveCount(0);

  // E o caminho contrário: conta sem área de trabalho não entra na fila.
  for (const rota of ["/personal", "/personal/alunos"]) {
    await telaAluno.goto(rota, { waitUntil: "domcontentloaded" });
    expect(
      new URL(telaAluno.url()).pathname,
      `aluno não pode ficar em ${rota}`,
    ).toBe("/");
  }

  // O aluno vê o campo de colar código, e não o de convidar.
  await telaAluno.goto("/ajustes/personal");
  await expect(
    telaAluno.getByRole("button", { name: "Gerar convite", exact: true }),
  ).toHaveCount(0);

  await contextoPersonal.close();
  await contextoAluno.close();
});

test("a MESMA conta, em modo treino, alcança o treino e perde a fila", async ({ browser }) => {
  // O ponto da emenda de 2026-09-12 (2): virar personal não custa a tela
  // de treino. O modo é trocado com o JWT da própria conta — a mesma
  // escrita que o seletor de Ajustes faz — e desfeito no fim.
  const cliente = await clienteAutenticado(personal);
  const contexto = await browser.newContext();
  try {
    const { error } = await cliente
      .from("usuario")
      .update({ modo_ativo: "treino" })
      .eq("id", personal.id);
    expect(error, "a própria conta troca de modo").toBeNull();

    const tela = await contexto.newPage();
    await entrarComoUsuario(tela, personal);

    for (const rota of ["/", "/treino", "/analise"]) {
      await tela.goto(rota, { waitUntil: "domcontentloaded" });
      expect(new URL(tela.url()).pathname, `modo treino precisa abrir ${rota}`).toBe(rota);
    }
    await expect(tela.locator("nav.nav").getByText("Treinos")).toBeVisible();

    // Link da fila em modo treino NÃO troca de modo sozinho.
    await tela.goto("/personal", { waitUntil: "domcontentloaded" });
    expect(new URL(tela.url()).pathname).toBe("/");
  } finally {
    await contexto.close();
    await cliente.from("usuario").update({ modo_ativo: "trabalho" }).eq("id", personal.id);
  }
});

test("a cápsula de Ajustes troca de modo, e conta de usuário não vê cápsula nem aviso", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const contextoPersonal = await browser.newContext();
  const contextoAluno = await browser.newContext();
  try {
    // ---- quem tem área de trabalho: ida e volta pela cápsula ----
    const tela = await contextoPersonal.newPage();
    await entrarComoUsuario(tela, personal);
    await tela.goto("/ajustes");
    const capsula = tela.getByRole("radiogroup", { name: "Modo" });
    await expect(capsula.getByRole("radio", { name: "TRABALHO" })).toHaveAttribute("aria-checked", "true");

    await capsula.getByRole("radio", { name: "TREINO" }).click();
    // Sinal que não existe antes: a URL da casa do modo treino.
    await tela.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
    await expect(tela.locator("nav.nav").getByText("Treinos")).toBeVisible();

    await tela.goto("/ajustes");
    await tela.getByRole("radiogroup", { name: "Modo" }).getByRole("radio", { name: "TRABALHO" }).click();
    await tela.waitForURL((url) => url.pathname === "/personal", { timeout: 15_000 });
    await expect(tela.locator("nav.nav").getByText("Fila")).toBeVisible();

    // ---- conta de usuário: nenhuma porta para virar personal ----
    // Até 2026-09-13 este bloco afirmava o contrário: TRABALHO travado com
    // o aviso "É personal?" levando ao CREF. Era a regra errada escrita
    // como correta (PRD §11, emenda 2026-09-13; DECISIONS 2026-09-13 (1)).
    const telaAluno = await contextoAluno.newPage();
    await entrarComoUsuario(telaAluno, aluno);
    await telaAluno.goto("/ajustes");
    // Sinal de que a tela carregou, e que existe nos dois estados de propósito:
    // o card do perfil. As ausências abaixo só valem depois dele.
    await expect(telaAluno.locator(".card-perfil-bento")).toBeVisible();
    await expect(telaAluno.getByRole("radiogroup", { name: "Modo" })).toHaveCount(0);
    await expect(telaAluno.getByText("É personal?")).toHaveCount(0);
    await expect(telaAluno.getByText("TRABALHO", { exact: true })).toHaveCount(0);
  } finally {
    await contextoPersonal.close();
    await contextoAluno.close();
    const cliente = await clienteAutenticado(personal);
    await cliente.from("usuario").update({ modo_ativo: "trabalho" }).eq("id", personal.id);
  }
});

test("conta de personal sem CREF não abre a área de trabalho", async ({ browser }) => {
  // O estado do cadastro por Google: `tipo_conta = 'personal'` com `cref`
  // nulo. É LEGÍTIMO no banco — constraint "personal implica CREF"
  // abortaria o cadastro dentro do insert em `auth.users`. A
  // obrigatoriedade é do app, e é isto que o teste mede.
  //
  // A conta nasce assim pelo trigger. Até 2026-09-12 este teste a
  // promovia com um update na própria linha e afirmava que isso era
  // correto — era o furo registrado como regra (`DECISIONS.md`
  // "2026-09-12 (2)"). Desde a 0025 esse update é recusado.
  const semCref = await criarUsuarioDescartavel("j8-sem-cref", "personal", { semCref: true });
  const contexto = await browser.newContext();
  try {
    const tela = await contexto.newPage();
    await entrarComoUsuario(tela, semCref);

    await tela.goto("/personal", { waitUntil: "domcontentloaded" });
    expect(new URL(tela.url()).pathname).toBe("/personal/completar");
    await expect(tela.locator("#cref_completar")).toBeVisible();
  } finally {
    await contexto.close();
    await apagarUsuarioDescartavel(semCref);
  }
});

test("conta nascida pelo Google escolhe PERSONAL com os dados e abre direto na fila", async ({ browser }) => {
  // O caminho do Google para personal (PRD §11, emenda 2026-09-13): a
  // conta nasce sem tipo, escolhe em /boas-vindas e termina ali, com CREF
  // e WhatsApp. A conta pendente nasce pelo trigger sem metadado de tipo,
  // que é o que o Google entrega.
  const pendente = await criarUsuarioDescartavel("j8-google-personal", "aluno", { semTipo: true });
  const contexto = await browser.newContext();
  try {
    const tela = await contexto.newPage();
    await entrarComoUsuario(tela, pendente);
    await tela.goto("/");
    await tela.waitForURL((url) => url.pathname === "/boas-vindas", { timeout: 15_000 });

    await tela.getByRole("radio", { name: "PERSONAL" }).click();
    await tela.locator("#cref_escolha").fill("123456-G/PB");
    await tela.locator("#telefone_escolha").fill("83 97777-6666");
    await tela.getByRole("button", { name: "Continuar" }).click();

    await tela.waitForURL((url) => url.pathname === "/personal", { timeout: 15_000 });
    await expect(tela.locator("nav.nav").getByText("Fila")).toBeVisible();

    // E tem os dois modos, como todo personal.
    await tela.goto("/ajustes");
    await expect(tela.getByRole("radiogroup", { name: "Modo" })).toBeVisible();
  } finally {
    await contexto.close();
    await apagarUsuarioDescartavel(pendente);
  }
});

for (const idioma of IDIOMAS_PERSONAL) {
  test(`idioma: personal vê título e navegação em ${idioma.opcao}`, async ({ browser }) => {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();
    try {
      await entrarComoUsuario(page, personal);
      await trocarIdiomaPelaTela(page, idioma);
      await page.goto("/personal");
      await expect(page.getByText(idioma.fila, { exact: true }).first()).toBeVisible();
      await expect(page.locator("nav.nav").getByText(idioma.alunos, { exact: true })).toBeVisible();
    } finally {
      await contexto.close();
    }
  });
}
