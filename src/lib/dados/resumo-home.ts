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
import { calcularSequenciaAtual } from "@/lib/analise/sequencia";
import { calcularSeriesPorGrupo } from "@/lib/analise/equilibrio";
import { semanaInicioDoTreino, semanaAnaliseAtual, paraISO, segundaFeiraDaSemana } from "@/lib/analise/semanas";
import type { SerieValendo } from "@/lib/analise/tipos";

/**
 * Quantos treinos entram no gráfico de barras da Home. Oito cabe na
 * largura de 360px sem barra virar risco, e cobre ~2 semanas de treino
 * regular. Não confundir com os 3 da lista de "Treinos Recentes".
 */
const MAX_BARRAS_HOME = 8;

export type TreinoRecente = {
  id: string;
  data: string;
  totalSeries: number;
  volume: number;
  gruposMusculares: string[];
};

export type ResumoHome = {
  /** Treinos feitos na semana ISO em andamento (não a última fechada). */
  treinosNaSemana: number;
  /** Volume das séries valendo da semana em andamento. */
  volumeNaSemana: number;
  /** Séries valendo na semana em andamento. Aquecimento não conta (A2). */
  seriesValendoNaSemana: number;
  /** Datas ISO dos treinos realizados nesta semana. */
  diasComTreinoNaSemana: string[];
  /**
   * Dias de calendário consecutivos treinados, terminando hoje ou ontem.
   * NÃO é `treinosNaSemana` — ver `analise/sequencia.ts` e o achado de
   * 2026-08-21 que separou as duas coisas.
   */
  sequenciaAtual: number;
  /**
   * Últimos treinos em ordem cronológica (antigo → recente), para o
   * gráfico de barras da Home. Vem do mesmo `select` já feito: nenhuma
   * requisição extra. Lista vazia quando não há treino — a Home não
   * desenha barra nenhuma nesse caso, porque ausência de dado tem que
   * parecer ausência.
   */
  historicoBarras: { data: string; volume: number; series: number }[];
  /**
   * Séries valendo por grupo muscular na semana em andamento, do mais
   * treinado para o menos. Alimenta a aba "Grupos" da Home.
   */
  seriesPorGrupo: { grupo: string; series: number }[];
  /** Os 3 treinos mais recentes, para a lista de atividade com grupos musculares. */
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
    diasComTreinoNaSemana: Array.from(new Set(daSemana.map((t) => t.data))),
    sequenciaAtual: calcularSequenciaAtual(
      comSerie.map((t) => t.data),
      hojeISO,
    ),
    // `comSerie` vem ordenado por data DESC — as barras leem da esquerda
    // (mais antigo) para a direita (mais recente), então inverte.
    historicoBarras: comSerie
      .slice(0, MAX_BARRAS_HOME)
      .map((t) => {
        const valendo = valendoDoTreino(t);
        return {
          data: t.data,
          volume: calcularVolume(valendo),
          series: valendo.length,
        };
      })
      .reverse(),
    seriesPorGrupo: calcularSeriesPorGrupo(valendoDaSemana),
    recentes: comSerie.slice(0, 3).map((t) => {
      const grupos = Array.from(
        new Set(
          (t.serie ?? [])
            .map((s) => s.exercicio?.grupo_muscular_primario)
            .filter((g): g is string => Boolean(g)),
        ),
      );
      return {
        id: t.id,
        data: t.data,
        totalSeries: (t.serie ?? []).length,
        volume: calcularVolume(valendoDoTreino(t)),
        gruposMusculares: grupos,
      };
    }),
    semanasFechadasComTreino: semanasComTreino.size,
    treinoDeHojeId: treinos.find((t) => t.data === hojeISO)?.id ?? null,
  };
}
