"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ExercicioDoCatalogo } from "@/lib/dados/treino";
import SetaNavegacao from "@/components/seta-navegacao";

export default function CatalogoInterativo({
  exercicios,
  semDicaCount,
}: {
  exercicios: ExercicioDoCatalogo[];
  semDicaCount: number;
}) {
  const [busca, setBusca] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>("todos");

  // Grupos musculares únicos
  const grupos = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of exercicios) {
      map.set(ex.grupoMuscularPrimario, ex.grupoMuscularNome);
    }
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [exercicios]);

  // Filtragem combinada por busca e grupo
  const exerciciosFiltrados = useMemo(() => {
    return exercicios.filter((ex) => {
      const bateGrupo =
        grupoSelecionado === "todos" || ex.grupoMuscularPrimario === grupoSelecionado;
      const termo = busca.trim().toLowerCase();
      const bateBusca =
        !termo ||
        ex.nome.toLowerCase().includes(termo) ||
        ex.grupoMuscularNome.toLowerCase().includes(termo);
      return bateGrupo && bateBusca;
    });
  }, [exercicios, grupoSelecionado, busca]);

  // Agrupamento por grupo para exibição
  const gruposExibicao = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string; itens: ExercicioDoCatalogo[] }>();
    for (const ex of exerciciosFiltrados) {
      if (!mapa.has(ex.grupoMuscularPrimario)) {
        mapa.set(ex.grupoMuscularPrimario, {
          id: ex.grupoMuscularPrimario,
          nome: ex.grupoMuscularNome,
          itens: [],
        });
      }
      mapa.get(ex.grupoMuscularPrimario)!.itens.push(ex);
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [exerciciosFiltrados]);

  return (
    <div className="catalogo-wrapper">
      {/* Barra de Busca Pro */}
      <div className="busca-box">
        <svg className="busca-box__icone" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Buscar exercício ou músculo…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="busca-box__input"
        />
        {busca && (
          <button
            type="button"
            className="busca-box__limpar"
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Carrossel de Filtro por Grupo Muscular */}
      <div className="chips-carrossel" role="tablist" aria-label="Grupos musculares">
        <button
          type="button"
          className={`chip-filtro${grupoSelecionado === "todos" ? " chip-filtro--ativo" : ""}`}
          onClick={() => setGrupoSelecionado("todos")}
        >
          Todos ({exercicios.length})
        </button>
        {grupos.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`chip-filtro${grupoSelecionado === g.id ? " chip-filtro--ativo" : ""}`}
            onClick={() => setGrupoSelecionado(g.id)}
          >
            {g.nome}
          </button>
        ))}
      </div>

      {semDicaCount > 0 && !busca && (
        <div className="nota-metodo">
          <span className="nota-metodo__badge">Curadoria</span>
          <p>
            {semDicaCount} exercícios estão aguardando curadoria de execução. Dicas técnicas são revisadas por humanos (ADR-007).
          </p>
        </div>
      )}

      {exerciciosFiltrados.length === 0 ? (
        <div className="cartao-vazio">
          <p className="vazio">Nenhum exercício encontrado para &ldquo;{busca}&rdquo;.</p>
        </div>
      ) : (
        <div className="catalogo-lista">
          {gruposExibicao.map((grupo) => (
            <section className="grupo-catalogo" key={grupo.id}>
              <div className="grupo__cab">
                <h2 className="grupo__nome">{grupo.nome}</h2>
                <span className="tag-grupo">{grupo.itens.length} {grupo.itens.length === 1 ? "exercício" : "exercícios"}</span>
              </div>

              <div className="grupo-catalogo__itens">
                {grupo.itens.map((exercicio) => (
                  <Link
                    href={`/catalogo/${exercicio.id}`}
                    className="cartao-exercicio-pro"
                    key={exercicio.id}
                  >
                    <div className="cartao-exercicio-pro__info">
                      <div className="cartao-exercicio-pro__topo">
                        <h3 className="cartao-exercicio-pro__nome">{exercicio.nome}</h3>
                        {exercicio.unilateral && (
                          <span className="tag-unilateral">Unilateral</span>
                        )}
                      </div>

                      {exercicio.dicaExecucao ? (
                        <p className="cartao-exercicio-pro__dica">{exercicio.dicaExecucao}</p>
                      ) : (
                        <p className="cartao-exercicio-pro__sem-dica">Sem dica registrada</p>
                      )}
                    </div>
                    <SetaNavegacao />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="aviso-saude">
        As instruções deste catálogo não substituem orientação médica ou fisioterapêutica.
      </p>
    </div>
  );
}
