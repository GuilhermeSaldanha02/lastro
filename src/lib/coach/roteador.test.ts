import { describe, expect, it } from "vitest";
import { classificar, ehRecusa, grupoCitado, normalizar } from "./roteador";

describe("normalizar", () => {
  it("tira acento, pontuação e caixa", () => {
    expect(normalizar("  Há QUANTO tempo não treino Costas?! ")).toBe("ha quanto tempo nao treino costas");
  });
});

describe("grupoCitado", () => {
  it("reconhece o grupo pelo jeito de falar nos 3 idiomas", () => {
    expect(grupoCitado(normalizar("treinei peitoral"))).toBe("peito");
    expect(grupoCitado(normalizar("when did I last train back"))).toBe("costas");
    expect(grupoCitado(normalizar("cuánto tiempo sin pantorrillas"))).toBe("panturrilha");
    expect(grupoCitado(normalizar("posterior de coxa"))).toBe("posterior_coxa");
  });

  it("dois grupos é ambíguo; palavra dentro de outra não conta", () => {
    expect(grupoCitado(normalizar("peito e costas"))).toBe("varios");
    expect(grupoCitado(normalizar("absoluto"))).toBeNull();
  });
});

describe("classificar — os chips da tela do Coach", () => {
  it("cada chip cai numa resposta local", () => {
    expect(classificar("Como foi meu volume de treino nesta semana?")).toEqual({ intent: "VOLUME_SEMANA" });
    expect(classificar("Qual grupo muscular estou treinando com menor frequência?")).toEqual({
      intent: "GRUPO_MENOS_FREQUENTE",
    });
    expect(classificar("Como foi minha semana?")).toEqual({ intent: "RESUMO_SEMANA" });
  });

  it("as traduções dos chips também", () => {
    expect(classificar("How was my workout volume this week?")).toEqual({ intent: "VOLUME_SEMANA" });
    expect(classificar("¿Qué grupo muscular estoy entrenando con menor frecuencia?")).toEqual({
      intent: "GRUPO_MENOS_FREQUENTE",
    });
    expect(classificar("¿Cómo fue mi semana?")).toEqual({ intent: "RESUMO_SEMANA" });
  });
});

describe("classificar — perguntas de dados", () => {
  it.each([
    ["Quantas vezes treinei esta semana?", "TREINOS_NA_SEMANA"],
    ["how many workouts this week", "TREINOS_NA_SEMANA"],
    ["Qual grupo recebeu mais volume?", "GRUPO_MAIS_VOLUME"],
    ["Minha frequência caiu?", "FREQUENCIA_COMPARADA"],
    ["Quantos dias seguidos eu treinei?", "SEQUENCIA_DIAS"],
    ["what's my streak", "SEQUENCIA_DIAS"],
    ["Resumo da semana", "RESUMO_SEMANA"],
  ])("%s → %s", (pergunta, intent) => {
    expect(classificar(pergunta)).toEqual({ intent });
  });

  it("há quanto tempo não treino um grupo leva o grupo junto", () => {
    expect(classificar("Há quanto tempo não treino costas?")).toEqual({ intent: "DIAS_SEM_GRUPO", grupo: "costas" });
    expect(classificar("hace cuánto no entreno hombros")).toEqual({ intent: "DIAS_SEM_GRUPO", grupo: "ombro" });
  });
});

describe("classificar — recusas que não gastam cota", () => {
  it.each([
    ["Meu joelho dói no agachamento", "SAUDE"],
    ["my shoulder hurts", "SAUDE"],
    ["Qual a postura certa no terra?", "EXECUCAO"],
    ["Devo aumentar a carga ou as repetições no meu próximo treino?", "PRESCRICAO"],
    ["O que mudar na próxima semana?", "PRESCRICAO"],
    ["Monta um treino de peito pra mim", "PRESCRICAO"],
  ])("%s → %s", (pergunta, intent) => {
    const c = classificar(pergunta);
    expect(c).toEqual({ intent });
    expect(c && ehRecusa(c)).toBe(true);
  });

  it("saúde vence qualquer outra leitura da mesma frase", () => {
    expect(classificar("Meu volume de peito está alto e o ombro dói")).toEqual({ intent: "SAUDE" });
  });
});

describe("classificar — na dúvida, segue para a Gemini (null)", () => {
  it.each([
    "Vale a pena treinar em jejum?",
    "O que é RIR?",
    "Qual o volume de peito e costas nesta semana?",
    "Como está meu volume de peito?",
    "Como foi meu treino hoje?",
    "",
  ])("%s", (pergunta) => {
    expect(classificar(pergunta)).toBeNull();
  });
});
