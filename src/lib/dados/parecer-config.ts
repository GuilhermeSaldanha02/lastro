/** Acima disso, uma linha 'gerando' é tratada como abandonada — não trava mais gerações novas (SDD.md §11.2). */
export const LIMITE_GERACAO_TRAVADA_MINUTOS = 5;
/** Rascunho pronto (status='pronto', confirmado=false) sem decisão do dono expira sozinho (SDD.md §11.2). */
export const EXPIRA_RASCUNHO_HORAS = 24;
