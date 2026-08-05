// lastro · SDD.md §6.6 — os 5 casos de teste do validador determinístico.
import { describe, expect, it } from "vitest";
import type { ResumoCompacto } from "@/lib/analise/tipos";
import { validarNumeros } from "./validador";

function resumoBase(): ResumoCompacto {
  return {
    versao: 1,
    periodo: {
      semana_atual_inicio: "2026-07-27",
      semanas_com_dados: 4,
      janela_semanas: 4,
    },
    faixa_referencia_series: [10, 20],
    volume_semanal: [
      { semana_inicio: "2026-07-06", volume_total: 1000 },
      { semana_inicio: "2026-07-13", volume_total: 1100 },
      { semana_inicio: "2026-07-20", volume_total: 1200 },
      { semana_inicio: "2026-07-27", volume_total: 1300 },
    ],
    volume_por_grupo_muscular: [
      {
        grupo_muscular: "peito",
        series_valendo: 14,
        volume: 1300,
        delta_series_pct: 10,
        delta_volume_pct: 8,
        posicao_na_faixa: "dentro",
      },
    ],
    tendencia_e1rm: [
      {
        exercicio: "Supino reto",
        grupo_muscular: "peito",
        e1rm_atual: 80,
        e1rm_inicial: 100,
        delta_pct: 20,
        sessoes: 8,
      },
      {
        exercicio: "Rosca direta",
        grupo_muscular: "braco",
        e1rm_atual: 66.66666666666667,
        e1rm_inicial: 60,
        delta_pct: 11.11,
        sessoes: 6,
      },
    ],
    series_dificeis: {
      total: 12,
      series_valendo_com_rir: 10,
      series_valendo: 14,
    },
    frequencia: {
      treinos_semana_atual: 3,
      media_semanas_anteriores: 2,
      grupos_sem_estimulo: [],
    },
    estagnacoes: [
      { exercicio: "Agachamento", semanas_sem_progresso: 5 },
    ],
    prs: [
      {
        exercicio: "Levantamento terra",
        tipo: "e1rm",
        valor: 150,
        valor_anterior: 140,
      },
    ],
  };
}

describe("validarNumeros", () => {
  it("parecer citando um valor de DADOS (o volume real) → ok true, valor em citados", () => {
    const resumo = resumoBase();
    const parecer = "Seu volume total nesta semana foi 1300.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(1300);
    }
  });

  it('parecer citando "supino subiu 15%" quando o resumo diz 20% → intrusos: [15]', () => {
    const resumo = resumoBase();
    const parecer = "Seu supino subiu 15% no período.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok && resultado.motivo === "intrusos") {
      expect(resultado.intrusos).toEqual([15]);
    } else {
      throw new Error("esperava motivo 'intrusos'");
    }
  });

  it('"66,7" contra resumo 66.666... → ok true (tolerância de arredondamento)', () => {
    const resumo = resumoBase();
    const parecer = "Sua rosca direta está com carga estimada de 66,7 kg.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(true);
  });

  it("parecer citando só números de CONTEXTO (janela) sem valor de DADOS → sem_numero_do_dono", () => {
    const resumo = resumoBase();
    const parecer = "Nas últimas 4 semanas não há padrão claro para comentar.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado).toEqual({ ok: false, motivo: "sem_numero_do_dono" });
  });

  it("parecer citando a data da semana (27/07 a 02/08) e um valor de DADOS → ok true, datas não são intrusos", () => {
    const resumo = resumoBase();
    const parecer =
      "Nesta semana (27/07 a 02/08), seu volume total foi 1300.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(1300);
    }
  });

  it("parecer citando data em formato ISO (2026-07-27) → ok true, hífen da data não vira sinal de menos (achado real, qa-treino 2026-08-05)", () => {
    const resumo = resumoBase();
    const parecer =
      "Na semana iniciada em 2026-07-27, seu volume total foi 1300.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(1300);
      // "-07" e "-27" não podem aparecer como intrusos derivados do hífen.
    }
  });

  it('parecer citando "e1RM" (termo com dígito embutido) → o "1" de dentro da sigla não vira número citado (achado real, qa-treino 2026-08-05)', () => {
    const resumo = resumoBase();
    // 47 não existe em nenhum campo do resumoBase — único candidato a
    // intruso deveria ser 47; o "1" embutido em "e1RM" não pode aparecer.
    const parecer = "Seu e1RM no supino chegou perto de 47, um bom sinal.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok && resultado.motivo === "intrusos") {
      expect(resultado.intrusos).not.toContain(1);
      expect(resultado.intrusos).toEqual([47]);
    } else {
      throw new Error("esperava motivo 'intrusos' contendo só [47]");
    }
  });
});
