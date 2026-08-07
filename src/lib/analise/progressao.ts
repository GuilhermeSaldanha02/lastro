import { calcularE1rm, elegivelParaE1rm } from "./e1rm";
import { calcularVolume } from "./volume";
import { PLATO_GRAFICO_SEMANAS, PLATO_GRAFICO_TOLERANCIA } from "./limiares";
import type { SerieValendo } from "./tipos";

/**
 * Um ponto do gráfico de progressão (DESIGN.md §3.7): uma semana ISO.
 * Regra da Presença — semana sem sessão do exercício fica com os dois
 * campos AUSENTES, nunca 0 (que seria "treinei e não levantei nada").
 */
export type PontoSemanal = {
  semanaInicio: string;
  e1rm?: number;
  volume?: number;
};

/**
 * Agrega séries VALENDO de um único exercício em pontos semanais, um por
 * entrada de `semanas` (ordem preservada — é o eixo X do gráfico).
 * e1RM da semana é o MÁXIMO elegível entre todas as séries dela (mesma
 * regra de `e1rmMaximoDaSessao` em agregar.ts, só que por semana em vez de
 * por sessão — o gráfico lê em semanas, não em treinos).
 */
export function calcularSeriesSemanais(
  series: SerieValendo[],
  semanas: string[],
): PontoSemanal[] {
  const porSemana = new Map<string, SerieValendo[]>();
  for (const serie of series) {
    if (!porSemana.has(serie.semanaInicio)) porSemana.set(serie.semanaInicio, []);
    porSemana.get(serie.semanaInicio)!.push(serie);
  }

  return semanas.map((semanaInicio) => {
    const daSemana = porSemana.get(semanaInicio);
    if (!daSemana || daSemana.length === 0) return { semanaInicio };

    const elegiveis = daSemana.filter((s) => elegivelParaE1rm(s.reps));
    const e1rm =
      elegiveis.length > 0
        ? Math.max(...elegiveis.map((s) => calcularE1rm(s.reps, s.peso)))
        : undefined;

    return { semanaInicio, e1rm, volume: calcularVolume(daSemana) };
  });
}

export type Plato = {
  semanaInicio: string;
  semanaFim: string;
  semanas: number;
};

/**
 * Platô do gráfico (DESIGN.md §3.7 item 3) — regra DESCRITIVA, não
 * clínica (ver PLATO_GRAFICO_SEMANAS/limiares.ts). Olha só a janela FIXA
 * das últimas `PLATO_GRAFICO_SEMANAS` semanas, na ponta mais recente da
 * série — não estende pra trás mesmo se semanas ainda mais antigas também
 * estivessem estáveis, e não detecta nada se a ponta mais recente tiver
 * qualquer ausência (Regra da Presença: não dá pra chamar de "sem mudar"
 * uma semana sem sessão nenhuma).
 */
export function detectarPlato(
  pontos: Array<{ semanaInicio: string; valor?: number }>,
): Plato | null {
  if (pontos.length < PLATO_GRAFICO_SEMANAS) return null;

  const janela = pontos.slice(-PLATO_GRAFICO_SEMANAS);
  if (janela.some((p) => p.valor === undefined)) return null;

  const valores = janela.map((p) => p.valor!);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  // minimo=0 (peso 0, ex.: assistida sem carga externa) quebra a variação
  // relativa — 0/0 é NaN, x/0 é Infinity. Só é platô se os dois extremos
  // forem exatamente 0; qualquer variação a partir de 0 é infinita, nunca
  // platô.
  const variacaoRelevante = minimo === 0 ? maximo !== 0 : (maximo - minimo) / minimo > PLATO_GRAFICO_TOLERANCIA;
  if (variacaoRelevante) return null;

  return {
    semanaInicio: janela[0].semanaInicio,
    semanaFim: janela[janela.length - 1].semanaInicio,
    semanas: PLATO_GRAFICO_SEMANAS,
  };
}
