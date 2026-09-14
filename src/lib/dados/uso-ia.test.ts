/**
 * lastro · testes do teto diário de uso da IA (migration 0020).
 *
 * O que estes testes protegem, e por quê: a regra de "deixar passar
 * quando a contagem falha" é uma decisão de produto, não um detalhe —
 * negar a peça-assinatura por causa de um erro nosso é pior do que
 * gastar uma chamada a mais. Ela é fácil de inverter sem querer numa
 * refatoração, e a inversão só apareceria no dia em que o Supabase
 * estivesse fora do ar. Daí o teste.
 */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TETO_DIARIO,
  consumirUso,
  contarUsoHoje,
  registrarUso,
  tetoAtingido,
} from "./uso-ia";

/**
 * Supabase falso do tamanho exato do que o módulo usa: a cadeia
 * `.from().select().eq().eq().gte()` e o `.from().insert()`. Devolve
 * também os filtros aplicados, para o teste do recorte de dia poder
 * olhar o `gte` que foi montado.
 */
function supabaseFalso(resultado: {
  count?: number | null;
  error?: { message: string } | null;
}) {
  const filtros: Record<string, unknown> = {};
  const inseridos: unknown[] = [];
  const consulta = {
    eq(coluna: string, valor: unknown) {
      filtros[coluna] = valor;
      return consulta;
    },
    gte(coluna: string, valor: unknown) {
      filtros[coluna] = valor;
      return Promise.resolve({
        count: resultado.count ?? null,
        error: resultado.error ?? null,
      });
    },
  };
  const cliente = {
    from() {
      return {
        select: () => consulta,
        insert: (linha: unknown) => {
          inseridos.push(linha);
          return Promise.resolve({ error: resultado.error ?? null });
        },
      };
    },
  };
  return { cliente: cliente as unknown as SupabaseClient, filtros, inseridos };
}

describe("contarUsoHoje", () => {
  it("filtra por usuário, origem e início do dia local do Brasil", async () => {
    const { cliente, filtros } = supabaseFalso({ count: 3 });

    expect(await contarUsoHoje(cliente, "u1", "coach")).toBe(3);
    expect(filtros.usuario_id).toBe("u1");
    expect(filtros.origem).toBe("coach");
    // O recorte é meia-noite de Brasília, não de UTC: às 22h daqui já é
    // o dia seguinte em UTC e a cota renovaria três horas cedo demais.
    expect(filtros.criado_em).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00-03:00$/);
  });

  it("devolve 0 quando a tabela está vazia (count nulo)", async () => {
    const { cliente } = supabaseFalso({ count: null });
    expect(await contarUsoHoje(cliente, "u1", "parecer")).toBe(0);
  });

  it("devolve null quando a contagem falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cliente } = supabaseFalso({ error: { message: "sem rede" } });
    expect(await contarUsoHoje(cliente, "u1", "parecer")).toBeNull();
  });
});

describe("tetoAtingido", () => {
  it("libera enquanto está abaixo do teto", async () => {
    const { cliente } = supabaseFalso({ count: TETO_DIARIO.coach - 1 });
    expect(await tetoAtingido(cliente, "u1", "coach")).toBe(false);
  });

  it("bloqueia no teto — o limite é inclusivo", async () => {
    const { cliente } = supabaseFalso({ count: TETO_DIARIO.coach });
    expect(await tetoAtingido(cliente, "u1", "coach")).toBe(true);
  });

  it("DEIXA PASSAR quando a contagem falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cliente } = supabaseFalso({ error: { message: "sem rede" } });
    expect(await tetoAtingido(cliente, "u1", "coach")).toBe(false);
  });
});

describe("registrarUso", () => {
  it("grava usuário e origem", async () => {
    const { cliente, inseridos } = supabaseFalso({});
    await registrarUso(cliente, "u1", "parecer");
    expect(inseridos).toEqual([{ usuario_id: "u1", origem: "parecer" }]);
  });

  it("não lança quando o registro falha — a chamada não pode ser perdida por causa do log", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cliente } = supabaseFalso({ error: { message: "sem rede" } });
    await expect(registrarUso(cliente, "u1", "coach")).resolves.toBeUndefined();
  });
});

/** Supabase falso só com `.rpc()`, guardando o que foi pedido. */
function supabaseComRpc(resposta: { data?: unknown; error?: { message: string } | null }) {
  const chamadas: { nome: string; args: unknown }[] = [];
  const cliente = {
    rpc(nome: string, args: unknown) {
      chamadas.push({ nome, args });
      return Promise.resolve({ data: resposta.data ?? null, error: resposta.error ?? null });
    },
  };
  return { cliente: cliente as unknown as SupabaseClient, chamadas };
}

describe("consumirUso (reserva atômica, migração 20260914024607)", () => {
  it("pede ao banco a vaga com o teto da origem", async () => {
    const { cliente, chamadas } = supabaseComRpc({ data: true });
    await consumirUso(cliente, "coach");
    expect(chamadas).toEqual([
      { nome: "consumir_uso_ia", args: { p_origem: "coach", p_teto: TETO_DIARIO.coach } },
    ]);
  });

  it("devolve true quando o banco reservou a vaga", async () => {
    const { cliente } = supabaseComRpc({ data: true });
    expect(await consumirUso(cliente, "coach")).toBe(true);
  });

  it("devolve false quando o banco diz que o teto foi atingido", async () => {
    const { cliente } = supabaseComRpc({ data: false });
    expect(await consumirUso(cliente, "coach")).toBe(false);
  });

  it("DEIXA PASSAR quando a chamada ao banco falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cliente } = supabaseComRpc({ error: { message: "sem rede" } });
    expect(await consumirUso(cliente, "coach")).toBe(true);
  });
});

describe("TETO_DIARIO", () => {
  it("soma abaixo da cota diária de 20 da Gemini, com folga", () => {
    // A folga cobre retry de 503 (que gasta chamada), troca de modelo e
    // chamada de desenvolvimento. Se alguém subir um teto sem pensar na
    // soma, este teste cai.
    expect(TETO_DIARIO.parecer + TETO_DIARIO.coach).toBeLessThanOrEqual(15);
  });
});
