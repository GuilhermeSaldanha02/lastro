"use client";

import { useState } from "react";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";

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

type MetricasHomeProps = {
  volumeFormatado: { valor: string; unidade: string };
  seriesValendo: number;
  treinosNaSemana: number;
  historicoBarras: Barra[];
  seriesPorGrupo: GrupoComSeries[];
};

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
 * Distribuição de séries por grupo muscular na semana. Barras
 * horizontais, não verticais: o rótulo é uma palavra ("Posterior de
 * coxa"), e palavra não cabe embaixo de uma coluna de 40px.
 */
function BarrasGrupos({ grupos }: { grupos: GrupoComSeries[] }) {
  const maximo = Math.max(...grupos.map((g) => g.series));

  return (
    <ul className="grupo-barras">
      {grupos.map((g) => (
        <li className="grupo-barra" key={g.grupo}>
          <span className="grupo-barra__nome">{formatarGrupoMuscular(g.grupo)}</span>
          <span className="grupo-barra__trilho">
            <span
              className="grupo-barra__preenchimento"
              style={{ width: `${Math.max(6, (g.series / maximo) * 100)}%` }}
            />
          </span>
          <span className="grupo-barra__valor">{g.series}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SeletorMetricasHome({
  volumeFormatado,
  seriesValendo,
  treinosNaSemana,
  historicoBarras,
  seriesPorGrupo,
}: MetricasHomeProps) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("volume");

  const temBarras = historicoBarras.length > 0;

  return (
    <section className="metrica-switcher-card" aria-label="Métricas da Semana">
      <div className="metrica-switcher__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "volume"}
          className={`metrica-tab${abaAtiva === "volume" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("volume")}
        >
          Volume
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "series"}
          className={`metrica-tab${abaAtiva === "series" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("series")}
        >
          Séries
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "grupos"}
          className={`metrica-tab${abaAtiva === "grupos" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("grupos")}
        >
          Grupos
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
                <p className="metrica-switcher__subtitulo">Volume acumulado na semana</p>
              </div>
              <span className="metrica-switcher__delta">
                {treinosNaSemana > 0
                  ? `${treinosNaSemana} ${treinosNaSemana === 1 ? "sessão" : "sessões"}`
                  : "Sem treinos"}
              </span>
            </div>

            <GraficoBarras
              barras={historicoBarras}
              valorDe={(b) => b.volume}
              formatar={(n) => `${Math.round(n).toLocaleString("pt-BR")} kg`}
              rotuloSerie={`Volume dos últimos ${historicoBarras.length} treinos`}
            />
          </div>
        )}

        {abaAtiva === "series" && (
          <div className="metrica-switcher__bloco">
            <div className="metrica-switcher__topo">
              <div>
                <div className="metrica-switcher__grande">
                  {seriesValendo}
                  <span className="metrica-switcher__unidade">séries</span>
                </div>
                <p className="metrica-switcher__subtitulo">
                  Séries valendo concluídas (aquecimento excluído)
                </p>
              </div>
              <span className="metrica-switcher__delta">
                {treinosNaSemana > 0
                  ? `${treinosNaSemana} ${treinosNaSemana === 1 ? "sessão" : "sessões"}`
                  : "Sem treinos"}
              </span>
            </div>

            <GraficoBarras
              barras={historicoBarras}
              valorDe={(b) => b.series}
              formatar={(n) => `${n} ${n === 1 ? "série" : "séries"}`}
              rotuloSerie={`Séries dos últimos ${historicoBarras.length} treinos`}
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
                    {seriesPorGrupo.length === 1 ? "grupo" : "grupos"}
                  </span>
                </div>
                <p className="metrica-switcher__subtitulo">
                  Séries por grupo muscular nesta semana
                </p>
              </div>
            </div>

            {seriesPorGrupo.length > 0 ? (
              <BarrasGrupos grupos={seriesPorGrupo} />
            ) : (
              <p className="metrica-switcher__vazio">
                Nenhuma série registrada nesta semana ainda.
              </p>
            )}
          </div>
        )}

        {abaAtiva !== "grupos" && !temBarras && (
          <p className="metrica-switcher__vazio">
            Os treinos que você registrar aparecem aqui como histórico.
          </p>
        )}
      </div>
    </section>
  );
}
