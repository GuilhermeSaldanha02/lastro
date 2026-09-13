// lastro · Card determinístico "grupos sem estímulo recente" na Análise —
// não passa pela Gemini, não precisa ser pedido: aparece sozinho, do jeito
// que o dono pediu (2026-08-28). Só lê `serie`/`treino`, nunca
// `modelo_treino` (ADR-009/010, FF8) — é informação passiva, o app não
// decide o treino de hoje por conta própria (PRD §5).
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { diasSemEstimuloPorGrupo, type GrupoComRecencia } from "@/lib/analise/recencia";

type LinhaSerie = {
  data_treino: { data: string } | { data: string }[] | null;
  exercicio: { grupo_muscular_primario: string } | { grupo_muscular_primario: string }[] | null;
};

export async function carregarDiasSemEstimuloPorGrupo(
  hojeISO: string,
): Promise<GrupoComRecencia[]> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();
  if (erroAuth || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("serie")
    .select(
      "data_treino:treino_id (data), exercicio:exercicio_id (grupo_muscular_primario)",
    )
    // Escopo explícito — ver a nota da migração 0022 em `resumo-home.ts`.
    .eq("usuario_id", user.id)
    .eq("tipo", "valendo");
  if (error) {
    throw new Error(`Falha ao carregar recência por grupo: ${error.message}`);
  }

  const linhas = (data ?? []) as unknown as LinhaSerie[];

  const series = linhas.map((l) => {
    const treino = Array.isArray(l.data_treino) ? l.data_treino[0] : l.data_treino;
    const exercicio = Array.isArray(l.exercicio) ? l.exercicio[0] : l.exercicio;
    return {
      grupoMuscular: exercicio?.grupo_muscular_primario ?? "",
      data: treino?.data ?? "",
    };
  });

  return diasSemEstimuloPorGrupo(series, hojeISO);
}
