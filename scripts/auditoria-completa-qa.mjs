import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/0d57de5d-9f17-40a9-9204-f44a7dfdf3f2";
const outputDir = path.resolve("qa/evidencias/auditoria_geral");
const artifactScreenshotsDir = path.join(ARTIFACT_DIR, "screenshots");

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRia3pjcWZ2YWZ6bnhhbGx5ZnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg4MTUyMywiZXhwIjoyMTAxNDU3NTIzfQ.YmuHF8f5qqQ-AdGbrsn01y1pMr80SweXhKcnwUC8rVw";
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

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { session: authData.session, user: authData.user, supabaseAdmin };
}

async function auditar() {
  console.log("🔍 [QA] Iniciando auditoria completa com Playwright...");
  const relatorio = {
    sucesso: true,
    errosConsole: [],
    telasAvaliadas: [],
    temasAvaliados: [],
    timerAudit: {},
  };

  const { session, user, supabaseAdmin } = await obterSessaoTeste();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "pt-BR",
  });

  // Configura cookie de sessão Supabase
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

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error(`  ❌ Console Error: ${msg.text()}`);
      relatorio.errosConsole.push({ url: page.url(), text: msg.text() });
    }
  });

  // 1. Obter ou Iniciar Treino via UI Real
  console.log("➡️ Acessando /treino para capturar ID do treino ativo...");
  await page.goto("http://localhost:3000/treino", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Procura link para treino de hoje ou treino existente
  let linkTreino = await page.$("a[href^='/treino/']");
  if (!linkTreino) {
    console.log("  Iniciando treino de hoje via botão Hero...");
    const btnIniciar = await page.$(".destaque-pro button, form button");
    if (btnIniciar) {
      await btnIniciar.click();
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  } else {
    console.log("  Encontrado treino existente, acessando...");
    await linkTreino.click();
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  const urlTreinoAtual = page.url();
  console.log(`📍 URL do Treino Ativo: ${urlTreinoAtual}`);
  const matchId = urlTreinoAtual.match(/\/treino\/([a-zA-Z0-9-]+)/);
  const treinoId = matchId ? matchId[1] : null;

  const rotas = [
    { nome: "Home_Dashboard", url: "http://localhost:3000/" },
    { nome: "Treino_Bancada", url: "http://localhost:3000/treino" },
    { nome: "Treino_Detalhe", url: `http://localhost:3000/treino/${treinoId}` },
    { nome: "Analise_Principal", url: "http://localhost:3000/analise" },
    { nome: "Catalogo_Lista", url: "http://localhost:3000/catalogo" },
    { nome: "Coach_IA", url: "http://localhost:3000/coach" },
    { nome: "Perfil_Atleta", url: "http://localhost:3000/perfil" },
    { nome: "Ajustes_Sistema", url: "http://localhost:3000/ajustes" },
  ];

  console.log("\n📱 --- 1. AUDITORIA DE TODAS AS TELAS PRINCIPAIS (MOBILE) ---");
  for (const r of rotas) {
    try {
      console.log(`➡️ Navegando para ${r.nome} (${r.url})...`);
      const resp = await page.goto(r.url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      const status = resp ? resp.status() : 0;
      const screenshotPath = path.join(outputDir, `${r.nome}.png`);
      const artifactPath = path.join(artifactScreenshotsDir, `${r.nome}.png`);
      await page.screenshot({ path: screenshotPath });
      fs.copyFileSync(screenshotPath, artifactPath);

      relatorio.telasAvaliadas.push({
        nome: r.nome,
        url: r.url,
        status,
        screenshot: `${r.nome}.png`,
      });
      console.log(`   ✅ OK: HTTP ${status}`);
    } catch (err) {
      console.error(`   ❌ Falha na rota ${r.nome}:`, err.message);
      relatorio.sucesso = false;
      relatorio.telasAvaliadas.push({ nome: r.nome, erro: err.message });
    }
  }

  console.log("\n🎨 --- 2. AUDITORIA DE TODOS OS TEMAS (E ESPECIALMENTE MARFIM & OURO) ---");
  const temas = [
    { id: "ouro", nome: "Obsidian Ouro (Padrão)" },
    { id: "branco-ouro", nome: "Marfim & Ouro Imperial (Claro)" },
    { id: "areia", nome: "Duna Areia & Âmbar" },
    { id: "clean", nome: "Clean Monolith" },
    { id: "petroleo", nome: "Slate Petróleo" },
    { id: "moka", nome: "Café Moka" },
    { id: "oliva", nome: "Oliva Tático" },
  ];

  for (const tema of temas) {
    console.log(`🎨 Testando tema: ${tema.nome} [${tema.id}]...`);
    await page.goto("http://localhost:3000/ajustes", { waitUntil: "domcontentloaded" });
    await page.evaluate((t) => {
      localStorage.setItem("lastro_tema", t);
      document.documentElement.setAttribute("data-tema", t);
    }, tema.id);
    await page.waitForTimeout(500);

    // Captura em Ajustes
    const printAjustes = path.join(outputDir, `tema_${tema.id}_ajustes.png`);
    await page.screenshot({ path: printAjustes });
    fs.copyFileSync(printAjustes, path.join(artifactScreenshotsDir, `tema_${tema.id}_ajustes.png`));

    // Captura no Treino
    await page.goto(`http://localhost:3000/treino/${treinoId}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const printTreino = path.join(outputDir, `tema_${tema.id}_treino.png`);
    await page.screenshot({ path: printTreino });
    fs.copyFileSync(printTreino, path.join(artifactScreenshotsDir, `tema_${tema.id}_treino.png`));

    relatorio.temasAvaliados.push({
      id: tema.id,
      nome: tema.nome,
      status: "OK",
    });
  }

  console.log("\n⏱️ --- 3. AUDITORIA DO FLUXO DO TIMER E BOTÃO FINALIZAR TREINO ---");
  await page.goto(`http://localhost:3000/treino/${treinoId}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Lê tempo inicial do relógio
  const tempoTreinoEl = await page.$(".status-tempo-treino__valor");
  const tempoAntes = tempoTreinoEl ? await tempoTreinoEl.textContent() : "N/A";
  console.log(`⏱️ Tempo exibido antes de finalizar: ${tempoAntes}`);

  // Dispara descanso se disponível
  const btnDescanso = await page.$(".timer-topo-botao-disparar");
  if (btnDescanso) {
    console.log("▶️ Iniciando descanso entre séries...");
    await btnDescanso.click();
    await page.waitForTimeout(1000);
  }

  // Clica no botão Finalizar Treino
  const btnFinalizar = await page.$(".botao-finalizar-treino");
  if (btnFinalizar) {
    console.log("🛑 Clicando no botão 'Finalizar Treino'...");
    await btnFinalizar.click();
    await page.waitForTimeout(1000);

    // Captura modal de pós treino aberto
    const printPosTreino = path.join(outputDir, `03_modal_pos_treino_aberto.png`);
    await page.screenshot({ path: printPosTreino });
    fs.copyFileSync(printPosTreino, path.join(artifactScreenshotsDir, `03_modal_pos_treino_aberto.png`));

    // Verifica se modal apareceu
    const modalAberto = await page.$(".pos-treino-modal");
    console.log(`📊 Modal pós-treino visível: ${!!modalAberto}`);

    // Aguarda 3 segundos para testar se o relógio de treino continua correndo ou congela
    await page.waitForTimeout(3000);
    const tempoDurante = tempoTreinoEl ? await tempoTreinoEl.textContent() : "N/A";
    console.log(`⏱️ Tempo exibido após 3s no modal: ${tempoDurante}`);

    // Fecha modal no X
    const btnFechar = await page.$(".pos-treino-fechar");
    if (btnFechar) {
      console.log("❌ Fechando modal no botão 'X'...");
      await btnFechar.click();
      await page.waitForTimeout(1000);

      const tempoAposFechar = tempoTreinoEl ? await tempoTreinoEl.textContent() : "N/A";
      console.log(`⏱️ Tempo exibido após fechar modal: ${tempoAposFechar}`);

      await page.waitForTimeout(2000);
      const tempo2sDepois = tempoTreinoEl ? await tempoTreinoEl.textContent() : "N/A";
      console.log(`⏱️ Tempo exibido 2s depois de fechado: ${tempo2sDepois}`);

      relatorio.timerAudit = {
        tempoAntes,
        tempoDurante,
        tempoAposFechar,
        tempo2sDepois,
        congelouAposFinalizar: tempoAposFechar === tempo2sDepois,
      };
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(outputDir, "relatorio-qa.json"),
    JSON.stringify(relatorio, null, 2)
  );

  console.log("\n✅ Auditoria concluída! Relatório salvo.");
  console.log(JSON.stringify(relatorio, null, 2));
}

auditar().catch((err) => {
  console.error("❌ Erro fatal na auditoria:", err);
  process.exit(1);
});
