// lastro · UX-03 — cobertura que a varredura j4 não tem (2026-09-26).
//
// A j4 captura página inteira das 17 rotas da casca de sempre, em três
// larguras, em português. Ela NÃO cobre: as rotas novas (aceite, onboarding,
// manual, políticas, termos, privacidade, redefinir senha, boas-vindas,
// completar cadastro, detalhe do treino e do exercício, login, 404), o inglês
// e o espanhol, os temas, nem o viewport ROLADO (onde se prova ou refuta
// "conteúdo escondido pela barra inferior").
//
// Esta spec NÃO reprova por achado visual: ela MEDE e grava. Cada tela vira
// `metricas.json` + duas capturas de viewport (topo e fim, 375×812) na pasta do
// teste em `test-results/`, que o CI publica no artefato `varredura-telas`.
// Só falha se a página lançar erro ou não carregar. Quem lê o resultado é o
// registro de achados (`docs/qualidade/ux-03-*.md`).
import { expect, test, type Page } from "@playwright/test";
import { registrarTela as registrar } from "./helpers/medir-tela";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";

const VIEWPORT = { width: 375, height: 812 };

let aluno: UsuarioDescartavel;
let semAceite: UsuarioDescartavel;
let semOnboarding: UsuarioDescartavel;
let semTipo: UsuarioDescartavel;
let personalSemCref: UsuarioDescartavel;
let treinoId = "";
let exercicioId = "";

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j26-aluno", "aluno");
  semAceite = await criarUsuarioDescartavel("j26-sem-aceite", "aluno", { comAceitePendente: true });
  semOnboarding = await criarUsuarioDescartavel("j26-onboarding", "aluno", { comOnboarding: true });
  semTipo = await criarUsuarioDescartavel("j26-sem-tipo", "aluno", { semTipo: true });
  personalSemCref = await criarUsuarioDescartavel("j26-personal", "personal", { semCref: true });

  const cliente = await clienteAutenticado(aluno);
  await semearHistoricoParaAnalise(cliente, aluno.id);
  const { data: treino } = await cliente.from("treino").select("id").limit(1).single();
  treinoId = treino?.id ?? "";
  const { data: ex } = await cliente.from("exercicio").select("id").not("dica_execucao", "is", null).limit(1).single();
  exercicioId = ex?.id ?? "";
});

test.afterAll(async () => {
  for (const c of [aluno, semAceite, semOnboarding, semTipo, personalSemCref]) {
    if (c) await apagarUsuarioDescartavel(c);
  }
});

async function definirIdioma(conta: UsuarioDescartavel, idioma: "pt-BR" | "en" | "es") {
  const cliente = await clienteAutenticado(conta);
  await cliente.from("usuario").update({ idioma }).eq("id", conta.id);
}

async function abrir(page: Page, conta: UsuarioDescartavel | null, rota: string) {
  await page.setViewportSize(VIEWPORT);
  if (conta) await entrarComoUsuario(page, conta);
  const resposta = await page.goto(rota);
  expect(resposta?.status() ?? 0, `${rota} não carregou`).toBeLessThan(500);
}

// ---------- Rotas públicas (sem conta) ----------
for (const rota of ["/login", "/termos", "/privacidade", "/rota-que-nao-existe"]) {
  test(`público: ${rota}`, async ({ page }) => {
    await abrir(page, null, rota);
    await registrar(page, rota, "pt-BR");
  });
}

// ---------- Estados de conta que caem em telas próprias ----------
test("aceite pendente: /aceite", async ({ page }) => {
  await abrir(page, semAceite, "/aceite");
  await registrar(page, "/aceite", "pt-BR");
});

test("onboarding pendente: /onboarding (aluno)", async ({ page }) => {
  await abrir(page, semOnboarding, "/onboarding");
  await registrar(page, "/onboarding", "pt-BR");
});

test("sem tipo escolhido: /boas-vindas", async ({ page }) => {
  await abrir(page, semTipo, "/boas-vindas");
  await registrar(page, "/boas-vindas", "pt-BR");
});

test("personal sem CREF: /personal/completar", async ({ page }) => {
  await abrir(page, personalSemCref, "/personal/completar");
  await registrar(page, "/personal/completar", "pt-BR");
});

// ---------- Rotas da casca de aluno que a j4 não tem ----------
test("aluno: rotas novas em português, viewport rolado", async ({ page }) => {
  await abrir(page, aluno, "/");
  for (const rota of [
    "/redefinir-senha",
    "/ajustes/guia",
    "/ajustes/politicas",
    `/treino/${treinoId}`,
    `/catalogo/${exercicioId}`,
    "/",
    "/treino",
    "/analise",
    "/coach",
    "/catalogo",
    "/ajustes",
    "/ajustes/relatorios",
    "/ajustes/modelos",
    "/ajustes/anilhas",
    "/ajustes/personal",
    "/perfil",
  ]) {
    await page.goto(rota);
    await registrar(page, rota, "pt-BR");
  }
});

// ---------- Idiomas ----------
for (const idioma of ["en", "es"] as const) {
  test(`aluno: ${idioma} nas telas principais`, async ({ page }) => {
    await definirIdioma(aluno, idioma);
    await abrir(page, aluno, "/");
    for (const rota of ["/", "/treino", "/analise", "/coach", "/catalogo", "/ajustes", "/ajustes/guia", "/ajustes/relatorios", "/ajustes/anilhas"]) {
      await page.goto(rota);
      await registrar(page, rota, idioma);
    }
    await definirIdioma(aluno, "pt-BR");
  });
}

// ---------- Temas ----------
for (const tema of ["branco-ouro", "areia", "clean", "petroleo", "moka", "oliva"]) {
  test(`tema ${tema}: home, treino e ajustes`, async ({ page }) => {
    await page.addInitScript((t) => window.localStorage.setItem("lastro_tema", t), tema);
    await abrir(page, aluno, "/");
    for (const rota of ["/", "/treino", "/ajustes"]) {
      await page.goto(rota);
      await registrar(page, rota, "pt-BR", tema);
    }
  });
}
