import { describe, expect, it } from "vitest";
import { PRIVACIDADE, RESPONSAVEL_CONTATO, RESPONSAVEL_NOME, TERMOS, VERSAO_DOCUMENTOS } from "./documentos";

const textoDe = (d: typeof TERMOS) =>
  d.secoes.flatMap((s) => [s.titulo, ...(s.paragrafos ?? []), ...(s.itens ?? [])]).join("\n");

describe("documentos legais (PU-06)", () => {
  it("não sobra lacuna entre colchetes nem nota interna no texto público", () => {
    for (const documento of [TERMOS, PRIVACIDADE]) {
      const texto = textoDe(documento);
      expect(texto, documento.titulo).not.toMatch(/\[[A-ZÇÃÕ ,-]{4,}\]/);
      expect(texto, documento.titulo).not.toMatch(/ADVOGADO|RASCUNHO|CONFERIR/);
    }
  });

  it("identifica o responsável e o contato (LGPD art. 41)", () => {
    expect(RESPONSAVEL_NOME.length).toBeGreaterThan(5);
    expect(RESPONSAVEL_CONTATO).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(textoDe(PRIVACIDADE)).toContain(RESPONSAVEL_NOME);
    expect(textoDe(PRIVACIDADE)).toContain(RESPONSAVEL_CONTATO);
    expect(textoDe(TERMOS)).toContain(RESPONSAVEL_CONTATO);
  });

  it("a versão é uma data (o aceite grava esse texto)", () => {
    expect(VERSAO_DOCUMENTOS).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it("declara o uso do conteúdo pelo Google no plano gratuito", () => {
    expect(textoDe(PRIVACIDADE)).toMatch(/plano gratuito da Gemini API/);
  });
});
