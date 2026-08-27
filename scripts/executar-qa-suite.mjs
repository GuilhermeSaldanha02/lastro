import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";
const PROJECT_REF = "tbkzcqfvafznxallyfqk";

async function obterSessaoTeste() {
  const testEmail = "qa_player_tester@lastro.app";
  const testPassword = "PlaywrightTester_2026!";

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError || !authData.session) {
    throw new Error(`Falha ao logar: ${signInError?.message}`);
  }

  return authData.session;
}

function salvarEvidencia(id, printBuffer, consoleLogs, redeLogs) {
  const dir = path.resolve(`qa/evidencias/${id}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "print.png"), printBuffer);
  fs.writeFileSync(path.join(dir, "console.txt"), consoleLogs.join("\n"));
  fs.writeFileSync(path.join(dir, "rede.txt"), redeLogs.join("\n"));
}

async function run() {
  console.log("⚡ Executando Bateria de Testes QA Lastro...");
  const session = await obterSessaoTeste();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "pt-BR",
  });

  // Cookies
  const sessionCookieStr = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  const cookieChunkSize = 3000;
  const cookieChunks = [];
  for (let i = 0; i < sessionCookieStr.length; i += cookieChunkSize) {
    cookieChunks.push(sessionCookieStr.slice(i, i + cookieChunkSize));
  }
  const cookies = cookieChunks.map((chunk, idx) => ({
    name: idx === 0 ? `sb-${PROJECT_REF}-auth-token` : `sb-${PROJECT_REF}-auth-token.${idx}`,
    value: chunk,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }));
  await context.addCookies(cookies);

  const page = await context.newPage();

  let consoleLogs = [];
  let redeLogs = [];

  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on("request", (req) => {
    redeLogs.push(`[REQ] ${req.method()} ${req.url()}`);
  });

  page.on("response", (res) => {
    redeLogs.push(`[RESP] ${res.status()} ${res.url()}`);
  });

  // ==========================================
  // 1. TR-01: Treino, Timer, Finalização e Relatório
  // ==========================================
  console.log("▶️ [TR-01] Testando Treino & Cronômetro Congelável...");
  consoleLogs = [];
  redeLogs = [];
  await page.goto("http://localhost:3000/treino", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  let linkTreino = await page.$("a[href^='/treino/']");
  if (!linkTreino) {
    const btnIniciar = await page.$(".destaque-pro button, form button");
    if (btnIniciar) {
      await btnIniciar.click();
      await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {});
    }
  } else {
    await linkTreino.click();
    await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {});
  }
  await page.waitForTimeout(1500);

  // Inicia descanso
  const btnDescanso = await page.$(".timer-topo-botao-disparar");
  if (btnDescanso) {
    await btnDescanso.click();
    await page.waitForTimeout(500);
  }

  // Se não houver séries, registra uma rápida
  let btnFinalizar = await page.$(".botao-finalizar-treino");
  if (!btnFinalizar) {
    const btnOutra = await page.$(".botao-secundario.botao-acao-duplo");
    if (btnOutra) {
      await btnOutra.click();
      await page.waitForTimeout(500);
      const btnReg = await page.$("button[type='submit'].botao-primario");
      if (btnReg) {
        await btnReg.click();
        await page.waitForTimeout(1500);
      }
    }
    btnFinalizar = await page.$(".botao-finalizar-treino");
  }

  // Finalizar treino
  if (btnFinalizar) {
    await btnFinalizar.click();
    await page.waitForTimeout(1500);
  }

  const printTR01 = await page.screenshot();
  salvarEvidencia("TR-01", printTR01, consoleLogs, redeLogs);
  console.log("   ✅ [TR-01] Gravado!");

  // ==========================================
  // 2. VS-01: Tema Obsidian Ouro (Padrão)
  // ==========================================
  console.log("▶️ [VS-01] Testando Tema Obsidian Ouro...");
  consoleLogs = [];
  redeLogs = [];
  await page.evaluate(() => {
    localStorage.setItem("lastro_tema", "ouro");
    document.documentElement.setAttribute("data-tema", "ouro");
  });
  await page.goto("http://localhost:3000/treino", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printVS01 = await page.screenshot();
  salvarEvidencia("VS-01", printVS01, consoleLogs, redeLogs);
  console.log("   ✅ [VS-01] Gravado!");

  // ==========================================
  // 3. VS-02: Tema Marfim & Ouro Imperial (Claro)
  // ==========================================
  console.log("▶️ [VS-02] Testando Tema Marfim & Ouro Imperial...");
  consoleLogs = [];
  redeLogs = [];
  await page.evaluate(() => {
    localStorage.setItem("lastro_tema", "branco-ouro");
    document.documentElement.setAttribute("data-tema", "branco-ouro");
  });
  await page.goto("http://localhost:3000/treino", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printVS02 = await page.screenshot();
  salvarEvidencia("VS-02", printVS02, consoleLogs, redeLogs);
  console.log("   ✅ [VS-02] Gravado!");

  // ==========================================
  // 4. AN-01: Análise Semanal (Peça-Assinatura)
  // ==========================================
  console.log("▶️ [AN-01] Testando Análise...");
  consoleLogs = [];
  redeLogs = [];
  await page.evaluate(() => {
    localStorage.setItem("lastro_tema", "ouro");
    document.documentElement.setAttribute("data-tema", "ouro");
  });
  await page.goto("http://localhost:3000/analise", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printAN01 = await page.screenshot();
  salvarEvidencia("AN-01", printAN01, consoleLogs, redeLogs);
  console.log("   ✅ [AN-01] Gravado!");

  // ==========================================
  // 5. CT-01: Catálogo de Exercícios & Mídia 3D
  // ==========================================
  console.log("▶️ [CT-01] Testando Catálogo...");
  consoleLogs = [];
  redeLogs = [];
  await page.goto("http://localhost:3000/catalogo", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printCT01 = await page.screenshot();
  salvarEvidencia("CT-01", printCT01, consoleLogs, redeLogs);
  console.log("   ✅ [CT-01] Gravado!");

  // ==========================================
  // 6. CH-01: Coach de IA
  // ==========================================
  console.log("▶️ [CH-01] Testando Coach...");
  consoleLogs = [];
  redeLogs = [];
  await page.goto("http://localhost:3000/coach", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printCH01 = await page.screenshot();
  salvarEvidencia("CH-01", printCH01, consoleLogs, redeLogs);
  console.log("   ✅ [CH-01] Gravado!");

  // ==========================================
  // 7. PF-01: Perfil do Atleta
  // ==========================================
  console.log("▶️ [PF-01] Testando Perfil...");
  consoleLogs = [];
  redeLogs = [];
  await page.goto("http://localhost:3000/perfil", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printPF01 = await page.screenshot();
  salvarEvidencia("PF-01", printPF01, consoleLogs, redeLogs);
  console.log("   ✅ [PF-01] Gravado!");

  // ==========================================
  // 8. AJ-01: Ajustes & Configuração de Temas
  // ==========================================
  console.log("▶️ [AJ-01] Testando Ajustes...");
  consoleLogs = [];
  redeLogs = [];
  await page.goto("http://localhost:3000/ajustes", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const printAJ01 = await page.screenshot();
  salvarEvidencia("AJ-01", printAJ01, consoleLogs, redeLogs);
  console.log("   ✅ [AJ-01] Gravado!");

  // ==========================================
  // 9. AU-01: Auth & Tela de Login
  // ==========================================
  console.log("▶️ [AU-01] Testando Login & Auth...");
  consoleLogs = [];
  redeLogs = [];
  const contextAnonimo = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "pt-BR",
  });
  const pageAnonima = await contextAnonimo.newPage();
  await pageAnonima.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await pageAnonima.waitForTimeout(1000);
  const printAU01 = await pageAnonima.screenshot();
  salvarEvidencia("AU-01", printAU01, consoleLogs, redeLogs);
  await contextAnonimo.close();
  console.log("   ✅ [AU-01] Gravado!");

  // ==========================================
  // 10. OF-01: Offline & Service Worker
  // ==========================================
  console.log("▶️ [OF-01] Testando Registro Offline e Service Worker...");
  consoleLogs = [];
  redeLogs = [];
  const swRegistrado = await page.evaluate(async () => {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg);
    }
    return false;
  });
  consoleLogs.push(`[INFO] Service Worker presente: ${swRegistrado}`);
  const printOF01 = await page.screenshot();
  salvarEvidencia("OF-01", printOF01, consoleLogs, redeLogs);
  console.log("   ✅ [OF-01] Gravado!");

  await browser.close();
  console.log("\n🎉 Todas as evidências salvas com sucesso em qa/evidencias/!");
}

run().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
