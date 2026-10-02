// lastro · AN-08 A1 — quando a folha do check-in sobe sozinha na Home.
//
// Decisão do dono (2026-10-01): sobe assim que a pessoa abre o app e ainda não
// respondeu o do dia. Respondeu, fechou o app e abriu de novo no mesmo dia:
// não aparece mais. Módulo puro (sem DOM), testado; o componente só lê o que
// o navegador guarda e pergunta aqui.
//
// "Abrir o app" = uma sessão do navegador (`sessionStorage`): navegar de volta
// à Home dentro da mesma abertura não faz a folha subir de novo depois de um
// "Agora não". Fechar o app (ou a aba) e abrir outra vez a traz de volta,
// enquanto o dia não tiver resposta.

/** `localStorage`: a resposta do dia neste aparelho (cobre a fila offline ainda não sincronizada). */
export const CHAVE_RESPOSTA_DO_DIA = "lastro_checkin";
/** `sessionStorage`: o dia em que a folha já subiu nesta abertura do app. */
export const CHAVE_FOLHA_VISTA = "lastro_checkin_visto";

export type RespostaGuardada = {
  dia: string;
  sono: number | null;
  energia: number | null;
  dor_muscular: number | null;
  estresse: number | null;
};

/** Lê o JSON guardado; qualquer coisa fora do formato vira `null` (nunca lança). */
export function lerRespostaGuardada(texto: string | null): RespostaGuardada | null {
  if (!texto) return null;
  try {
    const bruto = JSON.parse(texto) as Record<string, unknown>;
    if (typeof bruto.dia !== "string") return null;
    const nota = (v: unknown): number | null => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5 ? (v as number) : null);
    return {
      dia: bruto.dia,
      sono: nota(bruto.sono),
      energia: nota(bruto.energia),
      dor_muscular: nota(bruto.dor_muscular),
      estresse: nota(bruto.estresse),
    };
  } catch {
    return null;
  }
}

export function deveAbrirSozinha(entrada: {
  hoje: string;
  /** O servidor já tem um check-in de hoje desta conta. */
  respondidoNoServidor: boolean;
  /** O que este aparelho guardou da última resposta (pode ser de ontem). */
  guardada: RespostaGuardada | null;
  /** O dia em que a folha já subiu nesta abertura do app. */
  folhaVistaNoDia: string | null;
}): boolean {
  if (entrada.respondidoNoServidor) return false;
  if (entrada.guardada?.dia === entrada.hoje) return false;
  if (entrada.folhaVistaNoDia === entrada.hoje) return false;
  return true;
}
