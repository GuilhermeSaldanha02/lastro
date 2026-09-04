// lastro · SDD.md §6.1 — o ÚNICO ponto do repo (junto com route.ts, mesma
// pasta) que importa @google/genai (FF1). A interface abaixo isola o SDK:
// se a assinatura mudar, muda só este arquivo.
//
// Modelo: gemini-3.6-flash (DECISIONS.md, entrada de 2026-08-05 — o valor
// anterior, gemini-2.5-flash, estava desatualizado no ADR e aposenta em
// 16/out/2026).
import { GoogleGenAI } from "@google/genai";
import { comModeloAlternativo } from "./retry-transitorio";

export interface ClienteParecer {
  gerar(sistema: string, usuario: string): Promise<string>;
}

/**
 * Modelo principal. `DECISIONS.md` 2026-08-05 escolheu o `gemini-3.6-flash`
 * (o `2.5-flash` aposenta em 16/out/2026).
 */
const MODELO_PRIMARIO = "gemini-3.6-flash";

/**
 * Usado só quando o primário responde 503 duas vezes seguidas — ver
 * `comModeloAlternativo`. Escolhido em 2026-09-04 conferindo a lista
 * oficial de modelos, não de memória: mesma família, endpoint ESTÁVEL (não
 * é `-preview`, ao contrário do `gemini-3-flash-preview`) e sem a data de
 * aposentadoria que o `2.5-flash` já tem. Pool de capacidade próprio, que é
 * o ponto — a mensagem do Google no 503 é sobre "this model".
 *
 * Chutar nome de modelo aqui produziria exatamente os `404 NotFound` que
 * apareceram entre 27 e 29/ago e ninguém explicou.
 */
const MODELO_ALTERNATIVO = "gemini-3.5-flash";

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
    // Repetição em falha TRANSITÓRIA (503 e cia.) e, se persistir, troca de
    // modelo. Nunca em 429/404 — ver `retry-transitorio.ts` para a medição
    // que motivou cada regra. Sem isso, um 503 perdia o parecer inteiro e
    // ainda queimava a trava de 10 minutos (SDD §11.2).
    const response = await comModeloAlternativo(
      (modelo) =>
        this.ai.models.generateContent({
          model: modelo,
          contents: usuario,
          config: {
            systemInstruction: sistema,
            temperature: 0.3,
          },
        }),
      { primario: MODELO_PRIMARIO, alternativo: MODELO_ALTERNATIVO },
      {
        // Fica no log porque muda a procedência do parecer: dois pareceres
        // do mesmo dono podem ter vindo de modelos diferentes.
        aoTrocar: (alternativo) =>
          console.warn(
            `[analise] ${MODELO_PRIMARIO} indisponível; tentando ${alternativo}`,
          ),
      },
    );
    return response.text ?? "";
  }
}
