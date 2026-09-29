import { describe, expect, it } from "vitest";
import { classificar, ehRecusa, ehRelatorio, grupoCitado, normalizar } from "./roteador";

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
    ["Quantas semanas seguidas treinei?", "SEMANAS_SEGUIDAS"],
    ["Qual minha sequência de semanas?", "SEMANAS_SEGUIDAS"],
    ["How many weeks in a row have I trained?", "SEMANAS_SEGUIDAS"],
    ["¿Cuántas semanas seguidas entrené?", "SEMANAS_SEGUIDAS"],
    ["Em quantas semanas bati minha meta?", "META_CUMPRIDA"],
    ["Bati a meta esta semana?", "META_CUMPRIDA"],
    ["Did I hit my weekly goal?", "META_CUMPRIDA"],
    ["¿Cumplí mi meta semanal?", "META_CUMPRIDA"],
  ])("%s → %s", (pergunta, intent) => {
    expect(classificar(pergunta)).toEqual({ intent });
  });

  it.each([
    "Qual meta semanal devo ter?", // prescrição
    "Qual a meta ideal de treinos?",
    "Bati minha meta no mês?", // outro período
    "Qual o objetivo do supino?", // meta sem pergunta de contagem
    "Quantas semanas seguidas treinei peito?", // de um grupo
  ])("meta e semanas ficam com a Gemini: %s", (pergunta) => {
    expect(classificar(pergunta)).toBeNull();
  });

  it("há quanto tempo não treino um grupo leva o grupo junto", () => {
    expect(classificar("Há quanto tempo não treino costas?")).toEqual({ intent: "DIAS_SEM_GRUPO", grupo: "costas" });
    expect(classificar("hace cuánto no entreno hombros")).toEqual({ intent: "DIAS_SEM_GRUPO", grupo: "ombro" });
    expect(classificar("Quantos dias sem treinar peito?")).toEqual({ intent: "DIAS_SEM_GRUPO", grupo: "peito" });
  });
});

describe("classificar — volume e frequência de UM grupo (AN-08 M3)", () => {
  it.each([
    ["Qual meu volume de peito nesta semana?", "VOLUME_GRUPO", "peito"],
    ["Como está meu volume de peito?", "VOLUME_GRUPO", "peito"],
    ["Quantas séries de costas fiz?", "VOLUME_GRUPO", "costas"],
    ["how many sets of chest this week", "VOLUME_GRUPO", "peito"],
    ["¿Cuántas series de espalda esta semana?", "VOLUME_GRUPO", "costas"],
    ["Quantas vezes treinei costas?", "FREQUENCIA_GRUPO", "costas"],
    ["Qual a frequência de ombro?", "FREQUENCIA_GRUPO", "ombro"],
    ["How often do I train shoulders?", "FREQUENCIA_GRUPO", "ombro"],
    ["¿Con qué frecuencia entreno pecho?", "FREQUENCIA_GRUPO", "peito"],
  ])("%s → %s (%s)", (pergunta, intent, grupo) => {
    expect(classificar(pergunta)).toEqual({ intent, grupo });
  });

  it.each([
    // Prescrição disfarçada de contagem: número certo para a pergunta errada.
    "Quantas séries de peito devo fazer por semana?",
    "Qual o volume ideal de peito?",
    "How many sets of chest should I do?",
    "¿Cuántas series de pecho debo hacer?",
    // Período que a intent não cobre (a janela é fixa).
    "Volume de peito no mês",
    "Quantas vezes treinei costas desde o início?",
    "Volume de peito hoje",
    // A sequência é do treino inteiro, não de um grupo.
    "Quantos dias seguidos treinei peito?",
    // As duas coisas ao mesmo tempo.
    "Quantas vezes e quantas séries de peito?",
  ])("fica com a Gemini: %s", (pergunta) => {
    expect(classificar(pergunta)).toBeNull();
  });
});

describe("classificar — relatórios de período (AN-08 M2-3)", () => {
  it.each([
    ["Relatório do primeiro treino até hoje", "RELATORIO_HISTORICO"], // o pedido original do AN-07
    ["Como estou desde que comecei?", "RELATORIO_HISTORICO"],
    ["How have I done since my first workout?", "RELATORIO_HISTORICO"],
    ["¿Cómo me fue desde mi primer entrenamiento?", "RELATORIO_HISTORICO"],
    ["Como foi meu mês?", "RELATORIO_MES"],
    ["Resumo do mês", "RELATORIO_MES"],
    ["How was my month?", "RELATORIO_MES"],
    ["¿Cómo fue mi mes?", "RELATORIO_MES"],
  ])("%s → %s", (pergunta, intent) => {
    const c = classificar(pergunta);
    expect(c).toEqual({ intent });
    expect(c && ehRelatorio(c)).toBe(true);
  });

  it("semana continua sendo semana", () => {
    expect(classificar("Como foi minha semana?")).toEqual({ intent: "RESUMO_SEMANA" });
  });

  it("relatório de um grupo só ainda não é local", () => {
    expect(classificar("Como foi meu mês de peito?")).toBeNull();
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
    "Como está meu peito?",
    "Como foi meu treino hoje?",
    "",
  ])("%s", (pergunta) => {
    expect(classificar(pergunta)).toBeNull();
  });
});
