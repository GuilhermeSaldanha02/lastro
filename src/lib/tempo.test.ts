import { describe, expect, it } from "vitest";
import { dataLocalBrasil, formatarDataCurta } from "./tempo";

// `formatarDataCurta` ganhou `idioma` em 2026-09-12 por causa do rodapé da
// prescrição na /analise, que em inglês dizia "since 4 set". O que estes
// testes travam é a metade que NÃO podia mudar: a saída pt-BR dos
// chamadores antigos (Home e cabeçalho do parecer), que não passam idioma.
describe("formatarDataCurta", () => {
  it("sem idioma, a saída é exatamente a de antes — os chamadores antigos não mudam", () => {
    expect(formatarDataCurta("2026-08-06")).toBe("6 ago");
    expect(formatarDataCurta("2026-09-04")).toBe("4 set");
    expect(formatarDataCurta("2026-12-31")).toBe("31 dez");
  });

  it("pt-BR explícito é idêntico ao default", () => {
    expect(formatarDataCurta("2026-09-04", "pt-BR")).toBe(formatarDataCurta("2026-09-04"));
  });

  it("em inglês o mês sai em inglês — o defeito era 'since 4 set'", () => {
    const saida = formatarDataCurta("2026-09-04", "en");
    // Não crava a string inteira: a forma exata ("Sep 4") vem do ICU do
    // Node, que muda entre versões. O que importa é o mês não ser o nosso.
    expect(saida).toMatch(/Sep/);
    expect(saida).toMatch(/\b4\b/);
    expect(saida).not.toMatch(/\bset\b/);
  });

  it("em espanhol o dia é o certo", () => {
    expect(formatarDataCurta("2026-09-04", "es")).toMatch(/\b4\b/);
  });

  it("não volta um dia por fuso: 1º de janeiro continua sendo dia 1", () => {
    // A entrada é data de calendário, sem hora. Formatar no fuso local de
    // uma máquina a oeste de UTC devolveria 31 de dezembro.
    expect(formatarDataCurta("2026-01-01", "en")).toMatch(/\b1\b/);
    expect(formatarDataCurta("2026-01-01", "en")).toMatch(/Jan/);
  });

  it("entrada malformada passa inalterada, em qualquer idioma", () => {
    expect(formatarDataCurta("sem-data")).toBe("sem-data");
    expect(formatarDataCurta("sem-data", "en")).toBe("sem-data");
  });
});

// Achado real, revisão estática qa-treino (2026-08-05): `new Date().toISOString()`
// usa UTC e empurra treino noturno pro dia UTC seguinte. BRT = UTC-3, então
// 22h de domingo em Brasília já é 01h de segunda em UTC.
describe("dataLocalBrasil", () => {
  it("22h de domingo em Brasília (01h de segunda em UTC) -> ainda é domingo", () => {
    const instante = new Date("2026-08-03T01:00:00Z"); // segunda 01h UTC = domingo 22h BRT
    expect(dataLocalBrasil(instante)).toBe("2026-08-02");
  });

  it("meio-dia em Brasília (15h UTC) -> mesmo dia em ambos os fusos", () => {
    const instante = new Date("2026-08-03T15:00:00Z");
    expect(dataLocalBrasil(instante)).toBe("2026-08-03");
  });
});
