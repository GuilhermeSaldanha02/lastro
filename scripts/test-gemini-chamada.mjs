import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : "";
console.log("Chave presente:", Boolean(apiKey), "Prefixo:", apiKey?.slice(0, 8));

const modelos = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
];

const ai = new GoogleGenAI({ apiKey });

async function testar() {
  for (const m of modelos) {
    try {
      console.log(`Testando modelo: ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: "Responda apenas: OK",
      });
      console.log(`  ✅ ${m} FUNCIONOU: ${res.text}`);
    } catch (e) {
      console.error(`  ❌ ${m} FALHOU: ${e.message}`);
    }
  }
}

testar();
