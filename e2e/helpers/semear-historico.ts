// lastro · Fase 6 (E2E) — semear histórico pra J2 (Análise).
//
// `AnaliseInterativa` só libera pergunta com `semanasFechadasComTreino >=
// MINIMO_SEMANAS_PARECER` (3, src/lib/analise/limiares.ts) — sem isso a
// tela mostra o aviso "faltam N semanas" e o botão fica inativo. Como
// esse mínimo é sobre SEMANAS FECHADAS (não a atual, ver
// `src/lib/dados/resumo-home.ts`), 4 treinos com 7 dias de intervalo,
// todos no passado, caem em 4 semanas fechadas distintas — folga de 1
// sobre o mínimo.
import type { SupabaseClient } from "@supabase/supabase-js";

function dataISOHaDias(dias: number): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() - dias);
  return data.toISOString().slice(0, 10);
}

/** Insere 4 treinos (um por semana fechada) com 1 série "valendo" cada, direto via admin — sem passar pela UI. */
export async function semearHistoricoParaAnalise(
  admin: SupabaseClient,
  usuarioId: string,
): Promise<void> {
  const { data: exercicios, error: erroExercicio } = await admin
    .from("exercicio")
    .select("id")
    .limit(1);
  if (erroExercicio || !exercicios?.[0]) {
    throw new Error(
      `Falha ao ler catálogo pra semear histórico: ${erroExercicio?.message ?? "catálogo vazio"}`,
    );
  }
  const exercicioId = exercicios[0].id as string;

  for (const dias of [28, 21, 14, 7]) {
    const { data: treino, error: erroTreino } = await admin
      .from("treino")
      .insert({ usuario_id: usuarioId, data: dataISOHaDias(dias) })
      .select("id")
      .single();
    if (erroTreino || !treino) {
      throw new Error(`Falha ao semear treino (${dias}d atrás): ${erroTreino?.message}`);
    }

    const { error: erroSerie } = await admin.from("serie").insert({
      usuario_id: usuarioId,
      treino_id: treino.id,
      exercicio_id: exercicioId,
      ordem: 1,
      tipo: "valendo",
      reps: 8,
      peso: 40,
      rir: 2,
    });
    if (erroSerie) {
      throw new Error(`Falha ao semear série (${dias}d atrás): ${erroSerie.message}`);
    }
  }
}
