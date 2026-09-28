/**
 * lastro · a resposta de CADA pergunta da Análise, por lógica (AN-08 M2-1,
 * `DECISIONS.md` 2026-09-28 (2)). Antes, as perguntas 1 a 4 iam à Gemini e,
 * quando ela falhava, todas caíam no mesmo texto (`leituraDeterministica`
 * não sabe qual pergunta foi feita) — o dono via "a mesma coisa" nas quatro.
 *
 * Cada resposta abre com UMA frase curta de julgamento: a tela a destaca como
 * veredito (`separarVeredito`, DESIGN.md §3.6.2). Depois vem o detalhe. Toda
 * conta já foi feita por `agregar.ts`; aqui só se escolhe o recorte e se
 * escreve. A pergunta 5 (o que mudar) NÃO está aqui de propósito: prescrever
 * por regra é o "plano gerado automaticamente" que o PRD §5 proíbe.
 */
import type { Idioma } from "@/lib/dados/idioma";
import { formatarPercentual, formatarPeso } from "@/lib/texto/formatar-delta";
import {
  FAIXA_SERIES_SEMANAIS,
  MINIMO_SESSOES_TENDENCIA,
  RIR_SERIE_DIFICIL,
  SEMANAS_ESTAGNACAO,
} from "./limiares";
import { ZONA_MORTA_PCT } from "./leitura-deterministica";
import type { ResumoCompacto } from "./tipos";

export type PerguntaPorLogica = 1 | 2 | 3 | 4;

export function respondidaPorLogica(pergunta: number): pergunta is PerguntaPorLogica {
  return pergunta === 1 || pergunta === 2 || pergunta === 3 || pergunta === 4;
}

type Frases = {
  e: string;
  treinos: (n: number) => string;
  kg: (v: number) => string;
  // 1 — progresso
  progrediu: (n: number, total: number) => string;
  nenhumSubiu: string;
  semTendencia: string;
  semTendenciaDetalhe: string;
  lider: (exercicio: string, pct: string) => string;
  cairam: (lista: string) => string;
  estaveis: (n: number) => string;
  recordes: (lista: string) => string;
  recordeItem: (exercicio: string, valor: string, anterior: string) => string;
  // 2 — empaque
  parados: (n: number) => string;
  nenhumParado: string;
  nenhumParadoDetalhe: (semanas: number) => string;
  paradoItem: (exercicio: string, semanas: number) => string;
  paradosLista: (lista: string) => string;
  quedaReal: (lista: string) => string;
  // 3 — equilíbrio
  foraDaFaixa: (abaixo: number, acima: number) => string;
  tudoNaFaixa: string;
  semSeriesNaSemana: string;
  faixa: (min: number, max: number) => string;
  abaixo: (lista: string) => string;
  acima: (lista: string) => string;
  dentro: (lista: string) => string;
  semEstimulo: (semanas: number, lista: string) => string;
  // 4 — demais ou de menos
  frequenciaComMedia: (treinos: string, media: string) => string;
  frequenciaSemMedia: (treinos: string) => string;
  volumeSemana: (vol: string, pct?: string) => string;
  dificeis: (dificeis: number, valendo: number, rir: number) => string;
  rirInsuficiente: (com: number, total: number) => string;
  semNadaParaJulgar: string;
};

const listar = (itens: string[], e: string) =>
  itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} ${e} ${itens[itens.length - 1]}`;

const POR_IDIOMA: Record<Idioma, Frases> = {
  "pt-BR": {
    e: "e",
    treinos: (n) => `${n} ${n === 1 ? "treino" : "treinos"}`,
    kg: (v) => `${formatarPeso(Math.round(v), "pt-BR")} kg`,
    progrediu: (n, total) => `Você progrediu em ${n} de ${total} exercícios.`,
    nenhumSubiu: "Nenhum exercício subiu de e1RM nesta janela.",
    semTendencia: "Ainda não dá para medir progresso.",
    semTendenciaDetalhe: `Nenhum exercício teve ${MINIMO_SESSOES_TENDENCIA} sessões com carga medível na janela.`,
    lider: (exercicio, pct) => `O ${exercicio} liderou, com ${pct} de e1RM.`,
    cairam: (lista) => `Em queda real: ${lista}.`,
    estaveis: (n) => `${n} ${n === 1 ? "ficou estável" : "ficaram estáveis"} (variação de até 1%).`,
    recordes: (lista) => `Recorde pessoal na semana: ${lista}.`,
    recordeItem: (exercicio, valor, anterior) => `${exercicio} (${valor}, antes ${anterior})`,
    parados: (n) => `${n} ${n === 1 ? "exercício está parado" : "exercícios estão parados"}.`,
    nenhumParado: "Nenhum exercício parado.",
    nenhumParadoDetalhe: (s) => `Nenhum ficou ${s} semanas seguidas sem novo máximo de e1RM nem de volume.`,
    paradoItem: (exercicio, s) => `${exercicio} (há ${s} ${s === 1 ? "semana" : "semanas"})`,
    paradosLista: (lista) => `Sem novo máximo de e1RM nem de volume: ${lista}.`,
    quedaReal: (lista) => `Além de parado, em queda real: ${lista}.`,
    foraDaFaixa: (abaixo, acima) =>
      abaixo > 0 && acima > 0
        ? `${abaixo} abaixo e ${acima} acima da faixa de referência.`
        : abaixo > 0
          ? `${abaixo === 1 ? "1 grupo ficou abaixo" : `${abaixo} grupos ficaram abaixo`} da faixa de referência.`
          : `${acima === 1 ? "1 grupo ficou acima" : `${acima} grupos ficaram acima`} da faixa de referência.`,
    tudoNaFaixa: "Todos os grupos treinados ficaram na faixa de referência.",
    semSeriesNaSemana: "Sem séries valendo na semana analisada.",
    faixa: (min, max) => `Faixa de referência: ${min} a ${max} séries valendo por grupo na semana (convenção prática, não prescrição).`,
    abaixo: (lista) => `Abaixo: ${lista}.`,
    acima: (lista) => `Acima: ${lista}.`,
    dentro: (lista) => `Na faixa: ${lista}.`,
    semEstimulo: (s, lista) => `Sem nenhuma série nas últimas ${s} semanas: ${lista}.`,
    frequenciaComMedia: (treinos, media) => `${treinos} na semana, contra média de ${media}.`,
    frequenciaSemMedia: (treinos) => `${treinos} na semana analisada.`,
    volumeSemana: (vol, pct) => (pct ? `Volume da semana: ${vol} (${pct} contra a anterior).` : `Volume da semana: ${vol}.`),
    dificeis: (d, v, rir) => `${d} das ${v} séries valendo foram difíceis (RIR até ${rir}).`,
    rirInsuficiente: (com, total) => `Só ${com} das ${total} séries têm RIR registrado: pouco para medir o esforço.`,
    semNadaParaJulgar: "Sem treino na semana analisada.",
  },
  en: {
    e: "and",
    treinos: (n) => `${n} ${n === 1 ? "workout" : "workouts"}`,
    kg: (v) => `${formatarPeso(Math.round(v), "en")} kg`,
    progrediu: (n, total) => `You progressed in ${n} of ${total} exercises.`,
    nenhumSubiu: "No exercise gained e1RM in this window.",
    semTendencia: "Progress can't be measured yet.",
    semTendenciaDetalhe: `No exercise had ${MINIMO_SESSOES_TENDENCIA} sessions with measurable load in the window.`,
    lider: (exercicio, pct) => `${exercicio} led, with ${pct} in e1RM.`,
    cairam: (lista) => `Actually declining: ${lista}.`,
    estaveis: (n) => `${n} stayed flat (change of up to 1%).`,
    recordes: (lista) => `Personal record this week: ${lista}.`,
    recordeItem: (exercicio, valor, anterior) => `${exercicio} (${valor}, was ${anterior})`,
    parados: (n) => `${n} ${n === 1 ? "exercise is" : "exercises are"} stalled.`,
    nenhumParado: "No stalled exercise.",
    nenhumParadoDetalhe: (s) => `None went ${s} weeks in a row without a new e1RM or volume max.`,
    paradoItem: (exercicio, s) => `${exercicio} (${s} ${s === 1 ? "week" : "weeks"})`,
    paradosLista: (lista) => `No new e1RM or volume max: ${lista}.`,
    quedaReal: (lista) => `Besides stalled, actually declining: ${lista}.`,
    foraDaFaixa: (abaixo, acima) =>
      abaixo > 0 && acima > 0
        ? `${abaixo} below and ${acima} above the reference range.`
        : abaixo > 0
          ? `${abaixo === 1 ? "1 group was" : `${abaixo} groups were`} below the reference range.`
          : `${acima === 1 ? "1 group was" : `${acima} groups were`} above the reference range.`,
    tudoNaFaixa: "Every trained group was within the reference range.",
    semSeriesNaSemana: "No working sets in the analyzed week.",
    faixa: (min, max) => `Reference range: ${min} to ${max} working sets per group per week (a practical convention, not a prescription).`,
    abaixo: (lista) => `Below: ${lista}.`,
    acima: (lista) => `Above: ${lista}.`,
    dentro: (lista) => `Within: ${lista}.`,
    semEstimulo: (s, lista) => `No sets at all in the last ${s} weeks: ${lista}.`,
    frequenciaComMedia: (treinos, media) => `${treinos} this week, against an average of ${media}.`,
    frequenciaSemMedia: (treinos) => `${treinos} in the analyzed week.`,
    volumeSemana: (vol, pct) => (pct ? `Weekly volume: ${vol} (${pct} vs. the previous week).` : `Weekly volume: ${vol}.`),
    dificeis: (d, v, rir) => `${d} of the ${v} working sets were hard (RIR up to ${rir}).`,
    rirInsuficiente: (com, total) => `Only ${com} of the ${total} sets have RIR logged: too few to measure effort.`,
    semNadaParaJulgar: "No workouts in the analyzed week.",
  },
  es: {
    e: "y",
    treinos: (n) => `${n} ${n === 1 ? "entrenamiento" : "entrenamientos"}`,
    kg: (v) => `${formatarPeso(Math.round(v), "es")} kg`,
    progrediu: (n, total) => `Progresaste en ${n} de ${total} ejercicios.`,
    nenhumSubiu: "Ningún ejercicio subió de e1RM en esta ventana.",
    semTendencia: "Todavía no se puede medir el progreso.",
    semTendenciaDetalhe: `Ningún ejercicio tuvo ${MINIMO_SESSOES_TENDENCIA} sesiones con carga medible en la ventana.`,
    lider: (exercicio, pct) => `${exercicio} lideró, con ${pct} de e1RM.`,
    cairam: (lista) => `En caída real: ${lista}.`,
    estaveis: (n) => `${n} ${n === 1 ? "quedó estable" : "quedaron estables"} (variación de hasta 1%).`,
    recordes: (lista) => `Récord personal en la semana: ${lista}.`,
    recordeItem: (exercicio, valor, anterior) => `${exercicio} (${valor}, antes ${anterior})`,
    parados: (n) => `${n} ${n === 1 ? "ejercicio está estancado" : "ejercicios están estancados"}.`,
    nenhumParado: "Ningún ejercicio estancado.",
    nenhumParadoDetalhe: (s) => `Ninguno pasó ${s} semanas seguidas sin nuevo máximo de e1RM ni de volumen.`,
    paradoItem: (exercicio, s) => `${exercicio} (hace ${s} ${s === 1 ? "semana" : "semanas"})`,
    paradosLista: (lista) => `Sin nuevo máximo de e1RM ni de volumen: ${lista}.`,
    quedaReal: (lista) => `Además de estancado, en caída real: ${lista}.`,
    foraDaFaixa: (abaixo, acima) =>
      abaixo > 0 && acima > 0
        ? `${abaixo} por debajo y ${acima} por encima del rango de referencia.`
        : abaixo > 0
          ? `${abaixo === 1 ? "1 grupo quedó" : `${abaixo} grupos quedaron`} por debajo del rango de referencia.`
          : `${acima === 1 ? "1 grupo quedó" : `${acima} grupos quedaron`} por encima del rango de referencia.`,
    tudoNaFaixa: "Todos los grupos entrenados quedaron dentro del rango de referencia.",
    semSeriesNaSemana: "Sin series válidas en la semana analizada.",
    faixa: (min, max) => `Rango de referencia: ${min} a ${max} series válidas por grupo en la semana (convención práctica, no prescripción).`,
    abaixo: (lista) => `Por debajo: ${lista}.`,
    acima: (lista) => `Por encima: ${lista}.`,
    dentro: (lista) => `Dentro: ${lista}.`,
    semEstimulo: (s, lista) => `Ninguna serie en las últimas ${s} semanas: ${lista}.`,
    frequenciaComMedia: (treinos, media) => `${treinos} en la semana, contra un promedio de ${media}.`,
    frequenciaSemMedia: (treinos) => `${treinos} en la semana analizada.`,
    volumeSemana: (vol, pct) => (pct ? `Volumen de la semana: ${vol} (${pct} contra la anterior).` : `Volumen de la semana: ${vol}.`),
    dificeis: (d, v, rir) => `${d} de las ${v} series válidas fueron difíciles (RIR hasta ${rir}).`,
    rirInsuficiente: (com, total) => `Solo ${com} de las ${total} series tienen RIR registrado: poco para medir el esfuerzo.`,
    semNadaParaJulgar: "Sin entrenamientos en la semana analizada.",
  },
};

function progresso(r: ResumoCompacto, f: Frases, idioma: Idioma): string[] {
  const tendencias = [...r.tendencia_e1rm].sort((a, b) => b.delta_pct - a.delta_pct);
  if (tendencias.length === 0) return [f.semTendencia, f.semTendenciaDetalhe];

  const subiram = tendencias.filter((t) => t.delta_pct > ZONA_MORTA_PCT);
  const cairam = tendencias.filter((t) => t.delta_pct < -ZONA_MORTA_PCT).sort((a, b) => a.delta_pct - b.delta_pct);
  const estaveis = tendencias.length - subiram.length - cairam.length;

  const frases = [subiram.length > 0 ? f.progrediu(subiram.length, tendencias.length) : f.nenhumSubiu];
  if (subiram.length > 0) frases.push(f.lider(subiram[0].exercicio, formatarPercentual(subiram[0].delta_pct, idioma)));
  if (cairam.length > 0) {
    frases.push(f.cairam(listar(cairam.map((t) => `${t.exercicio} (${formatarPercentual(t.delta_pct, idioma)})`), f.e)));
  }
  if (estaveis > 0) frases.push(f.estaveis(estaveis));
  if (r.prs.length > 0) {
    frases.push(
      f.recordes(
        listar(
          r.prs.map((p) => f.recordeItem(p.exercicio, formatarPeso(p.valor, idioma), formatarPeso(p.valor_anterior, idioma))),
          f.e,
        ),
      ),
    );
  }
  return frases;
}

function empaque(r: ResumoCompacto, f: Frases, idioma: Idioma): string[] {
  if (r.estagnacoes.length === 0) return [f.nenhumParado, f.nenhumParadoDetalhe(SEMANAS_ESTAGNACAO)];
  const parados = new Set(r.estagnacoes.map((e) => e.exercicio));
  const frases = [
    f.parados(r.estagnacoes.length),
    f.paradosLista(listar(r.estagnacoes.map((e) => f.paradoItem(e.exercicio, e.semanas_sem_progresso)), f.e)),
  ];
  const emQueda = r.tendencia_e1rm.filter((t) => parados.has(t.exercicio) && t.delta_pct < -ZONA_MORTA_PCT);
  if (emQueda.length > 0) {
    frases.push(f.quedaReal(listar(emQueda.map((t) => `${t.exercicio} (${formatarPercentual(t.delta_pct, idioma)})`), f.e)));
  }
  return frases;
}

function equilibrio(r: ResumoCompacto, f: Frases): string[] {
  const grupos = r.volume_por_grupo_muscular;
  const item = (g: (typeof grupos)[number]) => `${g.grupo_muscular} (${g.series_valendo})`;
  const abaixo = grupos.filter((g) => g.posicao_na_faixa === "abaixo");
  const acima = grupos.filter((g) => g.posicao_na_faixa === "acima");
  const dentro = grupos.filter((g) => g.posicao_na_faixa === "dentro");
  const [min, max] = FAIXA_SERIES_SEMANAIS;

  const frases = [
    grupos.length === 0 ? f.semSeriesNaSemana : abaixo.length + acima.length > 0 ? f.foraDaFaixa(abaixo.length, acima.length) : f.tudoNaFaixa,
  ];
  if (grupos.length > 0) {
    frases.push(f.faixa(min, max));
    if (abaixo.length > 0) frases.push(f.abaixo(listar(abaixo.map(item), f.e)));
    if (acima.length > 0) frases.push(f.acima(listar(acima.map(item), f.e)));
    if (dentro.length > 0) frases.push(f.dentro(listar(dentro.map(item), f.e)));
  }
  if (r.frequencia.grupos_sem_estimulo.length > 0) {
    frases.push(f.semEstimulo(r.periodo.janela_semanas, listar(r.frequencia.grupos_sem_estimulo, f.e)));
  }
  return frases;
}

function demaisOuDeMenos(r: ResumoCompacto, f: Frases, idioma: Idioma): string[] {
  const { treinos_semana_atual, media_semanas_anteriores } = r.frequencia;
  if (treinos_semana_atual === 0 && media_semanas_anteriores === undefined) return [f.semNadaParaJulgar];

  const frases = [
    media_semanas_anteriores === undefined
      ? f.frequenciaSemMedia(f.treinos(treinos_semana_atual))
      : f.frequenciaComMedia(f.treinos(treinos_semana_atual), formatarPeso(Math.round(media_semanas_anteriores * 10) / 10, idioma)),
  ];

  const semanas = r.volume_semanal;
  const atual = semanas[semanas.length - 1]?.volume_total ?? 0;
  const anterior = semanas[semanas.length - 2]?.volume_total ?? 0;
  const pct = anterior > 0 ? formatarPercentual(Math.round(((atual - anterior) / anterior) * 1000) / 10, idioma) : undefined;
  frases.push(f.volumeSemana(f.kg(atual), pct));

  if (r.series_dificeis) {
    frases.push(f.dificeis(r.series_dificeis.total, r.series_dificeis.series_valendo, RIR_SERIE_DIFICIL));
  } else if (r.cobertura_rir_insuficiente) {
    frases.push(f.rirInsuficiente(r.cobertura_rir_insuficiente.series_valendo_com_rir, r.cobertura_rir_insuficiente.series_valendo));
  }
  return frases;
}

/** A resposta da pergunta, com o veredito como primeira frase. */
export function leituraDaPergunta(resumo: ResumoCompacto, pergunta: PerguntaPorLogica, idioma: Idioma): string {
  const f = POR_IDIOMA[idioma];
  const frases =
    pergunta === 1
      ? progresso(resumo, f, idioma)
      : pergunta === 2
        ? empaque(resumo, f, idioma)
        : pergunta === 3
          ? equilibrio(resumo, f)
          : demaisOuDeMenos(resumo, f, idioma);
  return frases.join(" ");
}
