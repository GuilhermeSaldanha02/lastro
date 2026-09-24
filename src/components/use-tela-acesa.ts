"use client";

// lastro · tela acesa durante o descanso (pedido do dono, 2026-09-24): com
// o lastro aberto, o iPhone não bloqueia sozinho enquanto o descanso corre,
// e a contagem fica visível no banco. Screen Wake Lock API (iOS 16.4+ no app
// da tela de início, Chrome no Android). O sistema solta a trava quando o
// app vai para segundo plano; ao voltar, ela é pedida de novo.
import { useEffect } from "react";

export function useTelaAcesa(ativa: boolean): void {
  useEffect(() => {
    if (!ativa || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let trava: WakeLockSentinel | null = null;
    let encerrado = false;

    const pedir = () => {
      if (document.visibilityState !== "visible" || trava) return;
      navigator.wakeLock
        .request("screen")
        .then((t) => {
          if (encerrado) return void t.release();
          trava = t;
          t.addEventListener("release", () => {
            trava = null;
          });
        })
        .catch(() => {
          // Bateria fraca ou política do sistema: a tela só volta a apagar normalmente.
        });
    };

    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      encerrado = true;
      document.removeEventListener("visibilitychange", pedir);
      void trava?.release();
    };
  }, [ativa]);
}
