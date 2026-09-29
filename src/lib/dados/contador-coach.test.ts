import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { registrarResolucaoCoach } from "./contador-coach";

function clienteCom(rpc: ReturnType<typeof vi.fn>): SupabaseClient {
  return { rpc } as unknown as SupabaseClient;
}

describe("registrarResolucaoCoach", () => {
  it("chama a função do banco só com intent e destino (sem usuário, sem texto)", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await registrarResolucaoCoach(clienteCom(rpc), "VOLUME_GRUPO", "local");
    expect(rpc).toHaveBeenCalledWith("registrar_resolucao_coach", { p_intent: "VOLUME_GRUPO", p_destino: "local" });
  });

  it("nunca derruba a resposta: erro do banco ou exceção são engolidos", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const comErro = vi.fn().mockResolvedValue({ error: { message: "check violado" } });
    await expect(registrarResolucaoCoach(clienteCom(comErro), "ABERTA", "gemini")).resolves.toBeUndefined();
    const lancando = vi.fn().mockRejectedValue(new Error("rede"));
    await expect(registrarResolucaoCoach(clienteCom(lancando), "ABERTA", "limite")).resolves.toBeUndefined();
  });
});
