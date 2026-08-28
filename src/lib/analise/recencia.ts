import type { SerieValendo } from "./tipos";
import { paraDataUTC } from "./semanas";

export type GrupoComRecencia = { grupo: string; diasSemEstimulo: number };

const MS_POR_DIA = 24 * 60 * 60 * 1000;

type SerieComGrupoEData = Pick<SerieValendo, "grupoMuscular" | "data">;

/**
 * Há quantos dias cada grupo muscular não recebe uma série valendo,
 * do mais tempo parado para o mais recente — informação PASSIVA (o
 * usuário decide o que fazer com ela), nunca uma sessão montada pelo app.
 * PRD §5 proíbe "planos e periodizações gerados automaticamente"; isto é
 * o oposto — é análise do que já foi feito, mesma natureza de
 * `volume_por_grupo_muscular`.
 *
 * Só entra grupo que a pessoa JÁ treinou alguma vez — um grupo nunca
 * tocado não tem "última vez" para contar a partir de (Regra da
 * Presença, SDD §1): não inventamos um número para "nunca".
 */
export function diasSemEstimuloPorGrupo(
  seriesValendo: SerieComGrupoEData[],
  hojeISO: string,
): GrupoComRecencia[] {
  const ultimaDataPorGrupo = new Map<string, string>();

  for (const serie of seriesValendo) {
    if (!serie.grupoMuscular) continue;
    const atual = ultimaDataPorGrupo.get(serie.grupoMuscular);
    if (!atual || serie.data > atual) {
      ultimaDataPorGrupo.set(serie.grupoMuscular, serie.data);
    }
  }

  const hoje = paraDataUTC(hojeISO);

  return Array.from(ultimaDataPorGrupo, ([grupo, ultimaData]) => ({
    grupo,
    // Piso em 0: `ultimaData` vem do próprio treino e pode, por skew de
    // fuso entre onde a data foi gravada e onde é lida (achado de
    // revisão, 2026-08-28), cair "depois" de `hojeISO` — sem o piso isso
    // lia "-1 dias" na tela, o que não existe pra quem treinou.
    diasSemEstimulo: Math.max(
      0,
      Math.round((hoje.getTime() - paraDataUTC(ultimaData).getTime()) / MS_POR_DIA),
    ),
  })).sort(
    (a, b) => b.diasSemEstimulo - a.diasSemEstimulo || a.grupo.localeCompare(b.grupo),
  );
}
