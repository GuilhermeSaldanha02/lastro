import { describe, expect, it } from "vitest";
import { ehErroPermanente, ehErroPermanenteDoPostgres, marcarComoPermanente } from "./erro-permanente";

describe("ehErroPermanente", () => {
  it("reconhece um erro marcado como permanente", () => {
    const erro = new Error(marcarComoPermanente("violates check constraint"));
    expect(ehErroPermanente(erro)).toBe(true);
  });

  it("não confunde um erro comum (sem o marcador) com permanente", () => {
    expect(ehErroPermanente(new Error("falha de rede"))).toBe(false);
  });

  it("não quebra em valores que nem são Error", () => {
    expect(ehErroPermanente("string qualquer")).toBe(false);
    expect(ehErroPermanente(undefined)).toBe(false);
  });
});

describe("ehErroPermanenteDoPostgres", () => {
  it("classifica violação de constraint (23xxx) como permanente", () => {
    expect(ehErroPermanenteDoPostgres("23514")).toBe(true);
  });

  it("classifica erro de tipo/formato de dado (22xxx) como permanente", () => {
    expect(ehErroPermanenteDoPostgres("22P02")).toBe(true);
  });

  it("não classifica outros códigos (ex.: permissão, PostgREST) como permanentes", () => {
    expect(ehErroPermanenteDoPostgres("42501")).toBe(false);
    expect(ehErroPermanenteDoPostgres("PGRST301")).toBe(false);
  });

  it("não classifica ausência de código (erro de rede, sem resposta estruturada)", () => {
    expect(ehErroPermanenteDoPostgres(undefined)).toBe(false);
  });
});
