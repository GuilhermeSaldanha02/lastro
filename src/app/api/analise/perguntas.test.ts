// lastro · quais perguntas a tela mostra, e qual fica em destaque.
//
// Direção "Troca de posto" (gate visual da §11.4.2, 2026-09-11): sob vínculo
// a prescrição SAI da lista e o destaque passa para outra pergunta. O que
// estes testes protegem são as duas metades que a §11.2 afirma ao mesmo
// tempo — a prescrição não aparece, e o aluno não perde diagnóstico nenhum.
import { describe, expect, it } from "vitest";
import {
  perguntasDaTela,
  PERGUNTA_PRIMARIA,
  PERGUNTA_PRESCRICAO,
  PERGUNTA_PRIMARIA_VINCULADO,
  perguntasDoIdioma,
  type NumeroPergunta,
} from "./perguntas";

const TODAS: NumeroPergunta[] = [1, 2, 3, 4, 5];

describe("perguntasDaTela — sem vínculo", () => {
  const { primaria, secundarias } = perguntasDaTela(false);

  it("mantém a prescrição em destaque", () => {
    expect(primaria).toBe(PERGUNTA_PRIMARIA);
  });

  it("mostra as cinco perguntas, sem repetir nenhuma", () => {
    expect([primaria, ...secundarias].sort()).toEqual(TODAS);
  });

  it("não repete a primária entre as secundárias", () => {
    expect(secundarias).not.toContain(primaria);
  });
});

describe("perguntasDaTela — com vínculo", () => {
  const { primaria, secundarias } = perguntasDaTela(true);
  const naTela = [primaria, ...secundarias];

  it("a prescrição não aparece em lugar nenhum da tela", () => {
    // Nem como card em destaque, nem como secundária, nem como alvo
    // desabilitado: o que não existe não pode ser clicado por engano.
    expect(naTela).not.toContain(PERGUNTA_PRESCRICAO);
  });

  it("o destaque vai para a pergunta escolhida no gate, não fica vazio", () => {
    expect(primaria).toBe(PERGUNTA_PRIMARIA_VINCULADO);
  });

  it("o aluno não perde nenhum dos quatro diagnósticos (PRD §11.2)", () => {
    const diagnosticos = TODAS.filter((n) => n !== PERGUNTA_PRESCRICAO);
    expect(naTela.sort()).toEqual(diagnosticos);
  });

  it("tira exatamente UMA pergunta em relação a quem não tem vínculo", () => {
    const sem = perguntasDaTela(false);
    const quantas = (p: { secundarias: NumeroPergunta[] }) =>
      p.secundarias.length + 1;
    expect(quantas(perguntasDaTela(true))).toBe(quantas(sem) - 1);
  });
});

describe("as duas constantes de papel", () => {
  it("a de escopo e a de layout valem o mesmo hoje, e são separadas de propósito", () => {
    expect(PERGUNTA_PRESCRICAO).toBe(PERGUNTA_PRIMARIA);
  });

  it("a primária sob vínculo NÃO é a prescrição — seria a trava anulada", () => {
    expect(PERGUNTA_PRIMARIA_VINCULADO).not.toBe(PERGUNTA_PRESCRICAO);
  });

  it("toda pergunta que a tela mostra tem texto nos três idiomas", () => {
    for (const idioma of ["pt-BR", "en", "es"] as const) {
      const textos = perguntasDoIdioma(idioma);
      for (const numero of [
        ...perguntasDaTela(true).secundarias,
        perguntasDaTela(true).primaria,
      ]) {
        expect(textos[numero]?.length).toBeGreaterThan(0);
      }
    }
  });
});
