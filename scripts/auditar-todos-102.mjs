import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/8bd20678-f0c8-4d79-ab2b-2b2a166af8f6";
const outputDir = path.resolve("docs/screenshots/auditoria_102_exercicios");
const artifactScreenshotsDir = path.join(ARTIFACT_DIR, "auditoria_102");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(artifactScreenshotsDir)) fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";

async function obterSessaoTeste() {
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
    email: "qa_player_tester@lastro.app",
    password: "PlaywrightTester_2026!",
  });

  if (authError || !authData.session) {
    throw new Error(`Falha ao obter sessão do usuário de teste: ${authError?.message}`);
  }

  return { session: authData.session, supabase: supabaseClient };
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

async function auditarTodos() {
  console.log("🚀 Iniciando auditoria Playwright de TODOS os 102 exercícios do catálogo...");

  const { session, supabase } = await obterSessaoTeste();

  const { data: exercicios, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral, peso_por_lado, dica_execucao, grupo_muscular(nome)")
    .order("nome");

  if (error || !exercicios) {
    throw new Error(`Erro ao listar exercícios: ${error?.message}`);
  }

  console.log(`Total de exercícios para auditar: ${exercicios.length}`);

  // Iniciar servidor local Next.js na porta 3094
  const PORT = 3094;
  console.log(`🌐 Iniciando servidor Next.js na porta ${PORT}...`);
  const devServer = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    shell: true,
  });

  devServer.stdout.on("data", (d) => process.stdout.write(d));
  devServer.stderr.on("data", (d) => process.stderr.write(d));

  try {
    await esperarServidor(`http://localhost:${PORT}`);
    console.log(`✅ Servidor pronto em http://localhost:${PORT}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    });

    const projectRef = "tbkzcqfvafznxallyfqk";
    const storageKey = `sb-${projectRef}-auth-token`;
    const tokenPayload = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: session.user,
      expires_at: session.expires_at,
    });

    await context.addInitScript(
      ({ key, value }) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {}
      },
      { key: storageKey, value: tokenPayload }
    );

    const page = await context.newPage();
    const manifestMidia = JSON.parse(fs.readFileSync("src/lib/dados/exercicios-midia.json", "utf8"));
    const mapMidia = new Map(manifestMidia.map((m) => [m.id, m]));

    const relatorioAuditoria = [];

    for (let i = 0; i < exercicios.length; i++) {
      const ex = exercicios[i];
      const grupoNome = Array.isArray(ex.grupo_muscular) ? ex.grupo_muscular[0]?.nome : ex.grupo_muscular?.nome;
      const midia = mapMidia.get(ex.id);

      console.log(`[${i + 1}/${exercicios.length}] Auditando: "${ex.nome}" (${grupoNome})...`);

      await page.goto(`http://localhost:${PORT}/catalogo/${ex.id}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      const numStr = String(i + 1).padStart(3, "0");
      const slug = ex.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      const filename = `${numStr}_${slug}.png`;
      const screenshotPath = path.join(outputDir, filename);

      await page.screenshot({ path: screenshotPath });
      try {
        fs.copyFileSync(screenshotPath, path.join(artifactScreenshotsDir, filename));
      } catch {}

      relatorioAuditoria.push({
        indice: i + 1,
        id: ex.id,
        nomePt: ex.nome,
        grupo: grupoNome,
        nomeEnDataset: midia?.nomeEn || "---",
        arquivoOrigem: midia?.arquivoOrigem || "---",
        videoUrl: midia?.videoUrl || "---",
        screenshot: filename,
      });
    }

    fs.writeFileSync("scripts/auditoria-102-resultado.json", JSON.stringify(relatorioAuditoria, null, 2), "utf8");
    console.log("🎉 Auditoria concluída! Relatório salvo em scripts/auditoria-102-resultado.json e screenshots em docs/screenshots/auditoria_102_exercicios");

    await browser.close();
  } finally {
    devServer.kill("SIGTERM");
  }
}

auditarTodos().catch(console.error);
