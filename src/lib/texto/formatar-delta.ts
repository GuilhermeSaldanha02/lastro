/**
 * lastro · DESIGN.md §3.6.6 — "o delta é o CANAL DE TEXTO obrigatório: cada
 * sinal traz a palavra e o número que o identificam. Dois blocos
 * distinguidos só pela cor reprovam o gate." Esta função monta esse texto
 * a partir do bloco de evidência (`src/app/api/analise/evidencia.ts`).
 */
import type { BlocoEvidencia } from "@/app/api/analise/evidencia";
import type { Idioma } from "@/lib/dados/idioma";

/**
 * Convenção decimal por idioma (módulo de idiomas, etapa 4/4) — mesmo
 * raciocínio do validador da Gemini (`api/analise/validador.ts`): PT-BR
 * e ES usam vírgula, EN usa ponto. `idioma` é opcional com default
 * pt-BR pra não quebrar quem ainda chama sem idioma.
 */
function separadorDecimal(idioma: Idioma): "," | "." {
  return idioma === "en" ? "." : ",";
}

/** 12.7 → "+12,7%" (pt-BR/es) ou "+12.7%" (en). -8.1 → "-8,1%"/"-8.1%". Sinal explícito. */
export function formatarPercentual(valor: number, idioma: Idioma = "pt-BR"): string {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor}`.replace(".", separadorDecimal(idioma)) + "%";
}

/**
 * Separador de MILHAR por idioma — o inverso do decimal. PT-BR e ES
 * agrupam com ponto ("12.480"); EN agrupa com vírgula ("12,480"). Mesma
 * convenção que o validador do parecer já desmonta ao ler a resposta do
 * LLM (`api/analise/validador.ts`), então os dois lados do sistema
 * concordam sobre o que é milhar e o que é decimal.
 */
function separadorMilhar(idioma: Idioma): "," | "." {
  return idioma === "en" ? "," : ".";
}

/**
 * 102.5 → "102,5" (pt-BR/es) ou "102.5" (en). 80 → "80". Sem casa
 * decimal artificial.
 *
 * Agrupa milhar desde 2026-09-10: 7280 → "7.280". Antes saía "7280 kg",
 * que num bloco de evidência ao lado de "102,5" obriga a contar dígito.
 * O volume semanal passa de 10.000 kg com facilidade — é justamente o
 * número grande que precisa ser lido rápido.
 *
 * `Intl.NumberFormat` faria isto em uma linha, e foi descartado de
 * propósito: ele depende do ICU do runtime, e num Node compilado com
 * `small-icu` toda localidade que não seja inglês cai para en-US **sem
 * erro** — "7.280" viraria "7,280" em português, calado. Agrupar à mão
 * é determinístico e roda igual em qualquer runtime, inclusive dentro do
 * renderizador de PDF.
 */
export function formatarPeso(kg: number, idioma: Idioma = "pt-BR"): string {
  const [inteiro, decimais] = String(kg).split(".");
  // `\B` não casa entre o sinal e o primeiro dígito, então negativo
  // (-7280 → "-7.280") sai certo sem tratamento à parte.
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, separadorMilhar(idioma));
  return decimais === undefined
    ? agrupado
    : `${agrupado}${separadorDecimal(idioma)}${decimais}`;
}

const TEXTO_DELTA_POR_IDIOMA: Record<
  Idioma,
  { emSemanas: (pct: string, semanas: number) => string; semMudanca: (semanas: number) => string }
> = {
  "pt-BR": {
    emSemanas: (pct, semanas) => `${pct} em ${semanas} semanas`,
    semMudanca: (semanas) => `sem mudança há ${semanas} semana${semanas === 1 ? "" : "s"}`,
  },
  en: {
    emSemanas: (pct, semanas) => `${pct} over ${semanas} weeks`,
    semMudanca: (semanas) => `no change for ${semanas} week${semanas === 1 ? "" : "s"}`,
  },
  es: {
    emSemanas: (pct, semanas) => `${pct} en ${semanas} semanas`,
    semMudanca: (semanas) => `sin cambios hace ${semanas} semana${semanas === 1 ? "" : "s"}`,
  },
};

export function formatarDelta(
  bloco: BlocoEvidencia,
  janelaSemanas: number,
  idioma: Idioma = "pt-BR",
): string {
  const textos = TEXTO_DELTA_POR_IDIOMA[idioma];
  if (bloco.sinal === "alta") return formatarPercentual(bloco.delta_pct, idioma);
  if (bloco.sinal === "queda") {
    return textos.emSemanas(formatarPercentual(bloco.delta_pct, idioma), janelaSemanas);
  }
  // platô: preferir o streak real de estagnacoes quando existir — é mais
  // específico que a janela de comparação inteira.
  const semanas = bloco.semanas_sem_progresso ?? janelaSemanas;
  return textos.semMudanca(semanas);
}
