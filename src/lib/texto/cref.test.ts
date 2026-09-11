// lastro · o CREF como o profissional escreve, e o que o app recusa.
//
// O risco que estes testes guardam não é sintático: é o app aceitar
// qualquer coisa num campo que a tela chama de registro profissional. Um
// campo obrigatório que aceita "123" é decoração, e decoração com nome de
// credencial é pior que campo nenhum.
import { describe, expect, it } from "vitest";
import {
  crefValido,
  formatarCref,
  normalizarCref,
  AVISO_CREF_NAO_VERIFICADO,
} from "./cref";

describe("normalizarCref", () => {
  it("tira o prefixo, os espaços e sobe a caixa", () => {
    expect(normalizarCref(" cref 123456-g/pb ")).toBe("123456-G/PB");
    expect(normalizarCref("CREF123456-G/PB")).toBe("123456-G/PB");
  });

  it("não inventa pontuação que a pessoa não digitou", () => {
    // "123456G/PB" não vira "123456-G/PB": adivinhar onde entra o hífen é
    // adivinhar o número de registro de outra pessoa.
    expect(crefValido("123456G/PB")).toBe(false);
  });
});

describe("crefValido", () => {
  it("aceita graduado e provisionado", () => {
    expect(crefValido("123456-G/PB")).toBe(true);
    expect(crefValido("000123-P/SP")).toBe(true);
  });

  it("aceita registro secundário", () => {
    expect(crefValido("123456-G/RJ-S")).toBe(true);
  });

  it("aceita como a pessoa digita, com prefixo e espaço", () => {
    expect(crefValido("CREF 123456-G/MG")).toBe(true);
  });

  it("recusa quantidade de dígitos fora da norma", () => {
    // Seis dígitos é a Resolução CONFEF 053/2003, não arredondamento.
    expect(crefValido("12345-G/PB")).toBe(false);
    expect(crefValido("1234567-G/PB")).toBe(false);
  });

  it("recusa categoria que não existe", () => {
    // Só G e P. "E", "A", "X" não são categorias de registro.
    expect(crefValido("123456-E/PB")).toBe(false);
    expect(crefValido("123456-X/PB")).toBe(false);
  });

  it("recusa UF que não existe", () => {
    // Sem a lista das 27, qualquer par de letras passaria — e "XX" é
    // exatamente o que alguém digita para vencer um campo obrigatório.
    expect(crefValido("123456-G/XX")).toBe(false);
    expect(crefValido("123456-G/ZZ")).toBe(false);
  });

  it("recusa vazio e lixo", () => {
    expect(crefValido("")).toBe(false);
    expect(crefValido("   ")).toBe(false);
    expect(crefValido("123")).toBe(false);
    expect(crefValido("sou personal")).toBe(false);
  });

  it("aceita as 27 UFs, sem faltar nenhuma", () => {
    const ufs = [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
      "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
      "RR", "SC", "SP", "SE", "TO",
    ];
    expect(ufs).toHaveLength(27);
    for (const uf of ufs) {
      expect(crefValido(`123456-G/${uf}`), uf).toBe(true);
    }
  });
});

describe("formatarCref", () => {
  it("mostra com o prefixo, como está na carteira", () => {
    expect(formatarCref("123456-G/PB")).toBe("CREF 123456-G/PB");
  });
});

describe("o aviso", () => {
  it("diz que o lastro NÃO verifica — é a frase que impede o selo falso", () => {
    expect(AVISO_CREF_NAO_VERIFICADO).toMatch(/não verifica/i);
    expect(AVISO_CREF_NAO_VERIFICADO).toMatch(/CONFEF/);
  });
});
