import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = "docs/screenshots/verificacao_timer_pos_treino";
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";
const PROJECT_REF = "tbkzcqfvafznxallyfqk";

async function obterSessaoTeste() {
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: "qa_player_tester@lastro.app",
        password: "PlaywrightTester_2026!",
      });

      if (!authError && authData?.session) {
        return { supabaseClient, authData };
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("Falha ao autenticar após 3 tentativas");
}

async function run() {
  console.log("🚀 Iniciando verificação do Timer e Botões...");

  const { supabaseClient, authData } = await obterSessaoTeste();

  const { data: treinos } = await supabaseClient
    .from("treino")
    .select("id")
    .eq("usuario_id", authData.user.id)
    .order("data", { ascending: false })
    .limit(1);

  const treinoId = treinos?.[0]?.id;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "pt-BR",
  });

  const sessionCookieStr = `base64-${Buffer.from(JSON.stringify(authData.session)).toString("base64")}`;
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

  await page.goto(`http://localhost:3000/treino/${treinoId}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // 1. Timer no topo
  const btnDisparar = await page.$(".timer-topo-botao-disparar");
  if (btnDisparar) {
    await btnDisparar.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_timer_topo_ativo.png") });
    console.log("📸 Salvo: 01_timer_topo_ativo.png");
  }

  // 2. Botões lado a lado no formato pílula e botão finalizar vermelho
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_botoes_acao_divididos.png") });
  console.log("📸 Salvo: 02_botoes_acao_divididos.png");

  console.log("🏁 Verificação finalizada com sucesso!");
  await browser.close();
}

run().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
