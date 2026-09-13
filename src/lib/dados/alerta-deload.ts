// lastro · Card determinístico de possível deload na Análise — mesma
// natureza do card de recência (`recencia-grupos.ts`): informação
// passiva, nunca escreve em `modelo_treino` nem decide o treino de hoje
// (PRD §5, ADR-010 "write-back só pelo caminho do +").
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { avaliarSinalDeload, type SinalDeload } from "@/lib/analise/alerta-deload";
import { semanaInicioDoTreino } from "@/lib/analise/semanas";
import type { SerieValendo } from "@/lib/analise/tipos";

type LinhaSerie = {
  rir: number | null;
  data_treino: { data: string } | { data: string }[] | null;
};

export async function carregarSinalDeload(agora: Date): Promise<SinalDeload | null> {
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
    .select("rir, data_treino:treino_id (data)")
    // Escopo explícito — ver a nota da migração 0022 em `resumo-home.ts`:
    // a RLS deixou de significar "só o meu" quando existe vínculo aceito.
    .eq("usuario_id", user.id)
    .eq("tipo", "valendo");
  if (error) {
    throw new Error(`Falha ao carregar sinal de deload: ${error.message}`);
  }

  const linhas = (data ?? []) as unknown as LinhaSerie[];

  const series: SerieValendo[] = linhas
    .map((l): SerieValendo | null => {
      const treino = Array.isArray(l.data_treino) ? l.data_treino[0] : l.data_treino;
      const dataTreino = treino?.data;
      if (!dataTreino) return null;
      return {
        treinoId: "",
        exercicioId: "",
        exercicio: "",
        grupoMuscular: "",
        unilateral: false,
        pesoPorLado: false,
        reps: 0,
        peso: 0,
        rir: l.rir === null ? undefined : l.rir,
        data: dataTreino,
        semanaInicio: semanaInicioDoTreino(dataTreino),
      };
    })
    .filter((s): s is SerieValendo => s !== null);

  return avaliarSinalDeload(series, agora);
}
