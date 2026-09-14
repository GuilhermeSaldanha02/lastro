"use client";

// lastro · o botão que cria o treino de hoje (sem modelo ou com um).
//
// Achado M3 (QA, 2026-09-13): o botão era um `<form action={criarTreino}>`
// direto. Sem rede, a chamada da Server Function falhava e o erro subia
// sem ninguém para pegar — o Next trocava a tela INTEIRA pela página de
// erro dele ("This page couldn't load", em inglês, fundo branco). É o caso
// do subsolo sem sinal, justamente onde o app promete funcionar (D6).
//
// Criar o treino continua exigindo rede (a fila offline só cobre séries,
// ver `sincronizar-pendentes.ts`); o que muda é que a falha vira um aviso
// na tela, e a tela fica de pé para tentar de novo.
//
// `unstable_rethrow`: o `redirect()` de `criarTreino` também chega aqui
// como exceção interna do Next. Ele precisa seguir para o Next, não virar
// "não foi possível iniciar".
import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { criarTreino, criarTreinoComModelo } from "@/lib/dados/treino";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function FormIniciarTreino({
  modeloId,
  idioma,
  classeBotao,
  estilo,
  children,
}: {
  /** Com modelo, o treino abre com o modelo pré-listado (SDD §9.3). */
  modeloId?: string;
  idioma: Idioma;
  classeBotao: string;
  estilo?: CSSProperties;
  children: ReactNode;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  // Ref, não só `pendente`: dois toques no mesmo quadro chegam antes de o
  // React desabilitar o botão.
  const enviando = useRef(false);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
    setErro(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErro(t("Sem conexão. Conecte-se à internet para iniciar o treino.", idioma));
      return;
    }

    enviando.current = true;
    iniciar(async () => {
      try {
        await (modeloId ? criarTreinoComModelo(modeloId) : criarTreino());
      } catch (falha) {
        unstable_rethrow(falha);
        // Rede que diz estar ligada e não entrega (sinal fraco) cai aqui.
        setErro(t("Não foi possível iniciar o treino. Verifique a conexão e tente de novo.", idioma));
      } finally {
        enviando.current = false;
      }
    });
  }

  return (
    <form onSubmit={aoEnviar} style={estilo}>
      <button type="submit" className={classeBotao} disabled={pendente} aria-busy={pendente}>
        {children}
      </button>
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </form>
  );
}
