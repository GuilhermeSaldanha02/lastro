/**
 * Tipos do agregador determinístico (SDD §4).
 * Nomes em PT-BR, termos do glossário (KNOWLEDGE.md §1) — sem sinônimo,
 * sem tradução para inglês.
 */

/** Uma série tal como gravada no banco (schema SDD §3.2), antes de qualquer filtro. */
export type SerieBruta = {
  id: string;
  exercicioId: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  /** RIR ausente = informação desconhecida. NUNCA usar 0 para "sem RIR" (D3). */
  rir?: number;
  pesoCorporalIncluso: boolean;
};

/** Uma ida à academia, com as séries registradas nela. */
export type TreinoBruto = {
  id: string;
  /** ISO date (YYYY-MM-DD) — data de calendário, não timestamp. */
  data: string;
  series: SerieBruta[];
};

/** Um exercício do catálogo (SDD §3.2) — inclui o atributo `unilateral`. */
export type ExercicioBruto = {
  id: string;
  nome: string;
  grupoMuscularPrimario: string;
  unilateral: boolean;
};

/**
 * Série VALENDO já enriquecida com o exercício e a semana do treino.
 * É o único ponto do agregador onde aquecimento é filtrado (FF4) — todo
 * módulo downstream recebe só isto, nunca `SerieBruta` crua ou `TreinoBruto`.
 */
export type SerieValendo = {
  treinoId: string;
  exercicioId: string;
  exercicio: string;
  grupoMuscular: string;
  unilateral: boolean;
  reps: number;
  peso: number;
  rir?: number;
  pesoCorporalIncluso: boolean;
  /** ISO date do treino. */
  data: string;
  /** ISO date (segunda-feira) da semana ISO-8601 do treino. */
  semanaInicio: string;
};

/**
 * ResumoCompacto — o ÚNICO objeto que chega ao LLM (SDD §D2).
 * REGRA DA PRESENÇA (SDD §1): campo ausente = informação indisponível.
 * Nenhum campo é preenchido com 0, null "neutro" ou placeholder para
 * significar "não sei". Se não sabemos, o campo não existe.
 * Todo delta é PRÉ-CALCULADO — o modelo nunca subtrai (ADR-003).
 */
export type ResumoCompacto = {
  /** Versão do contrato. Agregador e prompt sobem juntos. */
  versao: 1;

  periodo: {
    /** ISO date da segunda-feira da semana analisada (semana ISO-8601). */
    semana_atual_inicio: string;
    /** Semanas completas com pelo menos 1 série valendo, dentro da janela. */
    semanas_com_dados: number;
    /** Janela de COMPARAÇÃO em semanas. Fase 1: 4 (PRD §3). */
    janela_semanas: number;
  };

  /**
   * Faixa de referência de séries valendo por grupo/semana (KNOWLEDGE §3.6).
   * É a MESMA para todos os grupos. Rótulo de convenção prática é
   * obrigatório na UI.
   */
  faixa_referencia_series: [number, number];

  /**
   * Volume total (todos os grupos somados) por semana, mais recente por
   * último, cobrindo `periodo.janela_semanas` semanas.
   * Semana sem nenhuma série valendo aparece com volume 0 EXPLÍCITO —
   * isso NÃO viola a Regra da Presença: zero é fato conhecido aqui.
   */
  volume_semanal: Array<{
    semana_inicio: string;
    volume_total: number;
  }>;

  volume_por_grupo_muscular: Array<{
    grupo_muscular: string;
    series_valendo: number;
    volume: number;
    /** Ausente se não há semana anterior com dados. */
    delta_series_pct?: number;
    delta_volume_pct?: number;
    posicao_na_faixa: "abaixo" | "dentro" | "acima";
  }>;

  /**
   * Volume por EXERCÍCIO (não por grupo), semana atual — DESIGN.md §3.6.3,
   * Linha 2 do bloco de evidência ("80kg × 6"). `peso_referencia` e
   * `reps_referencia` vêm do set de MAIOR peso do treino mais recente da
   * semana em que o exercício apareceu — não é média nem soma, é o "top
   * set" que o dono de fato registrou, para não inventar um par que
   * nenhuma série real tem.
   */
  volume_por_exercicio: Array<{
    exercicio: string;
    grupo_muscular: string;
    series_valendo: number;
    volume: number;
    peso_referencia: number;
    reps_referencia: number;
    /** Ausente se não há semana anterior com dados deste exercício. */
    delta_volume_pct?: number;
  }>;

  tendencia_e1rm: Array<{
    exercicio: string;
    grupo_muscular: string;
    e1rm_atual: number;
    e1rm_inicial: number;
    delta_pct: number;
    sessoes: number;
  }>;

  /**
   * Escopo: SEMANA ATUAL (SDD §D3, corrigido — não a janela de comparação).
   * Ausente quando a cobertura de RIR fica abaixo do piso (D3).
   */
  series_dificeis?: {
    total: number;
    series_valendo_com_rir: number;
    series_valendo: number;
  };
  /** Presente EXCLUSIVAMENTE quando series_dificeis está ausente. */
  cobertura_rir_insuficiente?: {
    series_valendo_com_rir: number;
    series_valendo: number;
  };

  frequencia: {
    treinos_semana_atual: number;
    media_semanas_anteriores?: number;
    grupos_sem_estimulo: string[];
  };

  estagnacoes: Array<{
    exercicio: string;
    semanas_sem_progresso: number;
    e1rm_estavel_em?: number;
    volume_estavel_em?: number;
  }>;

  /** PR = recorde contra TODO o histórico do exercício, não contra a janela. */
  prs: Array<{
    exercicio: string;
    tipo: "e1rm" | "volume";
    valor: number;
    valor_anterior: number;
  }>;
};
