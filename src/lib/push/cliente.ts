// lastro · aviso de fim de descanso — lado do aparelho (pedido do dono,
// 2026-09-23). Só roda no navegador.
import { removerInscricaoPush, salvarInscricaoPush } from "@/lib/dados/aviso-descanso";

/** Liga/desliga neste aparelho; só com isto o app agenda avisos no servidor. */
export const CHAVE_AVISO_DESCANSO = "lastro_aviso_descanso";

export type EstadoAvisoDescanso =
  | "sem-suporte" // navegador sem push, ou iPhone fora da tela inicial
  | "sem-chave" // app sem a chave pública configurada: recurso dormente
  | "negado" // a pessoa recusou nas permissões do sistema
  | "desligado"
  | "ligado";

const chavePublica = () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function estadoAvisoDescanso(): EstadoAvisoDescanso {
  if (typeof window === "undefined") return "sem-suporte";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "sem-suporte";
  }
  if (!chavePublica()) return "sem-chave";
  if (Notification.permission === "denied") return "negado";
  return Notification.permission === "granted" && lerLigado() ? "ligado" : "desligado";
}

export function avisoDescansoLigado(): boolean {
  return estadoAvisoDescanso() === "ligado";
}

function lerLigado(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_AVISO_DESCANSO) === "1";
  } catch {
    return false;
  }
}

const EVENTO_AVISO_DESCANSO = "lastro:aviso-descanso";

function gravarLigado(ligado: boolean): void {
  try {
    if (ligado) window.localStorage.setItem(CHAVE_AVISO_DESCANSO, "1");
    else window.localStorage.removeItem(CHAVE_AVISO_DESCANSO);
  } catch {
    // Armazenamento bloqueado: o aviso só não fica lembrado neste aparelho.
  }
  window.dispatchEvent(new Event(EVENTO_AVISO_DESCANSO));
}

/** Para `useSyncExternalStore`: muda ao ligar/desligar aqui ou em outra aba. */
export function assinarAvisoDescanso(aoMudar: () => void): () => void {
  window.addEventListener(EVENTO_AVISO_DESCANSO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO_AVISO_DESCANSO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function base64UrlParaBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const preenchido = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bruto = atob(preenchido);
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

/**
 * Chame DIRETO no toque, sem `await` antes: o iPhone só mostra o pedido de
 * permissão se ele nascer do gesto. Devolve o estado final.
 */
export async function ligarAvisoDescanso(): Promise<EstadoAvisoDescanso> {
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao === "denied" ? "negado" : "desligado";

  const registro = await navigator.serviceWorker.ready;
  const inscricao =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaBytes(chavePublica()),
    }));

  const json = inscricao.toJSON();
  const resultado = await salvarInscricaoPush({
    endpoint: inscricao.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  });
  if (!resultado.ok) return "desligado";

  gravarLigado(true);
  return "ligado";
}

export async function desligarAvisoDescanso(): Promise<EstadoAvisoDescanso> {
  gravarLigado(false);
  try {
    const registro = await navigator.serviceWorker.ready;
    const inscricao = await registro.pushManager.getSubscription();
    if (inscricao) {
      await removerInscricaoPush(inscricao.endpoint);
      await inscricao.unsubscribe();
    }
  } catch {
    // Desligado neste aparelho mesmo se o servidor não respondeu: sem a
    // marca local, o app para de agendar avisos.
  }
  return estadoAvisoDescanso();
}
