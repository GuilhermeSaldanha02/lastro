/**
 * lastro · o desempenho de UM exercício, para a página dele (AN-08 C1,
 * direção C do portão de 2026-09-29).
 *
 * MATEMÁTICA PURA. Recorde, no app inteiro, é o maior e1RM (decisão do dono,
 * 2026-09-29): é o que a estrela das séries, a Análise e o Coach já usavam.
 * A maior carga continua existindo como dado, com esse nome e sem estrela:
 * "peguei 61 kg" é verdade e importa, mas não é o recorde.
 */
import { calcularE1rm, elegivelParaE1rm } from "./e1rm";
import { evolucaoPorMetades } from "./evolucao";

export type SerieDoExercicio = { treinoId: string; dataTreino: string; reps: number; peso: number };

export type MarcaDaSerie = { reps: number; peso: number; data: string };

export type DesempenhoExercicio = {
  /** Série de maior e1RM (reps até o teto confiável). */
  recorde: (MarcaDaSerie & { e1rm: number; sessoesDepois: number }) | null;
  /** Série de maior peso levantado, em qualquer número de reps. */
  maiorCarga: MarcaDaSerie | null;
  /** Melhor e1RM da 1ª metade das sessões × da 2ª; `null` com menos de 2 sessões. */
  evolucaoPct: number | null;
};

export function desempenhoDoExercicio(series: SerieDoExercicio[]): DesempenhoExercicio {
  const comPeso = series.filter((s) => s.peso > 0);
  if (comPeso.length === 0) return { recorde: null, maiorCarga: null, evolucaoPct: null };

  // Empate: a marca mais ANTIGA fica, porque foi ali que ela foi feita.
  const cronologicas = [...comPeso].sort((a, b) => a.dataTreino.localeCompare(b.dataTreino));

  let maiorCarga: MarcaDaSerie | null = null;
  for (const s of cronologicas) {
    if (!maiorCarga || s.peso > maiorCarga.peso) maiorCarga = { reps: s.reps, peso: s.peso, data: s.dataTreino };
  }

  const elegiveis = cronologicas.filter((s) => elegivelParaE1rm(s.reps));
  let melhor: (SerieDoExercicio & { e1rm: number }) | null = null;
  for (const s of elegiveis) {
    const e1rm = calcularE1rm(s.reps, s.peso);
    if (!melhor || e1rm > melhor.e1rm) melhor = { ...s, e1rm };
  }

  // Melhor e1RM de cada sessão, em ordem de calendário.
  const porSessao = new Map<string, { data: string; e1rm: number }>();
  for (const s of elegiveis) {
    const e1rm = calcularE1rm(s.reps, s.peso);
    const atual = porSessao.get(s.treinoId);
    if (!atual || e1rm > atual.e1rm) porSessao.set(s.treinoId, { data: s.dataTreino, e1rm });
  }
  const sessoes = Array.from(porSessao.entries()).sort((a, b) => a[1].data.localeCompare(b[1].data));
  const evolucao = evolucaoPorMetades(sessoes.map(([, s]) => s.e1rm));

  const recorde = melhor
    ? {
        reps: melhor.reps,
        peso: melhor.peso,
        data: melhor.dataTreino,
        e1rm: melhor.e1rm,
        sessoesDepois: sessoes.length - 1 - sessoes.findIndex(([id]) => id === melhor.treinoId),
      }
    : null;

  return {
    recorde,
    maiorCarga,
    evolucaoPct: evolucao ? ((evolucao.atual - evolucao.inicial) / evolucao.inicial) * 100 : null,
  };
}
