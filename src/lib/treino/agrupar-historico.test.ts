import { describe, expect, it } from "vitest";
import { agruparHistorico, mesesComTreino } from "./agrupar-historico";
import type { Treino } from "@/lib/dados/treino";

function treino(data: string, id = data): Treino {
  return { id, data, iniciadoEm: `${data}T10:00:00Z`, finalizadoEm: null, totalSeries: 1 };
}

const HOJE = "2026-09-26";

describe("agruparHistorico (UX-02)", () => {
  it("separa hoje do resto, mesmo com mais de um treino hoje", () => {
    const treinos = [treino(HOJE, "a"), treino(HOJE, "b"), treino("2026-09-19")];
    const r = agruparHistorico(treinos, HOJE);
    expect(r.hoje.map((t) => t.id)).toEqual(["a", "b"]);
    expect(r.porMes).toHaveLength(1);
    expect(r.porMes[0].itens).toHaveLength(1);
  });

  it("agrupa por mês, mais recente primeiro, sem repetir hoje no agrupamento", () => {
    const treinos = [
      treino(HOJE),
      treino("2026-09-19"),
      treino("2026-09-12"),
      treino("2026-08-29"),
      treino("2026-08-22"),
    ];
    const r = agruparHistorico(treinos, HOJE);
    expect(r.hoje).toHaveLength(1);
    expect(r.porMes.map((g) => g.anoMes)).toEqual(["2026-09", "2026-08"]);
    expect(r.porMes[0].itens).toHaveLength(2);
    expect(r.porMes[1].itens).toHaveLength(2);
  });

  it("sem treino de hoje, o grupo 'hoje' vem vazio e nada quebra", () => {
    const r = agruparHistorico([treino("2026-09-19")], HOJE);
    expect(r.hoje).toEqual([]);
    expect(r.porMes).toHaveLength(1);
  });

  it("lista vazia não inventa grupo nenhum", () => {
    expect(agruparHistorico([], HOJE)).toEqual({ hoje: [], porMes: [] });
  });
});

describe("mesesComTreino", () => {
  it("meses únicos, na ordem em que aparecem (mais recente primeiro)", () => {
    const treinos = [treino("2026-09-26"), treino("2026-09-19"), treino("2026-08-29")];
    expect(mesesComTreino(treinos)).toEqual(["2026-09", "2026-08"]);
  });

  it("vazio sem treino nenhum", () => {
    expect(mesesComTreino([])).toEqual([]);
  });
});
