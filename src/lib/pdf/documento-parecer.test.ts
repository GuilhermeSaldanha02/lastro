// lastro · o PDF era o único renderizador do projeto sem teste nenhum, e
// foi por isso que a correção da PR #177 (2026-09-02, "veredito gigante
// quando a IA falha") foi aplicada na tela e passou reto aqui: o mesmo
// `separarVeredito` sem guarda, num arquivo que ninguém conseguia olhar
// sem sessão autenticada. Este teste fecha essa porta.
//
// Não renderiza PDF de verdade — chama o componente como função e olha a
// árvore de elementos que ele devolve. É o suficiente para a invariante
// que interessa: existe (ou não) um nó de texto com o veredito.
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import DocumentoParecer from "./documento-parecer";
import { separarVeredito } from "@/lib/texto/separar-veredito";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";

const EVIDENCIA = {
  periodo: { janela_semanas: 4, semana_atual_fim: "2026-08-30", semana_atual_inicio: "2026-08-24" },
  blocos: [
    {
      sinal: "alta",
      volume: 4080,
      delta_pct: 66.7,
      exercicio: "Tríceps pulley (corda)",
      grupo_muscular: "Tríceps",
      series_valendo: 8,
      peso_referencia: 55,
      reps_referencia: 12,
    },
  ],
} as unknown as EvidenciaParaTela;

/** Resumo determinístico: a 1ª frase só fecha depois de várias linhas. */
const TEXTO_FALLBACK = [
  "Semana de 2026-08-24 — 4 de 4 semanas da janela com dados.",
  "Volume total em 2026-08-24: 60751.",
  "Costas: 23 séries valendo, volume 15685 — acima da faixa de referência.",
].join("\n");

/** Prosa real: abre com uma frase curta de julgamento, como o prompt pede. */
const TEXTO_PROSA =
  "Seu tríceps carregou a semana. Puxada e tríceps subiram junto, enquanto Leg press não saiu do lugar.";

function parecer(sobrescreve: Partial<ParecerSalvo> = {}): ParecerSalvo {
  return {
    id: "teste",
    pergunta: 5,
    perguntaTexto: "O que mudar na próxima semana?",
    texto: TEXTO_PROSA,
    avisoFalhaInterpretativa: false,
    evidencia: EVIDENCIA,
    idioma: "pt-BR",
    criadoEm: "2026-09-02T14:36:38.477Z",
    status: "pronto",
    confirmado: true,
    ...sobrescreve,
  };
}

/** Todo texto literal na árvore devolvida pelo componente. */
function textos(no: unknown, saida: string[] = []): string[] {
  if (typeof no === "string") {
    saida.push(no);
  } else if (Array.isArray(no)) {
    for (const filho of no) textos(filho, saida);
  } else if (no && typeof no === "object" && "props" in no) {
    textos((no as ReactElement<{ children?: unknown }>).props?.children, saida);
  }
  return saida;
}

describe("DocumentoParecer", () => {
  it("destaca a primeira frase como veredito quando a prosa é real", () => {
    const { veredito } = separarVeredito(TEXTO_PROSA);
    expect(veredito).not.toBe("");

    const encontrados = textos(DocumentoParecer({ parecer: parecer() }));
    expect(encontrados).toContain(veredito);
  });

  it("NÃO extrai veredito do resumo determinístico — o texto inteiro é corpo", () => {
    const { veredito } = separarVeredito(TEXTO_FALLBACK);
    // Sem a guarda, este seria o "veredito": um bloco inteiro em negrito.
    expect(veredito).not.toBe("");

    const encontrados = textos(
      DocumentoParecer({
        parecer: parecer({ texto: TEXTO_FALLBACK, avisoFalhaInterpretativa: true }),
      }),
    );

    expect(encontrados).not.toContain(veredito);
    expect(encontrados).toContain(TEXTO_FALLBACK.trim());
  });
});
