/**
 * Fonte única de todo número usado pelo agregador (SDD §4.2).
 * Nenhum outro arquivo do projeto repete estes valores (P7).
 */

/** RIR ≤ este valor = série difícil. Fonte: KNOWLEDGE.md §1 (inclui RIR 0). */
export const RIR_SERIE_DIFICIL: number = 3;
/** Faixa de referência de séries valendo por grupo/semana. Fonte: KNOWLEDGE.md §3.6. */
export const FAIXA_SERIES_SEMANAIS: [number, number] = [10, 20];
/**
 * Semanas sem progresso = estagnação. KNOWLEDGE.md §3.7 dá uma faixa (3–4),
 * não um ponto. RESOLVIDO nesta spec (SDD §4.2): 4 — alinha com
 * JANELA_SEMANAS e é o extremo mais conservador da faixa.
 */
export const SEMANAS_ESTAGNACAO: number = 4;

/**
 * Platô do GRÁFICO de progressão (DESIGN.md §3.7) — regra descritiva/visual,
 * DIFERENTE de SEMANAS_ESTAGNACAO acima (que é o limiar clínico que a Análise
 * usa pra aconselhar ação, PRD §10, ainda TODO). Decidida com o dono em
 * DECISIONS.md 2026-08-07, apoiada em pesquisa (RITFit, FitnessAI, Carbon
 * Performance, Barbell Medicine convergem em 3–4 semanas sem melhora
 * mensurável como o limiar comum de "plateau" em treino de força).
 */
export const PLATO_GRAFICO_SEMANAS: number = 3;
export const PLATO_GRAFICO_TOLERANCIA: number = 0.02;

/** Teto de reps para e1RM confiável. Convenção prática. Fonte: SDD §2/D1. */
export const E1RM_REPS_MAX = 12;
/** Piso de cobertura de RIR. Convenção prática. Fonte: SDD §2/D3. */
export const COBERTURA_RIR_MINIMA = 0.6;

/** Janela de COMPARAÇÃO — deltas e tendência de e1RM (PRD §3). */
export const JANELA_SEMANAS = 4;
/**
 * Janela de LEITURA para estagnação. Detectar "N semanas sem progresso"
 * exige N+1 semanas de dado.
 */
export const LOOKBACK_ESTAGNACAO_SEMANAS = SEMANAS_ESTAGNACAO + 1;

export const MAX_TENDENCIA_E1RM = 8;
/** Mesmo teto de `MAX_TENDENCIA_E1RM` — os cards de evidência pareiam exercício a exercício. */
export const MAX_VOLUME_POR_EXERCICIO = 8;

/**
 * Piso de semanas fechadas com treino pra liberar a Análise Semanal
 * (DESIGN.md §3.6.5, estado "Sem dados suficientes"). Abaixo disso a tela
 * bloqueia a lista de perguntas — nunca deixa o LLM ser quem avisa que
 * faltam dados. Convenção prática, mesmo número já usado no mockup de
 * referência da peça-assinatura (2026-08-10) e citado em sessões
 * anteriores como piso informal — não é limiar estatístico.
 */
export const MINIMO_SEMANAS_PARECER = 3;
export const MAX_ESTAGNACOES = 5;
export const MAX_PRS = 5;
export const MAX_GRUPOS = 12;
/** Somado contra os tetos acima em SDD §D2/C1 — não é número redondo arbitrário. */
export const MAX_BYTES_RESUMO = 6144;
