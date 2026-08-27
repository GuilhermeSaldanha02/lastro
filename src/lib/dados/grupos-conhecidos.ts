// lastro · Grupos musculares que o treino já revela sem perguntar nada.
//
// Existe por um achado do dono (2026-08-26): iniciar um treino a partir de
// um modelo salvo listava os exercícios do modelo na tela e, um toque
// depois, pedia "escolha o grupo muscular" — uma informação que a própria
// tela acabara de exibir. Perguntar o que já se sabe é fricção pura na
// cena que DESIGN.md §1 descreve (em pé, suado, uma mão, com pressa).
//
// Módulo separado do componente de propósito: é função pura, sem React,
// e o `vitest.config.ts` só coleta `src/**/*.test.ts`.

/** Só o que esta conta precisa — o catálogo real (`ExercicioDoCatalogo`) satisfaz. */
type ExercicioComGrupo = { id: string; grupoMuscularPrimario: string };

/** Idem — `Serie` e o item de modelo pré-selecionado satisfazem. */
type ReferenciaExercicio = { exercicioId: string };

/**
 * União dos grupos musculares de duas fontes que o app já conhece sem
 * perguntar: o modelo escolhido ao iniciar o treino (SDD §9.3) e as séries
 * já registradas (cobre recarregar no meio do treino, quando o modelo já
 * saiu da URL).
 *
 * Devolve vazio quando nenhuma das duas diz nada — o "Treino novo" puro,
 * ainda sem série. **Só aí perguntar é legítimo**, porque aí nada é sabido.
 *
 * O grupo sai sempre do catálogo, nunca da série nem do item de modelo:
 * só o catálogo carrega `grupoMuscularPrimario`, e é ele que o filtro do
 * formulário compara. Exercício que não esteja no catálogo é ignorado em
 * silêncio — não há grupo a deduzir, e inventar um filtraria a lista
 * errada.
 */
export function gruposConhecidos(
  catalogo: ExercicioComGrupo[],
  series: ReferenciaExercicio[],
  preSelecionados?: ReferenciaExercicio[],
): string[] {
  const grupoPorExercicio = new Map(
    catalogo.map((e) => [e.id, e.grupoMuscularPrimario]),
  );

  const conhecidos = new Set<string>();
  for (const { exercicioId } of [...(preSelecionados ?? []), ...series]) {
    const grupo = grupoPorExercicio.get(exercicioId);
    if (grupo) conhecidos.add(grupo);
  }

  return Array.from(conhecidos);
}
