import { describe, expect, it, vi } from "vitest";

// `redirect` do Next lança; aqui só queremos saber para onde iria.
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { exigirCascaDeAluno, exigirTipoEscolhido } from "./casca";
import type { Perfil } from "./perfil";

const perfil = (parcial: Partial<Perfil>) => ({ tipoEscolhido: true, termosAceitos: true, modo: "treino", ...parcial }) as Perfil;

describe("guarda do aceite (A1-ACEITE)", () => {
  it("sem aceite da versão vigente, manda para /aceite", () => {
    expect(() => exigirTipoEscolhido(perfil({ termosAceitos: false }))).toThrow("REDIRECT:/aceite");
  });

  it("com treino em andamento, o reaceite espera: não interrompe quem está treinando", () => {
    expect(() => exigirTipoEscolhido(perfil({ termosAceitos: false }), { treinoEmAndamento: true })).not.toThrow();
    expect(() => exigirCascaDeAluno(perfil({ termosAceitos: false }), { treinoEmAndamento: true })).not.toThrow();
  });

  it("o treino em andamento não pula a escolha do tipo de conta", () => {
    expect(() => exigirTipoEscolhido(perfil({ tipoEscolhido: false, termosAceitos: false }), { treinoEmAndamento: true })).toThrow("REDIRECT:/boas-vindas");
  });

  it("conta aceita segue normalmente, com ou sem treino", () => {
    expect(() => exigirCascaDeAluno(perfil({}))).not.toThrow();
    expect(() => exigirCascaDeAluno(perfil({}), { treinoEmAndamento: true })).not.toThrow();
  });
});
