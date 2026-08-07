// lastro · resumo da home. Conta determinística sobre o dado real do
// dono — NENHUMA chamada de IA, nenhum valor de exemplo (E3, PRD §7/A6).
// Se não há treino, os números vêm zerados e a tela diz isso; nunca
// inventa "Novo PR em Agachamento" para a tela parecer cheia.
//
// Reusa `calcularVolume` de `src/lib/analise/` — a MESMA função que
// alimenta a Análise Semanal. Duplicar a aritmética de volume aqui seria
// criar uma segunda fonte de verdade que diverge silenciosamente.
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { calcularVolume } from "@/lib/analise/volume";
import { semanaInicioDoTreino, semanaAnaliseAtual, paraISO, segundaFeiraDaSemana } from "@/lib/analise/semanas";
import type { SerieValendo } from "@/lib/analise/tipos";

export type TreinoRecente = {
  id: string;
  data: string;
  totalSeries: number;
  volume: number;
};

export type ResumoHome = {
  /** Treinos feitos na semana ISO em andamento (não a última fechada). */
  treinosNaSemana: number;
  /** Volume das séries valendo da semana em andamento. */
  volumeNaSemana: number;
  /** Séries valendo na semana em andamento. Aquecimento não conta (A2). */
  seriesValendoNaSemana: number;
  /** Os 3 treinos mais recentes, para a lista de atividade. */
  recentes: TreinoRecente[];
  /** Quantas semanas ISO fechadas já têm treino — a Análise precisa disso. */
  semanasFechadasComTreino: number;
  /** Se já existe um treino iniciado hoje, a home leva direto pra ele. */
  treinoDeHojeId: string | null;
};

type LinhaSerie = {
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  peso_corporal_incluso: boolean;
  exercicio: { grupo_muscular_primario: string; unilateral: boolean } | null;
};

type LinhaTreino = {
  id: string;
  data: string;
  serie: LinhaSerie[] | null;
};

export async function carregarResumoHome(hojeISO: string): Promise<ResumoHome> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();
  if (erroAuth || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("treino")
    .select(
      "id, data, serie (tipo, reps, peso, peso_corporal_incluso, exercicio:exercicio_id (grupo_muscular_primario, unilateral))",
    )
    .order("data", { ascending: false });
  if (error) throw new Error(`Falha ao carregar o resumo: ${error.message}`);

  const treinos = (data ?? []) as unknown as LinhaTreino[];
  const semanaCorrente = paraISO(segundaFeiraDaSemana(new Date(`${hojeISO}T00:00:00Z`)));
  const ultimaSemanaFechada = semanaAnaliseAtual(new Date(`${hojeISO}T00:00:00Z`));

  /** Converte as séries VALENDO de um treino para o formato do agregador. */
  function valendoDoTreino(treino: LinhaTreino): SerieValendo[] {
    return (treino.serie ?? [])
      .filter((s) => s.tipo === "valendo")
      .map((s) => ({
        treinoId: treino.id,
        exercicioId: "",
        exercicio: "",
        grupoMuscular: s.exercicio?.grupo_muscular_primario ?? "",
        unilateral: s.exercicio?.unilateral ?? false,
        reps: s.reps,
        peso: Number(s.peso),
        pesoCorporalIncluso: s.peso_corporal_incluso,
        data: treino.data,
        semanaInicio: semanaInicioDoTreino(treino.data),
      })) as SerieValendo[];
  }

  // Treino sem NENHUMA série (aquecimento ou valendo) não é um treino
  // feito — é uma linha criada por um clique em "Iniciar treino de hoje"
  // que ainda não virou nada. Não conta em nenhuma estatística nem
  // aparece em "recentes" (achado do dono, 2026-08-07): só o treino de
  // hoje (`treinoDeHojeId`, abaixo) permanece visível vazio, porque é o
  // link de "continuar" pra ele.
  const comSerie = treinos.filter((t) => (t.serie?.length ?? 0) > 0);

  const daSemana = comSerie.filter(
    (t) => semanaInicioDoTreino(t.data) === semanaCorrente,
  );
  const valendoDaSemana = daSemana.flatMap(valendoDoTreino);

  const semanasComTreino = new Set(
    comSerie
      .map((t) => semanaInicioDoTreino(t.data))
      .filter((semana) => semana <= ultimaSemanaFechada),
  );

  return {
    treinosNaSemana: daSemana.length,
    volumeNaSemana: calcularVolume(valendoDaSemana),
    seriesValendoNaSemana: valendoDaSemana.length,
    recentes: comSerie.slice(0, 3).map((t) => ({
      id: t.id,
      data: t.data,
      totalSeries: (t.serie ?? []).length,
      volume: calcularVolume(valendoDoTreino(t)),
    })),
    semanasFechadasComTreino: semanasComTreino.size,
    treinoDeHojeId: treinos.find((t) => t.data === hojeISO)?.id ?? null,
  };
}
