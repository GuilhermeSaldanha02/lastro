// lastro · dado para o gráfico de progressão (DESIGN.md §3.7), companhia
// visual da Análise Semanal. NENHUMA chamada de IA aqui — é a mesma conta
// determinística que já alimenta a home e a Análise (E3, PRD §7/A6).
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import {
  calcularSeriesSemanais,
  detectarPlato,
  type Plato,
  type PontoSemanal,
} from "@/lib/analise/progressao";
import {
  listarSemanas,
  semanaAnaliseAtual,
  semanaInicioDoTreino,
} from "@/lib/analise/semanas";
import type { SerieValendo } from "@/lib/analise/tipos";

export type OpcaoExercicio = { id: string; nome: string };

/** Um painel do gráfico (DESIGN.md §3.7.1) — um exercício, sua própria escala. */
export type PainelProgressao = {
  exercicio: OpcaoExercicio;
  pontos: PontoSemanal[];
  plato: Plato | null;
};

const TETO_PAINEIS = 4;

type LinhaSerie = {
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  peso_corporal_incluso: boolean;
  exercicio_id: string;
  exercicio: {
    nome: string;
    grupo_muscular_primario: string;
    unilateral: boolean;
  } | null;
};

type LinhaTreino = {
  id: string;
  data: string;
  serie: LinhaSerie[] | null;
};

const SEMANAS_HISTORICO = 12;

/**
 * Carrega até `TETO_PAINEIS` painéis de progressão (DESIGN.md §3.7.3) —
 * os exercícios com mais sessões no período, cada um com pelo menos 2
 * semanas elegíveis para e1RM (T-E6: 1 sessão não conta progressão,
 * precisa de pelo menos 2 pra ter delta). Sem seletor — a lista inteira
 * já vem pronta pra desenhar, sem escolha do usuário (§3.7, redesenho
 * 2026-08-14).
 */
export async function carregarProgressao(): Promise<PainelProgressao[]> {
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
      "id, data, serie (tipo, reps, peso, peso_corporal_incluso, exercicio_id, exercicio:exercicio_id (nome, grupo_muscular_primario, unilateral))",
    );
  if (error) throw new Error(`Falha ao carregar a progressão: ${error.message}`);

  const treinos = (data ?? []) as unknown as LinhaTreino[];

  const seriesValendo: SerieValendo[] = treinos.flatMap((treino) =>
    (treino.serie ?? [])
      .filter((s) => s.tipo === "valendo" && s.exercicio)
      .map((s) => ({
        treinoId: treino.id,
        exercicioId: s.exercicio_id,
        exercicio: s.exercicio!.nome,
        grupoMuscular: s.exercicio!.grupo_muscular_primario,
        unilateral: s.exercicio!.unilateral,
        reps: s.reps,
        peso: Number(s.peso),
        pesoCorporalIncluso: s.peso_corporal_incluso,
        data: treino.data,
        semanaInicio: semanaInicioDoTreino(treino.data),
      })),
  );

  if (seriesValendo.length === 0) return [];

  const ultimaSemanaFechada = semanaAnaliseAtual(new Date());
  const semanas = listarSemanas(ultimaSemanaFechada, SEMANAS_HISTORICO);
  const semanasDoPeriodo = new Set(semanas);

  // Exercício -> nome e sessões distintas (treinos) — total e dentro do
  // período mostrado, separadas (mesma razão de antes: o ranking prioriza
  // quem tem sessão DENTRO das SEMANAS_HISTORICO semanas visíveis, com
  // fallback pro histórico todo pra quem não tem nenhuma no período).
  const sessoesPorExercicio = new Map<string, Set<string>>();
  const sessoesNoPeriodoPorExercicio = new Map<string, Set<string>>();
  const nomePorExercicio = new Map<string, string>();
  for (const s of seriesValendo) {
    nomePorExercicio.set(s.exercicioId, s.exercicio);
    if (!sessoesPorExercicio.has(s.exercicioId)) {
      sessoesPorExercicio.set(s.exercicioId, new Set());
    }
    sessoesPorExercicio.get(s.exercicioId)!.add(s.treinoId);

    if (semanasDoPeriodo.has(s.semanaInicio)) {
      if (!sessoesNoPeriodoPorExercicio.has(s.exercicioId)) {
        sessoesNoPeriodoPorExercicio.set(s.exercicioId, new Set());
      }
      sessoesNoPeriodoPorExercicio.get(s.exercicioId)!.add(s.treinoId);
    }
  }

  // Ranking: mais sessões DENTRO do período primeiro; depois, o resto por
  // sessões no histórico todo (união sem repetir id) — mesma lógica de
  // fallback que já existia pro exercício único, agora aplicada à lista
  // inteira de candidatos a painel.
  const rankingDoPeriodo = Array.from(sessoesNoPeriodoPorExercicio.entries())
    .sort((a, b) => b[1].size - a[1].size)
    .map(([id]) => id);
  const rankingGeral = Array.from(sessoesPorExercicio.entries())
    .sort((a, b) => b[1].size - a[1].size)
    .map(([id]) => id);
  const idsRankeados = [
    ...rankingDoPeriodo,
    ...rankingGeral.filter((id) => !rankingDoPeriodo.includes(id)),
  ];

  const paineis: PainelProgressao[] = [];
  for (const exercicioId of idsRankeados) {
    if (paineis.length >= TETO_PAINEIS) break;

    const seriesDoExercicio = seriesValendo.filter((s) => s.exercicioId === exercicioId);
    const pontos = calcularSeriesSemanais(seriesDoExercicio, semanas);
    const comDado = pontos.filter((p) => p.e1rm !== undefined);
    if (comDado.length < 2) continue; // T-E6 — sem painel sem pelo menos 2 semanas elegíveis

    const plato = detectarPlato(
      pontos.map((p) => ({ semanaInicio: p.semanaInicio, valor: p.e1rm })),
    );

    paineis.push({
      exercicio: { id: exercicioId, nome: nomePorExercicio.get(exercicioId)! },
      pontos,
      plato,
    });
  }

  return paineis;
}
