/**
 * lastro · testes da reserva de cota de IA (0020 e PU-04).
 *
 * A regra que estes testes protegem: quando a reserva falha por erro NOSSO
 * (banco fora, resposta torta), a IA é liberada. Negar a peça-assinatura por
 * causa de um erro nosso é pior do que gastar uma chamada a mais, e a
 * inversão só apareceria no dia em que o Supabase estivesse fora do ar.
 */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reservarUso } from "./uso-ia";

function clienteQueDevolve(resposta: { data?: unknown; error?: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue({ data: resposta.data ?? null, error: resposta.error ?? null });
  return { cliente: { rpc } as unknown as SupabaseClient, rpc };
}

describe("reservarUso", () => {
  it("chama a função do banco com a origem", async () => {
    const { cliente, rpc } = clienteQueDevolve({ data: { status: "ok", limite: 3 } });
    expect(await reservarUso(cliente, "coach")).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("reservar_uso_ia", { p_origem: "coach" });
  });

  it.each(["conta", "global", "minuto"] as const)("recusa com o motivo %s e o limite da conta", async (motivo) => {
    const { cliente } = clienteQueDevolve({ data: { status: motivo, limite: 2 } });
    expect(await reservarUso(cliente, "parecer")).toEqual({ ok: false, motivo, limite: 2 });
  });

  it("erro do banco DEIXA PASSAR", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cliente } = clienteQueDevolve({ error: { message: "banco fora" } });
    expect(await reservarUso(cliente, "coach")).toEqual({ ok: true });
  });

  it("resposta vazia ou status desconhecido DEIXA PASSAR", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await reservarUso(clienteQueDevolve({ data: null }).cliente, "coach")).toEqual({ ok: true });
    expect(await reservarUso(clienteQueDevolve({ data: { status: "???" } }).cliente, "coach")).toEqual({ ok: true });
  });
});
