import { describe, expect, it } from "vitest";
import { metaNasSemanas, semanasSeguidasComTreino, type TreinoDoDia } from "./consistencia-semanal";

// Quarta, 30/09/2026. Semana em andamento: 28/09 a 04/10.
const HOJE = "2026-09-30";

let seq = 0;
const t = (data: string): TreinoDoDia => ({ treinoId: `t${++seq}`, data });

describe("semanasSeguidasComTreino", () => {
  it("conta a semana em andamento quando ela já tem treino", () => {
    // Semanas de 14/09, 21/09 e 28/09.
    expect(semanasSeguidasComTreino([t("2026-09-15"), t("2026-09-22"), t("2026-09-29")], HOJE)).toEqual({
      semanas: 3,
      incluiAtual: true,
    });
  });

  it("semana em andamento sem treino não quebra a sequência", () => {
    expect(semanasSeguidasComTreino([t("2026-09-15"), t("2026-09-22")], HOJE)).toEqual({
      semanas: 2,
      incluiAtual: false,
    });
  });

  it("semana fechada sem treino quebra", () => {
    // 07/09 e 21/09 com a semana de 14/09 vazia no meio.
    expect(semanasSeguidasComTreino([t("2026-09-08"), t("2026-09-22")], HOJE).semanas).toBe(1);
    expect(semanasSeguidasComTreino([t("2026-09-08")], HOJE)).toEqual({ semanas: 0, incluiAtual: false });
  });

  it("vários treinos na mesma semana contam uma semana; futuro é ignorado", () => {
    expect(semanasSeguidasComTreino([t("2026-09-21"), t("2026-09-23"), t("2026-10-02")], HOJE)).toEqual({
      semanas: 1,
      incluiAtual: false,
    });
  });
});

describe("metaNasSemanas", () => {
  const treinos = [
    // semana de 07/09: 1 treino; 14/09: 3; 21/09: 2 (dois no mesmo dia contam 2); 28/09: 1 até hoje.
    t("2026-09-08"),
    t("2026-09-14"),
    t("2026-09-16"),
    t("2026-09-18"),
    t("2026-09-22"),
    t("2026-09-22"),
    t("2026-09-29"),
  ];

  it("só conta semanas fechadas desde o primeiro treino", () => {
    expect(metaNasSemanas(treinos, 2, HOJE)).toEqual({
      meta: 2,
      semanasFechadas: 3,
      cumpridas: 2,
      treinosSemanaAtual: 1,
    });
  });

  it("limita à janela de 8 semanas", () => {
    const longo = Array.from({ length: 12 }, (_, i) => t(`2026-${i < 5 ? "07" : "08"}-${String(1 + (i % 5) * 6).padStart(2, "0")}`));
    const r = metaNasSemanas(longo, 1, HOJE);
    expect(r.semanasFechadas).toBe(8);
  });

  it("sem treino nenhum: nada a contar", () => {
    expect(metaNasSemanas([], 3, HOJE)).toEqual({ meta: 3, semanasFechadas: 0, cumpridas: 0, treinosSemanaAtual: 0 });
  });

  it("primeiro treino nesta semana: nenhuma semana fechada ainda", () => {
    expect(metaNasSemanas([t("2026-09-28")], 3, HOJE)).toEqual({
      meta: 3,
      semanasFechadas: 0,
      cumpridas: 0,
      treinosSemanaAtual: 1,
    });
  });
});
