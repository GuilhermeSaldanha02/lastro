export type GrupoComValor = { grupo: string; valor: number };
export type ParticipacaoGrupo = GrupoComValor & { percentual: number };

/** Participação dos grupos primários nas séries valendo já agregadas. */
export function distribuirGrupos(grupos: readonly GrupoComValor[]): ParticipacaoGrupo[] {
  const valores = new Map<string, number>();
  for (const { grupo, valor } of grupos) {
    const id = grupo.trim().toLowerCase();
    if (!id || !Number.isFinite(valor) || valor <= 0) continue;
    valores.set(id, (valores.get(id) ?? 0) + valor);
  }
  const total = [...valores.values()].reduce((soma, valor) => soma + valor, 0);
  return [...valores].map(([grupo, valor]) => ({ grupo, valor, percentual: Math.round((valor / total) * 1000) / 10 }));
}
