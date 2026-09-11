// lastro · A fila de trabalho do personal, de ponta a ponta (PRD §11.4.5 e
// §11.4.7) — `QA.md` PE-02 e PE-04.
//
// POR QUE ESTE ARQUIVO EXISTE.
//
// A fila é a tela pela qual o módulo Personal existe, e era a única peça
// grande do projeto cuja prova inteira tinha sido produzida por quem a
// escreveu (PE-02, ALEGADO). O `AGENTS.md` §5 é explícito: prova de quem
// implementa não fecha nada. O que dá para tirar dessa categoria sem um
// segundo agente é o que é DETERMINÍSTICO — existe alerta, o link tem o
// telefone certo, o clique gravou. É isso que este spec mede.
//
// E mede uma coisa que inspeção nenhuma pegaria: o registro do
// acionamento sai num server action NÃO esperado, disparado ao lado de uma
// navegação nativa para o WhatsApp. Se a navegação matar o action, o
// `acionado_em` nunca grava e a MEDIDA da §11.7 — "o grupo alertado
// recebeu estímulo na semana seguinte?" — perde a metade que diz quando o
// personal agiu. A tela continuaria idêntica.
//
// O que este spec NÃO faz: abrir o `wa.me`. É navegação externa, e em CI
// isso é rede de terceiro dentro do teste. A âncora é lida e neutralizada;
// o que se testa é o lastro, não o WhatsApp.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearGrupoAbandonado } from "./helpers/semear-abandono";
import { criarVinculoAceito } from "./helpers/vinculo";

let personal: UsuarioDescartavel;
let aluno: UsuarioDescartavel;

const NOME_DO_PERSONAL = "Marina Alencar";
const NOME_DO_ALUNO = "Ana Ribeiro";
/** Digitado como a pessoa digita; o app normaliza para E.164 sem o "+". */
const TELEFONE_DIGITADO = "83 97777-6666";
const TELEFONE_E164 = "5583977776666";

test.beforeAll(async () => {
  personal = await criarUsuarioDescartavel("j7-personal", "personal");
  aluno = await criarUsuarioDescartavel("j7-aluno");

  const comoPersonal = await clienteAutenticado(personal);
  const { error: erroPersonal } = await comoPersonal
    .from("usuario")
    .update({ nome: NOME_DO_PERSONAL })
    .eq("id", personal.id);
  if (erroPersonal) throw new Error(`Falha ao nomear o personal: ${erroPersonal.message}`);

  const comoAluno = await clienteAutenticado(aluno);
  const { error: erroAluno } = await comoAluno
    .from("usuario")
    .update({ nome: NOME_DO_ALUNO })
    .eq("id", aluno.id);
  if (erroAluno) throw new Error(`Falha ao nomear o aluno: ${erroAluno.message}`);

  await semearGrupoAbandonado(comoAluno, aluno.id);
});

test.afterAll(async () => {
  if (personal) await apagarUsuarioDescartavel(personal);
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

test("o personal recebe um alerta real do aluno e o clique fica registrado", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  // ---- convite e aceite, pelo fixture compartilhado ----
  const { contextoPersonal, telaPersonal, contextoAluno } = await criarVinculoAceito({
    browser,
    personal,
    aluno,
    telefone: TELEFONE_DIGITADO,
  });
  // A sessão do aluno não é mais necessária: daqui para baixo quem age é
  // o personal, e deixar a aba viva só disputa CPU com a fila.
  await contextoAluno.close();

  // ---- a fila ----
  await telaPersonal.goto("/personal");
  const cartoes = telaPersonal.locator(".alerta-personal");
  await expect(
    cartoes,
    "o aluno tem um grupo parado há ~28 dias — a fila não pode estar vazia",
  ).not.toHaveCount(0, { timeout: 20_000 });

  // Teto da §11.4.6: seletividade é o produto. Dois é o limite por aluno
  // por semana, e ele vale mesmo quando mais coisas são verdade.
  const quantos = await cartoes.count();
  expect(quantos, "teto de 2 alertas por aluno por semana").toBeLessThanOrEqual(2);

  const cartao = cartoes.first();
  await expect(cartao.locator(".alerta-personal__aluno")).toHaveText(NOME_DO_ALUNO);
  // O conteúdo segue a ordem que o P2 pediu; aqui basta provar que as
  // quatro linhas existem com texto — o texto em si é testado em unidade.
  await expect(cartao.locator(".alerta-personal__titulo")).not.toBeEmpty();
  await expect(cartao.locator(".alerta-personal__investigar")).not.toBeEmpty();

  // ---- a ação de um clique (§11.4.7) ----
  const acao = cartao.locator(".alerta-personal__acao a");
  const href = await acao.getAttribute("href");
  expect(href, "sem telefone do aluno não haveria link — e há").toBeTruthy();
  expect(href!, "o link abre a conversa com o número do aluno em E.164 sem o +").toContain(
    `wa.me/${TELEFONE_E164}`,
  );
  const textoPronto = new URL(href!).searchParams.get("text");
  expect(
    textoPronto && textoPronto.trim().length,
    "a mensagem tem de chegar pronta — link sem texto é o personal escrevendo do zero",
  ).toBeTruthy();
  // §11.7: o lastro compõe e entrega; quem aperta enviar é a pessoa.
  // `wa.me` com texto NÃO envia sozinho — se algum dia isto virar a API
  // paga, o host muda e este teste cai, que é exatamente o desejado.
  expect(new URL(href!).host).toBe("wa.me");

  // Neutraliza a navegação externa SEM tocar no mecanismo medido.
  //
  // A primeira versão disto removia o `target="_blank"` antes de clicar, e
  // o teste reprovou aqui. A causa era o próprio teste: sem `target`, o
  // clique vira navegação na MESMA aba, o documento começa a descarregar e
  // leva junto o `fetch` do server action que ainda estava no ar. No app
  // real a âncora abre uma ABA NOVA — a página da fila nunca descarrega, e
  // o registro chega. O teste tinha alterado exatamente a condição que
  // dizia estar medindo, e teria feito o dono caçar um bug que não existe.
  //
  // Agora: a rota é abortada no CONTEXTO (vale para a aba nova também),
  // nenhuma requisição a terceiro sai do CI, e a aba que abrir é fechada.
  // O `target` fica de pé.
  await contextoPersonal.route("**wa.me/**", (rota) => rota.abort());
  contextoPersonal.on("page", (nova) => {
    void nova.close().catch(() => {});
  });
  await acao.click();

  const comoPersonal = await clienteAutenticado(personal);
  await expect
    .poll(
      async () => {
        const { data } = await comoPersonal
          .from("alerta_personal")
          .select("acionado_em")
          .not("acionado_em", "is", null);
        return data?.length ?? 0;
      },
      {
        timeout: 20_000,
        message:
          "o clique precisa gravar `acionado_em` — o server action vai junto com uma navegação nativa e não é esperado; se a navegação o matar, a medida da §11.7 fica cega e a tela não muda",
      },
    )
    .toBeGreaterThan(0);

  // ---- a fila é idempotente ao reabrir (§11.4, índice único) ----
  await telaPersonal.goto("/personal");
  await expect(
    cartoes,
    "reabrir a fila não pode duplicar alerta da mesma semana",
  ).toHaveCount(quantos);
});
