import { describe, expect, it } from "vitest";
import { PARAM_RETORNO, sanitizarRotaDeRetorno } from "./rota-de-retorno";

// O valor chega pela URL — é entrada hostil. Cada caso abaixo é uma forma
// conhecida de transformar um redirecionamento interno em redirecionamento
// aberto. O ponto novo que este item cria (`/login` fazendo `router.push`
// com o valor) é redirecionamento no cliente, onde `//evil.com` sai mesmo
// do domínio: por isso a trava é testada, não só escrita.
const TAB = String.fromCharCode(9);
const NOVA_LINHA = String.fromCharCode(10);
const RETORNO = String.fromCharCode(13);
const NULO = String.fromCharCode(0);

describe("sanitizarRotaDeRetorno", () => {
  it("deixa passar caminho interno", () => {
    expect(sanitizarRotaDeRetorno("/analise")).toBe("/analise");
  });

  it("deixa passar caminho interno com consulta", () => {
    expect(sanitizarRotaDeRetorno("/treino/42?aba=series")).toBe(
      "/treino/42?aba=series",
    );
  });

  it("sem parâmetro -> home", () => {
    expect(sanitizarRotaDeRetorno(null)).toBe("/");
    expect(sanitizarRotaDeRetorno(undefined)).toBe("/");
    expect(sanitizarRotaDeRetorno("")).toBe("/");
  });

  it("rejeita URL absoluta", () => {
    expect(sanitizarRotaDeRetorno("https://evil.com")).toBe("/");
    expect(sanitizarRotaDeRetorno("javascript:alert(1)")).toBe("/");
  });

  it("rejeita caminho protocolo-relativo", () => {
    expect(sanitizarRotaDeRetorno("//evil.com")).toBe("/");
    expect(sanitizarRotaDeRetorno("//evil.com/analise")).toBe("/");
  });

  it("rejeita barra invertida — o navegador a normaliza para barra", () => {
    expect(sanitizarRotaDeRetorno("/\\evil.com")).toBe("/");
    expect(sanitizarRotaDeRetorno("\\\\evil.com")).toBe("/");
  });

  it("rejeita caractere de controle — some na normalização da URL", () => {
    expect(sanitizarRotaDeRetorno("/" + TAB + "/evil.com")).toBe("/");
    expect(sanitizarRotaDeRetorno("/" + NOVA_LINHA + "/evil.com")).toBe("/");
    expect(sanitizarRotaDeRetorno("/" + RETORNO + "/evil.com")).toBe("/");
    expect(sanitizarRotaDeRetorno("/analise" + NULO)).toBe("/");
  });

  it("o nome do parâmetro é um só, em todas as pontas", () => {
    expect(PARAM_RETORNO).toBe("proximo");
  });
});
