// lastro · backlog C3 — configuração de anilhas (peso da barra + inventário
// disponível), por usuário. Só leitura/escrita de config — a conta em si
// (calcularAnilhas) vive em src/lib/anilhas.ts, sem I/O.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export type ConfigAnilhas = {
  pesoBarra: number;
  anilhasDisponiveis: number[];
};

export async function obterConfigAnilhas(): Promise<ConfigAnilhas | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuario")
    .select("peso_barra, anilhas_disponiveis")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  return {
    pesoBarra: Number(data.peso_barra),
    anilhasDisponiveis: (data.anilhas_disponiveis as number[]).map(Number),
  };
}

/** `anilhasDisponiveis` sem duplicata, sem valor <= 0 — validado aqui e
 * não confiado à UI, já que é escrita direta na conta do usuário. */
export async function salvarConfigAnilhas(
  pesoBarra: number,
  anilhasDisponiveis: number[],
): Promise<void> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão ausente — usuário não autenticado.");

  if (!Number.isFinite(pesoBarra) || pesoBarra <= 0) {
    throw new Error("Peso da barra precisa ser um número positivo.");
  }
  const anilhasLimpa = Array.from(new Set(anilhasDisponiveis)).filter(
    (p) => Number.isFinite(p) && p > 0,
  );

  const { error } = await supabase
    .from("usuario")
    .update({ peso_barra: pesoBarra, anilhas_disponiveis: anilhasLimpa })
    .eq("id", user.id);
  if (error) throw new Error(`Falha ao salvar configuração: ${error.message}`);

  revalidatePath("/ajustes/anilhas");
}
