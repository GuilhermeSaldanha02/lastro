/**
 * lastro · consistência por SEMANA (AN-08 M3, resto da C2): semanas
 * seguidas com treino e semanas em que a meta foi cumprida. Função pura,
 * sobre as mesmas semanas ISO (segunda a domingo) do resto do app.
 *
 * Definições, deliberadas:
 * - "treino" é treino distinto com série valendo (a mesma contagem da Home e
 *   do Coach), não dia;
 * - a semana em andamento NÃO quebra a sequência nem conta como meta
 *   perdida: na terça, ela ainda pode ser cumprida. Ela só entra quando já
 *   tem treino (sequência) ou aparece à parte, como "até hoje" (meta);
 * - semanas antes do primeiro treino não existem para a conta: ninguém
 *   "perdeu a meta" antes de começar a usar o app.
 */
import { diferencaEmSemanas, listarSemanas, semanaInicioDoTreino, somarDias, paraDataUTC, paraISO } from "./semanas";

export type TreinoDoDia = { treinoId: string; data: string };

function treinosPorSemana(treinos: TreinoDoDia[], hojeISO: string): Map<string, number> {
  const ids = new Map<string, Set<string>>();
  for (const t of treinos) {
    if (t.data > hojeISO) continue;
    const semana = semanaInicioDoTreino(t.data);
    if (!ids.has(semana)) ids.set(semana, new Set());
    ids.get(semana)!.add(t.treinoId);
  }
  return new Map(Array.from(ids, ([semana, set]) => [semana, set.size]));
}

export type SemanasSeguidas = {
  /** Semanas consecutivas com pelo menos 1 treino. */
  semanas: number;
  /** A contagem inclui a semana em andamento (que já tem treino). */
  incluiAtual: boolean;
};

export function semanasSeguidasComTreino(treinos: TreinoDoDia[], hojeISO: string): SemanasSeguidas {
  const porSemana = treinosPorSemana(treinos, hojeISO);
  const atual = semanaInicioDoTreino(hojeISO);
  const incluiAtual = (porSemana.get(atual) ?? 0) > 0;

  let semanas = incluiAtual ? 1 : 0;
  let semana = paraISO(somarDias(paraDataUTC(atual), -7));
  while ((porSemana.get(semana) ?? 0) > 0) {
    semanas += 1;
    semana = paraISO(somarDias(paraDataUTC(semana), -7));
  }
  return { semanas, incluiAtual };
}

export type MetaNasSemanas = {
  meta: number;
  /** Semanas FECHADAS consideradas (no máximo `janela`, nunca antes do primeiro treino). */
  semanasFechadas: number;
  /** Quantas dessas bateram a meta. */
  cumpridas: number;
  /** Treinos na semana em andamento, até hoje. */
  treinosSemanaAtual: number;
};

export function metaNasSemanas(
  treinos: TreinoDoDia[],
  meta: number,
  hojeISO: string,
  janela = 8,
): MetaNasSemanas {
  const porSemana = treinosPorSemana(treinos, hojeISO);
  const atual = semanaInicioDoTreino(hojeISO);
  const treinosSemanaAtual = porSemana.get(atual) ?? 0;

  const semanasComTreino = Array.from(porSemana.keys()).sort();
  if (semanasComTreino.length === 0) return { meta, semanasFechadas: 0, cumpridas: 0, treinosSemanaAtual };

  const ultimaFechada = paraISO(somarDias(paraDataUTC(atual), -7));
  const desdeOPrimeiro = diferencaEmSemanas(ultimaFechada, semanasComTreino[0]) + 1;
  const semanasFechadas = Math.max(0, Math.min(janela, desdeOPrimeiro));
  const cumpridas = listarSemanas(ultimaFechada, semanasFechadas).filter((s) => (porSemana.get(s) ?? 0) >= meta).length;

  return { meta, semanasFechadas, cumpridas, treinosSemanaAtual };
}
