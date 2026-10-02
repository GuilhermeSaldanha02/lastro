// lastro · AN-08 A1 — a janela dos últimos dias do check-in, com os dias sem
// resposta preenchidos (a pessoa vê o buraco, não uma lista que esconde que
// ela pulou terça).
import type { CheckinDoDia } from "@/lib/dados/checkin";

export type DiaDoHistorico = { dia: string; checkin: CheckinDoDia | null };

function somarDias(iso: string, delta: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** `quantos` dias terminando em `hoje`, do mais novo para o mais antigo. */
export function janelaDoHistorico(hoje: string, checkins: CheckinDoDia[], quantos = 7): DiaDoHistorico[] {
  const porDia = new Map(checkins.map((c) => [c.dia, c]));
  return Array.from({ length: quantos }, (_, i) => {
    const dia = somarDias(hoje, -i);
    return { dia, checkin: porDia.get(dia) ?? null };
  });
}
