"use client";

// lastro · ícone de informação que abre uma explicação curta numa folha.
//
// Pedido do dono (2026-09-14): o app tinha texto explicativo demais
// sempre à vista ("o que é tal coisa"). A explicação continua existindo,
// mas só aparece quando a pessoa pede — ícone "i" ao lado do título ou do
// rótulo, e a folha sobe com o texto. "i" e não "!": no lastro o "!" já
// significa alerta e erro.
//
// O que NÃO entra aqui, por decisão do dono na mesma data: confirmação de
// salvar, dado que muda (telefone do aluno), aviso de formato inválido e
// consequência de ação sem volta ou de consentimento. Esses precisam ser
// lidos antes de agir, então continuam visíveis.
//
// A folha é a mesma `Folha` das rotas interceptadas (DESIGN.md §6.5, peça
// 10), aberta por estado. Vai para o `body` por portal: `.card-obsidian`
// tem `backdrop-filter`, que prende `position: fixed` dentro do cartão.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Folha from "./folha";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function DicaInfo({
  titulo,
  children,
  idioma = "pt-BR",
}: {
  /** Título da folha e parte do rótulo acessível do botão. */
  titulo: string;
  /** A explicação. */
  children: ReactNode;
  idioma?: Idioma;
}) {
  const [aberta, setAberta] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const jaAbriu = useRef(false);

  // Ao fechar, o foco volta para o ícone — quem usa teclado ou leitor de
  // tela não é jogado para o topo da página.
  useEffect(() => {
    if (aberta) {
      jaAbriu.current = true;
    } else if (jaAbriu.current) {
      gatilho.current?.focus();
    }
  }, [aberta]);

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className="dica-info"
        aria-label={`${t("Saiba mais sobre", idioma)} ${titulo}`}
        aria-haspopup="dialog"
        aria-expanded={aberta}
        onClick={() => setAberta(true)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      {aberta &&
        createPortal(
          <Folha titulo={titulo} idioma={idioma} onFechar={() => setAberta(false)} focarAoAbrir>
            <p className="dica-info__texto">{children}</p>
          </Folha>,
          document.body,
        )}
    </>
  );
}
