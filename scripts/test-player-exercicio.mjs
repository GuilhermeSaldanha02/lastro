import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/d20afdf2-f74e-45f6-bd30-1bf6dfc11d51";
const outputDir = path.resolve("docs/screenshots/player_exercicio");
const artifactScreenshotsDir = path.join(ARTIFACT_DIR, "screenshots");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(artifactScreenshotsDir)) fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRia3pjcWZ2YWZ6bnhhbGx5ZnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg4MTUyMywiZXhwIjoyMTAxNDU3NTIzfQ.YmuHF8f5qqQ-AdGbrsn01y1pMr80SweXhKcnwUC8rVw";
const PROJECT_REF = "tbkzcqfvafznxallyfqk";

async function obterSessaoTeste() {
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testEmail = "qa_player_tester@lastro.app";
  const testPassword = "PlaywrightTester_2026!";

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let { data: authData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginError) {
    // Tenta criar se falhar
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    let user = usersData?.users?.find((u) => u.email === testEmail);

    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: testPassword,
        email_confirm: true,
      });
    } else {
      const { data: novoUser } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { nome: "Atleta QA Player" },
      });
      user = novoUser?.user;
    }

    if (user) {
      await supabaseAdmin.from("usuario").upsert({
        id: user.id,
        nome: "Atleta QA Player",
        avatar_url: null,
      });
    }

    const { data: authData2, error: loginError2 } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError2) throw loginError2;
    authData = authData2;
  }

  return authData.session;
}

async function esperarServidor(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // espera
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout esperando servidor em ${url}`);
}

async function main() {
  console.log("🚀 Iniciando teste E2E com Playwright para o Player de Exercício...");

  // Iniciar servidor local na porta 3020
  console.log("🌐 Iniciando servidor Next.js na porta 3020...");
  const devServer = spawn("npx", ["next", "start", "-p", "3020"], {
    stdio: "pipe",
    shell: true,
  });

  devServer.stdout.on("data", (d) => process.stdout.write(d));
  devServer.stderr.on("data", (d) => process.stderr.write(d));

  try {
    await esperarServidor("http://localhost:3020");
    console.log("✅ Servidor pronto em http://localhost:3020");

    const session = await obterSessaoTeste();
    console.log("✅ Sessão de teste autenticada. Aguardando 5s para sincronia de relógio...");
    await new Promise((r) => setTimeout(r, 5000));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      locale: "pt-BR",
    });

    const sessionCookieStr = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
    const cookieChunkSize = 3000;
    const cookieChunks = [];
    for (let i = 0; i < sessionCookieStr.length; i += cookieChunkSize) {
      cookieChunks.push(sessionCookieStr.slice(i, i + cookieChunkSize));
    }

    const cookies = [
      {
        name: `sb-${PROJECT_REF}-auth-token`,
        value: cookieChunks.length === 1 ? sessionCookieStr : cookieChunks[0],
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ];

    if (cookieChunks.length > 1) {
      cookieChunks.slice(1).forEach((chunk, index) => {
        cookies.push({
          name: `sb-${PROJECT_REF}-auth-token.${index + 1}`,
          value: chunk,
          domain: "localhost",
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        });
      });
    }

    await context.addCookies(cookies);
    const page = await context.newPage();

    // 1. Acessar catálogo
    console.log("📱 Navegando para /catalogo...");
    await page.goto("http://localhost:3020/catalogo", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const shotCatalogo = path.join(outputDir, "01_catalogo_lista.png");
    await page.screenshot({ path: shotCatalogo });
    fs.copyFileSync(shotCatalogo, path.join(artifactScreenshotsDir, "01_catalogo_lista.png"));
    console.log("📸 Screenshot salva: 01_catalogo_lista.png");

    // 2. Acessar página de detalhes do exercício
    console.log("📱 Navegando para detalhes do exercício (Lower Ab Crunch)...");
    await page.goto("http://localhost:3020/catalogo/d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b", {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1000);

    // 3. Validar Player de Exercício - Modo Execução
    console.log("🔍 Validando Player de Exercício (Modo Execução)...");
    const playerCard = page.locator(".player-exercicio-card");
    await playerCard.waitFor({ state: "visible", timeout: 15000 });

    const shotExecucao = path.join(outputDir, "02_player_ver_execucao.png");
    await page.screenshot({ path: shotExecucao });
    fs.copyFileSync(shotExecucao, path.join(artifactScreenshotsDir, "02_player_ver_execucao.png"));
    console.log("📸 Screenshot salva: 02_player_ver_execucao.png");

    // 4. Alternar para Modo Aparelho / Posição
    console.log("👉 Clicando na aba 'Ver Aparelho / Posição'...");
    const btnAparelho = page.locator(".player-exercicio-card__tab").nth(1);
    await btnAparelho.click();
    await page.waitForTimeout(600);

    const shotAparelhoP1 = path.join(outputDir, "03_player_aparelho_posicao_1.png");
    await page.screenshot({ path: shotAparelhoP1 });
    fs.copyFileSync(shotAparelhoP1, path.join(artifactScreenshotsDir, "03_player_aparelho_posicao_1.png"));
    console.log("📸 Screenshot salva: 03_player_aparelho_posicao_1.png");

    // 5. Clicar no Ponto de Contração
    console.log("👉 Clicando no botão '2. Ponto de Contração'...");
    const btnContracao = page.locator(".player-exercicio-card__fase-btn").nth(1);
    await btnContracao.click();
    await page.waitForTimeout(600);

    const shotAparelhoP2 = path.join(outputDir, "04_player_aparelho_posicao_2.png");
    await page.screenshot({ path: shotAparelhoP2 });
    fs.copyFileSync(shotAparelhoP2, path.join(artifactScreenshotsDir, "04_player_aparelho_posicao_2.png"));
    console.log("📸 Screenshot salva: 04_player_aparelho_posicao_2.png");

    // 6. Voltar para Modo Execução
    console.log("👉 Retornando para 'Ver Execução'...");
    const btnExecucao = page.locator(".player-exercicio-card__tab").nth(0);
    await btnExecucao.click();
    await page.waitForTimeout(600);

    await browser.close();
    console.log("🎉 Teste E2E do Playwright concluído com 100% de sucesso!");
  } finally {
    devServer.kill();
  }
}

main().catch((err) => {
  console.error("❌ Erro no teste Playwright:", err);
  process.exit(1);
});
