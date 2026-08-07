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

export type DadosProgressao = {
  exercicio: OpcaoExercicio;
  opcoes: OpcaoExercicio[];
  pontos: PontoSemanal[];
  plato: Plato | null;
};

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
 * Carrega o histórico semanal de um exercício para o gráfico. Sem
 * `exercicioId`, escolhe o exercício com mais sessões no histórico —
 * o mais provável de interessar a leitura da semana. `null` quando o
 * dono ainda não tem nenhum exercício com sessão suficiente (T-E6: 1
 * sessão não conta progressão, precisa de pelo menos 2 pra ter delta).
 */
export async function carregarProgressao(
  exercicioId?: string,
): Promise<DadosProgressao | null> {
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

  if (seriesValendo.length === 0) return null;

  const ultimaSemanaFechada = semanaAnaliseAtual(new Date());
  const semanas = listarSemanas(ultimaSemanaFechada, SEMANAS_HISTORICO);
  const semanasDoPeriodo = new Set(semanas);

  // Exercício -> nome e nº de sessões distintas (treinos), pra opção do
  // seletor. Contagem SEPARADA pro período mostrado no gráfico — o padrão
  // (sem `exercicioId` explícito) precisa de um exercício com sessão
  // DENTRO das `SEMANAS_HISTORICO` semanas visíveis, senão a tela abre
  // direto no estado "dados insuficientes" mesmo quando outro exercício
  // tem histórico recente de sobra (achado do inspetor-qa, PR #12).
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

  const opcoes: OpcaoExercicio[] = Array.from(nomePorExercicio.entries())
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  // Padrão: mais sessões DENTRO do período mostrado; sem nenhum exercício
  // com sessão no período, cai pro mais treinado no histórico todo (ainda
  // assim mostra "dados insuficientes", mas por um motivo real, não por
  // ter escolhido um exercício qualquer alheio ao que a tela desenha).
  const rankingDoPeriodo = Array.from(sessoesNoPeriodoPorExercicio.entries()).sort(
    (a, b) => b[1].size - a[1].size,
  );
  const idPadrao =
    rankingDoPeriodo[0]?.[0] ??
    Array.from(sessoesPorExercicio.entries()).sort((a, b) => b[1].size - a[1].size)[0][0];

  const idEscolhido = exercicioId && sessoesPorExercicio.has(exercicioId) ? exercicioId : idPadrao;

  const exercicio = opcoes.find((o) => o.id === idEscolhido)!;

  const seriesDoExercicio = seriesValendo.filter(
    (s) => s.exercicioId === idEscolhido,
  );
  const pontos = calcularSeriesSemanais(seriesDoExercicio, semanas);
  const plato = detectarPlato(
    pontos.map((p) => ({ semanaInicio: p.semanaInicio, valor: p.e1rm })),
  );

  return { exercicio, opcoes, pontos, plato };
}
