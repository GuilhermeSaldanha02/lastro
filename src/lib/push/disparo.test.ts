import { describe, expect, it } from "vitest";

import { disparoAutorizado, lerAvisosDoCorpo } from "./disparo";

describe("autorização do disparo de avisos", () => {
  it("só autoriza com o segredo exato", () => {
    expect(disparoAutorizado("segredo-certo", "segredo-certo")).toBe(true);
    expect(disparoAutorizado("segredo-errado", "segredo-certo")).toBe(false);
    expect(disparoAutorizado(null, "segredo-certo")).toBe(false);
    expect(disparoAutorizado("", "segredo-certo")).toBe(false);
  });

  it("sem segredo configurado, nunca autoriza (a rota fica dormente)", () => {
    expect(disparoAutorizado("qualquer", undefined)).toBe(false);
    expect(disparoAutorizado("", "")).toBe(false);
  });
});

describe("leitura do corpo enviado pelo banco", () => {
  const valido = {
    endpoint: "https://web.push.apple.com/abc",
    p256dh: "chave",
    auth: "segredo",
    treino_id: "aa0cd9e6-6dc4-477b-9c91-6a9142bd4a59",
  };

  it("aceita a lista de avisos bem formada", () => {
    expect(lerAvisosDoCorpo({ avisos: [valido] })).toEqual([valido]);
  });

  it("descarta item malformado e corpo que não é lista", () => {
    expect(lerAvisosDoCorpo({ avisos: [valido, { endpoint: 1 }] })).toEqual([valido]);
    expect(lerAvisosDoCorpo({ avisos: "x" })).toEqual([]);
    expect(lerAvisosDoCorpo(null)).toEqual([]);
  });

  it("só aceita endpoint https (nunca uma URL qualquer vinda do corpo)", () => {
    expect(lerAvisosDoCorpo({ avisos: [{ ...valido, endpoint: "http://interno/x" }] })).toEqual([]);
  });
});
