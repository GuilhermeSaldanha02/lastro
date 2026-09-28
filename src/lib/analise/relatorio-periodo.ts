/**
 * lastro · relatório de PERÍODO por lógica (AN-08 M2-2): pergunta 6 "Como foi
 * meu mês?" (fecha a C3) e 7 "do primeiro treino até hoje" (fecha o AN-07).
 * Conteúdo escolhido pelo dono em 2026-09-28: base, evolução por exercício,
 * recordes e grupos. Sem Gemini, sem causa, sem prescrição.
 *
 * O mês é o mês de calendário ATÉ HOJE, contra o mês anterior INTEIRO, e por
 * isso não vira percentual: no dia 3, qualquer comparação diria "caiu". É a
 * mesma regra da semana em andamento no Coach (M1).
 */
import type { Idioma } from "@/lib/dados/idioma";
import { formatarPercentual, formatarPeso } from "@/lib/texto/formatar-delta";
import { formatarDataCurta, nomeMesComAno } from "@/lib/tempo";
import { calcularE1rm, elegivelParaE1rm } from "./e1rm";
import { ZONA_MORTA_PCT } from "./leitura-deterministica";
import { MINIMO_SESSOES_TENDENCIA } from "./limiares";
import { anteriorEquivalente, contem, mesDe, periodoLivre, type Periodo } from "./periodo";
import { marcarRecordesHistoricos } from "./recorde-serie";
import { diferencaEmSemanas, semanaInicioDoTreino } from "./semanas";
import type { SerieValendo } from "./tipos";
import { calcularVolume } from "./volume";

export type TipoRelatorio = "mes" | "historico";

export type RelatorioPeriodo = {
  tipo: TipoRelatorio;
  periodo: Periodo;
  treinos: number;
  semanasComTreino: number;
  semanasNoPeriodo: number;
  volume: number;
  /** Só no mês: o mês anterior inteiro, para comparação lado a lado. */
  anterior?: { periodo: Periodo; treinos: number; volume: number };
  /** e1RM da primeira contra a última sessão do período; só com sessões suficientes. */
  evolucao: Array<{ exercicio: string; deltaPct: number; sessoes: number }>;
  /** Recordes pessoais batidos no período, do mais antigo ao mais recente. */
  recordes: Array<{ exercicio: string; reps: number; peso: number }>;
  /** Todos os grupos já treinados, com as séries valendo no período (0 incluído). */
  grupos: Array<{ grupo: string; series: number }>;
};

const MAX_LISTADOS = 3;

/** `null` quando não há série nenhuma para ancorar "desde o primeiro treino". */
export function periodoDoRelatorio(tipo: TipoRelatorio, hojeISO: string, series: SerieValendo[]): Periodo | null {
  if (tipo === "mes") return { ...mesDe(hojeISO), fim: hojeISO };
  if (series.length === 0) return null;
  const primeira = series.reduce((min, s) => (s.data < min ? s.data : min), series[0].data);
  return periodoLivre(primeira, hojeISO);
}

function treinosDistintos(series: SerieValendo[]): number {
  return new Set(series.map((s) => s.treinoId)).size;
}

function evolucaoPorExercicio(series: SerieValendo[]): RelatorioPeriodo["evolucao"] {
  const porExercicioEDia = new Map<string, Map<string, number>>();
  const nome = new Map<string, string>();
  for (const s of series) {
    if (!elegivelParaE1rm(s.reps)) continue;
    nome.set(s.exercicioId, s.exercicio);
    const dias = porExercicioEDia.get(s.exercicioId) ?? new Map<string, number>();
    dias.set(s.data, Math.max(dias.get(s.data) ?? 0, calcularE1rm(s.reps, s.peso)));
    porExercicioEDia.set(s.exercicioId, dias);
  }
  const resultado: RelatorioPeriodo["evolucao"] = [];
  for (const [exercicioId, dias] of porExercicioEDia) {
    if (dias.size < MINIMO_SESSOES_TENDENCIA) continue;
    const ordenadas = Array.from(dias).sort((a, b) => a[0].localeCompare(b[0]));
    const inicial = ordenadas[0][1];
    const final = ordenadas[ordenadas.length - 1][1];
    if (inicial <= 0) continue;
    resultado.push({
      exercicio: nome.get(exercicioId)!,
      deltaPct: Math.round(((final - inicial) / inicial) * 1000) / 10,
      sessoes: dias.size,
    });
  }
  return resultado.sort((a, b) => b.deltaPct - a.deltaPct || a.exercicio.localeCompare(b.exercicio));
}

/** Mesma regra do marcador de recorde da tela de treino, aplicada ao histórico inteiro. */
function recordesNoPeriodo(todas: SerieValendo[], periodo: Periodo): RelatorioPeriodo["recordes"] {
  const porExercicio = new Map<string, SerieValendo[]>();
  for (const s of todas) porExercicio.set(s.exercicioId, [...(porExercicio.get(s.exercicioId) ?? []), s]);
  const achados: Array<SerieValendo> = [];
  for (const lista of porExercicio.values()) {
    const cronologica = [...lista].sort((a, b) => a.data.localeCompare(b.data));
    const marcas = marcarRecordesHistoricos(cronologica.map((s) => ({ reps: s.reps, peso: s.peso, treinoId: s.treinoId })));
    cronologica.forEach((s, i) => {
      if (marcas[i] && contem(periodo, s.data)) achados.push(s);
    });
  }
  return achados
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((s) => ({ exercicio: s.exercicio, reps: s.reps, peso: s.peso }));
}

export function montarRelatorioPeriodo(
  tipo: TipoRelatorio,
  periodo: Periodo,
  todas: SerieValendo[],
): RelatorioPeriodo {
  const doPeriodo = todas.filter((s) => contem(periodo, s.data));
  const semanaInicial = semanaInicioDoTreino(periodo.inicio);
  const semanaFinal = semanaInicioDoTreino(periodo.fim);

  const seriesPorGrupo = new Map<string, number>();
  for (const s of todas) if (!seriesPorGrupo.has(s.grupoMuscular)) seriesPorGrupo.set(s.grupoMuscular, 0);
  for (const s of doPeriodo) seriesPorGrupo.set(s.grupoMuscular, (seriesPorGrupo.get(s.grupoMuscular) ?? 0) + 1);

  const relatorio: RelatorioPeriodo = {
    tipo,
    periodo,
    treinos: treinosDistintos(doPeriodo),
    semanasComTreino: new Set(doPeriodo.map((s) => s.semanaInicio)).size,
    semanasNoPeriodo: diferencaEmSemanas(semanaFinal, semanaInicial) + 1,
    volume: calcularVolume(doPeriodo),
    evolucao: evolucaoPorExercicio(doPeriodo),
    recordes: recordesNoPeriodo(todas, periodo),
    grupos: Array.from(seriesPorGrupo, ([grupo, series]) => ({ grupo, series })).sort(
      (a, b) => b.series - a.series || a.grupo.localeCompare(b.grupo),
    ),
  };

  if (tipo === "mes") {
    const anterior = anteriorEquivalente(periodo);
    const doAnterior = todas.filter((s) => contem(anterior, s.data));
    relatorio.anterior = { periodo: anterior, treinos: treinosDistintos(doAnterior), volume: calcularVolume(doAnterior) };
  }
  return relatorio;
}

type Frases = {
  e: string;
  treinos: (n: number) => string;
  series: (n: number) => string;
  semanas: (n: number) => string;
  kg: (v: number) => string;
  mes: (nome: string, treinos: string) => string;
  mesVazio: (nome: string) => string;
  historico: (desde: string, treinos: string) => string;
  semNada: string;
  base: (com: number, total: string, media: string, volume: string) => string;
  mesAnterior: (nome: string, treinos: string, volume: string) => string;
  maiorEvolucao: (exercicio: string, pct: string, sessoes: number) => string;
  maiorQueda: (exercicio: string, pct: string) => string;
  semEvolucao: (sessoes: number) => string;
  recordes: (n: number, lista: string) => string;
  semRecordes: string;
  recordeItem: (exercicio: string, reps: number, peso: string) => string;
  maisTreinados: (lista: string) => string;
  menosTreinados: (lista: string) => string;
};

const listar = (itens: string[], e: string) =>
  itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} ${e} ${itens[itens.length - 1]}`;

const POR_IDIOMA: Record<Idioma, Frases> = {
  "pt-BR": {
    e: "e",
    treinos: (n) => `${n} ${n === 1 ? "treino" : "treinos"}`,
    series: (n) => `${n} ${n === 1 ? "série" : "séries"}`,
    semanas: (n) => `${n} ${n === 1 ? "semana" : "semanas"}`,
    kg: (v) => `${formatarPeso(Math.round(v), "pt-BR")} kg`,
    mes: (nome, treinos) => `${nome}: ${treinos} até hoje.`,
    mesVazio: (nome) => `${nome}: nenhum treino até hoje.`,
    historico: (desde, treinos) => `Desde ${desde}: ${treinos}.`,
    semNada: "Você ainda não registrou nenhuma série valendo.",
    base: (com, total, media, volume) => `Treinou em ${com} de ${total}, média de ${media} treinos por semana. Volume total: ${volume}.`,
    mesAnterior: (nome, treinos, volume) => `${nome} inteiro: ${treinos} e ${volume}.`,
    maiorEvolucao: (ex, pct, s) => `Maior evolução: ${ex}, ${pct} de e1RM em ${s} sessões.`,
    maiorQueda: (ex, pct) => `Maior queda: ${ex}, ${pct}.`,
    semEvolucao: (s) => `Nenhum exercício teve ${s} sessões com carga medível no período para medir evolução.`,
    recordes: (n, lista) => `${n} ${n === 1 ? "recorde pessoal" : "recordes pessoais"}: ${lista}.`,
    semRecordes: "Nenhum recorde pessoal no período.",
    recordeItem: (ex, reps, peso) => `${ex} ${reps} × ${peso} kg`,
    maisTreinados: (lista) => `Mais treinados: ${lista}.`,
    menosTreinados: (lista) => `Menos treinados: ${lista}.`,
  },
  en: {
    e: "and",
    treinos: (n) => `${n} ${n === 1 ? "workout" : "workouts"}`,
    series: (n) => `${n} ${n === 1 ? "set" : "sets"}`,
    semanas: (n) => `${n} ${n === 1 ? "week" : "weeks"}`,
    kg: (v) => `${formatarPeso(Math.round(v), "en")} kg`,
    mes: (nome, treinos) => `${nome}: ${treinos} so far.`,
    mesVazio: (nome) => `${nome}: no workouts so far.`,
    historico: (desde, treinos) => `Since ${desde}: ${treinos}.`,
    semNada: "You haven't logged any working set yet.",
    base: (com, total, media, volume) => `Trained in ${com} of ${total}, an average of ${media} workouts per week. Total volume: ${volume}.`,
    mesAnterior: (nome, treinos, volume) => `All of ${nome}: ${treinos} and ${volume}.`,
    maiorEvolucao: (ex, pct, s) => `Biggest gain: ${ex}, ${pct} in e1RM over ${s} sessions.`,
    maiorQueda: (ex, pct) => `Biggest drop: ${ex}, ${pct}.`,
    semEvolucao: (s) => `No exercise had ${s} sessions with measurable load in the period to measure progress.`,
    recordes: (n, lista) => `${n} ${n === 1 ? "personal record" : "personal records"}: ${lista}.`,
    semRecordes: "No personal record in the period.",
    recordeItem: (ex, reps, peso) => `${ex} ${reps} × ${peso} kg`,
    maisTreinados: (lista) => `Most trained: ${lista}.`,
    menosTreinados: (lista) => `Least trained: ${lista}.`,
  },
  es: {
    e: "y",
    treinos: (n) => `${n} ${n === 1 ? "entrenamiento" : "entrenamientos"}`,
    series: (n) => `${n} ${n === 1 ? "serie" : "series"}`,
    semanas: (n) => `${n} ${n === 1 ? "semana" : "semanas"}`,
    kg: (v) => `${formatarPeso(Math.round(v), "es")} kg`,
    mes: (nome, treinos) => `${nome}: ${treinos} hasta hoy.`,
    mesVazio: (nome) => `${nome}: ningún entrenamiento hasta hoy.`,
    historico: (desde, treinos) => `Desde ${desde}: ${treinos}.`,
    semNada: "Todavía no registraste ninguna serie válida.",
    base: (com, total, media, volume) => `Entrenaste en ${com} de ${total}, un promedio de ${media} entrenamientos por semana. Volumen total: ${volume}.`,
    mesAnterior: (nome, treinos, volume) => `${nome} entero: ${treinos} y ${volume}.`,
    maiorEvolucao: (ex, pct, s) => `Mayor evolución: ${ex}, ${pct} de e1RM en ${s} sesiones.`,
    maiorQueda: (ex, pct) => `Mayor caída: ${ex}, ${pct}.`,
    semEvolucao: (s) => `Ningún ejercicio tuvo ${s} sesiones con carga medible en el período para medir la evolución.`,
    recordes: (n, lista) => `${n} ${n === 1 ? "récord personal" : "récords personales"}: ${lista}.`,
    semRecordes: "Ningún récord personal en el período.",
    recordeItem: (ex, reps, peso) => `${ex} ${reps} × ${peso} kg`,
    maisTreinados: (lista) => `Más entrenados: ${lista}.`,
    menosTreinados: (lista) => `Menos entrenados: ${lista}.`,
  },
};

/** O texto do relatório, com o veredito como primeira frase. */
export function textoDoRelatorio(r: RelatorioPeriodo | null, idioma: Idioma): string {
  const f = POR_IDIOMA[idioma];
  if (!r) return f.semNada;

  const frases: string[] = [];
  if (r.tipo === "mes") {
    const nome = nomeMesComAno(r.periodo.inicio.slice(0, 7), idioma);
    frases.push(r.treinos > 0 ? f.mes(nome, f.treinos(r.treinos)) : f.mesVazio(nome));
  } else {
    frases.push(f.historico(`${formatarDataCurta(r.periodo.inicio, idioma)} ${r.periodo.inicio.slice(0, 4)}`, f.treinos(r.treinos)));
  }

  if (r.treinos > 0) {
    const media = formatarPeso(Math.round((r.treinos / r.semanasNoPeriodo) * 10) / 10, idioma);
    frases.push(f.base(r.semanasComTreino, f.semanas(r.semanasNoPeriodo), media, f.kg(r.volume)));
  }
  if (r.anterior && r.anterior.treinos > 0) {
    frases.push(f.mesAnterior(nomeMesComAno(r.anterior.periodo.inicio.slice(0, 7), idioma), f.treinos(r.anterior.treinos), f.kg(r.anterior.volume)));
  }
  if (r.treinos === 0) return frases.join(" ");

  const subiu = r.evolucao.find((e) => e.deltaPct > ZONA_MORTA_PCT);
  const caiu = [...r.evolucao].reverse().find((e) => e.deltaPct < -ZONA_MORTA_PCT);
  if (subiu) frases.push(f.maiorEvolucao(subiu.exercicio, formatarPercentual(subiu.deltaPct, idioma), subiu.sessoes));
  if (caiu) frases.push(f.maiorQueda(caiu.exercicio, formatarPercentual(caiu.deltaPct, idioma)));
  if (r.evolucao.length === 0) frases.push(f.semEvolucao(MINIMO_SESSOES_TENDENCIA));

  frases.push(
    r.recordes.length > 0
      ? f.recordes(
          r.recordes.length,
          listar(r.recordes.slice(-MAX_LISTADOS).map((p) => f.recordeItem(p.exercicio, p.reps, formatarPeso(p.peso, idioma))), f.e),
        )
      : f.semRecordes,
  );

  const item = (g: { grupo: string; series: number }) => `${g.grupo} (${f.series(g.series)})`;
  const mais = r.grupos.filter((g) => g.series > 0).slice(0, 2);
  const menos = r.grupos.slice(-2).filter((g) => !mais.includes(g)).reverse();
  if (mais.length > 0) frases.push(f.maisTreinados(listar(mais.map(item), f.e)));
  if (menos.length > 0) frases.push(f.menosTreinados(listar(menos.map(item), f.e)));

  return frases.join(" ");
}
