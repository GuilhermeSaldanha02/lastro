import { describe, expect, it } from "vitest";
import { gerarSvgSticker, MODELOS_STICKER, type TemaSticker } from "./modelos";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import { calcularMetricasSessao } from "@/lib/dados/metricas-treino";

const tema: TemaSticker = { ouro: "#d9b867", branco: "#ffffff", preto: "#121212", papel: "#f3eddd", sombra: "#000000", fonte: "Arial", fonteNumeros: "Arial" };
const logo = "data:image/png;base64,bWFyY2E=";
const metricas: MetricasSessao = { duracaoMinutos: 42, totalSeriesValendo: 12, totalExercicios: 4, totalSeriesAquecimento: 8, tonelagemTotalKg: 100, exerciciosDetalhados: [], prsBatidos: [], gruposMuscularesTreinados: ["peito", "triceps"] };
const grupos = ["peito", "costas", "ombro", "biceps", "triceps", "antebraco", "abdomen", "quadriceps", "posterior_coxa", "gluteo", "panturrilha"];

describe("renderizador de stickers", () => {
  it("mantém bilhete vertical e placa/etiqueta horizontais com marca ao lado dos dados", () => {
    const bilhete = gerarSvgSticker("bilhete", metricas, "pt-BR", logo, tema);
    expect(bilhete.altura).toBeGreaterThan(bilhete.largura);
    for (const modelo of ["placa", "etiqueta"] as const) {
      const resultado = gerarSvgSticker(modelo, metricas, "pt-BR", logo, tema);
      expect(resultado.largura / resultado.altura).toBeGreaterThan(2);
      const xLogo = Number(resultado.svg.match(/<image [^>]*x="([\d.]+)"/)?.[1]);
      const xTitulo = Number(resultado.svg.match(/<text x="([\d.]+)"[^>]*>Peito/)?.[1]);
      expect(xTitulo).toBeGreaterThan(xLogo + 80);
    }
  });
  it("números usa valores brancos grandes e rótulos dourados", () => {
    const { svg } = gerarSvgSticker("numeros", metricas, "pt-BR", logo, tema);
    expect(svg).toMatch(/<text [^>]*fill="#ffffff"[^>]*>42<\/text>/);
    expect(svg).toMatch(/<text [^>]*fill="#d9b867"[^>]*>min<\/text>/);
  });
  it("oferece os nove modelos aprovados", () => {
    expect(MODELOS_STICKER.map(({ id }) => id)).toEqual(["numeros", "lateral", "minimalista", "placa", "bilhete", "arco", "etiqueta", "editorial", "anatomico"]);
  });
  it.each(["numeros", "lateral", "minimalista", "placa", "bilhete", "arco", "etiqueta", "editorial", "anatomico"] as const)("%s preserva marca, números e dimensões naturais", (modelo) => {
    const { svg, largura, altura } = gerarSvgSticker(modelo, metricas, "pt-BR", logo, tema);
    expect(svg).toContain(`href="${logo}"`);
    expect(svg.match(/<image /g)).toHaveLength(1);
    expect(svg).toContain("42");
    expect(svg).toContain("12");
    expect(svg).toContain("Peito");
    expect(svg).toContain("Tríceps");
    expect(svg).toContain(`viewBox="0 0 ${largura} ${altura}"`);
    expect(largura).toBeGreaterThan(100);
    expect(altura).toBeGreaterThan(80);
    expect(svg).not.toContain("100 kg");
  });
  it.each(MODELOS_STICKER)("$id mantém todos os grupos e cresce para títulos longos", ({ id }) => {
    const curto = gerarSvgSticker(id, metricas, "pt-BR", logo, tema);
    const longo = gerarSvgSticker(id, { ...metricas, gruposMuscularesTreinados: grupos }, "pt-BR", logo, tema);
    const conteudoVisivel = longo.svg.replace(/<title>.*?<\/title>/, "");
    expect(longo.altura).toBeGreaterThan(curto.altura);
    expect(conteudoVisivel).toContain("Posterior de coxa");
    expect(conteudoVisivel).toContain("Panturrilha");
    expect(longo.svg).not.toContain("…");
  });
  it("escapa XML em textos e atributos", () => {
    const { svg } = gerarSvgSticker("editorial", { ...metricas, gruposMuscularesTreinados: ['grupo<&"\''] }, "pt-BR", 'data:image/png;base64,a"<&', { ...tema, fonte: 'Fonte "A" & B' });
    expect(svg).toContain("Grupo&lt;&amp;&quot;&apos;");
    expect(svg).toContain("Fonte &quot;A&quot; &amp; B");
    expect(svg).not.toContain('href="data:image/png;base64,a"');
  });
  it("traduz nomes, singular e plural", () => {
    const { svg } = gerarSvgSticker("numeros", { ...metricas, totalSeriesValendo: 1, totalExercicios: 1 }, "en", logo, tema);
    expect(svg).toContain("Chest");
    expect(svg).toContain(">set<");
    expect(svg).toContain(">exercise<");
    expect(gerarSvgSticker("numeros", metricas, "es", logo, tema).svg).toContain(">ejercicios<");
  });
  it("ignora divisões genéricas quando faltam IDs e deixa anatomia inativa", () => {
    const { svg } = gerarSvgSticker("anatomico", { ...metricas, gruposMuscularesTreinados: undefined, focoOuDivisao: "SUPERIORES" }, "en", logo, tema);
    expect(svg).toContain("WORKOUT");
    expect(svg).not.toContain("SUPERIORES");
    expect(svg).not.toContain('data-ativo="true"');
  });
  it("anatomia identifica todos os grupos e ativa apenas o primário de séries valendo", () => {
    const reais = calcularMetricasSessao([
      { id: "1", exercicioId: "supino", exercicioNome: "Supino", peso: 20, reps: 10, tipo: "valendo", exercicioGrupoMuscular: "peito" },
      { id: "2", exercicioId: "rosca", exercicioNome: "Rosca", peso: 5, reps: 10, tipo: "aquecimento", exercicioGrupoMuscular: "biceps" },
    ], 120);
    const { svg } = gerarSvgSticker("anatomico", reais, "pt-BR", logo, tema);
    for (const grupo of grupos) expect(svg).toContain(`data-grupo="${grupo}"`);
    expect(svg).toMatch(/data-grupo="peito" data-ativo="true"/);
    expect(svg).toMatch(/data-grupo="biceps" data-ativo="false"/);
    expect(svg).toMatch(/data-grupo="triceps" data-ativo="false"/);
    expect(svg).toContain('data-vista="frente"');
    expect(svg).toContain('data-vista="costas"');
  });
  it("anatomia também contempla os grupos adicionais do formatador sem inferência", () => {
    const { svg } = gerarSvgSticker("anatomico", { ...metricas, gruposMuscularesTreinados: ["lombar"] }, "pt-BR", logo, tema);
    expect(svg).toMatch(/data-grupo="lombar" data-ativo="true"/);
    for (const grupo of ["trapezio", "adutor", "abdutor"]) {
      expect(svg).toContain(`data-grupo="${grupo}" data-ativo="false"`);
    }
  });
});
