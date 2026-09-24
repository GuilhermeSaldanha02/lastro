// lastro · timer de descanso flutuante (pedido do dono, 2026-09-24): a
// contagem acompanha a tela quando a pessoa sai do app. Web não tem
// Live Activity nem notificação com cronômetro; o que existe é
// Picture-in-Picture de VÍDEO — então a contagem é desenhada num canvas e
// o canvas vira vídeo. Funciona no Chrome do Android e do computador; no
// iPhone (app na tela de início) o suporte é incerto, e o botão só aparece
// onde a API existe. O aviso por notificação (PR #280) cobre o iPhone.
import { formatarMinutosSegundos } from "@/lib/audio/som-timer";

export type PainelFlutuante = { segundosRestantes: number; pausado: boolean; metaAtingida: boolean };
export type QuadroFlutuante = { tempo: string; rotulo: string; destaque: boolean };

export function quadroDoTimerFlutuante(p: PainelFlutuante): QuadroFlutuante {
  if (p.metaAtingida) return { tempo: "00:00", rotulo: "Hora da próxima série", destaque: true };
  return { tempo: formatarMinutosSegundos(p.segundosRestantes), rotulo: p.pausado ? "Pausado" : "Descanso", destaque: false };
}

export function timerFlutuanteSuportado(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas") as HTMLCanvasElement & { captureStream?: unknown };
  return (
    Boolean(document.pictureInPictureEnabled) &&
    typeof HTMLVideoElement.prototype.requestPictureInPicture === "function" &&
    typeof canvas.captureStream === "function"
  );
}

const LARGURA = 320;
const ALTURA = 180;

function desenhar(ctx: CanvasRenderingContext2D, q: QuadroFlutuante): void {
  ctx.fillStyle = q.destaque ? "#7a5c12" : "#07090d";
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4af37";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(q.rotulo, LARGURA / 2, 52);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 72px system-ui, sans-serif";
  ctx.fillText(q.tempo, LARGURA / 2, 132);
}

/**
 * Abre a janela flutuante. Chame DIRETO no toque (a API exige gesto).
 * `ler` é consultado a cada quadro; `aoFechar` roda quando o sistema fecha
 * a janela (a pessoa tocou no X dela).
 */
export async function abrirTimerFlutuante(ler: () => QuadroFlutuante, aoFechar: () => void): Promise<() => void> {
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  desenhar(ctx, ler());

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(4);

  const quadro = window.setInterval(() => desenhar(ctx, ler()), 250);
  const encerrar = () => {
    window.clearInterval(quadro);
    video.srcObject = null;
  };
  video.addEventListener("leavepictureinpicture", () => {
    encerrar();
    aoFechar();
  }, { once: true });

  try {
    await video.play();
    await video.requestPictureInPicture();
  } catch (erro) {
    encerrar();
    throw erro;
  }

  return () => {
    if (document.pictureInPictureElement === video) void document.exitPictureInPicture();
    else encerrar();
  };
}
