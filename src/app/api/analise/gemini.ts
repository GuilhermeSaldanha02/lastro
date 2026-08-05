// lastro · SDD.md §6.1 — o ÚNICO ponto do repo (junto com route.ts, mesma
// pasta) que importa @google/genai (FF1). A interface abaixo isola o SDK:
// se a assinatura mudar, muda só este arquivo.
//
// Modelo: gemini-3.6-flash (DECISIONS.md, entrada de 2026-08-05 — o valor
// anterior, gemini-2.5-flash, estava desatualizado no ADR e aposenta em
// 16/out/2026).
import { GoogleGenAI } from "@google/genai";

export interface ClienteParecer {
  gerar(sistema: string, usuario: string): Promise<string>;
}

const MODELO = "gemini-3.6-flash";

function envObrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} ausente — configure .env.local (ver .env.example).`,
    );
  }
  return valor;
}

/** Implementação real, sobre o SDK @google/genai. */
export class ClienteParecerGemini implements ClienteParecer {
  private readonly ai: GoogleGenAI;

  constructor() {
    const apiKey = envObrigatoria("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
    this.ai = new GoogleGenAI({ apiKey });
  }

  async gerar(sistema: string, usuario: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: MODELO,
      contents: usuario,
      config: {
        systemInstruction: sistema,
        temperature: 0.3,
      },
    });
    return response.text ?? "";
  }
}
