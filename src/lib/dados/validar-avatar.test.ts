import { describe, expect, it } from "vitest";
import { validarArquivoAvatar } from "./validar-avatar";

function arquivo(tipo: string, tamanhoBytes: number): File {
  return new File([new Uint8Array(tamanhoBytes)], "foto", { type: tipo });
}

describe("validarArquivoAvatar", () => {
  it("rejeita tipo que não é JPEG nem PNG", () => {
    expect(validarArquivoAvatar(arquivo("image/gif", 1000))).toEqual({
      ok: false,
      erro: "Envie uma foto em JPEG ou PNG.",
    });
  });

  it("rejeita arquivo maior que 5 MB", () => {
    expect(
      validarArquivoAvatar(arquivo("image/jpeg", 5 * 1024 * 1024 + 1)),
    ).toEqual({
      ok: false,
      erro: "A foto precisa ter até 5 MB.",
    });
  });

  it("aceita JPEG dentro do limite de tamanho", () => {
    expect(validarArquivoAvatar(arquivo("image/jpeg", 1024))).toEqual({
      ok: true,
    });
  });

  it("aceita PNG dentro do limite de tamanho", () => {
    expect(validarArquivoAvatar(arquivo("image/png", 1024))).toEqual({
      ok: true,
    });
  });
});
