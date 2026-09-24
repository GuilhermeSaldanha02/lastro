import { painelDoDescanso, type EstadoDescanso } from "./descanso-real";

/**
 * Quantos segundos faltam para o aviso de "descanso acabou" — ou `null`
 * para cancelar (pedido do dono, 2026-09-23: saber que o descanso acabou
 * com o app em segundo plano).
 *
 * O servidor recebe a DURAÇÃO, não um horário, e calcula o disparo pelo
 * próprio relógio: assim o relógio errado de um aparelho não adianta nem
 * atrasa o aviso.
 *
 * Não agenda quando: não há descanso, ele está pausado, a meta já foi
 * atingida (o bip do próprio app já tocou) ou o aviso já foi emitido.
 */
export function segundosAteOAviso(estado: EstadoDescanso | null, agoraMs: number): number | null {
  if (!estado || estado.avisoMetaEmitido) return null;
  const painel = painelDoDescanso(estado, agoraMs);
  if (painel.pausado || painel.metaAtingida) return null;

  const decorridoMs =
    estado.acumuladoAtivoMs + (estado.iniciadoEmMs === null ? 0 : Math.max(0, agoraMs - estado.iniciadoEmMs));
  const faltaMs = estado.metaSegundos * 1000 - decorridoMs;
  return faltaMs > 0 ? Math.ceil(faltaMs / 1000) : null;
}
