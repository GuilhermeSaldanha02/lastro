"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ExercicioDoCatalogo } from "@/lib/dados/treino";
import SetaNavegacao from "@/components/seta-navegacao";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function CatalogoInterativo({
  exercicios,
  semDicaCount,
  idioma,
}: {
  exercicios: ExercicioDoCatalogo[];
  semDicaCount: number;
  idioma: Idioma;
}) {
  // O filtro vive na URL, não só em `useState` (achado do dono,
  // 2026-08-27): abrir um exercício e voltar desmontava o componente e
  // zerava o estado, jogando de volta pro topo do catálogo inteiro com
  // "todos" selecionado — perdia o grupo E o termo buscado. Na
  // querystring, o "voltar" do navegador restaura o filtro sozinho,
  // porque a URL anterior JÁ o carrega.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const grupoSelecionado = searchParams.get("grupo") ?? "todos";
  const buscaNaUrl = searchParams.get("busca") ?? "";
  // Espelho local só para o campo responder a cada tecla sem esperar a
  // rota. A URL continua sendo a fonte de verdade de quem volta.
  const [busca, setBusca] = useState(buscaNaUrl);

  /** Reescreve a querystring sem empilhar histórico nem rolar a página:
   *  cada tecla digitada não pode virar um "voltar" a mais. */
  const aplicarFiltro = useCallback(
    (mudancas: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [chave, valor] of Object.entries(mudancas)) {
        // Valor "vazio" sai da URL em vez de virar `?grupo=todos&busca=`.
        if (!valor || valor === "todos") params.delete(chave);
        else params.set(chave, valor);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const selecionarGrupo = useCallback(
    (id: string) => aplicarFiltro({ grupo: id }),
    [aplicarFiltro],
  );

  const digitarBusca = useCallback(
    (valor: string) => {
      setBusca(valor);
      aplicarFiltro({ busca: valor });
    },
    [aplicarFiltro],
  );

  // Grupos musculares únicos
  const grupos = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of exercicios) {
      map.set(ex.grupoMuscularPrimario, ex.grupoMuscularNome);
    }
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome, idioma),
    );
  }, [exercicios, idioma]);

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
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, idioma));
  }, [exerciciosFiltrados, idioma]);

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
          placeholder={t("Buscar exercício ou músculo…", idioma)}
          value={busca}
          onChange={(e) => digitarBusca(e.target.value)}
          className="busca-box__input"
        />
        {busca && (
          <button
            type="button"
            className="busca-box__limpar"
            onClick={() => digitarBusca("")}
            aria-label={t("Limpar busca", idioma)}
          >
            ✕
          </button>
        )}
      </div>

      {/* Carrossel de Filtro por Grupo Muscular */}
      <div className="chips-carrossel" role="tablist" aria-label={t("Grupos musculares", idioma)}>
        <button
          type="button"
          className={`chip-filtro${grupoSelecionado === "todos" ? " chip-filtro--ativo" : ""}`}
          onClick={() => selecionarGrupo("todos")}
        >
          {t("Todos", idioma)} ({exercicios.length})
        </button>
        {grupos.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`chip-filtro${grupoSelecionado === g.id ? " chip-filtro--ativo" : ""}`}
            onClick={() => selecionarGrupo(g.id)}
          >
            {g.nome}
          </button>
        ))}
      </div>

      {semDicaCount > 0 && !busca && (
        <div className="nota-metodo">
          <span className="nota-metodo__badge">{t("Curadoria", idioma)}</span>
          <p>
            {semDicaCount} {t("exercícios estão aguardando curadoria de execução. Dicas técnicas são revisadas por humanos (ADR-007).", idioma)}
          </p>
        </div>
      )}

      {exerciciosFiltrados.length === 0 ? (
        <p className="vazio">{t("Nenhum exercício encontrado para", idioma)} &ldquo;{busca}&rdquo;.</p>
      ) : (
        <div className="catalogo-lista">
          {gruposExibicao.map((grupo) => (
            <section className="grupo-catalogo" key={grupo.id}>
              <div className="grupo__cab">
                <h2 className="grupo__nome">{grupo.nome}</h2>
                <span className="tag-grupo">{grupo.itens.length} {t(grupo.itens.length === 1 ? "exercício" : "exercícios", idioma)}</span>
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
                          <span className="tag-unilateral">{t("Unilateral", idioma)}</span>
                        )}
                        {exercicio.pesoPorLado && (
                          <span className="tag-unilateral">{t("Peso por lado", idioma)}</span>
                        )}
                      </div>

                      {/* A DICA NÃO ENTRA AQUI, e é decisão, não esquecimento.
                          Quando as 102 dicas foram escritas (2026-09-09) elas
                          apareceram também neste card, e o catálogo no celular
                          passou a ter 11.552px de altura — cerca de 30 telas de
                          rolagem (medido na varredura j4). Quem procura um
                          exercício em pé na academia passa o olho pela lista;
                          duas linhas de texto por item multiplicam o caminho
                          sem ajudar a achar. A dica vive na tela de detalhe,
                          que é onde ela é procurada de propósito. */}
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
        {t("As instruções deste catálogo não substituem orientação médica ou fisioterapêutica.", idioma)}
      </p>
    </div>
  );
}
