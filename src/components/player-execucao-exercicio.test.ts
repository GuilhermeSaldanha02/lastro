import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PlayerExecucaoExercicio from "./player-execucao-exercicio";

describe("PlayerExecucaoExercicio", () => {
  it("mostra exatamente o crédito externo da mídia cadastrada", () => {
    const tela = renderToStaticMarkup(
      createElement(PlayerExecucaoExercicio, {
        exercicioId: "d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b",
        nomeExercicio: "Abdominal infra",
        idioma: "pt-BR",
      }),
    );

    expect(tela).toContain("© Gym visual — https://gymvisual.com/");
  });

  // Sem mídia cadastrada (os 116 exercícios da ampliação de 2026-09-23), a
  // tela mostra o nome sobre o ícone de reserva e nada que finja haver
  // animação: nem selo "Animação Ativa", nem "Foco" genérico, nem crédito,
  // e nenhum <img> apontando para um arquivo que não existe (era um 404).
  it("sem mídia cadastrada, mostra só o nome, sem fingir animação", () => {
    const tela = renderToStaticMarkup(
      createElement(PlayerExecucaoExercicio, {
        exercicioId: "00000000-0000-0000-0000-000000000000",
        nomeExercicio: "Exercício indisponível",
        idioma: "pt-BR",
      }),
    );

    expect(tela).toContain("Exercício indisponível");
    expect(tela).not.toContain("Gym visual");
    expect(tela).not.toContain("Animação Ativa");
    expect(tela).not.toContain("Foco:");
    expect(tela).not.toContain("<img");
  });
});
