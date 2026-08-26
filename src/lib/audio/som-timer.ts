/**
 * lastro · Utilitários de Som, Vibração e Formatação para o Timer de Descanso.
 * 
 * Utiliza a Web Audio API sintetizada (sem dependência de arquivos de áudio externos)
 * e navigator.vibrate para feedback háptico no celular.
 */

/**
 * Toca um bip duplo suave e agradável indicando fim do descanso.
 */
export function tocarBipConclusao(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error fallback safari webkit
      window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const agora = ctx.currentTime;

    // Primeiro tom suave (880Hz - Lá5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, agora);
    gain1.gain.setValueAtTime(0.15, agora);
    gain1.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(agora);
    osc1.stop(agora + 0.15);

    // Segundo tom mais alto (1174Hz - Ré6) logo após
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, agora + 0.18);
    gain2.gain.setValueAtTime(0.2, agora + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, agora + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(agora + 0.18);
    osc2.stop(agora + 0.38);
  } catch {
    // Degrada silenciosamente se áudio for bloqueado pelo navegador
  }
}

/**
 * Vibra o celular com padrão de dois pulsos (se suportado).
 */
export function vibrarConclusao(): void {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate([200, 100, 200]);
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
