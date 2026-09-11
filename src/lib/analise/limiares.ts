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
/**
 * Mínimo de SESSÕES do mesmo exercício para desenhar tendência de e1RM
 * (T-E6, `agregar.ts`). Unidade diferente de `MINIMO_SEMANAS_PARECER`
 * acima, e a confusão entre as duas é real: a tela de Análise chegou a
 * dizer "2 semanas do mesmo exercício" ao lado de "3 semanas fechadas",
 * como se fossem o mesmo tipo de contagem — dois treinos na MESMA semana
 * já satisfazem este piso. Nomear o número tira ele do texto e do
 * agregador ao mesmo tempo, para os dois não divergirem de novo.
 */
export const MINIMO_SESSOES_TENDENCIA = 2;
/**
 * Piso de sessões ANTERIORES daquele exercício pra marcar PR na linha da
 * série (backlog C4, 2026-08-13). Sem isso, com pouco histórico toda série
 * vira "recorde" e o marcador perde o sentido. Decidido com o dono — não é
 * limiar estatístico, é convenção prática (mesmo padrão de
 * MINIMO_SEMANAS_PARECER acima, ainda que a unidade seja diferente: sessões
 * do exercício, não semanas fechadas).
 */
export const MINIMO_SESSOES_PARA_RECORDE = 3;
export const MAX_ESTAGNACOES = 5;
export const MAX_PRS = 5;
export const MAX_GRUPOS = 12;
/** Somado contra os tetos acima em SDD §D2/C1 — não é número redondo arbitrário. */
export const MAX_BYTES_RESUMO = 6144;

// ============================================================
// Módulo Personal — os números da SELETIVIDADE (PRD §11.4.6)
// ============================================================
// Estes quatro não são ajuste fino: a §11.4.6 diz que seletividade É o
// produto, e que um alerta disparando para todo grupo toda semana mata o
// módulo. São os números que decidem isso, e vêm das entrevistas
// (DECISIONS.md "2026-09-10 (6)"), não de estatística.

/**
 * Teto de alertas por aluno, por semana. DECIDIDO PELO DONO em 2026-09-11.
 *
 * O P2 nomeou o modo de morte com quatro linhas numa tela: "Peito:
 * atenção / Bíceps: atenção / Costas: atenção / Tríceps: atenção — aí sim
 * vira notificação que eu começo a ignorar." Dois cabe no olho e força a
 * priorização a escolher de verdade. Não é limiar estatístico.
 */
export const TETO_ALERTAS_ALUNO_SEMANA = 2;

/**
 * Dias sem série valendo num grupo para ele virar alerta.
 *
 * 21 = a régua de 3 SEMANAS que o P2 deu ao dizer que abre o alerta se o
 * sinal for tendência, e não oscilação de uma sessão. DIFERENTE de
 * `SEMANAS_ESTAGNACAO` (4), que é sobre progresso de carga num exercício
 * que CONTINUA sendo treinado — aqui o grupo não está sendo treinado.
 *
 * Não confundir com o TODO aberto do `PRD.md` §10 ("N semanas que
 * caracterizam estagnação", que exige fonte primária): este número não
 * afirma nada clínico, só decide o que é barulho na fila de trabalho de
 * um profissional.
 */
export const DIAS_SEM_ESTIMULO_PARA_ALERTA = 21;

/**
 * Semanas sem re-emitir o MESMO (tipo, alvo) para o mesmo aluno.
 *
 * O teto de 2/semana sozinho NÃO impede a morte do módulo: um exercício
 * empacado há seis semanas gera os mesmos dois alertas em seis segundas
 * seguidas. Repetido no eixo do TEMPO mata igual a repetido no eixo do
 * grupo. 3 semanas lembra sem amolar — e é a mesma régua de tendência
 * acima, de propósito: o alerta volta quando o problema já é novo de novo.
 */
export const SEMANAS_SUPRESSAO_ALERTA = 3;

/**
 * Quedas consecutivas de volume semanal para virar alerta. Três quedas
 * exigem quatro semanas de dado — cabe exatamente na `JANELA_SEMANAS` (4)
 * que o `volume_semanal` do resumo já traz, sem agregação nova.
 */
export const QUEDAS_VOLUME_PARA_ALERTA = 3;
