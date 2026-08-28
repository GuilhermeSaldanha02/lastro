"use client";

import { useState } from "react";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

/**
 * Card de métricas da Home.
 *
 * A versão anterior desenhava três SVGs com o `d` do path escrito à mão,
 * idênticos para todo usuário: um perfil com ZERO treino via a mesma
 * curva subindo que um perfil com 11 toneladas na semana. Junto vinham
 * selos fixos ("Progressão", "Faixa Ideal") e um veredito de carga sem
 * cálculo nenhum ("Alta"). Auditoria de 2026-08-21, confirmada em
 * produção contra os dados reais do dono.
 *
 * Aqui cada barra é um treino de verdade, vindo de `resumo.historicoBarras`.
 * Sem treino, não há barra — ausência de dado precisa parecer ausência,
 * nunca uma linha de base que se lê como "zero progresso".
 *
 * A aba "Cargas" deu lugar a "Grupos": e1RM entre treinos de grupos
 * musculares diferentes não é série comparável (110 kg de agachamento e
 * 20 kg de rosca não conversam), enquanto série é somável em qualquer
 * grupo. Progressão de carga por exercício continua na `/analise`, que
 * compara o mesmo exercício ao longo das semanas.
 */

type Barra = { data: string; volume: number; series: number };
type GrupoComSeries = { grupo: string; series: number };
type GrupoComVolume = { grupo: string; volumeKg: number };

type MetricasHomeProps = {
  volumeFormatado: { valor: string; unidade: string };
  seriesValendo: number;
  treinosNaSemana: number;
  historicoBarras: Barra[];
  seriesPorGrupo: GrupoComSeries[];
  volumePorGrupo: GrupoComVolume[];
  idioma: Idioma;
};

type MetricaGrupo = "series" | "volume";

type Aba = "volume" | "series" | "grupos";

function rotuloDia(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return String(d.getUTCDate());
}

function GraficoBarras({
  barras,
  valorDe,
  formatar,
  rotuloSerie,
}: {
  barras: Barra[];
  valorDe: (b: Barra) => number;
  formatar: (n: number) => string;
  rotuloSerie: string;
}) {
  if (barras.length === 0) return null;

  const maximo = Math.max(...barras.map(valorDe));

  return (
    <div className="metrica-barras" role="img" aria-label={rotuloSerie}>
      {barras.map((b) => {
        const valor = valorDe(b);
        // Altura mínima de 4% para um treino leve não sumir da grade —
        // ele existiu, e a barra precisa dizer isso.
        const altura = maximo > 0 ? Math.max(4, (valor / maximo) * 100) : 4;
        return (
          <div className="metrica-barra" key={b.data + valor}>
            <div
              className="metrica-barra__haste"
              style={{ height: `${altura}%` }}
              title={`${rotuloDia(b.data)}: ${formatar(valor)}`}
            />
            <span className="metrica-barra__dia">{rotuloDia(b.data)}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Distribuição por grupo muscular na semana — séries ou volume (kg),
 * conforme `formatarValor`/`valorDe`. Barras horizontais, não verticais:
 * o rótulo é uma palavra ("Posterior de coxa"), e palavra não cabe
 * embaixo de uma coluna de 40px.
 */
function BarrasGrupos<T extends { grupo: string }>({
  grupos,
  valorDe,
  formatarValor,
  idioma,
}: {
  grupos: T[];
  valorDe: (g: T) => number;
  formatarValor: (n: number) => string;
  idioma: Idioma;
}) {
  const maximo = Math.max(...grupos.map(valorDe));

  return (
    <ul className="grupo-barras">
      {grupos.map((g) => {
        const valor = valorDe(g);
        return (
          <li className="grupo-barra" key={g.grupo}>
            <span className="grupo-barra__nome">{formatarGrupoMuscular(g.grupo, idioma)}</span>
            <span className="grupo-barra__trilho">
              <span
                className="grupo-barra__preenchimento"
                style={{ width: `${maximo > 0 ? Math.max(6, (valor / maximo) * 100) : 6}%` }}
              />
            </span>
            <span className="grupo-barra__valor">{formatarValor(valor)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function SeletorMetricasHome({
  volumeFormatado,
  seriesValendo,
  treinosNaSemana,
  historicoBarras,
  seriesPorGrupo,
  volumePorGrupo,
  idioma,
}: MetricasHomeProps) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("volume");
  // Sub-escolha dentro da aba "Grupos": contagem de séries não diz se o
  // grupo levou carga alta ou baixa, então o dono pediu as duas leituras
  // no mesmo lugar em vez de espalhar (2026-08-28).
  const [metricaGrupo, setMetricaGrupo] = useState<MetricaGrupo>("series");

  const temBarras = historicoBarras.length > 0;

  return (
    <section className="metrica-switcher-card" aria-label={t("Métricas da Semana", idioma)}>
      <div className="metrica-switcher__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "volume"}
          className={`metrica-tab${abaAtiva === "volume" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("volume")}
        >
          {t("Volume", idioma)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "series"}
          className={`metrica-tab${abaAtiva === "series" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("series")}
        >
          {t("Séries", idioma)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "grupos"}
          className={`metrica-tab${abaAtiva === "grupos" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("grupos")}
        >
          {t("Grupos", idioma)}
        </button>
      </div>

      <div className="metrica-switcher__conteudo">
        {abaAtiva === "volume" && (
          <div className="metrica-switcher__bloco">
            <div className="metrica-switcher__topo">
              <div>
                <div className="metrica-switcher__grande">
                  {volumeFormatado.valor}
                  <span className="metrica-switcher__unidade">{volumeFormatado.unidade}</span>
                </div>
                <p className="metrica-switcher__subtitulo">{t("Volume acumulado na semana", idioma)}</p>
              </div>
              <span className="metrica-switcher__delta">
                {treinosNaSemana > 0
                  ? `${treinosNaSemana} ${t(treinosNaSemana === 1 ? "sessão" : "sessões", idioma)}`
                  : t("Sem treinos", idioma)}
              </span>
            </div>

            <GraficoBarras
              barras={historicoBarras}
              valorDe={(b) => b.volume}
              formatar={(n) => `${Math.round(n).toLocaleString(idioma)} kg`}
              rotuloSerie={`${t("Volume dos últimos", idioma)} ${historicoBarras.length} ${t("treinos", idioma)}`}
            />
          </div>
        )}

        {abaAtiva === "series" && (
          <div className="metrica-switcher__bloco">
            <div className="metrica-switcher__topo">
              <div>
                <div className="metrica-switcher__grande">
                  {seriesValendo}
                  <span className="metrica-switcher__unidade">{t("séries", idioma)}</span>
                </div>
                <p className="metrica-switcher__subtitulo">
                  {t("Séries valendo concluídas (aquecimento excluído)", idioma)}
                </p>
              </div>
              <span className="metrica-switcher__delta">
                {treinosNaSemana > 0
                  ? `${treinosNaSemana} ${t(treinosNaSemana === 1 ? "sessão" : "sessões", idioma)}`
                  : t("Sem treinos", idioma)}
              </span>
            </div>

            <GraficoBarras
              barras={historicoBarras}
              valorDe={(b) => b.series}
              formatar={(n) => `${n} ${t(n === 1 ? "série" : "séries", idioma)}`}
              rotuloSerie={`${t("Séries dos últimos", idioma)} ${historicoBarras.length} ${t("treinos", idioma)}`}
            />
          </div>
        )}

        {abaAtiva === "grupos" && (
          <div className="metrica-switcher__bloco">
            <div className="metrica-switcher__topo">
              <div>
                <div className="metrica-switcher__grande">
                  {seriesPorGrupo.length}
                  <span className="metrica-switcher__unidade">
                    {t(seriesPorGrupo.length === 1 ? "grupo" : "grupos", idioma)}
                  </span>
                </div>
                <p className="metrica-switcher__subtitulo">
                  {metricaGrupo === "series"
                    ? t("Séries por grupo muscular nesta semana", idioma)
                    : t("Volume por grupo muscular nesta semana", idioma)}
                </p>
              </div>
              <div className="metrica-switcher__subtabs" role="tablist" aria-label={t("Métrica dos grupos", idioma)}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={metricaGrupo === "series"}
                  className={`metrica-subtab${metricaGrupo === "series" ? " metrica-subtab--ativa" : ""}`}
                  onClick={() => setMetricaGrupo("series")}
                >
                  {t("Séries", idioma)}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={metricaGrupo === "volume"}
                  className={`metrica-subtab${metricaGrupo === "volume" ? " metrica-subtab--ativa" : ""}`}
                  onClick={() => setMetricaGrupo("volume")}
                >
                  {t("Volume", idioma)}
                </button>
              </div>
            </div>

            {metricaGrupo === "series" ? (
              seriesPorGrupo.length > 0 ? (
                <BarrasGrupos
                  grupos={seriesPorGrupo}
                  valorDe={(g) => g.series}
                  formatarValor={(n) => String(n)}
                  idioma={idioma}
                />
              ) : (
                <p className="metrica-switcher__vazio">
                  {t("Nenhuma série registrada nesta semana ainda.", idioma)}
                </p>
              )
            ) : volumePorGrupo.length > 0 ? (
              <BarrasGrupos
                grupos={volumePorGrupo}
                valorDe={(g) => g.volumeKg}
                formatarValor={(n) => `${Math.round(n).toLocaleString(idioma)} kg`}
                idioma={idioma}
              />
            ) : (
              <p className="metrica-switcher__vazio">
                {t("Nenhuma série registrada nesta semana ainda.", idioma)}
              </p>
            )}
          </div>
        )}

        {abaAtiva !== "grupos" && !temBarras && (
          <p className="metrica-switcher__vazio">
            {t("Os treinos que você registrar aparecem aqui como histórico.", idioma)}
          </p>
        )}
      </div>
    </section>
  );
}
