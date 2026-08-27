// lastro · Teste de jornada de usuário — Playwright, celular real (390×844).
//
// Não é teste unitário: encarna alguém que acabou de abrir o app e percorre
// as três jornadas do PRD §6 (J1 treino, J2 análise, J3 dúvida), coletando
// TODA falha que aparecer pelo caminho em vez de parar na primeira.
//
// Colhe, a cada passo:
//   · erro de console e exceção de página (inclui o hydration mismatch)
//   · resposta HTTP >= 400 e requisição que falhou
//   · alvo de toque abaixo de --lastro-alvo-min (48px, restrição D1)
//   · texto que estoura o container (overflow horizontal)
//   · print da tela
//
// Uso:  node scripts/test-jornada-usuario.mjs
// Requer o dev server em http://localhost:3000 e as chaves em .env.local.

import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const BASE = process.env.APP_URL || "http://localhost:3000";
const DIR = "docs/screenshots/jornada-usuario";
const EMAIL = `qa-jornada-${Date.now()}@lastro.test`;
const SENHA = "SenhaTeste123!";

fs.mkdirSync(DIR, { recursive: true });

/** Achados do teste — nada é lançado, tudo é colecionado e relatado no fim. */
const achados = [];
let passoAtual = "abertura";

const anotar = (tipo, detalhe) =>
  achados.push({ passo: passoAtual, tipo, detalhe });

const helper = (...args) =>
  execFileSync("bash", ["scripts/qa-treino-helper.sh", ...args], {
    encoding: "utf8",
  });

/** Alvos de toque menores que 48px — D1, "dedo suado, pessoa em pé". */
async function auditarAlvos(page) {
  const pequenos = await page.evaluate(() => {
    const MIN = 48;
    const alvos = [...document.querySelectorAll("button, a[href], select, input, [role=button]")];
    return alvos
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const visivel = r.width > 0 && r.height > 0 &&
          getComputedStyle(el).visibility !== "hidden";
        return visivel && (r.height < MIN || r.width < MIN);
      })
      .filter((el) => !el.closest("nextjs-portal")) // devtools do Next, não é o app
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          texto: (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 40),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      });
  });
  for (const a of pequenos) {
    anotar("alvo-de-toque", `"${a.texto}" mede ${a.w}×${a.h}px — piso é 48×48 (D1)`);
  }
}

/** A página inteira nunca deve rolar de lado num celular. */
async function auditarOverflow(page) {
  const estouro = await page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= doc.clientWidth) return null;
    const culpados = [...document.querySelectorAll("*")]
      .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
      .filter((el) => !el.closest("nextjs-portal"))
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);
    return { largura: doc.scrollWidth, viewport: doc.clientWidth, culpados };
  });
  if (estouro) {
    anotar(
      "overflow",
      `página rola de lado: ${estouro.largura}px em viewport de ${estouro.viewport}px — ${estouro.culpados.join(", ")}`,
    );
  }
}

async function passo(page, nome, acao) {
  passoAtual = nome;
  await acao();
  await page.waitForTimeout(700);
  await auditarAlvos(page);
  await auditarOverflow(page);
  await page.screenshot({ path: `${DIR}/${nome}.png` });
  console.log(`  ✓ ${nome}`);
}

async function run() {
  console.log(`\nCriando usuário de teste: ${EMAIL}`);
  helper("criar-usuario", EMAIL, SENHA);

  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") {
      anotar("console", m.text().split("\n")[0].slice(0, 180));
    }
  });
  page.on("pageerror", (e) => anotar("exceção", String(e).slice(0, 180)));
  page.on("requestfailed", (r) =>
    anotar("rede", `${r.method()} ${r.url().replace(BASE, "")} falhou: ${r.failure()?.errorText}`),
  );
  page.on("response", (r) => {
    if (r.status() >= 400) {
      anotar("rede", `${r.status()} em ${r.url().replace(BASE, "")}`);
    }
  });

  try {
    console.log("\nJ1 — registrar treino (a jornada que precisa ser perfeita)");

    await passo(page, "01-login", async () => {
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.getByRole("textbox", { name: "E-mail" }).fill(EMAIL);
      await page.getByRole("textbox", { name: "Senha" }).fill(SENHA);
      await page.getByRole("button", { name: /entrar no lastro/i }).click();
      await page.waitForURL(BASE + "/", { timeout: 20000 });
    });

    await passo(page, "02-inicio", async () => {
      await page.waitForLoadState("networkidle");
    });

    await passo(page, "03-treino-iniciado", async () => {
      await page.getByRole("button", { name: /iniciar treino/i }).click();
      await page.waitForURL(/\/treino\//, { timeout: 20000 });
    });

    await passo(page, "04-escolher-grupo", async () => {
      await page.getByRole("button", { name: /adicionar exerc/i }).click();
      await page.getByText("Peito", { exact: true }).click();
      await page.getByRole("button", { name: "Continuar" }).click();
    });

    await passo(page, "05-primeira-serie", async () => {
      await page.getByLabel("Exercício").selectOption({ label: "Supino reto com barra" });
      await page.getByLabel("Tipo de Série").selectOption({ label: "Valendo" });
      await page.getByRole("spinbutton", { name: "Reps" }).fill("10");
      await page.getByRole("spinbutton", { name: /Peso/ }).fill("60");
      await page.getByRole("button", { name: "Registrar série" }).click();
      await page.waitForTimeout(1500);
    });

    // D3: "repetir última série é o botão mais proeminente do app".
    await passo(page, "06-repetir-serie", async () => {
      const repetir = page.getByRole("button", { name: /repetir série/i });
      if (await repetir.count()) {
        await repetir.click();
        await page.waitForTimeout(1200);
      } else {
        anotar("requisito", 'botão "Repetir série" não apareceu após registrar (D3)');
      }
    });

    await passo(page, "07-timer-descanso", async () => {
      const descanso = page.getByRole("button", { name: /descanso/i });
      if (await descanso.count()) {
        await descanso.first().click();
        await page.waitForTimeout(1800);
        const texto = await page.evaluate(() => document.body.innerText);
        if (!/pausar/i.test(texto)) {
          anotar("timer", "timer de descanso não entrou em contagem (sem botão Pausar)");
        }
      } else {
        anotar("requisito", "gatilho de descanso não encontrado na tela de treino");
      }
    });

    console.log("\nJ2 — ler a Análise (a jornada que justifica o projeto)");

    await passo(page, "08-analise", async () => {
      await page.goto(`${BASE}/analise`, { waitUntil: "networkidle" });
    });

    console.log("\nJ3 — tirar dúvida de execução");

    await passo(page, "09-catalogo", async () => {
      await page.goto(`${BASE}/catalogo`, { waitUntil: "networkidle" });
    });

    await passo(page, "10-exercicio", async () => {
      await page.locator("a[href^='/catalogo/']").first().click();
      await page.waitForTimeout(1200);
      const texto = await page.evaluate(() => document.body.innerText);
      if (/ainda não (foi )?cadastrada|não escrita/i.test(texto)) {
        anotar(
          "conteúdo",
          "exercício sem dica de execução — critério A9 do PRD não atendido",
        );
      }
      if (!/não substitui|profissional/i.test(texto)) {
        anotar(
          "conteúdo",
          "sem aviso de que não substitui acompanhamento profissional (PRD §4.5)",
        );
      }
    });

    await passo(page, "11-ajustes", async () => {
      await page.goto(`${BASE}/ajustes`, { waitUntil: "networkidle" });
    });

    await passo(page, "12-coach", async () => {
      await page.goto(`${BASE}/coach`, { waitUntil: "networkidle" });
      // T5 do backlog: o campo do coach ficava por baixo da aba inferior.
      const sobreposto = await page.evaluate(() => {
        const campo = document.querySelector("textarea, input[type=text]");
        const aba = document.querySelector("nav");
        if (!campo || !aba) return null;
        const c = campo.getBoundingClientRect();
        const a = aba.getBoundingClientRect();
        return c.bottom > a.top ? Math.round(c.bottom - a.top) : null;
      });
      if (sobreposto) {
        anotar("sobreposição", `campo do coach fica ${sobreposto}px por baixo da aba inferior`);
      }
    });
  } catch (erro) {
    anotar("quebra", `a jornada parou em "${passoAtual}": ${String(erro).split("\n")[0]}`);
  } finally {
    await browser.close();
    try {
      helper("limpar-usuario", EMAIL);
      console.log("\nUsuário de teste removido.");
    } catch {
      console.log(`\n⚠ NÃO consegui remover ${EMAIL} — limpar à mão.`);
    }
  }

  // ---- Relatório ----
  console.log(`\n${"=".repeat(66)}\nACHADOS\n${"=".repeat(66)}`);

  if (achados.length === 0) {
    console.log("Nenhuma falha encontrada.");
  } else {
    const porTipo = new Map();
    for (const a of achados) {
      const chave = `${a.tipo}::${a.detalhe}`;
      if (!porTipo.has(chave)) porTipo.set(chave, { ...a, vezes: 0, passos: new Set() });
      const reg = porTipo.get(chave);
      reg.vezes += 1;
      reg.passos.add(a.passo);
    }
    const unicos = [...porTipo.values()].sort((a, b) => a.tipo.localeCompare(b.tipo));
    for (const a of unicos) {
      const onde = [...a.passos].join(", ");
      console.log(`\n[${a.tipo}] ${a.detalhe}`);
      console.log(`   ${a.vezes}× · em: ${onde}`);
    }
    console.log(`\n${unicos.length} achados distintos, ${achados.length} ocorrências.`);
  }
  console.log(`\nPrints em ${DIR}/\n`);
}

run();
