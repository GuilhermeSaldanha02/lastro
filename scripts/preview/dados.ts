// Dado REAL do parecer 4dc6bcbf… (conta do dono, banco hospedado) — a
// bancada nunca inventa número. A única parte sintética está marcada.
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";

export const evidenciaReal = {
  periodo: { janela_semanas: 4, semana_atual_fim: "2026-08-30", semana_atual_inicio: "2026-08-24" },
  blocos: [
    { sinal: "plato", volume: 7280, delta_pct: 0, exercicio: "Leg press 45 graus", grupo_muscular: "Quadríceps", series_valendo: 4, peso_referencia: 160, reps_referencia: 8 },
    { sinal: "alta", volume: 4080, delta_pct: 66.7, exercicio: "Tríceps pulley (corda)", grupo_muscular: "Tríceps", series_valendo: 8, peso_referencia: 55, reps_referencia: 12 },
    { sinal: "plato", volume: 3300, delta_pct: 0, exercicio: "Rosca concentrada", grupo_muscular: "Bíceps", series_valendo: 5, peso_referencia: 40, reps_referencia: 10 },
    { sinal: "alta", volume: 4800, delta_pct: 25, exercicio: "Puxada pegada supinada", grupo_muscular: "Costas", series_valendo: 6, peso_referencia: 50, reps_referencia: 8 },
    { sinal: "queda", volume: 3200, delta_pct: -29.8, exercicio: "Supino fechado", grupo_muscular: "Tríceps", series_valendo: 4, peso_referencia: 40, reps_referencia: 10 },
    { sinal: "alta", volume: 3000, delta_pct: 10, exercicio: "Tríceps francês com halter", grupo_muscular: "Tríceps", series_valendo: 3, peso_referencia: 55, reps_referencia: 10 },
  ],
} as unknown as EvidenciaParaTela;

/** Texto REAL em fallback determinístico que está na conta do dono hoje. */
export const textoFallbackReal = `Semana de 2026-08-24 — 4 de 4 semanas da janela com dados.
Volume total em 2026-08-03: 16662.
Volume total em 2026-08-10: 42262.
Volume total em 2026-08-17: 32691.
Volume total em 2026-08-24: 60751.
Costas: 23 séries valendo, volume 15685 (349.4% vs. semana anterior) — acima da faixa de referência.
Quadríceps: 12 séries valendo, volume 11764 (-15.4% vs. semana anterior) — dentro da faixa de referência.
Tríceps: 15 séries valendo, volume 10280 (160.9% vs. semana anterior) — dentro da faixa de referência.
Peito: 14 séries valendo, volume 6584 (41.3% vs. semana anterior) — dentro da faixa de referência.
Ombro: 9 séries valendo, volume 5520 (220.9% vs. semana anterior) — abaixo da faixa de referência.
Bíceps: 11 séries valendo, volume 5132 (123.1% vs. semana anterior) — dentro da faixa de referência.
Posterior de coxa: 7 séries valendo, volume 3770 (129.9% vs. semana anterior) — abaixo da faixa de referência.
Panturrilha: 3 séries valendo, volume 1440 — abaixo da faixa de referência.
Abdômen: 4 séries valendo, volume 576 — abaixo da faixa de referência.
Frequência na semana atual: 5 treino(s).`;

/** SINTÉTICO — a Gemini deu 503 nesta semana e não há prosa real no
 *  banco. Existe só para exercitar a tipografia do veredito (Fraunces
 *  48px) e do corpo. Os números citados são os reais acima. */
export const textoProsaExemplo = `Seu tríceps carregou a semana. Puxada e tríceps subiram junto — 25% e 66,7% de e1RM na janela de 4 semanas — enquanto Leg press e Rosca concentrada não saíram do lugar em nenhuma das sessões registradas. O supino fechado caiu 29,8%, e é o único movimento em queda real da lista; nas 4 séries valendo dessa semana o peso de referência ficou em 40 kg × 10. Ombro e posterior de coxa seguem abaixo da faixa de referência de volume pela segunda semana.`;
