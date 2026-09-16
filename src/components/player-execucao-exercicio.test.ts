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

  it("usa crédito neutro quando não há mídia cadastrada", () => {
    const tela = renderToStaticMarkup(
      createElement(PlayerExecucaoExercicio, {
        exercicioId: "00000000-0000-0000-0000-000000000000",
        nomeExercicio: "Exercício indisponível",
        idioma: "pt-BR",
      }),
    );

    expect(tela).toContain("Mídia de exercício");
    expect(tela).not.toContain("Gym visual");
  });
});
