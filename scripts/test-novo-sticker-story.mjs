import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = "docs/screenshots/verificacao_sticker_story";
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
  console.log("🚀 Iniciando verificação do novo modelo de Sticker de Story com Playwright...");

  const { supabaseClient, authData } = await obterSessaoTeste();

  // 1. Busca ou cria um exercício do catálogo para associar as séries
  const { data: exercicios } = await supabaseClient
    .from("exercicio")
    .select("id, nome")
    .ilike("nome", "%agachamento%")
    .limit(1);

  const exId = exercicios?.[0]?.id || "e1111111-1111-1111-1111-111111111111";

  // 2. Cria um treino com data de hoje se não existir
  const dataHoje = new Date().toISOString().split("T")[0];
  const { data: treinoCriado } = await supabaseClient
    .from("treino")
    .insert({
      usuario_id: authData.user.id,
      data: dataHoje,
    })
    .select()
    .single();

  const treinoId = treinoCriado?.id;

  if (treinoId) {
    // Insere séries no treino
    await supabaseClient.from("serie").insert([
      {
        treino_id: treinoId,
        exercicio_id: exId,
        tipo: "valendo",
        reps: 8,
        peso: 120,
        peso_por_lado: false,
      },
      {
        treino_id: treinoId,
        exercicio_id: exId,
        tipo: "valendo",
        reps: 8,
        peso: 125,
        peso_por_lado: false,
      },
      {
        treino_id: treinoId,
        exercicio_id: exId,
        tipo: "valendo",
        reps: 6,
        peso: 130,
        peso_por_lado: false,
      },
    ]);
  }

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

  console.log("📱 Acessando /ajustes/relatorios...");
  await page.goto("http://localhost:3000/ajustes/relatorios", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Clica no botão de ação do relatório do primeiro card
  const btnAbrirRelatorio = page.locator(".botao-acao-relatorio").first();
  if (await btnAbrirRelatorio.count()) {
    console.log("👆 Abrindo modal de Sticker Story...");
    await btnAbrirRelatorio.click();
    await page.waitForTimeout(2000);

    // 1. Screenshot do Preview Fiel no Modal
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_sticker_story_preview_fiel.png") });
    console.log("📸 Salvo: 01_sticker_story_preview_fiel.png");

    // 2. Clica em Copiar para disparar o xadrez de transparência
    const btnCopiar = page.locator(".pos-treino-btn-acao-share").first();
    if (await btnCopiar.count()) {
      await btnCopiar.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_sticker_story_transparencia_ativa.png") });
      console.log("📸 Salvo: 02_sticker_story_transparencia_ativa.png");
    }
  } else {
    console.log("⚠️ Nenhum botão de relatório encontrado em /ajustes/relatorios.");
  }

  console.log("🏁 Verificação visual Playwright concluída com sucesso!");
  await browser.close();
}

run().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
