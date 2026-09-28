import { describe, expect, it } from "vitest";
import { separarVeredito } from "@/lib/texto/separar-veredito";
import { leituraDaPergunta, respondidaPorLogica } from "./leitura-por-pergunta";
import type { ResumoCompacto } from "./tipos";

function resumo(parcial: Partial<ResumoCompacto> = {}): ResumoCompacto {
  return {
    versao: 1,
    periodo: { semana_atual_inicio: "2026-09-21", semanas_com_dados: 4, janela_semanas: 4 },
    faixa_referencia_series: [10, 20],
    volume_semanal: [
      { semana_inicio: "2026-08-31", volume_total: 9000 },
      { semana_inicio: "2026-09-07", volume_total: 9500 },
      { semana_inicio: "2026-09-14", volume_total: 10000 },
      { semana_inicio: "2026-09-21", volume_total: 11200 },
    ],
    volume_por_grupo_muscular: [
      { grupo_muscular: "Costas", series_valendo: 22, volume: 5000, posicao_na_faixa: "acima" },
      { grupo_muscular: "Peito", series_valendo: 12, volume: 4000, posicao_na_faixa: "dentro" },
      { grupo_muscular: "Bíceps", series_valendo: 6, volume: 800, posicao_na_faixa: "abaixo" },
    ],
    volume_por_exercicio: [],
    tendencia_e1rm: [
      { exercicio: "Supino reto", grupo_muscular: "Peito", e1rm_atual: 107.5, e1rm_inicial: 100, delta_pct: 7.5, sessoes: 4 },
      { exercicio: "Remada", grupo_muscular: "Costas", e1rm_atual: 90.9, e1rm_inicial: 90, delta_pct: 1.0, sessoes: 3 },
      { exercicio: "Leg press", grupo_muscular: "Quadríceps", e1rm_atual: 186, e1rm_inicial: 200, delta_pct: -7, sessoes: 4 },
    ],
    series_dificeis: { total: 8, series_valendo_com_rir: 18, series_valendo: 20 },
    frequencia: { treinos_semana_atual: 3, media_semanas_anteriores: 4.333, grupos_sem_estimulo: ["Panturrilha"] },
    estagnacoes: [{ exercicio: "Leg press", semanas_sem_progresso: 5 }],
    prs: [{ exercicio: "Supino reto", tipo: "e1rm", valor: 107.5, valor_anterior: 105 }],
    ...parcial,
  };
}

describe("respondidaPorLogica", () => {
  it("1 a 4 sim; 5 (prescrição) não", () => {
    expect([1, 2, 3, 4].every(respondidaPorLogica)).toBe(true);
    expect(respondidaPorLogica(5)).toBe(false);
  });
});

describe("leituraDaPergunta", () => {
  it("cada pergunta tem a sua resposta: as quatro saem diferentes do mesmo resumo", () => {
    const textos = ([1, 2, 3, 4] as const).map((p) => leituraDaPergunta(resumo(), p, "pt-BR"));
    expect(new Set(textos).size).toBe(4);
  });

  it("toda resposta abre com um veredito curto", () => {
    for (const p of [1, 2, 3, 4] as const) {
      const { veredito, corpo } = separarVeredito(leituraDaPergunta(resumo(), p, "pt-BR"));
      expect(veredito.length).toBeLessThanOrEqual(70);
      expect(corpo.length).toBeGreaterThan(0);
    }
  });

  it("1 — progresso: quem subiu, o líder, a queda, os estáveis e o recorde", () => {
    expect(leituraDaPergunta(resumo(), 1, "pt-BR")).toBe(
      "Você progrediu em 1 de 3 exercícios. O Supino reto liderou, com +7,5% de e1RM. Em queda real: Leg press (-7%). 1 ficou estável (variação de até 1%). Recorde pessoal na semana: Supino reto (107,5, antes 105).",
    );
  });

  it("1 — sem tendência, diz que ainda não dá para medir, sem inventar", () => {
    expect(leituraDaPergunta(resumo({ tendencia_e1rm: [], prs: [] }), 1, "pt-BR")).toBe(
      "Ainda não dá para medir progresso. Nenhum exercício teve 2 sessões com carga medível na janela.",
    );
  });

  it("2 — empaque: os parados e, entre eles, quem também está caindo", () => {
    expect(leituraDaPergunta(resumo(), 2, "pt-BR")).toBe(
      "1 exercício está parado. Sem novo máximo de e1RM nem de volume: Leg press (há 5 semanas). Além de parado, em queda real: Leg press (-7%).",
    );
    expect(leituraDaPergunta(resumo({ estagnacoes: [] }), 2, "pt-BR")).toBe(
      "Nenhum exercício parado. Nenhum ficou 4 semanas seguidas sem novo máximo de e1RM nem de volume.",
    );
  });

  it("3 — equilíbrio: fora da faixa, com a faixa rotulada como convenção, e grupo sem estímulo na janela", () => {
    expect(leituraDaPergunta(resumo(), 3, "pt-BR")).toBe(
      "1 abaixo e 1 acima da faixa de referência. Faixa de referência: 10 a 20 séries valendo por grupo na semana (convenção prática, não prescrição). Abaixo: Bíceps (6). Acima: Costas (22). Na faixa: Peito (12). Sem nenhuma série nas últimas 4 semanas: Panturrilha.",
    );
  });

  it("4 — demais ou de menos: frequência contra a média, volume contra a semana anterior e esforço", () => {
    expect(leituraDaPergunta(resumo(), 4, "pt-BR")).toBe(
      "3 treinos na semana, contra média de 4,3. Volume da semana: 11.200 kg (+12% contra a anterior). 8 das 20 séries valendo foram difíceis (RIR até 3).",
    );
  });

  it("4 — com pouco RIR registrado, diz isso em vez de calcular esforço", () => {
    const texto = leituraDaPergunta(
      resumo({ series_dificeis: undefined, cobertura_rir_insuficiente: { series_valendo_com_rir: 4, series_valendo: 20 } }),
      4,
      "pt-BR",
    );
    expect(texto).toContain("Só 4 das 20 séries têm RIR registrado");
  });

  it("responde no idioma da conta", () => {
    expect(leituraDaPergunta(resumo(), 2, "en")).toMatch(/^1 exercise is stalled\./);
    expect(leituraDaPergunta(resumo(), 3, "es")).toMatch(/^1 por debajo y 1 por encima del rango de referencia\./);
  });
});
