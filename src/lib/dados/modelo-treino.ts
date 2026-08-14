// lastro · SDD.md §9 — modelo de treino: lista de exercícios reaproveitável,
// nunca série/peso/reps (ADR-009/FF8, escopo aprovado em DECISIONS.md
// 2026-08-13). Online-only de propósito (§9.2) — nenhuma função aqui passa
// pela fila outbox; se a rede cair, a UI cai no fluxo atual sem modelo.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

async function usuarioAutenticadoOuErro() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }
  return { supabase, user };
}

export type Modelo = {
  id: string;
  nome: string;
};

export type ModeloComExercicios = Modelo & {
  exercicios: { exercicioId: string; nome: string }[];
};

/** Lista os modelos do usuário, mais recente primeiro — só nome e id (a
 * lista de `/ajustes/modelos` não precisa dos exercícios). */
export async function listarModelos(): Promise<Modelo[]> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("modelo_treino")
    .select("id, nome")
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao listar modelos: ${error.message}`);
  return data ?? [];
}

/** Busca um modelo com os exercícios que o compõem, na ordem salva. */
export async function buscarModelo(
  modeloId: string,
): Promise<ModeloComExercicios | null> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data: modelo, error: erroModelo } = await supabase
    .from("modelo_treino")
    .select("id, nome")
    .eq("id", modeloId)
    .maybeSingle();
  if (erroModelo) throw new Error(`Falha ao buscar modelo: ${erroModelo.message}`);
  if (!modelo) return null;

  const { data: itens, error: erroItens } = await supabase
    .from("modelo_treino_exercicio")
    .select("exercicio_id, exercicio:exercicio_id (nome)")
    .eq("modelo_treino_id", modeloId)
    .order("ordem", { ascending: true });
  if (erroItens) throw new Error(`Falha ao buscar exercícios do modelo: ${erroItens.message}`);

  type LinhaItem = { exercicio_id: string; exercicio: { nome: string } | null };

  return {
    id: modelo.id,
    nome: modelo.nome,
    exercicios: ((itens ?? []) as unknown as LinhaItem[]).map((i) => ({
      exercicioId: i.exercicio_id,
      nome: i.exercicio?.nome ?? "",
    })),
  };
}

/**
 * Cria um modelo com os exercícios escolhidos, na ordem em que vieram.
 * Só grava lista de exercícios — nunca série, peso, reps (ADR-009/FF8).
 */
export async function criarModelo(
  nome: string,
  exercicioIds: string[],
): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();

  const { data: modelo, error: erroModelo } = await supabase
    .from("modelo_treino")
    .insert({ usuario_id: user.id, nome })
    .select("id")
    .single();
  if (erroModelo) throw new Error(`Falha ao criar modelo: ${erroModelo.message}`);

  const itens = exercicioIds.map((exercicioId, indice) => ({
    modelo_treino_id: modelo.id,
    exercicio_id: exercicioId,
    ordem: indice + 1,
  }));
  const { error: erroItens } = await supabase
    .from("modelo_treino_exercicio")
    .insert(itens);
  if (erroItens) {
    throw new Error(`Falha ao gravar exercícios do modelo: ${erroItens.message}`);
  }

  revalidatePath("/ajustes/modelos");
}

/** Exclui um modelo (e seus itens, via cascade). Não afeta treino/série já
 * registrados a partir dele — não há vínculo entre as tabelas (SDD §9.4). */
export async function excluirModelo(modeloId: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { error } = await supabase.from("modelo_treino").delete().eq("id", modeloId);
  if (error) throw new Error(`Falha ao excluir modelo: ${error.message}`);
  revalidatePath("/ajustes/modelos");
}
