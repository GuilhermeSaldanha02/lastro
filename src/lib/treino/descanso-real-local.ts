import type { EstadoDescanso } from "./descanso-real";

const EVENTO_DESCANSO_REAL = "lastro:descanso-real";

export const chaveDescansoReal = (treinoId: string) =>
  `lastro_descanso_real_${treinoId}`;

function estadoValido(valor: unknown): valor is EstadoDescanso {
  if (!valor || typeof valor !== "object") return false;
  const item = valor as Record<string, unknown>;
  return (
    typeof item.treinoId === "string" &&
    typeof item.serieId === "string" &&
    typeof item.metaSegundos === "number" &&
    item.metaSegundos >= 0 &&
    typeof item.acumuladoAtivoMs === "number" &&
    item.acumuladoAtivoMs >= 0 &&
    (typeof item.iniciadoEmMs === "number" || item.iniciadoEmMs === null) &&
    typeof item.avisoMetaEmitido === "boolean"
  );
}

export function lerDescansoLocal(
  storage: Storage,
  treinoId: string,
): EstadoDescanso | null {
  const bruto = storage.getItem(chaveDescansoReal(treinoId));
  if (!bruto) return null;

  try {
    const valor: unknown = JSON.parse(bruto);
    return estadoValido(valor) && valor.treinoId === treinoId ? valor : null;
  } catch {
    return null;
  }
}

function notificarMudanca(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_DESCANSO_REAL));
  }
}

export function salvarDescansoLocal(
  storage: Storage,
  estado: EstadoDescanso,
): void {
  storage.setItem(chaveDescansoReal(estado.treinoId), JSON.stringify(estado));
  notificarMudanca();
}

export function apagarDescansoLocal(storage: Storage, treinoId: string): void {
  storage.removeItem(chaveDescansoReal(treinoId));
  notificarMudanca();
}

export function assinarDescansoLocal(aoMudar: () => void): () => void {
  window.addEventListener(EVENTO_DESCANSO_REAL, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO_DESCANSO_REAL, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}
