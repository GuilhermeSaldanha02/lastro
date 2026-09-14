import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ehUuid } from "./id-valido";

describe("ehUuid", () => {
  it("aceita UUID gerado, em minúsculas ou maiúsculas", () => {
    const id = randomUUID();
    expect(ehUuid(id)).toBe(true);
    expect(ehUuid(id.toUpperCase())).toBe(true);
  });

  // Os ids que derrubavam as rotas (achado B2) e parentes próximos.
  it.each([
    ["texto curto", "abc"],
    ["vazio", ""],
    ["UUID sem hífens", "0f8fad5bd9cb469fa165708677289e39"],
    ["UUID com caractere a mais", "0f8fad5b-d9cb-469f-a165-70867728950e1"],
    ["UUID com letra fora do hexadecimal", "0f8fad5b-d9cb-469f-a165-70867728950g"],
    ["UUID com espaço em volta", " 0f8fad5b-d9cb-469f-a165-70867728950e "],
    ["tentativa de injeção", "abc' or '1'='1"],
  ])("recusa %s", (_nome, valor) => {
    expect(ehUuid(valor)).toBe(false);
  });
});
