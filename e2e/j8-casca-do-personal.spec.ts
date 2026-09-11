// lastro · As DUAS CASCAS (PRD §11, emenda de 2026-09-11) — `QA.md` PE-09.
//
// O que este spec protege: a decisão "conta de personal não treina" é
// arquitetura, não estética. Trocar a barra inferior é PISTA; a porta é o
// guarda de rota (`casca.ts`). Sem ele, `/treino` continua respondendo por
// URL digitada, por link velho no histórico e pelo HTML que o service
// worker guardou — e a decisão vira decoração, do mesmo jeito que a trava
// da prescrição viraria se morasse só na tela.
//
// As asserções de REDIRECIONAMENTO são, por isso, mais importantes que as
// de navegação: uma barra sem "Treinos" com a rota aberta é pior do que
// nenhuma das duas coisas, porque parece resolvido.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito, nomear } from "./helpers/vinculo";

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

test("a conta de personal mora na fila e não alcança as telas de quem treina", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  const { contextoPersonal, telaPersonal, contextoAluno, telaAluno } =
    await criarVinculoAceito({ browser, personal, aluno });

  // ---- a casca do personal ----
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
      `conta de personal não pode ficar em ${rota}`,
    ).toBe("/personal");
  }

  // A lista de alunos existe e mostra quem aceitou — é a tela que impede
  // o aluno que vai bem de sumir do app do personal.
  await telaPersonal.goto("/personal/alunos");
  await expect(telaPersonal.getByText("Ana Ribeiro")).toBeVisible();

  // Em Ajustes > Personal, a conta de personal vê o lado de convidar e
  // NÃO vê o campo de colar código — a função de aceite recusaria.
  await telaPersonal.goto("/ajustes/personal");
  await expect(telaPersonal.locator("#codigo_convite")).toHaveCount(0);
  await expect(
    telaPersonal.getByRole("button", { name: /Gerar código de convite/i }),
  ).toBeVisible();

  // ---- a casca do aluno, que não pode ter mudado ----
  const navAluno = telaAluno.locator("nav.nav");
  await telaAluno.goto("/");
  await expect(navAluno.getByText("Início")).toBeVisible();
  await expect(navAluno.getByText("Treinos")).toBeVisible();
  await expect(navAluno.getByText("Análise")).toBeVisible();
  await expect(navAluno.getByText("Fila")).toHaveCount(0);

  // E o caminho contrário: aluno não entra na casa de trabalho.
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
    telaAluno.getByRole("button", { name: /Gerar código de convite/i }),
  ).toHaveCount(0);

  await contextoPersonal.close();
  await contextoAluno.close();
});

test("conta de personal sem CREF não abre a área de trabalho", async ({ browser }) => {
  // O estado do cadastro por Google: `tipo_conta = 'personal'` com `cref`
  // nulo. É LEGÍTIMO no banco — não existe constraint "personal implica
  // CREF", e não pode existir, porque ela abortaria o cadastro dentro do
  // insert em `auth.users`. A obrigatoriedade é do app, e é isto que o
  // teste mede.
  const semCref = await criarUsuarioDescartavel("j8-sem-cref");
  try {
    // Promovido sem CREF, exatamente como o Google deixaria a conta.
    const cliente = await clienteAutenticado(semCref);
    const { error } = await cliente
      .from("usuario")
      .update({ tipo_conta: "personal" })
      .eq("id", semCref.id);
    expect(error, "a própria conta pode declarar o tipo — RLS de dono").toBeNull();

    const contexto = await browser.newContext();
    const tela = await contexto.newPage();
    await entrarComoUsuario(tela, semCref);

    await tela.goto("/personal", { waitUntil: "domcontentloaded" });
    expect(new URL(tela.url()).pathname).toBe("/personal/completar");
    await expect(tela.locator("#cref_completar")).toBeVisible();

    await contexto.close();
  } finally {
    await apagarUsuarioDescartavel(semCref);
  }
});
