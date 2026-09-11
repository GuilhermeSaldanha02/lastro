import { describe, expect, it } from "vitest";
import { conteudoDoAlerta, rascunhoWhatsApp } from "./alerta-personal";
import type { AlertaPersonal } from "@/lib/analise/fila-personal";
import { linkWhatsApp } from "./whatsapp";

const SEM_ESTIMULO: AlertaPersonal = {
  tipo: "grupo_sem_estimulo",
  alvo: "COSTAS",
  prioridade: 730,
  evidencia: { tipo: "grupo_sem_estimulo", diasSemEstimulo: 30 },
};

const ESTAGNACAO: AlertaPersonal = {
  tipo: "estagnacao_exercicio",
  alvo: "Supino reto",
  prioridade: 440,
  evidencia: {
    tipo: "estagnacao_exercicio",
    semanasSemProgresso: 6,
    e1rmEstavelEm: 102.5,
  },
};

const QUEDA: AlertaPersonal = {
  tipo: "queda_volume",
  alvo: "volume_total",
  prioridade: 160,
  evidencia: {
    tipo: "queda_volume",
    semanas: 3,
    volumeInicial: 12480,
    volumeAtual: 6240,
    quedaPct: 50,
  },
};

const TODOS = [SEM_ESTIMULO, ESTAGNACAO, QUEDA];

describe("conteudoDoAlerta — a ordem que o P2 pediu", () => {
  it("os cinco campos existem e nenhum sai vazio", () => {
    for (const alerta of TODOS) {
      const c = conteudoDoAlerta(alerta, "João Pedro da Silva");
      for (const campo of [
        c.titulo,
        c.oQueAconteceu,
        c.haQuantoTempo,
        c.evidencia,
        c.possivelCausa,
        c.oQueInvestigar,
      ]) {
        expect(campo.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("trata o aluno pelo primeiro nome, não pelo nome completo", () => {
    const c = conteudoDoAlerta(SEM_ESTIMULO, "João Pedro da Silva");
    expect(c.oQueAconteceu).toContain("João");
    expect(c.oQueAconteceu).not.toContain("da Silva");
  });

  it("grupo muscular sai com rótulo legível, nunca a chave do banco", () => {
    const c = conteudoDoAlerta(SEM_ESTIMULO, "João");
    expect(c.titulo).toBe("Costas sem estímulo");
    expect(c.titulo).not.toContain("COSTAS");
  });

  it("o número da evidência é o que o agregador calculou, com milhar agrupado", () => {
    expect(conteudoDoAlerta(ESTAGNACAO, "João").evidencia).toContain("102,5 kg");
    const c = conteudoDoAlerta(QUEDA, "João");
    expect(c.evidencia).toContain("12.480 kg");
    expect(c.evidencia).toContain("6.240 kg");
    expect(c.evidencia).toContain("50%");
  });

  it("estagnação sem número algum não inventa número (Regra da Presença)", () => {
    const semNumero: AlertaPersonal = {
      ...ESTAGNACAO,
      evidencia: { tipo: "estagnacao_exercicio", semanasSemProgresso: 4 },
    };
    const c = conteudoDoAlerta(semNumero, "João");
    expect(c.evidencia).toBe(
      "O exercício continua sendo treinado, sem melhora medida.",
    );
    expect(c.evidencia).not.toMatch(/\d/);
  });

  it("cai no volume quando só o volume está presente", () => {
    const porVolume: AlertaPersonal = {
      ...ESTAGNACAO,
      evidencia: {
        tipo: "estagnacao_exercicio",
        semanasSemProgresso: 5,
        volumeEstavelEm: 2400,
      },
    };
    expect(conteudoDoAlerta(porVolume, "João").evidencia).toContain("2.400 kg");
  });

  it("o que investigar é PERGUNTA, nunca prescrição de treino (PRD §5)", () => {
    for (const alerta of TODOS) {
      const c = conteudoDoAlerta(alerta, "João");
      expect(c.oQueInvestigar.toLowerCase()).toMatch(
        /perguntar|confirmar|olhar/,
      );
      // Nenhum imperativo de programa: o app não manda trocar carga,
      // série ou exercício — quem prescreve é o personal.
      expect(c.oQueInvestigar.toLowerCase()).not.toMatch(
        /aumente|reduza|troque|substitua|prescreva|faça \d/,
      );
    }
  });

  it("singular e plural não saem quebrados", () => {
    const umDia: AlertaPersonal = {
      ...SEM_ESTIMULO,
      evidencia: { tipo: "grupo_sem_estimulo", diasSemEstimulo: 1 },
    };
    expect(conteudoDoAlerta(umDia, "João").haQuantoTempo).toBe("1 dia.");
    expect(conteudoDoAlerta(SEM_ESTIMULO, "João").haQuantoTempo).toBe("30 dias.");

    const umaSemana: AlertaPersonal = {
      ...ESTAGNACAO,
      evidencia: { tipo: "estagnacao_exercicio", semanasSemProgresso: 1 },
    };
    expect(conteudoDoAlerta(umaSemana, "João").haQuantoTempo).toBe("1 semana.");
  });

  /**
   * O app não sabe o gênero de ninguém, e não existe campo para isso.
   *
   * A primeira execução real (2026-09-11) chamou uma ALUNA de "dele" em
   * três linhas — "o histórico dele", "a rotina dele", "a ficha dele".
   * Passou por revisão de código e só apareceu quando um nome de mulher
   * entrou na tela. Este teste é o que impede a volta: toda linha usa o
   * nome da pessoa ou construção impessoal.
   *
   * A fronteira de palavra não é enfeite: sem ela, "janela" e "paralela"
   * casariam com "ela" e o teste reprovaria texto correto.
   */
  it("nenhum texto usa pronome de pessoa (ele/ela/dele/dela)", () => {
    const PRONOME = /\b(ele|ela|dele|dela|eles|elas|deles|delas)\b/i;
    for (const alerta of TODOS) {
      const conteudo = conteudoDoAlerta(alerta, "Alice Aluna");
      for (const [campo, texto] of Object.entries(conteudo)) {
        expect(
          PRONOME.test(texto),
          `${alerta.tipo}.${campo} usa pronome de pessoa: "${texto}"`,
        ).toBe(false);
      }
      expect(PRONOME.test(rascunhoWhatsApp(alerta, "Alice Aluna"))).toBe(false);
    }
  });
});

describe("rascunhoWhatsApp", () => {
  it("chama pelo primeiro nome e termina em pergunta aberta", () => {
    for (const alerta of TODOS) {
      const texto = rascunhoWhatsApp(alerta, "João Pedro da Silva");
      expect(texto.startsWith("Oi, João!")).toBe(true);
      expect(texto).toContain("?");
    }
  });

  it("cita o fato real, com o número real", () => {
    expect(rascunhoWhatsApp(SEM_ESTIMULO, "João")).toContain("30 dias");
    expect(rascunhoWhatsApp(SEM_ESTIMULO, "João")).toContain("costas");
    expect(rascunhoWhatsApp(ESTAGNACAO, "João")).toContain("Supino reto");
    expect(rascunhoWhatsApp(ESTAGNACAO, "João")).toContain("6 semanas");
    expect(rascunhoWhatsApp(QUEDA, "João")).toContain("3 semanas");
  });

  it("não menciona o lastro nem soa automático — a mensagem é do personal", () => {
    for (const alerta of TODOS) {
      const texto = rascunhoWhatsApp(alerta, "João").toLowerCase();
      expect(texto).not.toContain("lastro");
      expect(texto).not.toContain("automátic");
      expect(texto).not.toContain("sistema");
      expect(texto).not.toContain("alerta");
    }
  });

  /**
   * Regra 6 do CLAUDE.md. Vale para a mensagem do WhatsApp porque quem a
   * compõe é o app — é o lugar mais tentador do projeto para um emoji
   * aparecer "para ficar simpático".
   */
  it("zero emoji e zero emoticon", () => {
    for (const alerta of TODOS) {
      const texto = rascunhoWhatsApp(alerta, "João");
      expect(texto).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(texto).not.toMatch(/[:;]-?[()D]/);
      expect(conteudoDoAlerta(alerta, "João").titulo).not.toMatch(
        /\p{Extended_Pictographic}/u,
      );
    }
  });

  it("sobrevive à codificação da URL e cabe num link válido", () => {
    for (const alerta of TODOS) {
      const link = linkWhatsApp("5583999998888", rascunhoWhatsApp(alerta, "João"));
      expect(link).not.toBeNull();
      expect(link).toContain("%0A");
      // Um link gigante é recusado em silêncio por alguns clientes; o
      // rascunho precisa ser curto de verdade.
      expect(link!.length).toBeLessThan(1000);
    }
  });

  it("nome vazio não produz 'Oi, !'", () => {
    expect(rascunhoWhatsApp(SEM_ESTIMULO, "   ")).toContain("Oi, aluno!");
  });
});
