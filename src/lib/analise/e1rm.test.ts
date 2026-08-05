import { describe, expect, it } from "vitest";
import { E1RM_REPS_MAX } from "./limiares";
import { calcularE1rm, elegivelParaE1rm } from "./e1rm";

describe("calcularE1rm", () => {
  // T-E1
  it("10x50 -> 66,7 kg (Epley)", () => {
    expect(calcularE1rm(10, 50)).toBeCloseTo(66.7, 1);
  });

  // T-E2
  it("8x50 -> 63,3 kg (Epley)", () => {
    expect(calcularE1rm(8, 50)).toBeCloseTo(63.3, 1);
  });

  // T-E3 — identidade em 1 rep
  it("1x100 -> 100,0 kg exatos, não 103,3 (Epley cru)", () => {
    expect(calcularE1rm(1, 100)).toBe(100);
  });
});

describe("elegivelParaE1rm", () => {
  // T-E5
  it("série com reps acima do teto não é elegível", () => {
    expect(elegivelParaE1rm(E1RM_REPS_MAX + 1)).toBe(false);
  });

  it("série com reps no teto é elegível", () => {
    expect(elegivelParaE1rm(E1RM_REPS_MAX)).toBe(true);
  });

  it("série com reps abaixo do teto é elegível", () => {
    expect(elegivelParaE1rm(1)).toBe(true);
  });
});
