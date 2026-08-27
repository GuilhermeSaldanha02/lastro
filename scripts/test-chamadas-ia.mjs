import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const SUPABASE_URL = "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";

async function testarApiCoachEAnalise() {
  console.log("🤖 Testando chamadas às rotas de IA /api/coach e /api/analise...");

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: "qa_player_tester@lastro.app",
    password: "PlaywrightTester_2026!",
  });

  if (signInError || !authData.session) {
    throw new Error(`Falha no login: ${signInError?.message}`);
  }

  const token = authData.session.access_token;
  const projectRef = "tbkzcqfvafznxallyfqk";
  const cookieStr = `sb-${projectRef}-auth-token=base64-${Buffer.from(JSON.stringify(authData.session)).toString("base64")}`;

  // 1. Testando /api/coach
  console.log("\n1️⃣ Disparando POST para http://localhost:3000/api/coach...");
  try {
    const resCoach = await fetch("http://localhost:3000/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStr,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pergunta: "Qual a importância do descanso entre as séries de hipertrofia?" }),
    });

    console.log(`  HTTP Status Coach: ${resCoach.status}`);
    const bodyCoach = await resCoach.text();
    console.log(`  Resposta Coach: ${bodyCoach.slice(0, 300)}...`);
  } catch (err) {
    console.error("  ❌ Erro ao chamar /api/coach:", err.message);
  }

  // 2. Testando /api/analise
  console.log("\n2️⃣ Disparando POST para http://localhost:3000/api/analise...");
  try {
    const resAnalise = await fetch("http://localhost:3000/api/analise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStr,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pergunta: 1 }),
    });

    console.log(`  HTTP Status Análise: ${resAnalise.status}`);
    const bodyAnalise = await resAnalise.text();
    console.log(`  Resposta Análise: ${bodyAnalise.slice(0, 300)}...`);
  } catch (err) {
    console.error("  ❌ Erro ao chamar /api/analise:", err.message);
  }
}

testarApiCoachEAnalise();
