// lastro · a trava do Coach sob vínculo (PRD §11.4.1).
//
// O que estes testes protegem: a §11.4.1 diz que deixar o chat de IA aberto
// sob vínculo torna a seção inteira decorativa. A proibição de prescrever já
// existia; o que este arquivo trava é o DESTINO — e o fato, no prompt, sobre
// quem está do outro lado.
//
// O modo de falha é silencioso: prompt errado não quebra build nem teste de
// tipo, e a resposta do modelo continua plausível. Só um teste sobre o TEXTO
// pega.
import { describe, expect, it } from "vitest";
import {
  SISTEMA_COACH,
  SISTEMA_COACH_COM_PERSONAL,
  sistemaCoach,
  perguntaAceitavel,
  limparPergunta,
  montarPerguntaCoach,
  LIMITE_PERGUNTA,
} from "./prompt";

/**
 * Mesma régua do texto dos alertas: o personal pode ser de qualquer gênero.
 * A borda `\b` é obrigatória — sem ela, "janela" casa com "ela" e o teste
 * reprova texto correto (erro real, 2026-09-11).
 */
const PRONOME = /\b(ele|ela|dele|dela|eles|elas|deles|delas)\b/i;

describe("sistemaCoach", () => {
  it("sem vínculo devolve exatamente o prompt padrão", () => {
    expect(sistemaCoach(false)).toBe(SISTEMA_COACH);
  });

  it("com vínculo devolve o prompt do vínculo", () => {
    expect(sistemaCoach(true)).toBe(SISTEMA_COACH_COM_PERSONAL);
  });

  it("os dois prompts são diferentes", () => {
    expect(SISTEMA_COACH_COM_PERSONAL).not.toBe(SISTEMA_COACH);
  });
});

describe("o prompt sob vínculo", () => {
  it("NÃO afirma que quem pergunta treina sem personal", () => {
    // Esta linha é um FATO entregue ao modelo, e sob vínculo ela é falsa.
    expect(SISTEMA_COACH).toContain("sem personal");
    expect(SISTEMA_COACH_COM_PERSONAL).not.toContain("sem personal");
  });

  it("manda levar o pedido de prescrição ao personal", () => {
    expect(SISTEMA_COACH_COM_PERSONAL).toContain("ao personal");
  });

  it("NÃO diz mais 'não manda o que fazer' — sob vínculo existe quem manda", () => {
    expect(SISTEMA_COACH).toContain("não manda o que fazer");
    expect(SISTEMA_COACH_COM_PERSONAL).not.toContain("não manda o que fazer");
  });

  it("não usa pronome de gênero — nem para o personal, nem para quem pergunta", () => {
    // Achado em 2026-09-11 ao escrever este teste: a regra 5 dizia "os dados
    // DELE", assumindo masculino para quem pergunta, nos DOIS prompts, desde
    // que o arquivo existe. Por isso os dois entram na checagem.
    expect(PRONOME.test(SISTEMA_COACH_COM_PERSONAL)).toBe(false);
    expect(PRONOME.test(SISTEMA_COACH)).toBe(false);
  });

  it("mantém as cinco proibições, inclusive a de prescrever", () => {
    // A trava do vínculo troca o DESTINO da regra 2; não relaxa nenhuma.
    for (const prompt of [SISTEMA_COACH, SISTEMA_COACH_COM_PERSONAL]) {
      expect(prompt).toContain("NÃO descreve execução");
      expect(prompt).toContain("NÃO prescreve programa, periodização");
      expect(prompt).toContain("NÃO dá conselho sobre dor");
      expect(prompt).toContain("NÃO fala de dieta");
      expect(prompt).toContain("NÃO inventa número");
    }
  });

  it("mantém a trava de dado cru: o coach segue sem acesso aos treinos", () => {
    expect(SISTEMA_COACH_COM_PERSONAL).toContain("Você não tem acesso a");
  });
});

describe("perguntaAceitavel", () => {
  it("recusa vazio e só espaço", () => {
    expect(perguntaAceitavel("")).toBe(false);
    expect(perguntaAceitavel("   ")).toBe(false);
  });

  it("recusa o que não é string", () => {
    expect(perguntaAceitavel(5)).toBe(false);
    expect(perguntaAceitavel(null)).toBe(false);
    expect(perguntaAceitavel(undefined)).toBe(false);
  });

  it("aceita no limite e recusa um caractere acima", () => {
    expect(perguntaAceitavel("a".repeat(LIMITE_PERGUNTA))).toBe(true);
    expect(perguntaAceitavel("a".repeat(LIMITE_PERGUNTA + 1))).toBe(false);
  });

  // Achado B4: a pergunta exata do QA foi "\u200B\u200B\u200B".
  it.each([
    ["espaço de largura zero", "\u200B\u200B\u200B"],
    ["BOM", "\uFEFF"],
    ["junção de palavra", "\u2060\u2060"],
    ["invisível misturado com espaço e quebra", " \u200B \n\u200C\u200D\t"],
    ["separador de parágrafo", "\u2029"],
  ])("recusa pergunta feita só de caractere invisível: %s", (_nome, valor) => {
    expect(perguntaAceitavel(valor)).toBe(false);
  });

  it("aceita pergunta com invisível no meio, e o limite conta só o que se lê", () => {
    expect(perguntaAceitavel("O que\u200B é RIR?")).toBe(true);
    expect(perguntaAceitavel("a".repeat(LIMITE_PERGUNTA) + "\u200B".repeat(10))).toBe(true);
  });
});

describe("limparPergunta", () => {
  it("tira os invisíveis e o espaço das pontas, e mantém o resto", () => {
    expect(limparPergunta("\uFEFF  O que\u200B é volume? \u2060")).toBe("O que é volume?");
  });

  it("não mexe em acento nem em emoji", () => {
    expect(limparPergunta("Descanso entre séries 💪")).toBe("Descanso entre séries 💪");
  });

  it("é o texto que vai para o modelo", () => {
    expect(montarPerguntaCoach("\u200BO que é RIR?\u200B")).toBe("Pergunta do dono:\n\nO que é RIR?");
  });
});
