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
import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";

type Metricas = {
  rota: string;
  idioma: string;
  tema: string;
  url: string;
  vazamentoHorizontal: number;
  alvosPequenos: { tag: string; texto: string; w: number; h: number }[];
  textoCortado: { tag: string; texto: string; visivel: number; total: number }[];
  escondidoPelaNav: { ultimoBottom: number; navTop: number; escondido: number } | null;
  alturaDocumento: number;
};

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

async function medir(page: Page, rota: string, idioma: string, tema: string): Promise<Metricas> {
  await page.waitForLoadState("networkidle").catch(() => {});
  return page.evaluate(
    ({ rota, idioma, tema }) => {
      const visivel = (el: Element) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
      };
      const alvos = [...document.querySelectorAll("a, button, input, select, textarea, [role=button], [role=radio], [role=tab]")]
        .filter((el) => visivel(el) && getComputedStyle(el).display !== "inline")
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), texto: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((a) => a.h < 44 || a.w < 44);

      const cortados = [...document.querySelectorAll("body *")]
        .filter((el) => visivel(el) && el.children.length === 0 && (el.textContent ?? "").trim().length > 0)
        .filter((el) => {
          const s = getComputedStyle(el);
          return (s.overflow === "hidden" || s.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 1;
        })
        .map((el) => ({ tag: el.tagName.toLowerCase(), texto: (el.textContent ?? "").trim().slice(0, 50), visivel: el.clientWidth, total: el.scrollWidth }));

      // Fim da página: o último elemento de conteúdo passa por baixo da barra inferior?
      window.scrollTo(0, document.documentElement.scrollHeight);
      const nav = document.querySelector(".nav");
      const corpo = document.querySelector(".corpo");
      let escondido: { ultimoBottom: number; navTop: number; escondido: number } | null = null;
      if (nav && corpo) {
        const filhos = [...corpo.querySelectorAll("*")].filter((el) => visivel(el) && el.children.length === 0);
        const ultimoBottom = Math.max(0, ...filhos.map((el) => el.getBoundingClientRect().bottom));
        const navTop = nav.getBoundingClientRect().top;
        escondido = { ultimoBottom: Math.round(ultimoBottom), navTop: Math.round(navTop), escondido: Math.round(Math.max(0, ultimoBottom - navTop)) };
      }

      return {
        rota,
        idioma,
        tema,
        url: location.pathname,
        vazamentoHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        alvosPequenos: alvos.slice(0, 12),
        textoCortado: cortados.slice(0, 12),
        escondidoPelaNav: escondido,
        alturaDocumento: document.documentElement.scrollHeight,
      };
    },
    { rota, idioma, tema },
  );
}

async function registrar(page: Page, rota: string, idioma: string, tema = "ouro") {
  const id = `${rota.replace(/[^a-z0-9]+/gi, "_") || "raiz"}__${idioma}__${tema}`;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: test.info().outputPath(`${id}__topo.png`) }).catch(() => {});
  const m = await medir(page, rota, idioma, tema);
  await page.screenshot({ path: test.info().outputPath(`${id}__fim.png`) }).catch(() => {});
  fs.writeFileSync(test.info().outputPath(`${id}__metricas.json`), JSON.stringify(m, null, 2));
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
