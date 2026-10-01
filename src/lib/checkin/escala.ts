// lastro · AN-08 A1 — o check-in diário: quatro notas de 1 a 5, tudo opcional,
// pelo menos uma. Módulo puro (sem rede, sem banco), compartilhado pela tela,
// pela fila offline e pela Server Action — a mesma régua nos três lugares.
//
// Sem texto livre, de propósito: a Política manda não digitar dado de saúde em
// campo livre, e uma nota de 1 a 5 não é dado médico.
//
// Este dado NUNCA vai para a IA (Gemini no plano gratuito: o Google pode usar o
// conteúdo e revisores humanos podem lê-lo). `nao-vai-para-ia.test.ts` barra
// qualquer referência a ele nos arquivos que montam o resumo da IA.

export const CAMPOS_CHECKIN = ["sono", "energia", "dor_muscular", "estresse"] as const;
export type CampoCheckin = (typeof CAMPOS_CHECKIN)[number];

export type NotaCheckin = 1 | 2 | 3 | 4 | 5;

/** O que a pessoa respondeu: só os campos tocados, `null` apaga um campo do dia. */
export type RespostaCheckin = Partial<Record<CampoCheckin, NotaCheckin | null>>;

/** O que viaja para a Server Action e para a fila offline. */
export type NovoCheckin = RespostaCheckin & { dia: string };

/**
 * Quantos dias para trás o servidor aceita. A fila offline pode entregar o
 * check-in de ontem (feito sem sinal) na manhã seguinte; mais que isso é
 * lixo ou relógio errado. Para a frente, 1 dia cobre o fuso.
 */
export const DIAS_ANTERIORES_ACEITOS = 3;
export const DIAS_POSTERIORES_ACEITOS = 1;

const DIA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function somarDias(isoDia: string, dias: number): string {
  const [a, m, d] = isoDia.split("-").map(Number);
  const data = new Date(Date.UTC(a, m - 1, d + dias));
  return data.toISOString().slice(0, 10);
}

/** `dia` e `hoje` no formato AAAA-MM-DD. Datas ISO comparam como texto. */
export function diaAceitavel(dia: string, hoje: string): boolean {
  if (!DIA_ISO.test(dia) || !DIA_ISO.test(hoje)) return false;
  // `new Date("2026-02-31")` normaliza em silêncio; conferir a ida e a volta.
  if (somarDias(dia, 0) !== dia) return false;
  return dia >= somarDias(hoje, -DIAS_ANTERIORES_ACEITOS) && dia <= somarDias(hoje, DIAS_POSTERIORES_ACEITOS);
}

export function ehNota(valor: unknown): valor is NotaCheckin {
  return Number.isInteger(valor) && (valor as number) >= 1 && (valor as number) <= 5;
}

export type ResultadoValidacao =
  | { ok: true; dados: NovoCheckin }
  | { ok: false; erro: "dia_invalido" | "nota_invalida" | "vazio" };

/**
 * Valida o que chegou (da tela, da fila ou de um cliente qualquer) e devolve
 * só os campos conhecidos. `null` explícito é "apagar este campo"; ausente é
 * "não mexer". O check-in precisa ter ao menos uma nota depois de valer — a
 * checagem de "vazio" olha só o que chegou agora; o banco confere a linha
 * inteira (`checkin_algum_campo`).
 */
export function validarCheckin(entrada: unknown, hoje: string): ResultadoValidacao {
  if (typeof entrada !== "object" || entrada === null) return { ok: false, erro: "vazio" };
  const bruto = entrada as Record<string, unknown>;

  if (typeof bruto.dia !== "string" || !diaAceitavel(bruto.dia, hoje)) {
    return { ok: false, erro: "dia_invalido" };
  }

  const dados: NovoCheckin = { dia: bruto.dia };
  let comNota = 0;
  for (const campo of CAMPOS_CHECKIN) {
    if (!(campo in bruto) || bruto[campo] === undefined) continue;
    const valor = bruto[campo];
    if (valor === null) {
      dados[campo] = null;
    } else if (ehNota(valor)) {
      dados[campo] = valor;
      comNota++;
    } else {
      return { ok: false, erro: "nota_invalida" };
    }
  }
  if (comNota === 0) return { ok: false, erro: "vazio" };
  return { ok: true, dados };
}
