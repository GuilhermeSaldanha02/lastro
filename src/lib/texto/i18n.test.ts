import { describe, expect, it } from "vitest";

import { possuiTraducao, t } from "./i18n";

describe("i18n", () => {
  it.each(["pt-BR", "en", "es"] as const)("devolve a própria chave inexistente em %s", (idioma) => {
    expect(t("Chave inexistente", idioma)).toBe("Chave inexistente");
  });

  it.each([
    "Fila",
    "Alunos",
    "Modo do app",
    "Nada pede atenção nesta semana.",
    "Sessão expirada. Entre novamente.",
    "Página não encontrada",
  ])("tem cobertura completa para %s", (chave) => {
    expect(possuiTraducao(chave)).toBe(true);
    expect(t(chave, "en")).not.toBe(chave);
    expect(t(chave, "es")).not.toBe(chave);
  });
});
