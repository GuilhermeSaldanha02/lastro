/**
 * Comparação temporal (AN-08, F0-TEMPO): um único lugar para "semana",
 * "mês" e "janela de N dias", e para o período anterior equivalente de cada
 * um. Datas são dias de calendário ISO (YYYY-MM-DD), inclusivos nas duas
 * pontas — mesma convenção de `semanas.ts`, que continua dono da aritmética.
 */
import { paraDataUTC, paraISO, segundaFeiraDaSemana, somarDias } from "./semanas";

export type TipoPeriodo = "semana" | "mes" | "dias";

export type Periodo = { tipo: TipoPeriodo; inicio: string; fim: string };

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function semanaDe(dataISO: string): Periodo {
  const segunda = segundaFeiraDaSemana(paraDataUTC(dataISO));
  return { tipo: "semana", inicio: paraISO(segunda), fim: paraISO(somarDias(segunda, 6)) };
}

export function mesDe(dataISO: string): Periodo {
  const d = paraDataUTC(dataISO);
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const fim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return { tipo: "mes", inicio: paraISO(inicio), fim: paraISO(fim) };
}

/** Os `n` dias que terminam em `hojeISO`, hoje incluído. */
export function ultimosDias(hojeISO: string, n: number): Periodo {
  return { tipo: "dias", inicio: paraISO(somarDias(paraDataUTC(hojeISO), -(n - 1))), fim: hojeISO };
}

export function periodoLivre(inicio: string, fim: string): Periodo {
  if (inicio > fim) throw new Error(`período inválido: ${inicio} depois de ${fim}`);
  return { tipo: "dias", inicio, fim };
}

export function diasNoPeriodo(p: Periodo): number {
  return Math.round((paraDataUTC(p.fim).getTime() - paraDataUTC(p.inicio).getTime()) / MS_POR_DIA) + 1;
}

/**
 * O período com que `p` se compara. Mês anterior é o mês de CALENDÁRIO
 * anterior, com o tamanho dele: comparar setembro com "os 30 dias antes de
 * setembro" misturaria dois meses e ninguém lê assim.
 */
export function anteriorEquivalente(p: Periodo): Periodo {
  const vespera = paraISO(somarDias(paraDataUTC(p.inicio), -1));
  if (p.tipo === "semana") return semanaDe(vespera);
  if (p.tipo === "mes") return mesDe(vespera);
  return ultimosDias(vespera, diasNoPeriodo(p));
}

export function contem(p: Periodo, dataISO: string): boolean {
  return dataISO >= p.inicio && dataISO <= p.fim;
}

export type Variacao = { atual: number; anterior: number; delta: number; deltaPct?: number };

/** Regra da Presença: sem base (anterior 0), `deltaPct` não existe — nunca 0 nem Infinity. */
export function variacao(atual: number, anterior: number): Variacao {
  const resultado: Variacao = { atual, anterior, delta: atual - anterior };
  if (anterior > 0) {
    resultado.deltaPct = Math.round(((atual - anterior) / anterior) * 1000) / 10;
  }
  return resultado;
}
