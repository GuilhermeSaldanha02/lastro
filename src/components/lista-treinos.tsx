"use client";

// lastro · UX-02 (2026-09-28) — histórico de /treino. "Treino de hoje"
// separado do resto (item 1 do pedido do dono), histórico agrupado por mês
// em linhas finas (item 2), calendário do mês para pular direto a um dia
// (pedido do dono no portão visual — mockup aprovado), filtro por grupo
// muscular (já existia, mantido) e um botão de gerar relatório por linha,
// sem sair da tela (segundo pedido do dono, mesma conversa).
//
// Volume e séries continuam vindo de `listarTreinos` (servidor) — nada
// aqui recalcula métrica; é só apresentação, agrupamento e filtro.
import { useMemo, useState } from "react";
import Link from "next/link";
import ExcluirTreino from "@/components/excluir-treino";
import RelatorioPosTreino from "@/components/relatorio-pos-treino";
import SetaNavegacao from "@/components/seta-navegacao";
import type { Treino } from "@/lib/dados/treino";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import { agruparHistorico, mesesComTreino } from "@/lib/treino/agrupar-historico";
import { anoMesDeData, gerarGradeMes } from "@/lib/treino/calendario-mes";
import { formatarDataCurta, nomeMesComAno } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

const DIAS_SEMANA_POR_IDIOMA: Record<Idioma, string[]> = {
  "pt-BR": ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"],
  en: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  es: ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"],
};

function formatarVolume(kg?: number): string {
  if (!kg || kg === 0) return "—";
  if (kg < 1000) return `${kg} kg`;
  return `${(kg / 1000).toFixed(1).replace(".", ",")} t`;
}

export default function ListaTreinos({
  treinos,
  hojeISO,
  idioma,
  obterMetricasAcao,
}: {
  treinos: Treino[];
  /** Data de hoje (calendário de Brasília, "YYYY-MM-DD") — separa a seção "hoje". */
  hojeISO: string;
  idioma: Idioma;
  /** Mesma ação de `/ajustes/relatorios` (`lib/dados/relatorio-treino.ts`): gera as métricas do adesivo sem sair de `/treino`. */
  obterMetricasAcao: (treinoId: string) => Promise<MetricasSessao | null>;
}) {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [indiceMes, setIndiceMes] = useState(0);
  const [metricasAtivas, setMetricasAtivas] = useState<MetricasSessao | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

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
      treino.gruposMusculares?.some((g) => g.toLowerCase() === filtroGrupo.toLowerCase()),
    );
  }, [treinos, filtroGrupo]);

  const meses = useMemo(() => mesesComTreino(treinos), [treinos]);
  const mesAtual = meses[indiceMes] ?? anoMesDeData(hojeISO);
  const grade = useMemo(() => gerarGradeMes(mesAtual), [mesAtual]);
  const diasComTreino = useMemo(
    () => new Set(treinosFiltrados.map((t) => t.data)),
    [treinosFiltrados],
  );

  const agrupado = useMemo(
    () => agruparHistorico(treinosFiltrados, hojeISO),
    [treinosFiltrados, hojeISO],
  );
  const itensDoDia = diaSelecionado
    ? treinosFiltrados.filter((t) => t.data === diaSelecionado)
    : null;

  async function abrirRelatorio(treinoId: string) {
    setCarregandoId(treinoId);
    try {
      const metricas = await obterMetricasAcao(treinoId);
      if (metricas) setMetricasAtivas(metricas);
    } finally {
      setCarregandoId(null);
    }
  }

  function linhaTreino(treino: Treino) {
    return (
      <div key={treino.id} className="cartao-treino-item-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--lastro-e-2)" }}>
          <Link href={`/treino/${treino.id}`} className="cartao-treino-item" style={{ flex: 1 }}>
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
              <span className="cartao-treino-item__data">{formatarDataCurta(treino.data, idioma)}</span>
            </div>

            <div className="cartao-treino-item__direita">
              <div className="cartao-treino-item__metricas">
                <span className="cartao-treino-item__vol">{formatarVolume(treino.volumeKg)}</span>
                <span className="cartao-treino-item__series">
                  {treino.totalSeries} {t(treino.totalSeries === 1 ? "série" : "séries", idioma)}
                </span>
              </div>
              <SetaNavegacao />
            </div>
          </Link>
          {!modoEdicao && (
            <button
              type="button"
              className="item-treino-linha__acao-relatorio"
              disabled={carregandoId === treino.id}
              aria-label={t("Gerar relatório deste treino", idioma)}
              onClick={() => abrirRelatorio(treino.id)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          )}
        </div>
        {modoEdicao && (
          <div className="item__acao-edicao">
            <ExcluirTreino
              id={treino.id}
              data={formatarDataCurta(treino.data, idioma)}
              series={treino.totalSeries}
              idioma={idioma}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="secao-treinos">
      {treinos.length > 0 && (
        <div className="calendario-mes">
          <button
            type="button"
            className="calendario-mes__gatilho"
            aria-expanded={calendarioAberto}
            onClick={() => setCalendarioAberto((atual) => !atual)}
          >
            <span className="calendario-mes__titulo">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--lastro-ouro)" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>{nomeMesComAno(mesAtual, idioma)}</span>
              {!calendarioAberto && (
                <span className="calendario-mes__resumo">
                  · {diasComTreino.size} {t(diasComTreino.size === 1 ? "treino" : "treinos", idioma)}
                </span>
              )}
            </span>
            <svg
              className={`calendario-mes__seta${calendarioAberto ? " calendario-mes__seta--aberta" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {calendarioAberto && (
            <div className="calendario-mes__corpo">
              <div className="calendario-mes__navegacao">
                <button
                  type="button"
                  className="calendario-mes__navegacao-botao"
                  aria-label={t("Mês anterior", idioma)}
                  disabled={indiceMes >= meses.length - 1}
                  onClick={() => setIndiceMes((i) => Math.min(i + 1, meses.length - 1))}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="calendario-mes__navegacao-dica">{t("Toque num dia marcado", idioma)}</span>
                <button
                  type="button"
                  className="calendario-mes__navegacao-botao"
                  aria-label={t("Próximo mês", idioma)}
                  disabled={indiceMes <= 0}
                  onClick={() => setIndiceMes((i) => Math.max(i - 1, 0))}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>

              <div className="calendario-mes__semana">
                {DIAS_SEMANA_POR_IDIOMA[idioma].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="calendario-mes__grade">
                {grade.map((celula, i) => {
                  const temTreino = !celula.foraDoMes && !!celula.iso && diasComTreino.has(celula.iso);
                  const ehHoje = celula.iso === hojeISO;
                  const selecionado = !!celula.iso && celula.iso === diaSelecionado;
                  const classes = [
                    "calendario-dia",
                    celula.foraDoMes && "calendario-dia--fora-do-mes",
                    temTreino && "calendario-dia--com-treino",
                    ehHoje && "calendario-dia--hoje",
                    selecionado && "calendario-dia--selecionado",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={i}
                      type="button"
                      className={classes}
                      disabled={!temTreino}
                      onClick={() => {
                        if (!celula.iso) return;
                        setDiaSelecionado(celula.iso);
                        setCalendarioAberto(false);
                      }}
                    >
                      {celula.diaNum}
                      {temTreino && <span className="calendario-dia__ponto" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grupo__cab">
        <div>
          <h2 className="secao-header__titulo">{t("Histórico de Treinos", idioma)}</h2>
          <p className="secao-header__subtitulo">
            {diaSelecionado
              ? `${itensDoDia!.length} ${t(itensDoDia!.length === 1 ? "sessão registrada" : "sessões registradas", idioma)}`
              : `${treinosFiltrados.length} ${t(treinosFiltrados.length === 1 ? "sessão registrada" : "sessões registradas", idioma)}`}
          </p>
        </div>
        {treinos.length > 0 && (
          <button type="button" className="botao-textual-com-icone" onClick={() => setModoEdicao((atual) => !atual)}>
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

      {diaSelecionado && (
        <div className="filtro-dia-ativo">
          <span className="filtro-dia-ativo__rotulo">{t("Mostrando", idioma)}</span>
          <div className="filtro-dia-ativo__chip">
            {formatarDataCurta(diaSelecionado, idioma)}
            <button
              type="button"
              className="filtro-dia-ativo__limpar"
              aria-label={t("Ver todos os treinos", idioma)}
              onClick={() => setDiaSelecionado(null)}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {todosGrupos.length > 1 && (
        <div className="chips-carrossel" role="tablist" aria-label={t("Filtro de grupos", idioma)}>
          <button type="button" className={`chip-filtro${filtroGrupo === "todos" ? " chip-filtro--ativo" : ""}`} onClick={() => setFiltroGrupo("todos")}>
            {t("Todos", idioma)}
          </button>
          {todosGrupos.map((grupo) => (
            <button key={grupo} type="button" className={`chip-filtro${filtroGrupo === grupo ? " chip-filtro--ativo" : ""}`} onClick={() => setFiltroGrupo(grupo)}>
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
      ) : diaSelecionado ? (
        itensDoDia!.length === 0 ? (
          <p className="vazio">{t("Nenhum treino nesse dia com o grupo", idioma)} &ldquo;{filtroGrupo}&rdquo;.</p>
        ) : (
          <div className="feed-treinos">{itensDoDia!.map(linhaTreino)}</div>
        )
      ) : treinosFiltrados.length === 0 ? (
        <p className="vazio">{t("Nenhum treino com o grupo", idioma)} &ldquo;{filtroGrupo}&rdquo;.</p>
      ) : (
        <>
          {agrupado.hoje.length > 0 && (
            <div className="historico-hoje">
              <p className="historico-hoje__titulo">{t("Hoje", idioma)}</p>
              <div className="feed-treinos">{agrupado.hoje.map(linhaTreino)}</div>
            </div>
          )}
          {agrupado.porMes.map((grupoMes) => (
            <div key={grupoMes.anoMes}>
              <p className="historico-mes-cabecalho">{nomeMesComAno(grupoMes.anoMes, idioma)}</p>
              <div className="feed-treinos">{grupoMes.itens.map(linhaTreino)}</div>
            </div>
          ))}
        </>
      )}

      {metricasAtivas && (
        <RelatorioPosTreino metricas={metricasAtivas} idioma={idioma} onFechar={() => setMetricasAtivas(null)} />
      )}
    </div>
  );
}
