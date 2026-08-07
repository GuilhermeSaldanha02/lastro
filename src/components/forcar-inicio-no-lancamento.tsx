"use client";

// lastro · pedido do dono (2026-08-07) — abrir o app instalado (ícone na
// tela inicial) deve sempre levar pra "Início", nunca reabrir onde a
// última sessão parou. O Chrome/Android costuma restaurar a última
// página do PWA em vez de navegar pro `start_url` do manifesto — isto
// não é bug do app, é comportamento da plataforma, mas o dono decidiu
// que prefere sempre abrir do zero na Início, mesmo perdendo a
// conveniência de retomar um treino em andamento direto.
//
// `useEffect` no layout raiz roda uma vez por CARREGAMENTO DE DOCUMENTO
// (lançamento do PWA, F5, aba nova) — não roda de novo em navegação
// interna via `<Link>`/`router.push`, porque o layout raiz persiste
// entre rotas no App Router. É exatamente a distinção que se precisa:
// só redireciona no lançamento "frio", nunca ao navegar dentro do app.
import { useEffect } from "react";

const ROTAS_ISENTAS = ["/", "/login", "/auth/callback"];

export default function ForcarInicioNoLancamento() {
  useEffect(() => {
    const emPwaInstalado = window.matchMedia("(display-mode: standalone)").matches;
    if (emPwaInstalado && !ROTAS_ISENTAS.includes(window.location.pathname)) {
      window.location.replace("/");
    }
  }, []);

  return null;
}
