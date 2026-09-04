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
    volume_por_exercicio: [
      {
        exercicio: "Supino reto",
        grupo_muscular: "peito",
        series_valendo: 14,
        volume: 1300,
        peso_referencia: 80,
        reps_referencia: 6,
        delta_volume_pct: 8,
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

  it('parecer citando volume com separador de milhar PT-BR ("12.480") → ok true, ponto não vira decimal (achado real, qa-treino 2026-08-05)', () => {
    const resumo = resumoBase();
    resumo.volume_semanal.push({
      semana_inicio: "2026-08-03",
      volume_total: 12480,
    });
    const parecer = "Seu volume total nesta semana foi 12.480.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(12480);
    }
  });

  it('parecer descrevendo queda sem escrever o sinal ("caiu 15%") quando o dado é delta_pct -15 → ok true, módulo do negativo conta como citado (achado real, qa-treino 2026-08-05)', () => {
    const resumo = resumoBase();
    resumo.tendencia_e1rm.push({
      exercicio: "Desenvolvimento militar",
      grupo_muscular: "ombro",
      e1rm_atual: 34,
      e1rm_inicial: 40,
      delta_pct: -15,
      sessoes: 4,
    });
    const parecer = "Seu desenvolvimento militar caiu 15% no período.";

    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(15);
    }
  });
});

// lastro · módulo de idiomas (etapa 3/4, 2026-08-24) — inglês inverte a
// convenção decimal/milhar de PT-BR/ES ("11.5%" decimal, "12,480" milhar).
// Sem passar idioma="en", estes mesmos pareceres seriam lidos errado —
// replica os mesmos achados reais acima (data ISO, milhar, arredondamento),
// agora na convenção oposta.
describe("validarNumeros — convenção numérica em inglês (idioma = \"en\")", () => {
  it('"66.7" (ponto decimal) contra resumo 66.666... → ok true', () => {
    const resumo = resumoBase();
    const parecer = "Your barbell curl estimated load is 66.7 kg.";

    const resultado = validarNumeros(parecer, resumo, [], "en");

    expect(resultado.ok).toBe(true);
  });

  it('volume com separador de milhar em inglês ("12,480") → ok true, vírgula não vira decimal', () => {
    const resumo = resumoBase();
    resumo.volume_semanal.push({
      semana_inicio: "2026-08-03",
      volume_total: 12480,
    });
    const parecer = "Your total volume this week was 12,480.";

    const resultado = validarNumeros(parecer, resumo, [], "en");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(12480);
    }
  });

  it('mesmo parecer com vírgula de milhar, validado como pt-BR (idioma default) → NÃO bate ("12,480" vira decimal 12.48, intruso)', () => {
    const resumo = resumoBase();
    resumo.volume_semanal.push({
      semana_inicio: "2026-08-03",
      volume_total: 12480,
    });
    const parecer = "Your total volume this week was 12,480.";

    // Prova que a convenção realmente importa: o MESMO texto, lido com a
    // convenção errada, deixa de bater — não é um teste redundante do de
    // cima, é a demonstração do bug que a etapa 3/4 corrigiu.
    const resultado = validarNumeros(parecer, resumo, []);

    expect(resultado.ok).toBe(false);
  });

  it("data ISO em parecer inglês → ok true, hífen da data não vira sinal de menos", () => {
    const resumo = resumoBase();
    const parecer = "For the week starting 2026-07-27, your total volume was 1300.";

    const resultado = validarNumeros(parecer, resumo, [], "en");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.citados).toContain(1300);
    }
  });

  it('parecer citando "15" quando o resumo diz 20 → intrusos: [15], mesmo em inglês', () => {
    const resumo = resumoBase();
    const parecer = "Your bench press went up 15% in the period.";

    const resultado = validarNumeros(parecer, resumo, [], "en");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok && resultado.motivo === "intrusos") {
      expect(resultado.intrusos).toEqual([15]);
    } else {
      throw new Error("esperava motivo 'intrusos'");
    }
  });
});

// FLAGRADO EM PRODUÇÃO em 2026-09-04, no log de uma geração real do dono:
// `tentativa 1 { resultado: { ok: false, motivo: 'intrusos', intrusos: [45] } }`.
// O 45 veio de "Leg press 45 graus" — o NOME do exercício, que o próprio
// resumo entregou ao modelo. O parecer estava certo; o validador é que
// punia o modelo por usar o vocabulário que nós demos.
describe("número que faz parte do NOME do exercício", () => {
  function resumoComNomeNumerado(): ResumoCompacto {
    const base = resumoBase();
    return {
      ...base,
      volume_por_exercicio: [
        { ...base.volume_por_exercicio[0], exercicio: "Leg press 45 graus" },
      ],
      tendencia_e1rm: [{ ...base.tendencia_e1rm[0], exercicio: "Leg press 45 graus" }],
    };
  }

  it("não rejeita o parecer por citar o exercício pelo nome", () => {
    const resultado = validarNumeros(
      "O Leg press 45 graus ficou com volume 1300 na semana.",
      resumoComNomeNumerado(),
      [],
    );
    expect(resultado.ok).toBe(true);
  });

  it("o número do nome NÃO conta como prova de especificidade", () => {
    // Só o nome, nenhum número real do dono: continua reprovando, agora
    // pelo motivo certo. Se o 45 entrasse no conjunto DADOS, este parecer
    // passaria sem citar nada do dono — que é o que o validador existe
    // para impedir.
    const resultado = validarNumeros(
      "O Leg press 45 graus apareceu na semana.",
      resumoComNomeNumerado(),
      [],
    );
    expect(resultado).toEqual({ ok: false, motivo: "sem_numero_do_dono" });
  });

  it("continua pegando intruso de verdade quando o nome tem número", () => {
    const resultado = validarNumeros(
      "O Leg press 45 graus subiu 777% na semana, com volume 1300.",
      resumoComNomeNumerado(),
      [],
    );
    expect(resultado).toEqual({ ok: false, motivo: "intrusos", intrusos: [777] });
  });

  it("cobre número no nome do GRUPO muscular também", () => {
    const base = resumoBase();
    const resumo: ResumoCompacto = {
      ...base,
      volume_por_grupo_muscular: [
        { ...base.volume_por_grupo_muscular[0], grupo_muscular: "grupo 7" },
      ],
    };
    const resultado = validarNumeros(
      "O grupo 7 fechou a semana com volume 1300.",
      resumo,
      [],
    );
    expect(resultado.ok).toBe(true);
  });
});
