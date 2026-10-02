import { describe, expect, it } from "vitest";
import { janelaDoHistorico } from "./historico";
import type { CheckinDoDia } from "@/lib/dados/checkin";

const c = (dia: string): CheckinDoDia => ({ dia, sono: 4, energia: null, dorMuscular: null, estresse: null });

describe("janelaDoHistorico", () => {
  it("devolve 7 dias do mais novo ao mais antigo, preenchendo os sem resposta", () => {
    const j = janelaDoHistorico("2026-10-02", [c("2026-10-02"), c("2026-09-30")]);
    expect(j.map((d) => d.dia)).toEqual([
      "2026-10-02", "2026-10-01", "2026-09-30", "2026-09-29", "2026-09-28", "2026-09-27", "2026-09-26",
    ]);
    expect(j.map((d) => d.checkin !== null)).toEqual([true, false, true, false, false, false, false]);
  });

  it("atravessa a virada de mês e de ano", () => {
    expect(janelaDoHistorico("2027-01-02", [], 3).map((d) => d.dia)).toEqual(["2027-01-02", "2027-01-01", "2026-12-31"]);
  });

  it("ignora check-in fora da janela", () => {
    expect(janelaDoHistorico("2026-10-02", [c("2026-08-01")]).every((d) => d.checkin === null)).toBe(true);
  });
});
