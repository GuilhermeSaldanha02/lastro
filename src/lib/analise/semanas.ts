/**
 * Helper de calendário compartilhado por todo o agregador.
 * DESVIO do §4.1 do SDD (que não lista este arquivo): extraído porque
 * `agregar.ts`, `frequencia.ts`, `estagnacao.ts` e `prs.ts` precisam da
 * MESMA aritmética de semana ISO — duplicá-la é o tipo de limiar
 * duplicado que o CLAUDE.md aponta como falha da Fase 0.
 *
 * Toda data é tratada como calendário (Y-M-D em UTC), nunca timestamp
 * com fuso — isso elimina a classe inteira de bug de off-by-one entre
 * UTC e horário local (SDD §8, item aberto 1: "semana fecha na segunda?").
 */

/** Converte um ISO date (YYYY-MM-DD) para meia-noite UTC daquele dia. */
export function paraDataUTC(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Formata uma data como ISO date (YYYY-MM-DD), em UTC. */
export function paraISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Segunda-feira (00:00 UTC) da semana ISO-8601 que contém `data`. */
export function segundaFeiraDaSemana(data: Date): Date {
  const diaSemana = data.getUTCDay(); // 0=domingo .. 6=sábado
  const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1; // dias desde a segunda
  const segunda = new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
  );
  segunda.setUTCDate(segunda.getUTCDate() - deslocamento);
  return segunda;
}

export function somarDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

/** ISO date (segunda-feira) da semana ISO do treino, a partir da data do treino. */
export function semanaInicioDoTreino(dataTreinoISO: string): string {
  return paraISO(segundaFeiraDaSemana(paraDataUTC(dataTreinoISO)));
}

/**
 * "Semana analisada" (`periodo.semana_atual_inicio`, SDD §D2): a última
 * semana ISO COMPLETA relativa a `agora`, não a semana corrente de `agora`
 * (que pode ainda estar em andamento — ex.: `agora` numa segunda de manhã).
 * Decisão registrada em SDD §8/pergunta aberta 1: a semana fecha na segunda.
 */
export function semanaAnaliseAtual(agora: Date): string {
  return paraISO(somarDias(segundaFeiraDaSemana(agora), -7));
}

/** Diferença em semanas inteiras entre duas segundas-feiras ISO (a - b). */
export function diferencaEmSemanas(aISO: string, bISO: string): number {
  const ms = paraDataUTC(aISO).getTime() - paraDataUTC(bISO).getTime();
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Lista `quantidade` segundas-feiras ISO terminando em `semanaFinalInicio`
 * (inclusive), da mais antiga para a mais recente.
 */
export function listarSemanas(
  semanaFinalInicio: string,
  quantidade: number,
): string[] {
  const semanas: string[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    semanas.push(paraISO(somarDias(paraDataUTC(semanaFinalInicio), -7 * i)));
  }
  return semanas;
}
