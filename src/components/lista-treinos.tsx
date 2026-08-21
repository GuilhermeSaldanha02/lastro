"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ExcluirTreino from "@/components/excluir-treino";
import SetaNavegacao from "@/components/seta-navegacao";

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
}: {
  treinos: ItemTreinoLista[];
}) {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");

  // Extrai todos os grupos musculares únicos
  const todosGrupos = useMemo(() => {
    const set = new Set<string>();
    for (const t of treinos) {
      for (const g of t.gruposMusculares ?? []) {
        if (g) set.add(g);
      }
    }
    return Array.from(set);
  }, [treinos]);

  const treinosFiltrados = useMemo(() => {
    if (filtroGrupo === "todos") return treinos;
    return treinos.filter((t) =>
      t.gruposMusculares?.some(
        (g) => g.toLowerCase() === filtroGrupo.toLowerCase(),
      ),
    );
  }, [treinos, filtroGrupo]);

  return (
    <div className="secao-treinos">
      <div className="grupo__cab">
        <div>
          <h2 className="secao-header__titulo">Histórico de Treinos</h2>
          <p className="secao-header__subtitulo">
            {treinos.length} {treinos.length === 1 ? "sessão registrada" : "sessões registradas"}
          </p>
        </div>
        {treinos.length > 0 && (
          <button
            type="button"
            className="botao-textual"
            onClick={() => setModoEdicao((atual) => !atual)}
          >
            {modoEdicao ? "Concluído" : "Editar"}
          </button>
        )}
      </div>

      {todosGrupos.length > 1 && (
        <div className="chips-carrossel" role="tablist" aria-label="Filtro de grupos">
          <button
            type="button"
            className={`chip-filtro${filtroGrupo === "todos" ? " chip-filtro--ativo" : ""}`}
            onClick={() => setFiltroGrupo("todos")}
          >
            Todos
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
        <div className="cartao-vazio">
          <div className="cartao-vazio__icone">⚔️</div>
          <p className="vazio">Nenhum treino registrado ainda. Inicie sua primeira sessão abaixo.</p>
        </div>
      ) : treinosFiltrados.length === 0 ? (
        <div className="cartao-vazio">
          <p className="vazio">Nenhum treino com o grupo &ldquo;{filtroGrupo}&rdquo;.</p>
        </div>
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
                      <span className="tag-grupo">SESSÃO</span>
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
                      {treino.totalSeries} {treino.totalSeries === 1 ? "série" : "séries"}
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
