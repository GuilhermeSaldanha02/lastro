"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ExcluirTreino from "@/components/excluir-treino";
import SetaNavegacao from "@/components/seta-navegacao";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export type ItemTreinoLista = {
  id: string;
  dataFormatada: string;
  totalSeries: number;
  gruposMusculares?: string[];
  volumeKg?: number;
};

function formatarVolume(kg?: number): string {
  if (!kg || kg === 0) return "—";
  if (kg < 1000) return `${kg} kg`;
  return `${(kg / 1000).toFixed(1).replace(".", ",")} t`;
}

export default function ListaTreinos({
  treinos,
  idioma,
}: {
  treinos: ItemTreinoLista[];
  idioma: Idioma;
}) {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");

  // Extrai todos os grupos musculares únicos
  const todosGrupos = useMemo(() => {
    const set = new Set<string>();
    for (const treino of treinos) {
      for (const g of treino.gruposMusculares ?? []) {
        if (g) set.add(g);
      }
    }
    return Array.from(set);
  }, [treinos]);

  const treinosFiltrados = useMemo(() => {
    if (filtroGrupo === "todos") return treinos;
    return treinos.filter((treino) =>
      treino.gruposMusculares?.some(
        (g) => g.toLowerCase() === filtroGrupo.toLowerCase(),
      ),
    );
  }, [treinos, filtroGrupo]);

  return (
    <div className="secao-treinos">
      <div className="grupo__cab">
        <div>
          <h2 className="secao-header__titulo">{t("Histórico de Treinos", idioma)}</h2>
          <p className="secao-header__subtitulo">
            {treinos.length} {t(treinos.length === 1 ? "sessão registrada" : "sessões registradas", idioma)}
          </p>
        </div>
        {treinos.length > 0 && (
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

      {todosGrupos.length > 1 && (
        <div className="chips-carrossel" role="tablist" aria-label={t("Filtro de grupos", idioma)}>
          <button
            type="button"
            className={`chip-filtro${filtroGrupo === "todos" ? " chip-filtro--ativo" : ""}`}
            onClick={() => setFiltroGrupo("todos")}
          >
            {t("Todos", idioma)}
          </button>
          {todosGrupos.map((grupo) => (
            <button
              key={grupo}
              type="button"
              className={`chip-filtro${filtroGrupo === grupo ? " chip-filtro--ativo" : ""}`}
              onClick={() => setFiltroGrupo(grupo)}
            >
              {grupo}
            </button>
          ))}
        </div>
      )}

      {treinos.length === 0 ? (
        <div className="vazio">
          <div className="cartao-vazio__icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--lastro-ouro)" strokeWidth="1.5">
              <path d="M4 8v8M20 8v8M8 6v12M16 6v12M8 12h8" />
            </svg>
          </div>
          <p>{t("Nenhum treino registrado ainda. Inicie sua primeira sessão abaixo.", idioma)}</p>
        </div>
      ) : treinosFiltrados.length === 0 ? (
        <p className="vazio">{t("Nenhum treino com o grupo", idioma)} &ldquo;{filtroGrupo}&rdquo;.</p>
      ) : (
        <div className="feed-treinos">
          {treinosFiltrados.map((treino) => (
            <div key={treino.id} className="cartao-treino-item-wrap">
              <Link href={`/treino/${treino.id}`} className="cartao-treino-item">
                <div className="cartao-treino-item__esquerda">
                  <div className="cartao-treino-item__grupos">
                    {(treino.gruposMusculares?.length ?? 0) > 0 ? (
                      treino.gruposMusculares!.map((grupo, idx) => (
                        <span key={idx} className="tag-grupo">
                          {grupo.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="tag-grupo">{t("SESSÃO", idioma)}</span>
                    )}
                  </div>
                  <span className="cartao-treino-item__data">{treino.dataFormatada}</span>
                </div>

                <div className="cartao-treino-item__direita">
                  <div className="cartao-treino-item__metricas">
                    <span className="cartao-treino-item__vol">
                      {formatarVolume(treino.volumeKg)}
                    </span>
                    <span className="cartao-treino-item__series">
                      {treino.totalSeries} {t(treino.totalSeries === 1 ? "série" : "séries", idioma)}
                    </span>
                  </div>
                  <SetaNavegacao />
                </div>
              </Link>
              {modoEdicao && (
                <div className="item__acao-edicao">
                  <ExcluirTreino
                    id={treino.id}
                    data={treino.dataFormatada}
                    series={treino.totalSeries}
                    idioma={idioma}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
