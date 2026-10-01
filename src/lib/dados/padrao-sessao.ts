// lastro · AN-08 B1 — as sessões ANTERIORES a um treino, para o relatório
// pós-treino comparar o volume com o padrão do próprio usuário.
//
// Só a régua vem do servidor. O volume da sessão que acabou de terminar é
// calculado no aparelho, com as séries da tela: parte delas pode ainda estar
// na fila offline, e a soma do servidor diria outro número.
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { volumeDeSerie } from "@/lib/analise/volume";
import type { SessaoParaPadrao } from "@/lib/analise/fora-do-padrao";

/** Folga para achar 6 sessões de cada tipo mesmo com dias de outro tipo no meio. */
const LIMITE_TREINOS = 60;

type LinhaTreino = {
  id: string;
  data: string;
  serie:
    | {
        tipo: "aquecimento" | "valendo";
        reps: number;
        peso: number;
        peso_por_lado: boolean;
        exercicio: { grupo_muscular_primario: string; unilateral: boolean } | null;
      }[]
    | null;
};

export type PadraoDaSessao = { data: string; anteriores: SessaoParaPadrao[] };

/** `null` sem sessão, com treino alheio ou em falha: a tela então não mostra o bloco. */
export async function carregarPadraoDaSessao(treinoId: string): Promise<PadraoDaSessao | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // ESCOPO EXPLÍCITO nas duas leituras: desde a migração 0022 o personal
  // com vínculo também enxerga treino do aluno pela RLS.
  const { data: treino } = await supabase
    .from("treino")
    .select("id, data")
    .eq("id", treinoId)
    .eq("usuario_id", user.id)
    .maybeSingle();
  if (!treino) return null;

  const { data, error } = await supabase
    .from("treino")
    .select(
      "id, data, serie (tipo, reps, peso, peso_por_lado, exercicio:exercicio_id (grupo_muscular_primario, unilateral))",
    )
    .eq("usuario_id", user.id)
    .neq("id", treinoId)
    .lte("data", treino.data)
    .order("data", { ascending: false })
    .order("iniciado_em", { ascending: false })
    .limit(LIMITE_TREINOS);
  if (error) {
    console.error("[padrao-sessao] falha ao ler sessões anteriores:", error.message);
    return null;
  }

  const anteriores = ((data ?? []) as unknown as LinhaTreino[])
    .map((t) => {
      const valendo = (t.serie ?? []).filter((s) => s.tipo === "valendo");
      return {
        treinoId: t.id,
        data: t.data,
        grupos: Array.from(
          new Set(valendo.map((s) => s.exercicio?.grupo_muscular_primario).filter((g): g is string => Boolean(g))),
        ),
        volume: valendo.reduce(
          (soma, s) =>
            soma +
            volumeDeSerie({
              reps: s.reps,
              peso: Number(s.peso),
              unilateral: s.exercicio?.unilateral ?? false,
              pesoPorLado: s.peso_por_lado,
            }),
          0,
        ),
      };
    })
    .filter((s) => s.volume > 0);

  return { data: treino.data as string, anteriores };
}
