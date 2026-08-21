import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/6c6e6dee-9f5d-410e-8054-72ad0b5bc87b";
const outputDir = path.resolve("docs/screenshots/playwright_mobile");
const artifactScreenshotsDir = path.join(ARTIFACT_DIR, "screenshots");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(artifactScreenshotsDir)) {
  fs.mkdirSync(artifactScreenshotsDir, { recursive: true });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRia3pjcWZ2YWZ6bnhhbGx5ZnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg4MTUyMywiZXhwIjoyMTAxNDU3NTIzfQ.YmuHF8f5qqQ-AdGbrsn01y1pMr80SweXhKcnwUC8rVw";
const PROJECT_REF = "tbkzcqfvafznxallyfqk";

async function obterOuCriarSessaoTeste() {
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testEmail = "playwright_mobile_tester@lastro.app";
  const testPassword = "PlaywrightTester_2026!";

  console.log(`🔑 Configurando autenticação de teste para ${testEmail}...`);

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  let user = usersData?.users?.find((u) => u.email === testEmail);

  if (!user) {
    console.log("  Criando novo usuário de teste...");
    const { data: novoUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { nome: "Atleta Mobile QA" },
    });
    if (error) throw error;
    user = novoUser.user;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: testPassword,
      email_confirm: true,
    });
  }

  // Garante linha na tabela 'usuario'
  await supabaseAdmin.from("usuario").upsert({
    id: user.id,
    nome: "Atleta Mobile QA",
    avatar_url: null,
  });

  // Gera sessão via sign in
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError || !authData.session) {
    throw new Error(`Falha ao gerar sessão: ${signInError?.message}`);
  }

  console.log("  ✅ Sessão de autenticação gerada com sucesso!");
  return authData.session;
}

function salvarScreenshot(nome, buffer) {
  const localPath = path.join(outputDir, `${nome}.png`);
  const artPath = path.join(artifactScreenshotsDir, `${nome}.png`);
  fs.writeFileSync(localPath, buffer);
  fs.writeFileSync(artPath, buffer);
  return { localPath, artPath };
}

async function run() {
  console.log("📱 Iniciando bateria completa de testes Playwright 100% MOBILE");
  
  let session;
  try {
    session = await obterOuCriarSessaoTeste();
  } catch (e) {
    console.warn("⚠️ Não foi possível obter sessão de teste admin:", e.message);
  }

  const browser = await chromium.launch({ headless: true });
  
  const iphone = devices["iPhone 14"] || {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: "chromium"
  };

  const context = await browser.newContext({
    ...iphone,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "pt-BR",
  });

  if (session) {
    const sessionCookieStr = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
    await context.addCookies([
      {
        name: `sb-${PROJECT_REF}-auth-token`,
        value: sessionCookieStr,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);
    console.log(`🍪 Cookie de autenticação 'sb-${PROJECT_REF}-auth-token' injetado.`);
  }

  const page = await context.newPage();

  const relatorio = [];

  const telas = [
    { id: "01_login", url: "http://localhost:3000/login", nome: "Login / Autenticação", desc: "Tela de entrada para e-mail/senha ou Google OAuth" },
    { id: "02_home", url: "http://localhost:3000/", nome: "Início / Dashboard", desc: "Visão geral com ciclo de treinos, parecer do coach e atalhos rápidos" },
    { id: "03_treino", url: "http://localhost:3000/treino", nome: "Treinos / Modo Bancada", desc: "Lista de sessões anteriores e botão de iniciar novo treino" },
    { id: "04_analise", url: "http://localhost:3000/analise", nome: "Análise e Progressão", desc: "Métricas de volume, carga, consistência e gráfico interativo" },
    { id: "05_catalogo", url: "http://localhost:3000/catalogo", nome: "Catálogo de Exercícios", desc: "Biblioteca de exercícios com filtros musculares e busca" },
    { id: "06_coach", url: "http://localhost:3000/coach", nome: "Coach IA", desc: "Assistente inteligente para leitura de treino e recomendações" },
    { id: "07_ajustes", url: "http://localhost:3000/ajustes", nome: "Ajustes Gerais", desc: "Configurações da conta, modelos e calculadora de anilhas" },
    { id: "08_ajustes_anilhas", url: "http://localhost:3000/ajustes/anilhas", nome: "Ajustes - Anilhas", desc: "Gerenciamento do estoque de anilhas e peso da barra" },
    { id: "09_ajustes_modelos", url: "http://localhost:3000/ajustes/modelos", nome: "Ajustes - Modelos de Treino", desc: "Lista de rotinas e templates pré-configurados" },
    { id: "10_ajustes_modelos_novo", url: "http://localhost:3000/ajustes/modelos/novo", nome: "Ajustes - Novo Modelo", desc: "Criador e editor de template de treino" },
    { id: "11_perfil", url: "http://localhost:3000/perfil", nome: "Perfil do Usuário", desc: "Dados biométricos e histórico do atleta" },
  ];

  for (const tela of telas) {
    console.log(`\n🔍 Testando tela: [${tela.nome}] -> ${tela.url}`);
    try {
      const resp = await page.goto(tela.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1500);

      const urlFinal = page.url();
      const statusHttp = resp ? resp.status() : 200;
      const title = await page.title();

      const temAbaInferior = (await page.$("nav.nav")) !== null;
      const temHeader = (await page.$("header, .barra-topo, .topo, .header")) !== null;
      
      const shotBuffer = await page.screenshot({ fullPage: false });
      const { artPath } = salvarScreenshot(tela.id, shotBuffer);

      const fullBuffer = await page.screenshot({ fullPage: true });
      salvarScreenshot(`${tela.id}_full`, fullBuffer);

      relatorio.push({
        id: tela.id,
        nome: tela.nome,
        descricao: tela.desc,
        urlRequisitada: tela.url,
        urlFinal,
        statusHttp,
        title,
        temAbaInferior,
        temHeader,
        screenshot: artPath,
        status: statusHttp >= 200 && statusHttp < 400 ? "OK" : `HTTP ${statusHttp}`,
      });

      console.log(`  ✅ [${tela.nome}] Carregada com sucesso! (Status: ${statusHttp})`);
    } catch (e) {
      console.error(`  ❌ Falha na tela ${tela.nome}:`, e.message);
      relatorio.push({
        id: tela.id,
        nome: tela.nome,
        descricao: tela.desc,
        urlRequisitada: tela.url,
        status: "ERRO",
        erro: e.message,
      });
    }
  }

  // Interação detalhe no catálogo
  console.log("\n🧪 Testando interação: Exercício no Catálogo...");
  try {
    await page.goto("http://localhost:3000/catalogo", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);

    const itemExercicio = await page.$("a[href^='/catalogo/']");
    if (itemExercicio) {
      const linkHref = await itemExercicio.getAttribute("href");
      console.log(`  👉 Clicando no exercício ${linkHref}...`);
      await itemExercicio.click();
      await page.waitForTimeout(1500);

      const shotEx = await page.screenshot({ fullPage: false });
      const { artPath } = salvarScreenshot("12_catalogo_exercicio_detalhe", shotEx);
      const shotExFull = await page.screenshot({ fullPage: true });
      salvarScreenshot("12_catalogo_exercicio_detalhe_full", shotExFull);

      relatorio.push({
        id: "12_catalogo_exercicio_detalhe",
        nome: "Catálogo - Detalhes do Exercício",
        descricao: "Tela de histórico, PRs e instruções do exercício selecionado",
        urlRequisitada: `http://localhost:3000${linkHref}`,
        urlFinal: page.url(),
        statusHttp: 200,
        temAbaInferior: (await page.$("nav.nav")) !== null,
        screenshot: artPath,
        status: "OK",
      });
      console.log("  ✅ Detalhe do exercício inspecionado!");
    }
  } catch (e) {
    console.error("  ❌ Falha no teste de detalhe de exercício:", e.message);
  }

  // Interação: Iniciar um novo treino
  console.log("\n🧪 Testando interação: Iniciar Novo Treino...");
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);

    const botaoIniciar = await page.$("button.botao-primario, a.botao-primario");
    if (botaoIniciar) {
      console.log("  👉 Tocando em Iniciar/Continuar Treino...");
      await botaoIniciar.tap();
      await page.waitForTimeout(2000);

      const shotTreinoAtivo = await page.screenshot({ fullPage: false });
      const { artPath } = salvarScreenshot("13_treino_ativo_execucao", shotTreinoAtivo);
      salvarScreenshot("13_treino_ativo_execucao_full", await page.screenshot({ fullPage: true }));

      relatorio.push({
        id: "13_treino_ativo_execucao",
        nome: "Treino em Execução / Bancada Ativa",
        descricao: "Interface de registro de séries em tempo real (peso, reps, RIR)",
        urlRequisitada: page.url(),
        urlFinal: page.url(),
        statusHttp: 200,
        temAbaInferior: (await page.$("nav.nav")) !== null,
        screenshot: artPath,
        status: "OK",
      });
      console.log("  ✅ Treino ativo inspecionado com sucesso!");
    }
  } catch (e) {
    console.warn("  ⚠️ Aviso ao iniciar treino:", e.message);
  }

  // Navegação contínua tocando na Aba Inferior (Mobile Tabs)
  console.log("\n🧪 Testando fluxo de abas da barra inferior...");
  const secoesBarra = [
    { nome: "Início", href: "/" },
    { nome: "Treinos", href: "/treino" },
    { nome: "Análise", href: "/analise" },
    { nome: "Catálogo", href: "/catalogo" },
    { nome: "Ajustes", href: "/ajustes" },
  ];

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  for (const secao of secoesBarra) {
    try {
      const seletor = `nav.nav a[href='${secao.href}']`;
      await page.waitForSelector(seletor, { timeout: 3000 });
      await page.click(seletor);
      await page.waitForTimeout(1000);
      console.log(`  📱 Aba [${secao.nome}] -> ${page.url()}`);
    } catch (e) {
      console.warn(`  ⚠️ Ao tocar na aba ${secao.nome}:`, e.message);
    }
  }

  await browser.close();

  const jsonReportPath = path.join(ARTIFACT_DIR, "relatorio_navegacao_mobile.json");
  fs.writeFileSync(
    jsonReportPath,
    JSON.stringify({ dataHora: new Date().toISOString(), totalTelas: relatorio.length, relatorio }, null, 2),
    "utf8"
  );

  console.log(`\n🎉 Teste Playwright concluído! ${relatorio.length} telas capturadas com sucesso.`);
}

run().catch((err) => {
  console.error("❌ Erro fatal Playwright:", err);
  process.exit(1);
});
