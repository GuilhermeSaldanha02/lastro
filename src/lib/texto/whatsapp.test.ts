import { describe, expect, it } from "vitest";
import {
  formatarTelefoneBrasil,
  linkWhatsApp,
  normalizarTelefoneWhatsApp,
  telefoneValidoParaLink,
} from "./whatsapp";

describe("normalizarTelefoneWhatsApp", () => {
  it("aceita celular brasileiro escrito como gente escreve", () => {
    for (const bruto of [
      "(83) 99999-8888",
      "83 99999 8888",
      "83999998888",
      "+55 83 99999-8888",
      "55 (83) 99999-8888",
    ]) {
      expect(normalizarTelefoneWhatsApp(bruto)).toBe("5583999998888");
    }
  });

  it("descarta o zero à esquerda do DDD e o prefixo de operadora", () => {
    expect(normalizarTelefoneWhatsApp("083 99999-8888")).toBe("5583999998888");
    expect(normalizarTelefoneWhatsApp("0 83 99999 8888")).toBe("5583999998888");
  });

  it("aceita fixo de 8 dígitos com DDD", () => {
    expect(normalizarTelefoneWhatsApp("(83) 3222-1111")).toBe("558332221111");
  });

  it("não reescreve número que já tem código de país estrangeiro", () => {
    expect(normalizarTelefoneWhatsApp("+351 912 345 678")).toBe("351912345678");
  });

  it("devolve null para o que não dá para salvar, em vez de palpitar", () => {
    expect(normalizarTelefoneWhatsApp("")).toBeNull();
    expect(normalizarTelefoneWhatsApp("99999")).toBeNull();
    expect(normalizarTelefoneWhatsApp("sem número")).toBeNull();
    expect(normalizarTelefoneWhatsApp("5583999998888123456")).toBeNull();
  });

  it("o que a função devolve é sempre aceito pelo link e pelo banco", () => {
    for (const bruto of [
      "(83) 99999-8888",
      "+351 912 345 678",
      "83 3222-1111",
    ]) {
      const normalizado = normalizarTelefoneWhatsApp(bruto);
      expect(normalizado).not.toBeNull();
      expect(telefoneValidoParaLink(normalizado!)).toBe(true);
    }
  });
});

describe("linkWhatsApp", () => {
  it("monta o link com a mensagem codificada", () => {
    const link = linkWhatsApp("5583999998888", "Oi, João! Tudo bem?");
    expect(link).toBe(
      "https://wa.me/5583999998888?text=Oi%2C%20Jo%C3%A3o!%20Tudo%20bem%3F",
    );
  });

  it("quebra de linha e acento sobrevivem à codificação", () => {
    const link = linkWhatsApp("5583999998888", "Linha 1\nLinha 2 com ç");
    expect(link).toContain("%0A");
    expect(link).toContain("%C3%A7");
  });

  it("recusa telefone inválido em vez de gerar link que falha em silêncio", () => {
    expect(linkWhatsApp("99999", "oi")).toBeNull();
    expect(linkWhatsApp("0583999998888", "oi")).toBeNull();
  });
});

describe("formatarTelefoneBrasil", () => {
  it("mostra de volta o que a pessoa reconhece", () => {
    expect(formatarTelefoneBrasil("5583999998888")).toBe("+55 83 99999-8888");
    expect(formatarTelefoneBrasil("558332221111")).toBe("+55 83 3222-1111");
  });

  it("número estrangeiro sai com o + e os dígitos, sem formatação inventada", () => {
    expect(formatarTelefoneBrasil("351912345678")).toBe("+351912345678");
  });
});
