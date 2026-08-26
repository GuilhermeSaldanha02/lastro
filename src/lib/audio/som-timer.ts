/**
 * lastro · Utilitários de Som, Vibração e Formatação para o Timer de Descanso.
 * 
 * Utiliza a Web Audio API sintetizada com desbloqueio prévio no toque do usuário
 * e navigator.vibrate para feedback háptico robusto no celular.
 */

let audioCtxCompartilhado: AudioContext | null = null;

function obterAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtxCompartilhado) {
      const AudioContextClass =
        window.AudioContext ||
        // @ts-expect-error fallback safari webkit
        window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtxCompartilhado = new AudioContextClass();
      }
    }
    if (audioCtxCompartilhado && audioCtxCompartilhado.state === "suspended") {
      void audioCtxCompartilhado.resume();
    }
    return audioCtxCompartilhado;
  } catch {
    return null;
  }
}

/**
 * Desbloqueia o contexto de áudio na primeira interação do usuário (evita bloqueio de autoplay).
 */
export function desbloquearAudio(): void {
  const ctx = obterAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

/**
 * Toca um alerta sonoro triplo claro e nítido indicando fim do descanso.
 */
export function tocarBipConclusao(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = obterAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;

    // 1º Tom (880Hz - Lá5)
    tocarNota(ctx, 880, agora, 0.18, 0.35);

    // 2º Tom (1174Hz - Ré6)
    tocarNota(ctx, 1174.66, agora + 0.20, 0.18, 0.40);

    // 3º Tom Resolutivo (1760Hz - Lá6)
    tocarNota(ctx, 1760, agora + 0.40, 0.35, 0.45);
  } catch {
    // Degrada silenciosamente
  }
}

function tocarNota(
  ctx: AudioContext,
  freq: number,
  momento: number,
  duracao: number,
  volume: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, momento);
  
  gain.gain.setValueAtTime(volume, momento);
  gain.gain.exponentialRampToValueAtTime(0.001, momento + duracao);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(momento);
  osc.stop(momento + duracao);
}

/**
 * Vibra o celular com padrão de pulsos nítidos (se suportado).
 */
export function vibrarConclusao(): void {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate([300, 150, 300, 150, 400]);
    }
  } catch {
    // Ignora erro em navegadores que não suportam
  }
}

/**
 * Formata segundos em formato MM:SS (ex: 90 -> "01:30").
 */
export function formatarMinutosSegundos(totalSegundos: number): string {
  const segPositivos = Math.max(0, Math.floor(totalSegundos));
  const minutos = Math.floor(segPositivos / 60);
  const segundos = segPositivos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
