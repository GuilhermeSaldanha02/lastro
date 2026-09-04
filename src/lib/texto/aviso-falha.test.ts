// lastro · a frase antiga MENTIA: dizia "duas tentativas rejeitadas"
// mesmo quando a API não tinha respondido — não houve tentativa rejeitada,
// não houve resposta para rejeitar. Estes testes fixam que cada causa
// recebe uma frase verdadeira só para ela.
import { describe, expect, it } from "vitest";
import { textoAvisoFalha } from "./aviso-falha";
import type { FalhaMotivo } from "@/lib/dados/parecer";

const MOTIVOS: FalhaMotivo[] = [
  "api_indisponivel",
  "cota_excedida",
  "modelo_ausente",
  "api_erro",
  "validador_rejeitou",
];

describe("textoAvisoFalha", () => {
  it("dá uma frase diferente para cada causa", () => {
    const frases = MOTIVOS.map((m) => textoAvisoFalha(m, "pt-BR"));
    expect(new Set(frases).size).toBe(MOTIVOS.length);
  });

  it("toda frase termina explicando o que o dono está lendo no lugar", () => {
    for (const motivo of [...MOTIVOS, null]) {
      expect(textoAvisoFalha(motivo, "pt-BR")).toContain(
        "resumo determinístico dos seus dados",
      );
    }
  });

  // A causa mais importante de acertar: aqui NINGUÉM rejeitou nada.
  it("indisponibilidade não fala em rejeição, e diz o que fazer", () => {
    const frase = textoAvisoFalha("api_indisponivel", "pt-BR");
    expect(frase).not.toContain("rejeit");
    expect(frase).toContain("indisponível");
    expect(frase).toContain("alguns minutos");
  });

  it("cota fala em limite e renovação, não em erro", () => {
    const frase = textoAvisoFalha("cota_excedida", "pt-BR");
    expect(frase).toContain("limite de uso");
    expect(frase).toContain("cota renovar");
  });

  // Único caso em que o sistema funcionou como devia — a frase explica a
  // proteção em vez de pedir paciência.
  it("rejeição do validador explica a proteção, sem pedir para tentar depois", () => {
    const frase = textoAvisoFalha("validador_rejeitou", "pt-BR");
    expect(frase).toContain("não batem com os seus dados");
    expect(frase).not.toContain("minutos");
  });

  it("modelo ausente assume a culpa em vez de sugerir que o dono errou", () => {
    expect(textoAvisoFalha("modelo_ausente", "pt-BR")).toContain("falha nossa");
  });

  // Pareceres anteriores à migration 0019 não têm motivo, e não dá pra
  // inventar retroativamente.
  it("sem motivo, cai na frase genérica — e ela continua verdadeira", () => {
    const frase = textoAvisoFalha(null, "pt-BR");
    expect(frase).toContain("Não foi possível gerar a interpretação");
    expect(frase).not.toContain("rejeit");
    expect(textoAvisoFalha(undefined, "pt-BR")).toBe(frase);
  });

  it("traduz nos três idiomas", () => {
    expect(textoAvisoFalha("api_indisponivel", "en")).toContain("service was unavailable");
    expect(textoAvisoFalha("api_indisponivel", "es")).toContain("no estaba disponible");
    expect(textoAvisoFalha("api_indisponivel", "pt-BR")).toContain("indisponível");
  });

  it("não deixa chave sem tradução em nenhum idioma", () => {
    for (const motivo of [...MOTIVOS, null]) {
      for (const idioma of ["en", "es"] as const) {
        // Sem entrada no dicionário, `t` devolve o próprio PT-BR — o que
        // apareceria como português no meio de uma tela em inglês.
        expect(textoAvisoFalha(motivo, idioma)).not.toBe(
          textoAvisoFalha(motivo, "pt-BR"),
        );
      }
    }
  });
});
