import { timingSafeEqual } from "node:crypto";

/**
 * Aviso vencido que o banco manda para a rota de disparo
 * (`private.disparar_avisos_descanso`, pg_cron). O banco já resolveu a
 * inscrição de push de quem é o aviso: a rota não lê dado de usuário
 * nenhum, só assina e envia — por isso ela não precisa da chave de
 * service role (regra do `cliente-admin.ts`).
 */
export type AvisoVencido = {
  endpoint: string;
  p256dh: string;
  auth: string;
  treino_id: string;
  /** "pre" = faltam 15 s; "fim" = acabou. Tipo ausente ou desconhecido vira "fim". */
  tipo: "pre" | "fim";
};

/** Compara o segredo em tempo constante. Sem segredo configurado, a rota fica dormente. */
export function disparoAutorizado(recebido: string | null, segredo: string | undefined): boolean {
  if (!segredo || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return a.length === b.length && timingSafeEqual(a, b);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function avisoValido(item: unknown): item is Omit<AvisoVencido, "tipo"> & { tipo?: unknown } {
  if (!item || typeof item !== "object") return false;
  const a = item as Record<string, unknown>;
  return (
    typeof a.endpoint === "string" &&
    a.endpoint.startsWith("https://") &&
    typeof a.p256dh === "string" &&
    a.p256dh.length > 0 &&
    typeof a.auth === "string" &&
    a.auth.length > 0 &&
    typeof a.treino_id === "string" &&
    UUID.test(a.treino_id)
  );
}

/** Lê a lista de avisos do corpo; item malformado é descartado, não derruba o lote. */
export function lerAvisosDoCorpo(corpo: unknown): AvisoVencido[] {
  if (!corpo || typeof corpo !== "object") return [];
  const avisos = (corpo as { avisos?: unknown }).avisos;
  if (!Array.isArray(avisos)) return [];
  return avisos.filter(avisoValido).map((a) => ({
    endpoint: a.endpoint,
    p256dh: a.p256dh,
    auth: a.auth,
    treino_id: a.treino_id,
    tipo: a.tipo === "pre" ? ("pre" as const) : ("fim" as const),
  }));
}
