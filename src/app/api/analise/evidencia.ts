/**
 * lastro · SDD.md §6.2 — fatia estruturada de evidência devolvida à tela
 * junto de `parecer`. Função PURA, sem rede: separa o contrato da TELA
 * (DESIGN.md §3.6.3) do contrato do PROMPT (`ResumoCompacto` inteiro,
 * dimensionado contra `MAX_BYTES_RESUMO`) — devolver o resumo cru
 * acoplaria os dois (DECISIONS.md 2026-08-08).
 *
 * Um bloco só existe quando o exercício tem AMBOS `tendencia_e1rm`
 * (sinal e delta) e `volume_por_exercicio` (peso×reps×séries valendo) —
 * sem os dois, o bloco não teria como preencher a Linha 2 de §3.6.3 sem
 * inventar um número (E3). Regra da Presença: exercício sem os dois não
 * aparece, não aparece com campo ausente.
 */
import type { ResumoCompacto } from "@/lib/analise/tipos";

/**
 * Zona-morta pra classificar "platô" no bloco de evidência, a partir do
 * DELTA DE e1RM na janela de comparação (`tendencia_e1rm`, 4 semanas) —
 * família de sinal DIFERENTE da regra de platô do GRÁFICO
 * (`PLATO_GRAFICO_TOLERANCIA`, 3 semanas, `limiares.ts`). DESIGN.md
 * §3.6.3 decide que os dois nunca competem pela mesma barra lateral;
 * por isso este valor não reusa aquela constante, mesmo sendo parecido.
 * `estagnacoes` (mesma família da janela de comparação, mas streak sem
 * NOVO MÁXIMO) não decide a cor — ela conflaria platô real com queda
 * disfarçada (achado real, seed 2026-08-08: Remada Curvada em queda
 * constante também aparece em `estagnacoes`). A cor vem só do sinal do
 * delta; estagnação vira texto qualificado, nunca uma segunda cor.
 */
const ZONA_MORTA_PLATO_PCT = 1;

export type Sinal = "alta" | "plato" | "queda";

export function classificarSinal(deltaPct: number): Sinal {
  if (Math.abs(deltaPct) <= ZONA_MORTA_PLATO_PCT) return "plato";
  return deltaPct > 0 ? "alta" : "queda";
}

export type BlocoEvidencia = {
  exercicio: string;
  grupo_muscular: string;
  sinal: Sinal;
  peso_referencia: number;
  reps_referencia: number;
  volume: number;
  series_valendo: number;
  delta_pct: number;
  /** Presente quando o mesmo exercício também está em `estagnacoes` — texto qualificado, nunca cor (ver comentário acima). */
  semanas_sem_progresso?: number;
};

export type EvidenciaParaTela = {
  periodo: {
    semana_atual_inicio: string;
    /** `semana_atual_inicio` + 6 dias — domingo da mesma semana ISO. */
    semana_atual_fim: string;
    janela_semanas: number;
  };
  blocos: BlocoEvidencia[];
};

function somarDiasIso(dataIso: string, dias: number): string {
  const data = new Date(`${dataIso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function montarEvidenciaParaTela(
  resumo: ResumoCompacto,
): EvidenciaParaTela {
  const volumePorNome = new Map(
    resumo.volume_por_exercicio.map((v) => [v.exercicio, v]),
  );
  const estagnacaoPorNome = new Map(
    resumo.estagnacoes.map((e) => [e.exercicio, e.semanas_sem_progresso]),
  );

  const blocos: BlocoEvidencia[] = [];
  for (const tendencia of resumo.tendencia_e1rm) {
    const volumeExercicio = volumePorNome.get(tendencia.exercicio);
    if (!volumeExercicio) continue; // sem os dois, sem bloco — ver docstring

    blocos.push({
      exercicio: tendencia.exercicio,
      grupo_muscular: tendencia.grupo_muscular,
      sinal: classificarSinal(tendencia.delta_pct),
      peso_referencia: volumeExercicio.peso_referencia,
      reps_referencia: volumeExercicio.reps_referencia,
      volume: volumeExercicio.volume,
      series_valendo: volumeExercicio.series_valendo,
      delta_pct: tendencia.delta_pct,
      ...(estagnacaoPorNome.has(tendencia.exercicio)
        ? { semanas_sem_progresso: estagnacaoPorNome.get(tendencia.exercicio) }
        : {}),
    });
  }

  return {
    periodo: {
      semana_atual_inicio: resumo.periodo.semana_atual_inicio,
      semana_atual_fim: somarDiasIso(resumo.periodo.semana_atual_inicio, 6),
      janela_semanas: resumo.periodo.janela_semanas,
    },
    blocos,
  };
}
