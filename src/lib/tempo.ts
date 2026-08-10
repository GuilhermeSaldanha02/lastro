// lastro — fuso fixo em America/Sao_Paulo: app pessoal, o dono treina no Brasil.
// Sem essa conversão, `new Date().toISOString()` (UTC) atribui um treino feito
// à noite (21h–23h59 BRT) ao dia UTC seguinte, empurrando o treino pra semana
// ISO errada exatamente no fim de semana (achado real, revisão estática
// qa-treino, 2026-08-05).
const FUSO_BRASIL = "America/Sao_Paulo";

/** Data (YYYY-MM-DD) do calendário de Brasília no instante dado. */
export function dataLocalBrasil(instante: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_BRASIL }).format(
    instante,
  );
}

const MESES_ABREVIADOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "2026-08-06" → "6 ago". Fonte única (E10) — usada pela home e pelo cabeçalho do parecer. */
export function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-").map(Number);
  if (!mes || !dia) return iso;
  return `${dia} ${MESES_ABREVIADOS[mes - 1]}`;
}
