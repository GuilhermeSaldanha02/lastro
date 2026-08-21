/**
 * Sequência de dias treinados — a métrica que a Home chama de
 * "sessões seguidas".
 *
 * Existe porque a Home anunciava `treinosNaSemana` sob esse rótulo: quem
 * treinasse terça e quinta lia "2 sessões seguidas" com a quarta vazia no
 * meio (achado da auditoria de 2026-08-21, nos dados reais do dono).
 * Contagem não é sequência.
 *
 * Definição, deliberada:
 * - dias de CALENDÁRIO consecutivos, não dias de treino;
 * - a corrida precisa terminar HOJE ou ONTEM — senão já foi quebrada e a
 *   sequência atual é 0. Sem essa borda, uma corrida antiga seria
 *   anunciada como atual para sempre;
 * - atravessa semana e mês: sequência é do calendário, não da semana ISO;
 * - dia repetido conta uma vez; dia futuro é ignorado.
 */
const UM_DIA_MS = 86_400_000;

function paraUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function calcularSequenciaAtual(
  datasISO: string[],
  hojeISO: string,
): number {
  const hoje = paraUTC(hojeISO);
  if (Number.isNaN(hoje)) return 0;

  // Únicos, sem futuro, do mais recente para o mais antigo.
  const dias = Array.from(new Set(datasISO))
    .map(paraUTC)
    .filter((d) => !Number.isNaN(d) && d <= hoje)
    .sort((a, b) => b - a);

  if (dias.length === 0) return 0;

  // A corrida só é "atual" se o último treino foi hoje ou ontem.
  const distanciaDoUltimo = Math.round((hoje - dias[0]) / UM_DIA_MS);
  if (distanciaDoUltimo > 1) return 0;

  let sequencia = 1;
  for (let i = 1; i < dias.length; i++) {
    const passo = Math.round((dias[i - 1] - dias[i]) / UM_DIA_MS);
    if (passo !== 1) break;
    sequencia++;
  }

  return sequencia;
}
