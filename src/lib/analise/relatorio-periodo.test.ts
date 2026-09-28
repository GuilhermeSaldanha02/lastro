import { describe, expect, it } from "vitest";
import { separarVeredito } from "@/lib/texto/separar-veredito";
import { achatarSeriesValendo } from "./agregar";
import { montarRelatorioPeriodo, periodoDoRelatorio, textoDoRelatorio } from "./relatorio-periodo";
import type { ExercicioBruto, TreinoBruto } from "./tipos";

const HOJE = "2026-09-30";

const EXERCICIOS: ExercicioBruto[] = [
  { id: "supino", nome: "Supino reto", grupoMuscularPrimario: "Peito", unilateral: false, pesoPorLado: false },
  { id: "remada", nome: "Remada", grupoMuscularPrimario: "Costas", unilateral: false, pesoPorLado: false },
  { id: "bulgaro", nome: "Búlgaro", grupoMuscularPrimario: "Quadríceps", unilateral: true, pesoPorLado: false },
];

let seq = 0;
function treino(data: string, series: Array<[string, number, number]>): TreinoBruto {
  seq += 1;
  return {
    id: `t${seq}`,
    data,
    series: series.map(([exercicioId, reps, peso], i) => ({
      id: `t${seq}-s${i}`,
      exercicioId,
      tipo: "valendo" as const,
      reps,
      peso,
      pesoPorLado: false,
    })),
  };
}

// Agosto: 3 treinos. Setembro: 3 treinos, com três recordes de supino (a
// partir da 4ª sessão dele, piso de `MINIMO_SESSOES_PARA_RECORDE`).
const TREINOS: TreinoBruto[] = [
  treino("2026-08-10", [["supino", 10, 40], ["remada", 10, 30]]),
  treino("2026-08-17", [["supino", 10, 42]]),
  treino("2026-08-24", [["supino", 10, 44]]),
  treino("2026-09-02", [["supino", 10, 45], ["remada", 10, 35]]),
  treino("2026-09-15", [["supino", 8, 50], ["remada", 10, 30]]),
  treino("2026-09-29", [["supino", 10, 50], ["bulgaro", 10, 20]]),
];

const SERIES = achatarSeriesValendo(TREINOS, new Map(EXERCICIOS.map((e) => [e.id, e])));

function relatorio(tipo: "mes" | "historico") {
  const periodo = periodoDoRelatorio(tipo, HOJE, SERIES)!;
  return montarRelatorioPeriodo(tipo, periodo, SERIES);
}

describe("relatório do mês", () => {
  it("mês até hoje, mês anterior inteiro ao lado e sem percentual entre os dois", () => {
    const texto = textoDoRelatorio(relatorio("mes"), "pt-BR");
    expect(texto).toBe(
      [
        "Setembro 2026: 3 treinos até hoje.",
        // 5 semanas ISO tocam setembro (31/08 a 28/09); 800 + 700 + 900 (búlgaro unilateral: 10 × 20 × 2).
        "Treinou em 3 de 5 semanas, média de 0,6 treinos por semana. Volume total: 2.400 kg.",
        "Agosto 2026 inteiro: 3 treinos e 1.560 kg.",
        // Supino: 10 × 45 → 10 × 50 (Epley, mesmas reps: +11,1%). Remada: 10 × 35 → 10 × 30. Búlgaro: 1 sessão, fica de fora.
        "Maior evolução: Supino reto, +11,1% de e1RM em 3 sessões.",
        "Maior queda: Remada, -14,3%.",
        "3 recordes pessoais: Supino reto 10 × 45 kg, Supino reto 8 × 50 kg e Supino reto 10 × 50 kg.",
        "Mais treinados: Peito (3 séries) e Costas (2 séries). Menos treinados: Quadríceps (1 série).",
      ].join(" "),
    );
    expect(texto).not.toMatch(/Agosto[^.]*%/);
  });

  it("veredito curto", () => {
    expect(separarVeredito(textoDoRelatorio(relatorio("mes"), "pt-BR")).veredito).toBe("Setembro 2026: 3 treinos até hoje.");
  });

  it("mês sem treino ainda diz isso e mostra o mês anterior", () => {
    const periodo = periodoDoRelatorio("mes", "2026-10-02", SERIES)!;
    expect(textoDoRelatorio(montarRelatorioPeriodo("mes", periodo, SERIES), "pt-BR")).toBe(
      "Outubro 2026: nenhum treino até hoje. Setembro 2026 inteiro: 3 treinos e 2.400 kg.",
    );
  });
});

describe("relatório desde o primeiro treino (AN-07)", () => {
  it("começa no primeiro treino, sem mês anterior", () => {
    expect(textoDoRelatorio(relatorio("historico"), "pt-BR")).toBe(
      [
        "Desde 10 ago 2026: 6 treinos.",
        "Treinou em 6 de 8 semanas, média de 0,8 treinos por semana. Volume total: 3.960 kg.",
        // Supino 10 × 40 → 10 × 50: +25%. Remada 30 → 30: estável, não é queda.
        "Maior evolução: Supino reto, +25% de e1RM em 6 sessões.",
        "3 recordes pessoais: Supino reto 10 × 45 kg, Supino reto 8 × 50 kg e Supino reto 10 × 50 kg.",
        "Mais treinados: Peito (6 séries) e Costas (3 séries). Menos treinados: Quadríceps (1 série).",
      ].join(" "),
    );
  });

  it("sem série nenhuma, não há período para ancorar", () => {
    expect(periodoDoRelatorio("historico", HOJE, [])).toBeNull();
    expect(textoDoRelatorio(null, "pt-BR")).toBe("Você ainda não registrou nenhuma série valendo.");
  });
});

describe("idiomas", () => {
  it("responde em inglês e espanhol", () => {
    expect(textoDoRelatorio(relatorio("mes"), "en")).toMatch(/^September 2026: 3 workouts so far\./);
    expect(textoDoRelatorio(relatorio("mes"), "es")).toMatch(/^Septiembre 2026: 3 entrenamientos hasta hoy\./);
  });
});
