// lastro · AN-08 A1 — o check-in NUNCA vai para a IA.
//
// A Política de Privacidade diz que, no plano gratuito da Gemini, o Google pode
// usar o conteúdo enviado e revisores humanos podem lê-lo. Sono, dor muscular e
// estresse são dado sensível (LGPD art. 5º, II) e a Política só os cobre porque
// eles ficam no lastro. Este teste é a trava mecânica dessa promessa: nenhum
// arquivo que monta o resumo, o prompt ou a rota da IA pode mencionar o
// check-in.
//
// O roteador local do Coach (`src/lib/coach`) NÃO está na lista de propósito: ele
// responde por cálculo, sem IA, e é onde o check-in poderá entrar numa segunda
// fase. Quando entrar, a regra continua: o que ele devolve nunca vai para um
// prompt (a rota decide, e a rota está na lista).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = process.cwd();

// Quem monta o que vai para a Gemini.
const PASTAS_DA_IA = ["src/app/api/analise", "src/app/api/coach", "src/lib/analise"];

function arquivosDe(pasta: string): string[] {
  const achados: string[] = [];
  for (const nome of readdirSync(join(RAIZ, pasta))) {
    const caminho = join(pasta, nome);
    if (statSync(join(RAIZ, caminho)).isDirectory()) {
      achados.push(...arquivosDe(caminho));
    } else if (/\.(ts|tsx)$/.test(nome) && !/\.test\.(ts|tsx)$/.test(nome)) {
      achados.push(caminho);
    }
  }
  return achados;
}

describe("o check-in não entra no que vai para a IA", () => {
  const arquivos = PASTAS_DA_IA.flatMap(arquivosDe);

  it("encontrou os arquivos da IA (a trava não pode passar por pasta vazia)", () => {
    expect(arquivos.length).toBeGreaterThan(10);
  });

  it("nenhum deles menciona check-in", () => {
    const culpados = arquivos.filter((a) => /check-?in/i.test(readFileSync(join(RAIZ, a), "utf8")));
    expect(culpados, "arquivo da IA falando de check-in: o dado sensível vazaria para a Gemini").toEqual([]);
  });
});
