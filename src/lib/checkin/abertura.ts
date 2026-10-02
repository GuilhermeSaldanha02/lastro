// lastro · AN-08 A1 — quando a folha do check-in sobe sozinha na Home.
//
// Decisão do dono (2026-10-01): sobe assim que a pessoa abre o app e ainda não
// respondeu o do dia. Respondeu, fechou o app e abriu de novo no mesmo dia:
// não aparece mais. Módulo puro (sem DOM), testado; o componente só lê o que
// o navegador guarda e pergunta aqui.
//
// "Abrir o app" = uma sessão do navegador (`sessionStorage`): navegar de volta
// à Home dentro da mesma abertura não faz a folha subir de novo.
//
// Limite de insistência (parecer de produto, 2026-10-02): o lastro é aberto
// várias vezes ao dia, então UM "Agora não" encerra a subida automática do dia
// (`localStorage`). O cartão da Home continua sendo a porta para responder.

// Tudo que o navegador guarda é POR CONTA (a chave leva o id do usuário). Um
// aparelho com duas contas (o dono usa duas no mesmo Chrome) não pode mostrar o
// check-in de uma na outra, nem a dispensa de uma calar a outra: a primeira
// versão guardava numa chave só e foi achada assim em produção (2026-10-02).

/** `localStorage`: a resposta do dia neste aparelho (cobre a fila offline ainda não sincronizada). */
export const chaveRespostaDoDia = (usuarioId: string) => `lastro_checkin:${usuarioId}`;
/** `sessionStorage`: o dia em que a folha já subiu nesta abertura do app. */
export const chaveFolhaVista = (usuarioId: string) => `lastro_checkin_visto:${usuarioId}`;
/** `localStorage`: o dia em que a pessoa dispensou a folha ("Agora não"). */
export const chaveFolhaDispensada = (usuarioId: string) => `lastro_checkin_dispensado:${usuarioId}`;
/** Chaves da primeira versão, globais e por isso erradas: o componente as apaga. */
export const CHAVES_ANTIGAS_GLOBAIS = ["lastro_checkin", "lastro_checkin_dispensado"] as const;

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
  /** O dia em que a pessoa tocou em "Agora não" (neste aparelho). */
  dispensadoNoDia: string | null;
}): boolean {
  if (entrada.respondidoNoServidor) return false;
  if (entrada.guardada?.dia === entrada.hoje) return false;
  if (entrada.folhaVistaNoDia === entrada.hoje) return false;
  if (entrada.dispensadoNoDia === entrada.hoje) return false;
  return true;
}
