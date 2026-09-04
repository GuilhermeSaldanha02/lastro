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
import DocumentoParecer, { tamanhoVeredito } from "./documento-parecer";
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
  falhaMotivo: null,
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

  // A linha de procedência nasceu no portão visual de 2026-09-03: era o
  // que tirava a página do vazio SEM inventar enfeite, usando campo que a
  // evidência já carrega por contrato (evidencia.ts, Regra da Presença) e
  // que a tela não mostra.
  it("imprime a procedência de cada evidência — grupo, séries valendo e referência", () => {
    const encontrados = textos(DocumentoParecer({ parecer: parecer() })).join(" ");
    expect(encontrados).toContain("Tríceps");
    expect(encontrados).toContain("8 séries valendo");
    expect(encontrados).toContain("55 kg × 12");
  });

  it("usa singular quando é uma série só", () => {
    const uma = {
      ...EVIDENCIA,
      blocos: [{ ...EVIDENCIA.blocos[0], series_valendo: 1 }],
    } as EvidenciaParaTela;
    const encontrados = textos(
      DocumentoParecer({ parecer: parecer({ evidencia: uma }) }),
    ).join(" ");
    expect(encontrados).toContain("1 série valendo");
    expect(encontrados).not.toContain("1 séries valendo");
  });

  // DESIGN.md §3.6.6: "o delta é o CANAL DE TEXTO obrigatório — cada sinal
  // traz a palavra e o número que o identificam; dois blocos distinguidos
  // só pela cor reprovam o gate". No PDF isso é ainda mais crítico que na
  // tela: o documento pode ser impresso em preto e branco, onde a cor do
  // sinal simplesmente não existe.
  it("traz o delta em TEXTO, não só na cor do sinal", () => {
    const plato = {
      ...EVIDENCIA,
      blocos: [{ ...EVIDENCIA.blocos[0], sinal: "plato", delta_pct: 0 }],
    } as unknown as EvidenciaParaTela;
    const encontrados = textos(
      DocumentoParecer({ parecer: parecer({ evidencia: plato }) }),
    ).join(" ");
    expect(encontrados).toContain("sem mudança há 4 semanas");
  });

  it("só cita semanas sem novo máximo quando o campo opcional existe", () => {
    const semCampo = textos(DocumentoParecer({ parecer: parecer() })).join(" ");
    expect(semCampo).not.toContain("sem novo máximo");

    const comCampo = {
      ...EVIDENCIA,
      blocos: [{ ...EVIDENCIA.blocos[0], semanas_sem_progresso: 3 }],
    } as EvidenciaParaTela;
    const encontrados = textos(
      DocumentoParecer({ parecer: parecer({ evidencia: comCampo }) }),
    ).join(" ");
    expect(encontrados).toContain("3 semanas sem novo máximo");
  });
});

// Achado ao olhar o PDF REAL baixado do app (2026-09-04): o clamp do
// veredito existia na tela desde 03/set e nunca chegou aqui. Um veredito de
// 151 caracteres saía em 27pt fixo, ocupava 5 linhas e empurrava metade da
// evidência para uma segunda página quase vazia.
describe("tamanhoVeredito", () => {
  it("usa o teto para frase curta — o veredito precisa dominar", () => {
    expect(tamanhoVeredito(13)).toBe(27);
    expect(tamanhoVeredito(20)).toBe(27);
  });

  it("encolhe progressivamente, não em degrau", () => {
    const curto = tamanhoVeredito(30);
    const medio = tamanhoVeredito(45);
    expect(curto).toBeLessThan(27);
    expect(medio).toBeLessThan(curto);
  });

  // Mesma proporção da tela: lá 30 caracteres levam 48px a 40,8px (85%).
  it("mantém a proporção da fórmula da tela", () => {
    expect(tamanhoVeredito(30) / 27).toBeCloseTo(40.8 / 48, 2);
  });

  it("nunca desce abaixo do piso, por mais longo que seja", () => {
    expect(tamanhoVeredito(151)).toBe(20); // o caso real que originou o fix
    expect(tamanhoVeredito(500)).toBe(20);
  });

  it("o piso continua claramente maior que o corpo (11pt)", () => {
    expect(tamanhoVeredito(1000)).toBeGreaterThan(11 * 1.7);
  });

  it("é aplicado no documento, não só definido", () => {
    const longo = `${"a".repeat(150)}. Resto do corpo aqui.`;
    const encontrados = textos(DocumentoParecer({ parecer: parecer({ texto: longo }) }));
    // A primeira frase virou veredito e o texto inteiro não ficou no corpo.
    expect(encontrados.some((t) => t.startsWith("aaa"))).toBe(true);
  });
});
