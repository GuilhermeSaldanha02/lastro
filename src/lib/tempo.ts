// lastro — fuso fixo em America/Sao_Paulo: app pessoal, o dono treina no Brasil.
// Sem essa conversão, `new Date().toISOString()` (UTC) atribui um treino feito
// à noite (21h–23h59 BRT) ao dia UTC seguinte, empurrando o treino pra semana
// ISO errada exatamente no fim de semana (achado real, revisão estática
// qa-treino, 2026-08-05).
import type { Idioma } from "@/lib/dados/idioma";

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

/**
 * "2026-08-06" → "6 ago". Fonte única (E10) — usada pela home e pelo
 * cabeçalho do parecer.
 *
 * `idioma` entrou em 2026-09-12 por causa do rodapé da prescrição na
 * `/analise` ("…é de Marina, desde 4 set"), que é a primeira string de
 * data desta função numa tela INTEIRAMENTE traduzida. Em inglês ela dizia
 * "since 4 set" — mês em português no meio de uma frase em inglês.
 *
 * O default é pt-BR e o ramo pt-BR é o MESMO de antes, byte a byte: os
 * chamadores antigos não passam idioma e não podem mudar de saída por
 * causa desta correção. EN/ES usam `Intl` em UTC — a entrada é uma data de
 * calendário, sem hora, e formatar no fuso local poderia voltar um dia.
 */
export function formatarDataCurta(iso: string, idioma: Idioma = "pt-BR"): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!mes || !dia) return iso;
  if (idioma === "pt-BR") return `${dia} ${MESES_ABREVIADOS[mes - 1]}`;
  return new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}
