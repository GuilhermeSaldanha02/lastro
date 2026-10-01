/**
 * lastro · respostas locais do Coach (AN-08 M1). Função pura: recebe o
 * histórico já no formato do agregador e devolve o texto, sem rede e sem
 * Gemini. Toda conta vem de `src/lib/analise/`; aqui só se escolhe o recorte
 * e se escreve a frase. Nada de causa, prescrição ou número que o dado não
 * sustenta (mesmas regras de `leitura-deterministica.ts`).
 */
import { calcularVolume, volumePorGrupoMuscular } from "@/lib/analise/volume";
import { calcularSequenciaAtual } from "@/lib/analise/sequencia";
import { diasSemEstimuloPorGrupo } from "@/lib/analise/recencia";
import { leituraDeterministica } from "@/lib/analise/leitura-deterministica";
import { anteriorEquivalente, contem, semanaDe, ultimosDias } from "@/lib/analise/periodo";
import { metaNasSemanas, semanasSeguidasComTreino } from "@/lib/analise/consistencia-semanal";
import type { ResumoCompacto, SerieValendo } from "@/lib/analise/tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { formatarPeso } from "@/lib/texto/formatar-delta";
import type { ClassificacaoDados, IntentRecusa } from "./roteador";

export type ContextoResposta = {
  /** Séries valendo do usuário, com o grupo muscular já no idioma dele. */
  series: SerieValendo[];
  /** Resumo da última semana ISO fechada (o mesmo da Análise). */
  resumo: ResumoCompacto;
  hojeISO: string;
  metaSemana: number | null;
  idioma: Idioma;
  /**
   * Nome, no idioma do usuário, do grupo citado nas intents de grupo. As
   * séries já vêm com o grupo traduzido, então o filtro é por este nome, não
   * pela chave do banco que o roteador devolve.
   */
  nomeGrupoAlvo?: string;
};

/** Janela de "menos treinado": 4 semanas, a mesma régua de tendência do resto do app. */
const DIAS_JANELA_FREQUENCIA = 28;
const MAX_GRUPOS_LISTADOS = 3;

type Frases = {
  kg: (v: number) => string;
  treinos: (n: number) => string;
  semDados: string;
  volumeSemana: (vol: string, treinos: string) => string;
  volumeSemanaVazia: string;
  volumeSemanaPassada: (vol: string) => string;
  grupoMaisVolume: (lista: string) => string;
  grupoVolumeItem: (grupo: string, vol: string, series: number) => string;
  treinosNaSemana: (treinos: string) => string;
  meta: (meta: number) => string;
  menosFrequente: (lista: string) => string;
  menosFrequenteItem: (grupo: string, treinos: string, ultimo?: string) => string;
  ultimaVez: (dias: number) => string;
  diasSemGrupo: (grupo: string, quando: string) => string;
  nuncaGrupo: (grupo: string) => string;
  series: (n: number) => string;
  volumeGrupo: (grupo: string, vol: string, series: string) => string;
  volumeGrupoVazio: (grupo: string) => string;
  volumeGrupoPassada: (vol: string, series: string) => string;
  frequenciaGrupo: (grupo: string, treinos: string) => string;
  frequenciaGrupoZero: (grupo: string) => string;
  ultimaSerieGrupo: (quando: string) => string;
  semanasSeguidasComAtual: (n: number) => string;
  semanasSeguidasSemAtual: (n: number) => string;
  semSemanasSeguidas: string;
  metaNaoDefinida: string;
  metaCumprida: (meta: string, cumpridas: number, fechadas: number) => string;
  metaSemanaAtual: (feitos: number, meta: number) => string;
  frequenciaComMedia: (treinos: string, media: string) => string;
  frequenciaSemMedia: (treinos: string) => string;
  umaSemanaNaoETendencia: string;
  sequencia: (dias: number) => string;
  semSequencia: string;
  prescricao: string;
  prescricaoComPersonal: string;
  execucao: string;
  saude: string;
};

const POR_IDIOMA: Record<Idioma, Frases> = {
  "pt-BR": {
    kg: (v) => `${formatarPeso(Math.round(v), "pt-BR")} kg`,
    treinos: (n) => `${n} ${n === 1 ? "treino" : "treinos"}`,
    semDados: "Você ainda não registrou nenhuma série valendo.",
    volumeSemana: (vol, treinos) => `Nesta semana, até hoje: ${vol} em ${treinos}.`,
    volumeSemanaVazia: "Nenhuma série valendo nesta semana ainda.",
    volumeSemanaPassada: (vol) => `A semana passada inteira fechou em ${vol}.`,
    grupoMaisVolume: (lista) => `Nesta semana, até hoje: ${lista}.`,
    grupoVolumeItem: (grupo, vol, series) => `${grupo} ${vol} (${series} ${series === 1 ? "série" : "séries"})`,
    treinosNaSemana: (treinos) => `Nesta semana, até hoje: ${treinos}.`,
    meta: (meta) => `Sua meta é de ${meta} por semana.`,
    menosFrequente: (lista) => `Nas últimas 4 semanas, os grupos menos treinados foram: ${lista}.`,
    menosFrequenteItem: (grupo, treinos, ultimo) => (ultimo ? `${grupo} (${treinos}, ${ultimo})` : `${grupo} (${treinos})`),
    ultimaVez: (dias) => `último há ${dias} dias`,
    diasSemGrupo: (grupo, quando) => `Última série valendo de ${grupo}: ${quando}.`,
    nuncaGrupo: (grupo) => `Você ainda não registrou série valendo de ${grupo}.`,
    series: (n) => `${n} ${n === 1 ? "série" : "séries"}`,
    volumeGrupo: (grupo, vol, series) => `${grupo} nesta semana, até hoje: ${vol} em ${series}.`,
    volumeGrupoVazio: (grupo) => `Nenhuma série valendo de ${grupo} nesta semana ainda.`,
    volumeGrupoPassada: (vol, series) => `Na semana passada inteira: ${vol} em ${series}.`,
    frequenciaGrupo: (grupo, treinos) => `Nas últimas 4 semanas, ${grupo} entrou em ${treinos}.`,
    frequenciaGrupoZero: (grupo) => `Nas últimas 4 semanas, ${grupo} não entrou em nenhum treino.`,
    ultimaSerieGrupo: (quando) => `Última série valendo: ${quando}.`,
    semanasSeguidasComAtual: (n) =>
      n === 1
        ? "Esta semana já tem treino; a semana passada ficou sem."
        : `${n} semanas seguidas com pelo menos 1 treino, contando esta.`,
    semanasSeguidasSemAtual: (n) =>
      n === 1
        ? "A semana passada teve treino; a anterior ficou sem. Nesta semana ainda não há treino."
        : `${n} semanas seguidas com pelo menos 1 treino, até a semana passada. Nesta semana ainda não há treino.`,
    semSemanasSeguidas: "Sem sequência de semanas: a semana passada ficou sem treino, e esta ainda não tem.",
    metaNaoDefinida: "Você ainda não definiu uma meta semanal. Ela fica em Ajustes.",
    metaCumprida: (meta, cumpridas, fechadas) =>
      fechadas === 1
        ? `Meta de ${meta} por semana: ${cumpridas === 1 ? "cumprida" : "não cumprida"} na semana passada.`
        : `Meta de ${meta} por semana: cumprida em ${cumpridas} das últimas ${fechadas} semanas fechadas.`,
    metaSemanaAtual: (feitos, meta) => `Nesta semana, até hoje: ${feitos} de ${meta}.`,
    frequenciaComMedia: (treinos, media) =>
      `Na última semana fechada foram ${treinos}, contra média de ${media} nas semanas anteriores com treino.`,
    frequenciaSemMedia: (treinos) => `Na última semana fechada foram ${treinos}. Ainda não há semanas anteriores para comparar.`,
    umaSemanaNaoETendencia: "Uma semana sozinha não é tendência.",
    sequencia: (dias) => `${dias} ${dias === 1 ? "dia" : "dias seguidos"} de treino, contando até hoje ou ontem.`,
    semSequencia: "Sem sequência ativa: o último treino não foi hoje nem ontem.",
    prescricao:
      "O lastro analisa o que foi feito e não monta o próximo treino. Para uma leitura dos seus números com sugestão para a semana, use “O que mudar na próxima semana?” na Análise.",
    prescricaoComPersonal: "Quem monta a próxima semana é o seu personal. Leve esse pedido para o personal.",
    execucao: "A execução de cada exercício está no Catálogo, com a dica e a animação. Abra o exercício por lá.",
    saude: "Sobre dor, lesão ou qualquer sintoma, procure um fisioterapeuta ou médico. O lastro não orienta sobre isso.",
  },
  en: {
    kg: (v) => `${formatarPeso(Math.round(v), "en")} kg`,
    treinos: (n) => `${n} ${n === 1 ? "workout" : "workouts"}`,
    semDados: "You haven't logged any working set yet.",
    volumeSemana: (vol, treinos) => `This week so far: ${vol} across ${treinos}.`,
    volumeSemanaVazia: "No working sets this week yet.",
    volumeSemanaPassada: (vol) => `Last week closed at ${vol}.`,
    grupoMaisVolume: (lista) => `This week so far: ${lista}.`,
    grupoVolumeItem: (grupo, vol, series) => `${grupo} ${vol} (${series} ${series === 1 ? "set" : "sets"})`,
    treinosNaSemana: (treinos) => `This week so far: ${treinos}.`,
    meta: (meta) => `Your goal is ${meta} per week.`,
    menosFrequente: (lista) => `In the last 4 weeks, the least trained groups were: ${lista}.`,
    menosFrequenteItem: (grupo, treinos, ultimo) => (ultimo ? `${grupo} (${treinos}, ${ultimo})` : `${grupo} (${treinos})`),
    ultimaVez: (dias) => `last one ${dias} days ago`,
    diasSemGrupo: (grupo, quando) => `Last working set for ${grupo}: ${quando}.`,
    nuncaGrupo: (grupo) => `You haven't logged a working set for ${grupo} yet.`,
    series: (n) => `${n} ${n === 1 ? "set" : "sets"}`,
    volumeGrupo: (grupo, vol, series) => `${grupo} this week so far: ${vol} across ${series}.`,
    volumeGrupoVazio: (grupo) => `No working sets for ${grupo} this week yet.`,
    volumeGrupoPassada: (vol, series) => `All of last week: ${vol} across ${series}.`,
    frequenciaGrupo: (grupo, treinos) => `In the last 4 weeks, ${grupo} was in ${treinos}.`,
    frequenciaGrupoZero: (grupo) => `In the last 4 weeks, ${grupo} wasn't in any workout.`,
    ultimaSerieGrupo: (quando) => `Last working set: ${quando}.`,
    semanasSeguidasComAtual: (n) =>
      n === 1
        ? "This week already has a workout; last week had none."
        : `${n} weeks in a row with at least 1 workout, counting this one.`,
    semanasSeguidasSemAtual: (n) =>
      n === 1
        ? "Last week had a workout; the one before had none. No workout this week yet."
        : `${n} weeks in a row with at least 1 workout, up to last week. No workout this week yet.`,
    semSemanasSeguidas: "No weekly streak: last week had no workout, and this week has none yet.",
    metaNaoDefinida: "You haven't set a weekly goal yet. It's in Settings.",
    metaCumprida: (meta, cumpridas, fechadas) =>
      fechadas === 1
        ? `Goal of ${meta} per week: ${cumpridas === 1 ? "met" : "not met"} last week.`
        : `Goal of ${meta} per week: met in ${cumpridas} of the last ${fechadas} closed weeks.`,
    metaSemanaAtual: (feitos, meta) => `This week so far: ${feitos} of ${meta}.`,
    frequenciaComMedia: (treinos, media) =>
      `Last closed week had ${treinos}, against an average of ${media} in previous weeks with training.`,
    frequenciaSemMedia: (treinos) => `Last closed week had ${treinos}. There are no previous weeks to compare yet.`,
    umaSemanaNaoETendencia: "A single week is not a trend.",
    sequencia: (dias) => `${dias} ${dias === 1 ? "day" : "days in a row"} of training, counting up to today or yesterday.`,
    semSequencia: "No active streak: your last workout wasn't today or yesterday.",
    prescricao:
      "lastro analyzes what you did and doesn't build your next workout. For a reading of your numbers with a suggestion for the week, use “What should I change next week?” in Analysis.",
    prescricaoComPersonal: "Your personal trainer plans your next week. Take this request to them.",
    execucao: "Each exercise's technique is in the Catalog, with the tip and the animation. Open the exercise there.",
    saude: "For pain, injury or any symptom, see a physical therapist or a doctor. lastro doesn't give guidance on that.",
  },
  es: {
    kg: (v) => `${formatarPeso(Math.round(v), "es")} kg`,
    treinos: (n) => `${n} ${n === 1 ? "entrenamiento" : "entrenamientos"}`,
    semDados: "Todavía no registraste ninguna serie válida.",
    volumeSemana: (vol, treinos) => `Esta semana, hasta hoy: ${vol} en ${treinos}.`,
    volumeSemanaVazia: "Ninguna serie válida esta semana todavía.",
    volumeSemanaPassada: (vol) => `La semana pasada entera cerró en ${vol}.`,
    grupoMaisVolume: (lista) => `Esta semana, hasta hoy: ${lista}.`,
    grupoVolumeItem: (grupo, vol, series) => `${grupo} ${vol} (${series} ${series === 1 ? "serie" : "series"})`,
    treinosNaSemana: (treinos) => `Esta semana, hasta hoy: ${treinos}.`,
    meta: (meta) => `Tu meta es de ${meta} por semana.`,
    menosFrequente: (lista) => `En las últimas 4 semanas, los grupos menos entrenados fueron: ${lista}.`,
    menosFrequenteItem: (grupo, treinos, ultimo) => (ultimo ? `${grupo} (${treinos}, ${ultimo})` : `${grupo} (${treinos})`),
    ultimaVez: (dias) => `el último hace ${dias} días`,
    diasSemGrupo: (grupo, quando) => `Última serie válida de ${grupo}: ${quando}.`,
    nuncaGrupo: (grupo) => `Todavía no registraste una serie válida de ${grupo}.`,
    series: (n) => `${n} ${n === 1 ? "serie" : "series"}`,
    volumeGrupo: (grupo, vol, series) => `${grupo} esta semana, hasta hoy: ${vol} en ${series}.`,
    volumeGrupoVazio: (grupo) => `Ninguna serie válida de ${grupo} esta semana todavía.`,
    volumeGrupoPassada: (vol, series) => `Toda la semana pasada: ${vol} en ${series}.`,
    frequenciaGrupo: (grupo, treinos) => `En las últimas 4 semanas, ${grupo} estuvo en ${treinos}.`,
    frequenciaGrupoZero: (grupo) => `En las últimas 4 semanas, ${grupo} no estuvo en ningún entrenamiento.`,
    ultimaSerieGrupo: (quando) => `Última serie válida: ${quando}.`,
    semanasSeguidasComAtual: (n) =>
      n === 1
        ? "Esta semana ya tiene entrenamiento; la semana pasada quedó sin."
        : `${n} semanas seguidas con al menos 1 entrenamiento, contando esta.`,
    semanasSeguidasSemAtual: (n) =>
      n === 1
        ? "La semana pasada tuvo entrenamiento; la anterior quedó sin. Esta semana todavía no hay entrenamiento."
        : `${n} semanas seguidas con al menos 1 entrenamiento, hasta la semana pasada. Esta semana todavía no hay entrenamiento.`,
    semSemanasSeguidas: "Sin racha de semanas: la semana pasada quedó sin entrenamiento, y esta todavía no tiene.",
    metaNaoDefinida: "Todavía no definiste una meta semanal. Está en Ajustes.",
    metaCumprida: (meta, cumpridas, fechadas) =>
      fechadas === 1
        ? `Meta de ${meta} por semana: ${cumpridas === 1 ? "cumplida" : "no cumplida"} la semana pasada.`
        : `Meta de ${meta} por semana: cumplida en ${cumpridas} de las últimas ${fechadas} semanas cerradas.`,
    metaSemanaAtual: (feitos, meta) => `Esta semana, hasta hoy: ${feitos} de ${meta}.`,
    frequenciaComMedia: (treinos, media) =>
      `En la última semana cerrada fueron ${treinos}, contra un promedio de ${media} en las semanas anteriores con entrenamiento.`,
    frequenciaSemMedia: (treinos) => `En la última semana cerrada fueron ${treinos}. Todavía no hay semanas anteriores para comparar.`,
    umaSemanaNaoETendencia: "Una sola semana no es tendencia.",
    sequencia: (dias) => `${dias} ${dias === 1 ? "día" : "días seguidos"} de entrenamiento, contando hasta hoy o ayer.`,
    semSequencia: "Sin racha activa: el último entrenamiento no fue hoy ni ayer.",
    prescricao:
      "lastro analiza lo que hiciste y no arma tu próximo entrenamiento. Para una lectura de tus números con sugerencia para la semana, usa “¿Qué debo cambiar la próxima semana?” en Análisis.",
    prescricaoComPersonal: "Quien arma tu próxima semana es tu entrenador personal. Llévale este pedido.",
    execucao: "La ejecución de cada ejercicio está en el Catálogo, con el consejo y la animación. Abre el ejercicio allí.",
    saude: "Para dolor, lesión o cualquier síntoma, consulta a un fisioterapeuta o a un médico. lastro no orienta sobre eso.",
  },
};

const QUANDO: Record<Idioma, (dias: number) => string> = {
  "pt-BR": (d) => (d === 0 ? "hoje" : d === 1 ? "ontem" : `há ${d} dias`),
  en: (d) => (d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`),
  es: (d) => (d === 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`),
};

function treinosDistintos(series: SerieValendo[]): number {
  return new Set(series.map((s) => s.treinoId)).size;
}

/** Recusa conhecida: não lê dado nenhum e não gasta cota. */
export function textoDeRecusa(intent: IntentRecusa, idioma: Idioma, temPersonal: boolean): string {
  const f = POR_IDIOMA[idioma];
  if (intent === "SAUDE") return f.saude;
  if (intent === "EXECUCAO") return f.execucao;
  return temPersonal ? f.prescricaoComPersonal : f.prescricao;
}

export function responder(classificacao: ClassificacaoDados, ctx: ContextoResposta): string {
  const f = POR_IDIOMA[ctx.idioma];
  if (ctx.series.length === 0) return f.semDados;

  const semanaAtual = semanaDe(ctx.hojeISO);
  const daSemana = ctx.series.filter((s) => contem(semanaAtual, s.data));

  switch (classificacao.intent) {
    case "VOLUME_SEMANA": {
      const semanaPassada = anteriorEquivalente(semanaAtual);
      const volPassada = calcularVolume(ctx.series.filter((s) => contem(semanaPassada, s.data)));
      // Semana em andamento contra semana inteira não vira percentual:
      // na terça, qualquer comparação diria "caiu".
      const frases = [
        daSemana.length > 0
          ? f.volumeSemana(f.kg(calcularVolume(daSemana)), f.treinos(treinosDistintos(daSemana)))
          : f.volumeSemanaVazia,
      ];
      if (volPassada > 0) frases.push(f.volumeSemanaPassada(f.kg(volPassada)));
      return frases.join(" ");
    }

    case "GRUPO_MAIS_VOLUME": {
      if (daSemana.length === 0) return f.volumeSemanaVazia;
      const seriesPorGrupo = new Map<string, number>();
      for (const s of daSemana) seriesPorGrupo.set(s.grupoMuscular, (seriesPorGrupo.get(s.grupoMuscular) ?? 0) + 1);
      const lista = Array.from(volumePorGrupoMuscular(daSemana))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, MAX_GRUPOS_LISTADOS)
        .map(([grupo, vol]) => f.grupoVolumeItem(grupo, f.kg(vol), seriesPorGrupo.get(grupo) ?? 0));
      return f.grupoMaisVolume(lista.join(", "));
    }

    case "TREINOS_NA_SEMANA": {
      const frases = [f.treinosNaSemana(f.treinos(treinosDistintos(daSemana)))];
      if (ctx.metaSemana) frases.push(f.meta(ctx.metaSemana));
      return frases.join(" ");
    }

    case "GRUPO_MENOS_FREQUENTE": {
      const janela = ultimosDias(ctx.hojeISO, DIAS_JANELA_FREQUENCIA);
      const recencia = new Map(diasSemEstimuloPorGrupo(ctx.series, ctx.hojeISO).map((g) => [g.grupo, g.diasSemEstimulo]));
      const treinosPorGrupo = new Map<string, Set<string>>();
      for (const grupo of recencia.keys()) treinosPorGrupo.set(grupo, new Set());
      for (const s of ctx.series) {
        if (contem(janela, s.data)) treinosPorGrupo.get(s.grupoMuscular)?.add(s.treinoId);
      }
      const lista = Array.from(treinosPorGrupo, ([grupo, treinos]) => ({ grupo, n: treinos.size, dias: recencia.get(grupo) ?? 0 }))
        .sort((a, b) => a.n - b.n || b.dias - a.dias || a.grupo.localeCompare(b.grupo))
        .slice(0, MAX_GRUPOS_LISTADOS)
        .map((g) => f.menosFrequenteItem(g.grupo, f.treinos(g.n), g.n === 0 ? f.ultimaVez(g.dias) : undefined));
      return f.menosFrequente(lista.join(", "));
    }

    case "DIAS_SEM_GRUPO": {
      const grupo = ctx.nomeGrupoAlvo ?? classificacao.grupo;
      const dias = diasSemEstimuloPorGrupo(ctx.series, ctx.hojeISO).find((g) => g.grupo === grupo)?.diasSemEstimulo;
      return dias === undefined ? f.nuncaGrupo(grupo) : f.diasSemGrupo(grupo, QUANDO[ctx.idioma](dias));
    }

    case "VOLUME_GRUPO": {
      const grupo = ctx.nomeGrupoAlvo ?? classificacao.grupo;
      const doGrupo = ctx.series.filter((s) => s.grupoMuscular === grupo);
      const nestaSemana = doGrupo.filter((s) => contem(semanaAtual, s.data));
      const semanaPassada = anteriorEquivalente(semanaAtual);
      const naPassada = doGrupo.filter((s) => contem(semanaPassada, s.data));
      // Mesma regra do VOLUME_SEMANA: semana em andamento não vira percentual.
      const frases = [
        nestaSemana.length > 0
          ? f.volumeGrupo(grupo, f.kg(calcularVolume(nestaSemana)), f.series(nestaSemana.length))
          : f.volumeGrupoVazio(grupo),
      ];
      if (naPassada.length > 0) frases.push(f.volumeGrupoPassada(f.kg(calcularVolume(naPassada)), f.series(naPassada.length)));
      return frases.join(" ");
    }

    case "FREQUENCIA_GRUPO": {
      const grupo = ctx.nomeGrupoAlvo ?? classificacao.grupo;
      const dias = diasSemEstimuloPorGrupo(ctx.series, ctx.hojeISO).find((g) => g.grupo === grupo)?.diasSemEstimulo;
      if (dias === undefined) return f.nuncaGrupo(grupo);
      const janela = ultimosDias(ctx.hojeISO, DIAS_JANELA_FREQUENCIA);
      const treinos = new Set(
        ctx.series.filter((s) => s.grupoMuscular === grupo && contem(janela, s.data)).map((s) => s.treinoId),
      ).size;
      const primeira = treinos > 0 ? f.frequenciaGrupo(grupo, f.treinos(treinos)) : f.frequenciaGrupoZero(grupo);
      return `${primeira} ${f.ultimaSerieGrupo(QUANDO[ctx.idioma](dias))}`;
    }

    case "SEMANAS_SEGUIDAS": {
      const { semanas, incluiAtual } = semanasSeguidasComTreino(ctx.series, ctx.hojeISO);
      if (semanas === 0) return f.semSemanasSeguidas;
      return incluiAtual ? f.semanasSeguidasComAtual(semanas) : f.semanasSeguidasSemAtual(semanas);
    }

    case "META_CUMPRIDA": {
      if (!ctx.metaSemana) return f.metaNaoDefinida;
      const r = metaNasSemanas(ctx.series, ctx.metaSemana, ctx.hojeISO);
      const frases: string[] = [];
      if (r.semanasFechadas > 0) frases.push(f.metaCumprida(f.treinos(r.meta), r.cumpridas, r.semanasFechadas));
      frases.push(f.metaSemanaAtual(r.treinosSemanaAtual, r.meta));
      return frases.join(" ");
    }

    case "FREQUENCIA_COMPARADA": {
      const { treinos_semana_atual, media_semanas_anteriores } = ctx.resumo.frequencia;
      if (media_semanas_anteriores === undefined) return f.frequenciaSemMedia(f.treinos(treinos_semana_atual));
      return `${f.frequenciaComMedia(
        f.treinos(treinos_semana_atual),
        formatarPeso(Math.round(media_semanas_anteriores * 10) / 10, ctx.idioma),
      )} ${f.umaSemanaNaoETendencia}`;
    }

    case "SEQUENCIA_DIAS": {
      const dias = calcularSequenciaAtual(ctx.series.map((s) => s.data), ctx.hojeISO);
      return dias === 0 ? f.semSequencia : f.sequencia(dias);
    }

    case "RESUMO_SEMANA":
      return leituraDeterministica(ctx.resumo, ctx.idioma);
  }
}
