"use client";

// lastro · achado do dono (2026-08-30) — ver comentário completo em
// `src/lib/offline/sincronizar-pendentes.ts`. Este componente é o que
// faltava: montado no layout raiz (uma vez, em toda página), garante que
// "a rede voltou" drena a fila não importa em que tela o dono esteja —
// antes só acontecia dentro de `/treino/[id]`.
//
// Sem UI própria de propósito: o indicador visual de sync (D7) continua
// vivendo em `treino-detalhe.tsx`, que já assina o mesmo evento pra
// atualizar o selo "salvo"/"sincronizando" enquanto está montado. Este
// componente cobre as telas onde aquele indicador não existe — o dreno
// em si é idempotente (fila vazia não faz nada), então rodar duas vezes
// quando as duas telas coincidem não causa duplicidade nem corrida: os
// dois chamam `sincronizar()`, que já é sequencial e apaga da fila (Dexie)
// antes de devolver.
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sincronizarPendentes } from "@/lib/offline/sincronizar-pendentes";
import { ouvirPedidosDeSincronizacao } from "@/lib/offline/sincronizacao-em-segundo-plano";

export default function SincronizadorGlobal() {
  const rota = usePathname();

  // Drena ao montar E a cada troca de rota.
  //
  // Achado B7 (QA, 2026-09-13): só drenava ao montar. O login entra com
  // `router.push` (navegação dentro do app), então este componente, que
  // mora no layout raiz, NÃO remonta — a série que ficou na fila quando a
  // sessão expirou esperava até alguém recarregar o app ou abrir o treino.
  // Com a fila por conta (M1), antes do login nada podia subir; depois
  // dele, a primeira navegação sobe.
  //
  // Barato de propósito: `sincronizarPendentes` tem mutex, e fila vazia não
  // faz chamada de rede nenhuma.
  useEffect(() => {
    void sincronizarPendentes();
  }, [rota]);

  useEffect(() => {
    const aoVoltarARede = () => {
      void sincronizarPendentes();
    };
    window.addEventListener("online", aoVoltarARede);

    // Background Sync — o SW acorda mesmo com a aba em segundo plano e
    // avisa via `postMessage`; funciona em qualquer aba aberta, não só na
    // que registrou a série (tarefa 2.3, ver public/sw.js).
    const pararDeOuvir = ouvirPedidosDeSincronizacao(() => {
      void sincronizarPendentes();
    });

    return () => {
      window.removeEventListener("online", aoVoltarARede);
      pararDeOuvir();
    };
  }, []);

  return null;
}
