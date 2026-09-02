/**
 * Acima disso, uma linha 'gerando' é tratada como abandonada — não trava
 * mais gerações novas (SDD.md §11.2). Era 5 até a auditoria independente
 * de AA-01 (qa/evidencias/AA-01/auditoria-independente/correcao.md,
 * 2026-09-02) medir uma chamada real à Gemini levando ~4min32s — a só 28s
 * do limiar antigo, bem mais apertado do que a spec original supunha
 * ("folgado o bastante... com margem"). Subido pra 10 pra dar folga real.
 */
export const LIMITE_GERACAO_TRAVADA_MINUTOS = 10;
/** Rascunho pronto (status='pronto', confirmado=false) sem decisão do dono expira sozinho (SDD.md §11.2). */
export const EXPIRA_RASCUNHO_HORAS = 24;
