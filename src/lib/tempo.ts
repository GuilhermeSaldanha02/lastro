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
