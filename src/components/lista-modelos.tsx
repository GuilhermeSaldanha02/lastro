"use client";

// lastro · H2 (D8, DECISIONS.md 2026-08-15) — "Modo de edição" substitui a
// lixeira sempre visível por linha por um estado explícito de tela: por
// padrão nenhuma linha mostra ação destrutiva, um botão "Editar" liga o
// modo, "Concluído" desliga. Primeiro consumidor do mecanismo — escolhido
// por ser o único caso sem alvo de toque concorrente (`.item` aqui é só
// nome + lixeira, sem `.item__link`; grade de anilhas e lista de treinos
// competem com outro alvo, `.serie` compete com o toque na linha inteira
// pra editar — os três ficam pendentes, ver docs/BACKLOG-REDESENHO.md).
//
// A confirmação em duas etapas de `ExcluirModelo` continua existindo —
// D8 não mexe nela. O que resolve o desalinhamento entre "modo de edição"
// (estado da tela) e "confirmando exclusão" (estado local do componente)
// é não montar `ExcluirModelo` quando o modo de edição está desligado:
// sair do modo de edição desmonta o componente, e o estado `confirmando`
// dele simplesmente deixa de existir — nada de sincronizar dois estados
// à mão.
import { useState } from "react";
import ExcluirModelo from "@/components/excluir-modelo";
import DicaInfo from "@/components/dica-info";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function ListaModelos({
  modelos,
  idioma,
}: {
  modelos: { id: string; nome: string }[];
  idioma: Idioma;
}) {
  const [modoEdicao, setModoEdicao] = useState(false);

  return (
    <>
      <div className="grupo__cab">
        <span className="titulo-com-dica">
          <h2 className="grupo__nome">{t("Modelos", idioma)}</h2>
          <DicaInfo titulo={t("Modelos", idioma)} idioma={idioma}>
            {t(
              "Listas de exercícios pra reaproveitar ao iniciar um treino — sem série, peso ou reps. Isso continua sendo preenchido normalmente no dia.",
              idioma,
            )}
          </DicaInfo>
        </span>
        {modelos.length > 0 && (
          <button
            type="button"
            className="botao-textual-com-icone"
            onClick={() => setModoEdicao((atual) => !atual)}
          >
            {modoEdicao ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--lastro-esmeralda)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            )}
            <span>{t(modoEdicao ? "Concluído" : "Editar", idioma)}</span>
          </button>
        )}
      </div>

      {modelos.length === 0 ? (
        <p className="vazio">{t("Nenhum modelo criado ainda.", idioma)}</p>
      ) : (
        <ul className="lista">
          {modelos.map((modelo) => (
            <li key={modelo.id}>
              <div className="item">
                <span className="item__estatico item__data">{modelo.nome}</span>
                {modoEdicao && <ExcluirModelo id={modelo.id} nome={modelo.nome} idioma={idioma} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
