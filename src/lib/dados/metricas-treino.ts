/**
 * lastro · Métricas determinísticas do treino finalizado (Relatório Pós-Treino).
 *
 * Calcula tonelagem total (volume em kg), duração real da sessão,
 * contagem de séries válidas, detalhamento por exercício e PRs do dia.
 */

export type SerieParaMetricas = {
  id: string;
  exercicioId: string;
  exercicioNome: string;
  reps: number;
  peso: number;
  tipo: "aquecimento" | "valendo";
  pesoPorLado?: boolean;
  ehRecordePessoal?: boolean;
};

export type MetricasSessao = {
  duracaoMinutos: number;
  tonelagemTotalKg: number;
  totalSeriesValendo: number;
  totalSeriesAquecimento: number;
  totalExercicios: number;
  exerciciosDetalhados: { exercicioNome: string; totalSeries: number; pesoMaximo: number }[];
  prsBatidos: { exercicioNome: string; reps: number; peso: number }[];
  focoOuDivisao?: string;
  identificadorTreino?: string;
  fraseAssinatura?: string;
};

export type OpcoesMetricasSessao = {
  focoOuDivisao?: string;
  identificadorTreino?: string;
  fraseAssinatura?: string;
};

function inferirFoco(nomesExercicios: string[]): string {
  if (nomesExercicios.length === 0) return "TREINO";

  const texto = nomesExercicios.join(" ").toLowerCase();
  const temPernas = /agachamento|leg|extensora|flexora|panturrilha|quadr[ií]ceps|stiff|b[uú]lgaro|passada|abdut|adut|gl[uú]teo|sum[oô]|eleva[cç][aã]o p[eé]lvica/.test(texto);
  const temPeito = /supino|crucifixo|peck|cross|peitoral|paralelas/.test(texto);
  const temCostas = /puxada|remada|barra fixa|pulldown|pullover|serrote|dorsal|cavalinho/.test(texto);
  const temOmbros = /desenvolvimento|lateral|frontal|deltoide|face pull|arnold/.test(texto);
  const temBracos = /rosca|tr[ií]ceps|b[ií]ceps|antebra[cç]o|testa|corda|martelo|scott|francesa/.test(texto);

  const contagemGrupos = [temPernas, temPeito, temCostas, temOmbros, temBracos].filter(Boolean).length;
  if (contagemGrupos > 2) return "FULL BODY";

  if (temPernas && contagemGrupos === 1) return "PERNAS";
  if (temPeito && !temCostas && !temPernas) return "PEITORAL";
  if (temCostas && !temPeito && !temPernas) return "COSTAS";
  if (temOmbros && !temPernas && !temCostas && !temPeito) return "OMBROS";
  if (temBracos && !temPernas && !temCostas && !temPeito) return "BRAÇOS";
  if (temPeito || temCostas || temOmbros || temBracos) return "SUPERIORES";

  return "TREINO";
}

export function calcularMetricasSessao(
  series: SerieParaMetricas[],
  iniciadoEmOuSegundos: string | number,
  finalizadoEmIso?: string,
  opcoes?: OpcoesMetricasSessao
): MetricasSessao {
  let duracaoMinutos = 1;
  if (typeof iniciadoEmOuSegundos === "number") {
    duracaoMinutos = Math.max(1, Math.round(iniciadoEmOuSegundos / 60));
  } else {
    const inicio = new Date(iniciadoEmOuSegundos).getTime();
    const fim = finalizadoEmIso ? new Date(finalizadoEmIso).getTime() : Date.now();
    const duracaoMs = Math.max(0, fim - inicio);
    duracaoMinutos = Math.max(1, Math.round(duracaoMs / 60000));
  }

  let tonelagemTotalKg = 0;
  let totalSeriesValendo = 0;
  let totalSeriesAquecimento = 0;
  const exerciciosUnicosValendo = new Set<string>();
  const mapaExercicios = new Map<string, { exercicioNome: string; totalSeries: number; pesoMaximo: number }>();
  const prsBatidos: { exercicioNome: string; reps: number; peso: number }[] = [];
  const nomesExercicios: string[] = [];

  for (const s of series) {
    const pesoEfetivo = s.pesoPorLado ? s.peso * 2 : s.peso;
    const volumeSerie = s.reps * pesoEfetivo;

    let ex = mapaExercicios.get(s.exercicioId);
    if (!ex) {
      ex = { exercicioNome: s.exercicioNome, totalSeries: 0, pesoMaximo: 0 };
      mapaExercicios.set(s.exercicioId, ex);
      nomesExercicios.push(s.exercicioNome);
    }
    ex.totalSeries++;
    ex.pesoMaximo = Math.max(ex.pesoMaximo, s.peso);

    if (s.tipo === "valendo") {
      exerciciosUnicosValendo.add(s.exercicioId);
      totalSeriesValendo++;
      tonelagemTotalKg += volumeSerie;
      
      if (s.ehRecordePessoal) {
        prsBatidos.push({
          exercicioNome: s.exercicioNome,
          reps: s.reps,
          peso: s.peso,
        });
      }
    } else {
      totalSeriesAquecimento++;
    }
  }

  const focoOuDivisao = (opcoes?.focoOuDivisao || inferirFoco(nomesExercicios)).toUpperCase();
  const identificadorTreino = opcoes?.identificadorTreino || "TREINO 404B";
  const fraseAssinatura = opcoes?.fraseAssinatura || "Mais uma sessão no histórico.";

  return {
    duracaoMinutos,
    tonelagemTotalKg: Math.round(tonelagemTotalKg * 10) / 10,
    totalSeriesValendo,
    totalSeriesAquecimento,
    totalExercicios: exerciciosUnicosValendo.size || (series.length > 0 ? 1 : 0),
    exerciciosDetalhados: Array.from(mapaExercicios.values()),
    prsBatidos,
    focoOuDivisao,
    identificadorTreino,
    fraseAssinatura,
  };
}
