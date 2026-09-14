// lastro · backlog C3 — configuração de anilhas (peso da barra + inventário
// disponível), por usuário. Só leitura/escrita de config — a conta em si
// (calcularAnilhas) vive em src/lib/anilhas.ts, sem I/O.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { normalizarPesoKg } from "@/lib/anilhas";

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

/** `anilhasDisponiveis` sem duplicata, sem valor fora da faixa — validado aqui e
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

  // Arredondado ANTES de validar, como o `numeric(6,2)` vai guardar (achado
  // B5): checar `> 0` no número cru deixava 0,001 virar 0 kg no banco.
  const barra = normalizarPesoKg(pesoBarra);
  if (barra === null) {
    throw new Error("Peso da barra fora da faixa de 0,01 a 9999,99 kg.");
  }
  // Deduplica DEPOIS de arredondar: 1,25 e 1,251 são a mesma anilha no banco.
  const anilhasLimpa = Array.from(
    new Set(anilhasDisponiveis.map(normalizarPesoKg).filter((p): p is number => p !== null)),
  );

  const { error } = await supabase
    .from("usuario")
    .update({ peso_barra: barra, anilhas_disponiveis: anilhasLimpa })
    .eq("id", user.id);
  if (error) throw new Error(`Falha ao salvar configuração: ${error.message}`);

  revalidatePath("/ajustes/anilhas");
}
