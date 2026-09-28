// lastro · UX-02 — separa "treino de hoje" do resto e agrupa o restante por
// mês, mais recente primeiro. Função pura: recebe `Treino[]` já ordenado
// pelo servidor (`listarTreinos`, mais recente primeiro) e não recalcula
// nada de métrica — volume e séries continuam vindo de lá.
import type { Treino } from "@/lib/dados/treino";
import { anoMesDeData } from "./calendario-mes";

export type GrupoMes = {
  anoMes: string;
  itens: Treino[];
};

export type HistoricoAgrupado = {
  /** Treinos de hoje (qualquer estado), na ordem que já vêm do servidor. */
  hoje: Treino[];
  /** O resto, agrupado por mês — hoje nunca aparece aqui. */
  porMes: GrupoMes[];
};

export function agruparHistorico(treinos: Treino[], hojeISO: string): HistoricoAgrupado {
  const hoje = treinos.filter((t) => t.data === hojeISO);
  const resto = treinos.filter((t) => t.data !== hojeISO);

  const porMes: GrupoMes[] = [];
  for (const treino of resto) {
    const anoMes = anoMesDeData(treino.data);
    const grupoAtual = porMes[porMes.length - 1];
    if (grupoAtual && grupoAtual.anoMes === anoMes) {
      grupoAtual.itens.push(treino);
    } else {
      porMes.push({ anoMes, itens: [treino] });
    }
  }

  return { hoje, porMes };
}

/** Os meses que têm pelo menos um treino (hoje incluído), mais recente primeiro — é o que o calendário deixa navegar. */
export function mesesComTreino(treinos: Treino[]): string[] {
  const vistos = new Set<string>();
  const meses: string[] = [];
  for (const treino of treinos) {
    const anoMes = anoMesDeData(treino.data);
    if (!vistos.has(anoMes)) {
      vistos.add(anoMes);
      meses.push(anoMes);
    }
  }
  return meses;
}
