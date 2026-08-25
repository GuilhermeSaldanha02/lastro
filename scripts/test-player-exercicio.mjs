import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/8bd20678-f0c8-4d79-ab2b-2b2a166af8f6";
const outputDir = path.resolve("docs/screenshots/player_exercicio");
const artifactScreenshotsDir = path.join(ARTIFACT_DIR, "screenshots");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(artifactScreenshotsDir)) fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";
const PROJECT_REF = "tbkzcqfvafznxallyfqk";

async function obterSessaoTeste() {
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
    email: "qa_player_tester@lastro.app",
    password: "PlaywrightTester_2026!",
  });

  if (authError || !authData.session) {
    throw new Error(`Falha ao obter sessão do usuário de teste: ${authError?.message}`);
  }

  return authData.session;
}

async function esperarServidor(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout esperando servidor em ${url}`);
}

async function main() {
  console.log("🚀 Iniciando teste E2E com Playwright para o Player de Exercício...");

  // Iniciar servidor local na porta 3095
  console.log("🌐 Iniciando servidor Next.js na porta 3095...");
  const devServer = spawn("npx", ["next", "start", "-p", "3095"], {
    stdio: "pipe",
    shell: true,
  });

  devServer.stdout.on("data", (d) => process.stdout.write(d));
  devServer.stderr.on("data", (d) => process.stderr.write(d));

  try {
    await esperarServidor("http://localhost:3095");
    console.log("✅ Servidor pronto em http://localhost:3095");

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
    await page.goto("http://localhost:3095/catalogo", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const shotCatalogo = path.join(outputDir, "01_catalogo_lista.png");
    await page.screenshot({ path: shotCatalogo });
    fs.copyFileSync(shotCatalogo, path.join(artifactScreenshotsDir, "01_catalogo_lista.png"));
    console.log("📸 Screenshot salva: 01_catalogo_lista.png");

    // Testes de Cenas Anatômicas 3D de Diferentes Grupos Musculares:
    const exerciciosCenas = [
      { id: "963a1f70-4cb6-4117-b1a6-c1e4215debe9", nome: "Tríceps Testa com Barra", arquivo: "02_triceps_testa_barra.png" },
      { id: "05d30e37-7b2c-45f4-9e71-34abf1703ef3", nome: "Tríceps Pulley (Corda)", arquivo: "03_triceps_pulley_corda.png" },
      { id: "339a305e-4c52-4744-86c5-6b830b707032", nome: "Supino Reto com Barra", arquivo: "04_supino_reto_barra.png" },
      { id: "0f4d2b26-f2eb-4e16-b9e8-48d1d737590d", nome: "Puxada Frente no Pulley", arquivo: "05_puxada_frente_pulley.png" },
      { id: "1db2c316-4c25-4f71-b2f4-6c30ceb75259", nome: "Agachamento Livre", arquivo: "06_agachamento_livre.png" },
      { id: "ff8a4f89-15e6-4c97-85cc-90cd5c15d03f", nome: "Elevação Lateral com Halteres", arquivo: "07_elevacao_lateral.png" },
      { id: "39c48554-3192-4072-a877-f8259e737d29", nome: "Rosca Direta Bíceps", arquivo: "08_rosca_direta.png" },
      { id: "d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b", nome: "Abdominal Infra", arquivo: "09_abdominal_infra.png" },
    ];

    for (const ex of exerciciosCenas) {
      console.log(`📱 Acessando ${ex.nome}...`);
      await page.goto(`http://localhost:3095/catalogo/${ex.id}`, { waitUntil: "networkidle" });
      const playerCard = page.locator(".player-exercicio-card");
      await playerCard.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForTimeout(600);

      const shotPath = path.join(outputDir, ex.arquivo);
      await page.screenshot({ path: shotPath });
      fs.copyFileSync(shotPath, path.join(artifactScreenshotsDir, ex.arquivo));
      console.log(`📸 Screenshot salva: ${ex.arquivo}`);
    }

    console.log("🎉 Teste E2E do Playwright concluído com 100% de sucesso!");
    await browser.close();
  } catch (error) {
    console.error("❌ Erro no teste Playwright:", error);
    process.exitCode = 1;
  } finally {
    console.log("🛑 Encerrando servidor Next.js...");
    devServer.kill("SIGTERM");
  }
}

main().catch(console.error);
