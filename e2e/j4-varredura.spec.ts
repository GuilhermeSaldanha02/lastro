// lastro · varredura de navegação completa — pedido do dono em 2026-09-10.
//
// O QUE ISTO É, E POR QUE NÃO É MAIS UMA JORNADA. J1/J2/J3 provam que os
// três caminhos do PRD §6 funcionam. Esta spec não prova caminho nenhum:
// ela ANDA por todas as telas do app com um usuário recém-criado e
// reprova se alguma delas emitir erro de console, quebrar requisição,
// vazar horizontalmente ou renderizar vazia. É rede de arrasto, não
// jornada — pega o que as três jornadas não olham porque não passam ali.
//
// USUÁRIO NOVO DE VERDADE, E DE PROPÓSITO. O dono pediu explicitamente
// para não usar a conta dele. Cada execução cria o próprio usuário via
// admin e apaga no fim (cascade cuida de treino/série). Isso também
// cobre o que a conta dele NÃO cobre mais: como o app se comporta com
// histórico zerado, que é o primeiro minuto de qualquer pessoa nova.
//
// TRÊS LARGURAS. 390 (celular real, iPhone 14), 768 (tablet / limiar dos
// media queries em `sistema.css`) e 1440 (desktop). O dono já reportou
// problema de responsividade em 2026-09-05 vendo no celular — largura
// única não teria pego.
//
// O QUE FAZ FALHAR, e por que cada um:
//   · erro de console → é defeito mesmo quando a tela "parece" certa;
//   · requisição 4xx/5xx → tela montada sobre chamada quebrada;
//   · vazamento horizontal → o corpo nunca deve rolar de lado (regra do
//     próprio projeto: conteúdo largo rola dentro do container dele);
//   · tela vazia → rota que renderiza casca sem conteúdo.
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  clienteAutenticado,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito, nomear } from "./helpers/vinculo";
import { semearGrupoAbandonado } from "./helpers/semear-abandono";

let usuario: UsuarioDescartavel;
let personal: UsuarioDescartavel;

/**
 * DUAS contas, porque agora existem DUAS CASCAS (PRD §11, emenda de
 * 2026-09-11): a conta varrida é um ALUNO vinculado, e existe um PERSONAL
 * separado para varrer a casca de trabalho.
 *
 * Foi assim que ficou depois que o guarda de rota entrou. Com uma conta só
 * de personal — como esta spec chegou a ficar por algumas horas — `/`,
 * `/treino` e `/analise` passam a redirecionar, e a varredura mediria
 * três redirecionamentos achando que mediu três telas. Conta errada não
 * falha alto: ela devolve verde medindo outra coisa.
 *
 * A `/personal` entrou aqui em 2026-09-11 (`QA.md` PE-04): ela exige
 * vínculo aceito, e varrer sem ele mediria o redirecionamento.
 *
 * O aluno recebe um grupo abandonado semeado de propósito: no estado
 * vazio a `/personal` não tem texto nem cor suficientes para a varredura
 * (e menos ainda para a medição de contraste da `j5`, que usa a mesma
 * montagem).
 *
 * O que isto NÃO muda: as outras rotas seguem varridas por uma conta
 * recém-nascida. Ter aluno vinculado não altera o estado de nenhuma delas
 * — a exceção é a `/analise`, que sob vínculo troca a pergunta em destaque
 * (PRD §11.4.2), e essa passa a ser a variante varrida.
 */
test.beforeAll(async ({ browser }) => {
  usuario = await criarUsuarioDescartavel("varredura");
  personal = await criarUsuarioDescartavel("varredura-personal", "personal");

  const comoPersonal = await clienteAutenticado(personal);
  await nomear(comoPersonal, personal.id, "Marina Alencar");

  const comoAluno = await clienteAutenticado(usuario);
  await nomear(comoAluno, usuario.id, "Ana Ribeiro");
  await semearGrupoAbandonado(comoAluno, usuario.id);

  const { contextoPersonal, contextoAluno } = await criarVinculoAceito({
    browser,
    personal,
    aluno: usuario,
  });
  // A varredura roda na `page` do teste, com login próprio — estas duas
  // sessões só existiram para o aceite. Fechar evita duas abas vivas à toa
  // durante os cinco minutos de varredura.
  await contextoPersonal.close();
  await contextoAluno.close();
});

test.afterAll(async () => {
  if (usuario) await apagarUsuarioDescartavel(usuario);
  if (personal) await apagarUsuarioDescartavel(personal);
});

/** Larguras conferidas. A altura é a real do aparelho, não um número redondo. */
const LARGURAS = [
  { nome: "celular", largura: 390, altura: 844 },
  { nome: "tablet", largura: 768, altura: 1024 },
  { nome: "desktop", largura: 1440, altura: 900 },
] as const;

/**
 * Rotas fixas. As dinâmicas (`/treino/[id]`, `/catalogo/[id]`) entram
 * depois, com id real colhido da própria navegação — id inventado testaria
 * a tela de "não encontrado", não a tela.
 */
const ROTAS_FIXAS = [
  "/",
  "/treino",
  "/catalogo",
  "/analise",
  "/coach",
  "/perfil",
  "/ajustes",
  "/ajustes/temas",
  "/ajustes/anilhas",
  "/ajustes/modelos",
  "/ajustes/modelos/novo",
  "/ajustes/relatorios",
  // Módulo Personal (PRD §11). Renderiza para QUALQUER conta logada — é o
  // lado do aluno ("vincular a um personal") somado ao de convidar.
  "/ajustes/personal",
];

/**
 * As telas que só a CONTA DE PERSONAL alcança. Varridas numa segunda
 * sessão, porque o guarda de rota (`casca.ts`) devolve o aluno para a Home
 * — e um redirecionamento varrido é uma tela não varrida.
 */
const ROTAS_PERSONAL = ["/personal", "/personal/alunos"];

type Achado = { rota: string; largura: string; tipo: string; detalhe: string };

/** A preferência é mudada pela tela, nunca pelo banco: é a jornada real. */
const IDIOMAS = [
  {
    opcao: "Português",
    salvo: "Idioma salvo.",
    inicio: "Iniciar Treino de Hoje",
    vazio: "Nenhum treino registrado ainda. O primeiro começa no botão acima.",
    catalogo: "Catálogo",
  },
  {
    opcao: "English",
    salvo: "Language saved.",
    inicio: "Start Today's Workout",
    vazio: "No workouts logged yet. The first one starts with the button above.",
    catalogo: "Catalog",
  },
  {
    opcao: "Español",
    salvo: "Idioma guardado.",
    inicio: "Iniciar Entrenamiento de Hoy",
    vazio: "Aún no hay entrenamientos registrados. El primero comienza con el botón de arriba.",
    catalogo: "Catálogo",
  },
] as const;

async function trocarIdiomaPelaTela(page: Page, idioma: (typeof IDIOMAS)[number]): Promise<void> {
  await page.goto("/ajustes");
  await page.getByRole("radio", { name: idioma.opcao }).click();
  // Este é o rótulo que só aparece depois de a preferência ter sido salva.
  await expect(page.getByText(idioma.salvo, { exact: true })).toBeVisible();
}

async function montarGradeDeSeries(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  await page.locator("label.chip").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();

  for (const [indice, reps] of ["10", "8"].entries()) {
    if (indice > 0) await page.getByRole("button", { name: "Outra série" }).click();
    await page.locator("#exercicio_id").selectOption({ index: 1 });
    await page.locator("#tipo").selectOption("valendo");
    await page.locator("#reps").fill(reps);
    await page.locator("#peso").fill("40");
    await page.getByRole("button", { name: "Registrar série" }).click();
  }

  await expect(page.getByRole("row")).toHaveCount(3);
}

/**
 * Ruído conhecido que não é defeito do app. Lista curta e justificada de
 * propósito: filtro largo aqui transforma a varredura em teatro.
 */
function ehRuidoConhecido(texto: string): boolean {
  return (
    // O SW é bloqueado no config (`serviceWorkers: "block"`); o registro
    // falhar é consequência DA configuração de teste, não do app.
    texto.includes("ServiceWorker") ||
    texto.includes("serviceWorker") ||
    // Extensões/devtools do runner, fora do controle da página.
    texto.includes("chrome-extension://") ||
    // Vídeo/GIF do catálogo depende de CDN externa; indisponibilidade dela
    // não é defeito de tela e já tem fallback próprio (`erroMidia`).
    texto.includes("net::ERR_BLOCKED_BY_CLIENT")
  );
}

/** Liga os coletores. Devolve a lista viva, que a rota inspeciona depois. */
function coletar(page: Page, achados: Achado[], rotulo: () => { rota: string; largura: string }) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const texto = msg.text();
    if (ehRuidoConhecido(texto)) return;
    achados.push({ ...rotulo(), tipo: "console", detalhe: texto.slice(0, 300) });
  });

  page.on("pageerror", (erro) => {
    if (ehRuidoConhecido(erro.message)) return;
    achados.push({ ...rotulo(), tipo: "exceção", detalhe: erro.message.slice(0, 300) });
  });

  page.on("response", (resposta) => {
    if (resposta.status() < 400) return;
    const url = resposta.url();
    if (ehRuidoConhecido(url)) return;
    achados.push({
      ...rotulo(),
      tipo: `http ${resposta.status()}`,
      detalhe: url.slice(0, 200),
    });
  });
}

/** O corpo da página nunca deve rolar de lado. Conteúdo largo rola no container dele. */
async function vazamentoHorizontal(page: Page): Promise<number> {
  return page.evaluate(() => {
    const d = document.documentElement;
    return Math.max(0, d.scrollWidth - d.clientWidth);
  });
}

/** Texto visível suficiente para a rota não ser uma casca vazia. */
async function temConteudo(page: Page): Promise<number> {
  return page.evaluate(() => (document.body.innerText ?? "").trim().length);
}

test("varre todas as telas com usuário novo, em três larguras", async ({ page, browser }) => {
  test.setTimeout(300_000);

  const achados: Achado[] = [];
  let rotaAtual = "(login)";
  let larguraAtual = "desktop";
  coletar(page, achados, () => ({ rota: rotaAtual, largura: larguraAtual }));

  await entrarComoUsuario(page, usuario);

  // Um treino real, para `/treino/[id]` existir e para as telas que
  // dependem de dado não serem julgadas só no estado vazio.
  await page.goto("/treino");
  await page.getByRole("button", { name: /iniciar treino/i }).click();
  await page.waitForURL(/\/treino\/[^/]+$/, { timeout: 20_000 });
  const urlTreino = new URL(page.url()).pathname;
  await montarGradeDeSeries(page);

  // Um exercício real do catálogo, para `/catalogo/[id]`.
  await page.goto("/catalogo");
  const primeiroCard = page.locator('a[href^="/catalogo/"]').first();
  await expect(primeiroCard).toBeVisible({ timeout: 20_000 });
  const urlExercicio = await primeiroCard.getAttribute("href");
  expect(urlExercicio).toBeTruthy();

  const rotas = [...ROTAS_FIXAS, urlTreino, urlExercicio!];

  for (const { nome, largura, altura } of LARGURAS) {
    larguraAtual = nome;
    await page.setViewportSize({ width: largura, height: altura });

    for (const rota of rotas) {
      rotaAtual = rota;
      await page.goto(rota, { waitUntil: "domcontentloaded" });
      // Dá tempo de hidratar e de as chamadas de dado voltarem antes de
      // medir — medir cedo demais acusa vazamento que não existe.
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const vazamento = await vazamentoHorizontal(page);
      if (vazamento > 1) {
        achados.push({
          rota,
          largura: nome,
          tipo: "vazamento horizontal",
          detalhe: `${vazamento}px além da largura da viewport (${largura}px)`,
        });
      }

      const tamanhoTexto = await temConteudo(page);
      if (tamanhoTexto < 20) {
        achados.push({
          rota,
          largura: nome,
          tipo: "tela vazia",
          detalhe: `só ${tamanhoTexto} caracteres visíveis`,
        });
      }

      await page.screenshot({
        path: `test-results/varredura/${nome}${rota.replace(/\//g, "_") || "_raiz"}.png`,
        fullPage: true,
      });
    }
  }

  // ---- a SEGUNDA casca, com a conta que a tem ----
  // Sessão própria: trocar de conta na mesma aba exigiria logout e
  // re-login a cada largura, e o cookie de sessão é por contexto.
  const contextoTrabalho = await browser.newContext();
  const telaTrabalho = await contextoTrabalho.newPage();
  coletar(telaTrabalho, achados, () => ({ rota: rotaAtual, largura: larguraAtual }));
  await entrarComoUsuario(telaTrabalho, personal);

  for (const { nome, largura, altura } of LARGURAS) {
    larguraAtual = nome;
    await telaTrabalho.setViewportSize({ width: largura, height: altura });

    for (const rota of ROTAS_PERSONAL) {
      rotaAtual = rota;
      await telaTrabalho.goto(rota, { waitUntil: "domcontentloaded" });
      await telaTrabalho
        .waitForLoadState("networkidle", { timeout: 30_000 })
        .catch(() => {});

      // A tela precisa ser a pedida, e não o redirecionamento do guarda:
      // sem esta asserção, uma casca quebrada devolveria varredura verde
      // sobre a Home do aluno.
      expect(
        new URL(telaTrabalho.url()).pathname,
        `a conta de personal precisa ALCANÇAR ${rota}`,
      ).toBe(rota);

      const vazamento = await vazamentoHorizontal(telaTrabalho);
      if (vazamento > 1) {
        achados.push({
          rota,
          largura: nome,
          tipo: "vazamento horizontal",
          detalhe: `${vazamento}px além da largura da viewport (${largura}px)`,
        });
      }

      const tamanhoTexto = await temConteudo(telaTrabalho);
      if (tamanhoTexto < 20) {
        achados.push({
          rota,
          largura: nome,
          tipo: "tela vazia",
          detalhe: `só ${tamanhoTexto} caracteres visíveis`,
        });
      }

      await telaTrabalho.screenshot({
        path: `test-results/varredura/${nome}${rota.replace(/\//g, "_")}.png`,
        fullPage: true,
      });
    }
  }

  await contextoTrabalho.close();

  // Relatório legível ANTES do assert: quando falha, o log já diz o quê e
  // onde, sem precisar abrir trace.
  if (achados.length > 0) {
    console.log("\n=== ACHADOS DA VARREDURA ===");
    for (const a of achados) {
      console.log(`[${a.largura}] ${a.rota} · ${a.tipo}\n    ${a.detalhe}`);
    }
    console.log(`=== total: ${achados.length} ===\n`);
  }

  expect(
    achados,
    `varredura encontrou ${achados.length} problema(s) — ver lista acima`,
  ).toEqual([]);
});

for (const idioma of IDIOMAS) {
  test(`idioma: aluno vê início, ação e vazio em ${idioma.opcao}`, async ({ page }) => {
    const conta = await criarUsuarioDescartavel("j4-idioma");
    try {
      await entrarComoUsuario(page, conta);
      await trocarIdiomaPelaTela(page, idioma);

      await page.goto("/");
      await expect(page.getByRole("button", { name: idioma.inicio, exact: true })).toBeVisible();
      await expect(page.getByText(idioma.vazio, { exact: true })).toBeVisible();

      await page.goto("/catalogo");
      await expect(page.getByText(idioma.catalogo, { exact: true }).first()).toBeVisible();
    } finally {
      await apagarUsuarioDescartavel(conta);
    }
  });
}
