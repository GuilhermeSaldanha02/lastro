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

/**
 * Plano de um exercício dentro do modelo (ADR-010, 2026-08-27).
 *
 * `reps`/`peso` são `null` quando o dono ainda não cadastrou — e `null` é
 * significado, não ausência de dado a ser preenchida com zero: a UI cai no
 * histórico real do exercício. Modelo criado antes desta mudança chega
 * inteiro com `null` e continua funcionando.
 */
export type ExercicioDoModelo = {
  exercicioId: string;
  nome: string;
  reps: number | null;
  peso: number | null;
};

export type ModeloComExercicios = Modelo & {
  exercicios: ExercicioDoModelo[];
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
    .select("exercicio_id, reps, peso, exercicio:exercicio_id (nome)")
    .eq("modelo_treino_id", modeloId)
    .order("ordem", { ascending: true });
  if (erroItens) throw new Error(`Falha ao buscar exercícios do modelo: ${erroItens.message}`);

  type LinhaItem = {
    exercicio_id: string;
    reps: number | null;
    peso: number | string | null;
    exercicio: { nome: string } | null;
  };

  return {
    id: modelo.id,
    nome: modelo.nome,
    exercicios: ((itens ?? []) as unknown as LinhaItem[]).map((i) => ({
      exercicioId: i.exercicio_id,
      nome: i.exercicio?.nome ?? "",
      reps: i.reps,
      // `numeric` do Postgres chega como string no supabase-js — converter
      // aqui evita "60.00" virando texto num campo numérico da tela.
      peso: i.peso === null ? null : Number(i.peso),
    })),
  };
}

/**
 * Cria um modelo com os exercícios escolhidos, na ordem em que vieram.
 * Só grava lista de exercícios — nunca série, peso, reps (ADR-009/FF8).
 */
/** Um exercício a gravar no modelo. `reps`/`peso` ausentes = não cadastrados. */
export type PlanoDoExercicio = {
  exercicioId: string;
  reps?: number | null;
  peso?: number | null;
};

export async function criarModelo(
  nome: string,
  plano: PlanoDoExercicio[],
): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();

  const { data: modelo, error: erroModelo } = await supabase
    .from("modelo_treino")
    .insert({ usuario_id: user.id, nome })
    .select("id")
    .single();
  if (erroModelo) throw new Error(`Falha ao criar modelo: ${erroModelo.message}`);

  const itens = plano.map((item, indice) => ({
    modelo_treino_id: modelo.id,
    exercicio_id: item.exercicioId,
    ordem: indice + 1,
    // `null` explícito, nunca 0: ADR-010 trata ausência como "cai no
    // histórico real", e 0 seria um número que ninguém escolheu.
    reps: item.reps ?? null,
    peso: item.peso ?? null,
  }));
  const { error: erroItens } = await supabase
    .from("modelo_treino_exercicio")
    .insert(itens);
  if (erroItens) {
    // Achado M4 (QA, 2026-09-13): cabeçalho e itens são dois inserts, sem
    // transação. Se os itens falham, o cabeçalho já existe — sobrava um
    // modelo com 0 exercícios na lista a cada tentativa. Desfaz aqui; o
    // `on delete cascade` não tem o que levar, e a RLS só deixa apagar o
    // próprio modelo.
    const { error: erroDesfazer } = await supabase.from("modelo_treino").delete().eq("id", modelo.id);
    if (erroDesfazer) {
      console.error("[modelo] não desfez o modelo sem exercícios:", erroDesfazer.message);
    }
    throw new Error(`Falha ao gravar exercícios do modelo: ${erroItens.message}`);
  }

  revalidatePath("/ajustes/modelos");
}

/**
 * Grava de volta no modelo a carga/reps que a pessoa ajustou durante o
 * treino (ADR-010, limite 3: só pelo caminho do `+`, nunca em toda
 * alteração de série).
 *
 * **Nunca lança.** É deliberado, e é o limite 4 da ADR-010: registrar
 * série é offline-first (D6) e `modelo_treino` é online-only (SDD §9.2).
 * Se a rede caiu ou a escrita falhou, a série JÁ foi registrada e o treino
 * não pode parar por causa da atualização de um plano. Devolve `false` para
 * quem quiser saber, e ninguém é obrigado a olhar.
 *
 * O `update` no banco só alcança `reps`/`peso` — o grant é por coluna
 * (migração 0015), então nem um bug aqui consegue reordenar o modelo.
 */
export async function atualizarPlanoDoExercicio(
  modeloId: string,
  exercicioId: string,
  reps: number,
  peso: number,
): Promise<boolean> {
  try {
    const { supabase } = await usuarioAutenticadoOuErro();
    const { error } = await supabase
      .from("modelo_treino_exercicio")
      .update({ reps, peso })
      .eq("modelo_treino_id", modeloId)
      .eq("exercicio_id", exercicioId);
    if (error) {
      console.warn("[modelo] não gravou o plano de volta:", error.message);
      return false;
    }
    return true;
  } catch (erro) {
    console.warn("[modelo] não gravou o plano de volta:", erro);
    return false;
  }
}

/** Exclui um modelo (e seus itens, via cascade). Não afeta treino/série já
 * registrados a partir dele — não há vínculo entre as tabelas (SDD §9.4). */
export async function excluirModelo(modeloId: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { error } = await supabase.from("modelo_treino").delete().eq("id", modeloId);
  if (error) throw new Error(`Falha ao excluir modelo: ${error.message}`);
  revalidatePath("/ajustes/modelos");
}
