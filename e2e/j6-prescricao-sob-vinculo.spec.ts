// lastro · A prescrição sob vínculo, medida de ponta a ponta (PRD §11.2,
// §11.4.1 e §11.4.2) — `QA.md` PE-05 e PE-07.
//
// POR QUE ESTE ARQUIVO EXISTE.
//
// A trava da prescrição é a única parte do módulo Personal que não dá para
// verificar olhando a tela: o furo que ela fecha é um POST que a tela não
// faz. Aba aberta antes do vínculo, HTML em cache do service worker e
// `curl` chegam no mesmo endpoint. Esconder o card não fecha nada disso, e
// um teste de componente também não prova nada sobre isso.
//
// E há uma afirmação aqui que NINGUÉM pegaria no olho: a de que o pedido
// recusado não cobra cota nem deixa rascunho órfão. Uma trava que recusa
// DEPOIS de `registrarUso` passa em qualquer inspeção visual e cobra do
// aluno uma pergunta que o app nunca responde. É por isso que as duas
// contagens abaixo existem.
//
// Este é o PRIMEIRO spec com DOIS usuários e vínculo aceito — o
// `PROGRESS.md` listava isso como o que faltava para cobrir o módulo.
//
// CUSTO DE COTA DA GEMINI: zero. O passo de controle chega a receber 202 e
// a geração roda em `after()`, mas o workflow não passa `GEMINI_API_KEY`
// para o e2e (de propósito, ver `ci.yml`), então a chamada real nunca sai.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let personal: UsuarioDescartavel;
let aluno: UsuarioDescartavel;

const NOME_DO_PERSONAL = "Marina Alencar";

test.beforeAll(async () => {
  personal = await criarUsuarioDescartavel("pe05-personal");
  aluno = await criarUsuarioDescartavel("pe05-aluno");

  // Conta criada pela API de admin não tem `nome` — sem isto o rodapé da
  // `/analise` cairia no texto de reserva e a asserção não provaria que é
  // o nome de quem detém a prescrição que aparece ali.
  const comoPersonal = await clienteAutenticado(personal);
  const { error } = await comoPersonal
    .from("usuario")
    .update({ nome: NOME_DO_PERSONAL })
    .eq("id", personal.id);
  if (error) throw new Error(`Falha ao nomear o personal QA: ${error.message}`);
});

test.afterAll(async () => {
  // Apaga mesmo se o teste falhar no meio: conta QA sobrando neste banco
  // vira vínculo órfão em produção.
  if (personal) await apagarUsuarioDescartavel(personal);
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

test("sob vínculo a prescrição some da tela E é recusada no servidor, sem gastar cota", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  // ---- o personal convida ----
  const contextoPersonal = await browser.newContext();
  const telaPersonal = await contextoPersonal.newPage();
  await entrarComoUsuario(telaPersonal, personal);
  await telaPersonal.goto("/ajustes/personal");
  await telaPersonal
    .getByRole("button", { name: /Gerar código de convite/i })
    .click();

  const codigo = (
    await telaPersonal.locator(".codigo-convite").first().textContent({ timeout: 15_000 })
  )?.trim();
  expect(codigo, "o convite precisa ter gerado um código").toMatch(
    /^[A-HJ-NP-Z2-9]{10}$/,
  );

  // ---- o aluno, AINDA SEM VÍNCULO ----
  const contextoAluno = await browser.newContext();
  const telaAluno = await contextoAluno.newPage();
  await entrarComoUsuario(telaAluno, aluno);

  // CONTROLE. Sem este passo, uma trava que recusasse a pergunta 5 para
  // TODO MUNDO passaria no teste inteiro e ninguém notaria até o dono
  // perder a própria prescrição.
  const semVinculo = await telaAluno.request.post("/api/analise", {
    data: { pergunta: 5 },
  });
  expect(
    semVinculo.status(),
    "sem vínculo, a pergunta 5 tem de continuar funcionando",
  ).not.toBe(403);

  // Contagens DEPOIS do controle (ele consome uma cota e cria um rascunho,
  // legitimamente) e ANTES do vínculo: é esta linha de base que a recusa
  // não pode mexer.
  const comoAluno = await clienteAutenticado(aluno);
  const contar = async (tabela: "uso_ia" | "parecer") => {
    const { count, error } = await comoAluno
      .from(tabela)
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", aluno.id);
    if (error) throw new Error(`Falha ao contar ${tabela}: ${error.message}`);
    return count ?? -1;
  };
  const usoAntes = await contar("uso_ia");
  const parecerAntes = await contar("parecer");

  // ---- o aluno aceita ----
  await telaAluno.goto(`/ajustes/personal?codigo=${codigo}`);
  await telaAluno.locator("#telefone_whatsapp").fill("83 97777-6666");
  await telaAluno.getByRole("button", { name: /Aceitar convite/i }).click();
  await expect(telaAluno.getByText(NOME_DO_PERSONAL)).toBeVisible({
    timeout: 15_000,
  });

  // ---- A TRAVA, no servidor ----
  const comVinculo = await telaAluno.request.post("/api/analise", {
    data: { pergunta: 5 },
  });
  expect(comVinculo.status(), "a pergunta 5 tem de ser recusada").toBe(403);
  expect((await comVinculo.json()).erro).toBe("prescricao_do_personal");

  // ---- e a recusa não cobra nada ----
  expect(
    await contar("uso_ia"),
    "pedido recusado não pode consumir cota — o consumo é imutável",
  ).toBe(usoAntes);
  expect(
    await contar("parecer"),
    "pedido recusado não pode deixar rascunho órfão preso no teto de geração",
  ).toBe(parecerAntes);

  // ---- a trava é ESPECÍFICA: o diagnóstico continua inteiro ----
  const diagnostico = await telaAluno.request.post("/api/analise", {
    data: { pergunta: 2 },
  });
  expect(
    diagnostico.status(),
    "o aluno vinculado não perde diagnóstico nenhum (§11.2)",
  ).not.toBe(403);

  // ---- e a tela (direção "Troca de posto" do gate visual) ----
  await telaAluno.goto("/analise");
  await expect(telaAluno.locator(".pergunta")).toHaveCount(4);
  await expect(
    telaAluno.getByRole("button", { name: /mudar na próxima semana/i }),
    "a prescrição não pode aparecer nem como card desabilitado",
  ).toHaveCount(0);
  await expect(telaAluno.locator(".pergunta--primaria")).toContainText(
    /empaquei/i,
  );
  await expect(telaAluno.locator(".perguntas__rodape")).toContainText(
    NOME_DO_PERSONAL,
  );

  // ---- revogar devolve a prescrição ----
  // A §11.4.3 diz "quando o vínculo termina, a prescrição volta para o
  // aluno". Sem este passo, a trava poderia ser permanente e o teste
  // acima seguiria verde.
  await telaAluno.goto("/ajustes/personal");
  await telaAluno.getByRole("button", { name: /Revogar o vínculo/i }).click();
  await telaAluno
    .getByRole("button", { name: /Confirmar e revogar/i })
    .click();
  await expect(telaAluno.locator("#codigo_convite")).toBeVisible({
    timeout: 15_000,
  });

  await telaAluno.goto("/analise");
  await expect(telaAluno.locator(".pergunta")).toHaveCount(5);
  await expect(telaAluno.locator(".perguntas__rodape")).toHaveCount(0);
  await expect(telaAluno.locator(".pergunta--primaria")).toContainText(
    /mudar na próxima semana/i,
  );
});
