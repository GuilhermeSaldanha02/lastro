// lastro · UX-02 — a grade de um mês para o calendário do histórico de
// `/treino`. Função pura: nada de Date local (fuso), tudo em UTC sobre uma
// data de calendário ("YYYY-MM") — mesma cautela de `lib/tempo.ts`.
//
// Semana começando na SEGUNDA (mesmo padrão de `rastreador-disciplina.tsx`
// e da semana ISO que a Análise usa, `PRD.md` §3). Sempre 42 células (6
// linhas): é o único número que cobre todo mês possível sem variar a
// altura do card conforme o mês (fevereiro vs. outros).

export type CelulaCalendario = {
  /** "YYYY-MM-DD" só para dias DENTRO do mês pedido; fora dele, `null`. */
  iso: string | null;
  diaNum: number;
  foraDoMes: boolean;
};

/** Segunda = 0 ... Domingo = 6. */
function diaDaSemanaSegundaPrimeiro(data: Date): number {
  return (data.getUTCDay() + 6) % 7;
}

export function gerarGradeMes(anoMes: string): CelulaCalendario[] {
  const [ano, mes] = anoMes.split("-").map(Number);
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1));
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const offsetInicio = diaDaSemanaSegundaPrimeiro(primeiroDia);

  const celulas: CelulaCalendario[] = [];

  // Cauda do mês anterior, só para preencher a primeira semana.
  const diasNoMesAnterior = new Date(Date.UTC(ano, mes - 1, 0)).getUTCDate();
  for (let i = offsetInicio - 1; i >= 0; i--) {
    celulas.push({ iso: null, diaNum: diasNoMesAnterior - i, foraDoMes: true });
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    celulas.push({
      iso: `${anoMes}-${String(dia).padStart(2, "0")}`,
      diaNum: dia,
      foraDoMes: false,
    });
  }

  // Início do mês seguinte, até fechar 42 células.
  let diaSeguinte = 1;
  while (celulas.length < 42) {
    celulas.push({ iso: null, diaNum: diaSeguinte, foraDoMes: true });
    diaSeguinte++;
  }

  return celulas;
}

/** "2026-09-26" → "2026-09". Só corte de string; sem Date, sem fuso. */
export function anoMesDeData(iso: string): string {
  return iso.slice(0, 7);
}

/** "2026-09" com deslocamento de meses (±). "2026-01" − 1 → "2025-12". */
export function deslocarAnoMes(anoMes: string, deslocamento: number): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + deslocamento, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}
