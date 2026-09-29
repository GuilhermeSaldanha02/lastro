import { describe, expect, it } from "vitest";
import {
  compararComPadrao,
  familiaDaSessao,
  mediana,
  sessoesForaDoPadrao,
  type SessaoParaPadrao,
} from "./fora-do-padrao";

const EMPURRAR = ["ombro", "peito", "triceps"];
const PUXAR = ["biceps", "costas"];
const PERNAS = ["gluteo", "quadriceps"];

let seq = 0;
const s = (data: string, grupos: string[], volume: number): SessaoParaPadrao => ({
  treinoId: `t${++seq}`,
  data,
  grupos,
  volume,
});

describe("familiaDaSessao", () => {
  it("peito empurra, costas puxa, grupo de perna é pernas", () => {
    expect(familiaDaSessao(EMPURRAR)).toBe("empurrar");
    expect(familiaDaSessao(["abdomen", "biceps", "costas"])).toBe("puxar");
    expect(familiaDaSessao(["panturrilha", "posterior_coxa"])).toBe("pernas");
  });

  it("sessão mista ou sem grupo principal não tem com quem comparar", () => {
    expect(familiaDaSessao(["peito", "costas"])).toBeNull();
    expect(familiaDaSessao(["quadriceps", "peito"])).toBeNull();
    expect(familiaDaSessao(["biceps", "triceps"])).toBeNull();
    expect(familiaDaSessao(["abdomen"])).toBeNull();
    expect(familiaDaSessao([])).toBeNull();
  });
});

describe("mediana", () => {
  it("ímpar e par", () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("compararComPadrao", () => {
  const anteriores = [
    s("2026-09-01", EMPURRAR, 10_000),
    s("2026-09-04", EMPURRAR, 11_000),
    s("2026-09-08", EMPURRAR, 9_000),
    s("2026-09-11", EMPURRAR, 10_000),
    s("2026-09-09", PUXAR, 50_000), // outro tipo: não entra no padrão
  ];

  it("40% acima da mediana das sessões do mesmo tipo", () => {
    const r = compararComPadrao(s("2026-09-14", EMPURRAR, 14_000), anteriores);
    expect(r).toMatchObject({ familia: "empurrar", padrao: 10_000, sessoesComparadas: 4, direcao: "acima" });
    expect(r?.desvio).toBeCloseTo(0.4);
  });

  it("abaixo, e exatamente 30% ainda é dentro", () => {
    expect(compararComPadrao(s("2026-09-14", EMPURRAR, 6_500), anteriores)?.direcao).toBe("abaixo");
    expect(compararComPadrao(s("2026-09-14", EMPURRAR, 13_000), anteriores)?.direcao).toBe("dentro");
    expect(compararComPadrao(s("2026-09-14", EMPURRAR, 7_000), anteriores)?.direcao).toBe("dentro");
  });

  it("sem 4 sessões do mesmo tipo não há padrão", () => {
    expect(compararComPadrao(s("2026-09-14", PUXAR, 9_000), anteriores)).toBeNull();
    expect(compararComPadrao(s("2026-09-14", EMPURRAR, 14_000), anteriores.slice(0, 3))).toBeNull();
  });

  it("usa só as 6 mais recentes do mesmo tipo", () => {
    const antigas = [s("2026-08-01", EMPURRAR, 1_000), s("2026-08-02", EMPURRAR, 1_000)];
    const recentes = Array.from({ length: 6 }, (_, i) => s(`2026-09-0${i + 1}`, EMPURRAR, 10_000));
    const r = compararComPadrao(s("2026-09-14", EMPURRAR, 10_000), [...antigas, ...recentes]);
    expect(r).toMatchObject({ padrao: 10_000, sessoesComparadas: 6, direcao: "dentro" });
  });

  it("sessão sem tipo ou sem volume fica de fora", () => {
    expect(compararComPadrao(s("2026-09-14", ["peito", "costas"], 14_000), anteriores)).toBeNull();
    expect(compararComPadrao(s("2026-09-14", EMPURRAR, 0), anteriores)).toBeNull();
  });
});

describe("sessoesForaDoPadrao (Home)", () => {
  // Mais recente primeiro, como o carregador da Home.
  const base = [
    s("2026-09-10", PERNAS, 12_000),
    s("2026-09-06", PERNAS, 12_000),
    s("2026-09-03", PERNAS, 12_000),
    s("2026-08-30", PERNAS, 12_000),
    s("2026-09-09", EMPURRAR, 10_000),
    s("2026-09-05", EMPURRAR, 10_000),
    s("2026-09-02", EMPURRAR, 10_000),
    s("2026-08-29", EMPURRAR, 10_000),
  ].sort((a, b) => b.data.localeCompare(a.data));

  it("as dos últimos 7 dias, a mais recente primeiro, no máximo 2", () => {
    const sessoes = [
      s("2026-09-16", EMPURRAR, 15_000), // +50%
      s("2026-09-15", PERNAS, 7_000), // −42%
      s("2026-09-14", EMPURRAR, 14_000), // +40%, mas já há 2
      ...base,
    ];
    const r = sessoesForaDoPadrao(sessoes, "2026-09-16");
    expect(r.map((c) => [c.data, c.direcao])).toEqual([
      ["2026-09-16", "acima"],
      ["2026-09-15", "abaixo"],
    ]);
  });

  it("compara só com as sessões mais antigas, e a percepção some depois de 7 dias", () => {
    const sessoes = [s("2026-09-12", EMPURRAR, 15_000), ...base];
    expect(sessoesForaDoPadrao(sessoes, "2026-09-18")).toHaveLength(1);
    expect(sessoesForaDoPadrao(sessoes, "2026-09-19")).toEqual([]);
  });

  it("sessão dentro do padrão não vira percepção", () => {
    expect(sessoesForaDoPadrao([s("2026-09-12", EMPURRAR, 11_000), ...base], "2026-09-12")).toEqual([]);
  });
});
