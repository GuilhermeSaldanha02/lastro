"use client";

import { useState } from "react";
import type { Treino } from "@/lib/dados/treino";
import type { Idioma } from "@/lib/dados/idioma";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import { formatarDataCurta } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";
import RelatorioPosTreino from "@/components/relatorio-pos-treino";

type TreinoComMetricas = Treino & {
  metricasSessao?: MetricasSessao;
};

type HistoricoRelatoriosPosTreinoProps = {
  treinos: TreinoComMetricas[];
  idioma: Idioma;
  obterMetricasAcao: (treinoId: string) => Promise<MetricasSessao | null>;
};

export default function HistoricoRelatoriosPosTreino({
  treinos,
  idioma,
  obterMetricasAcao,
}: HistoricoRelatoriosPosTreinoProps) {
  const [metricasAtivas, setMetricasAtivas] = useState<MetricasSessao | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  async function abrirSticker(treinoId: string) {
    setCarregandoId(treinoId);
    try {
      const metricas = await obterMetricasAcao(treinoId);
      if (metricas) {
        setMetricasAtivas(metricas);
      }
    } finally {
      setCarregandoId(null);
    }
  }

  return (
    <>
      <div className="pilha">
        {treinos.map((tr) => (
          <div key={tr.id} className="card-relatorio-item">
            <div className="card-relatorio-item__cabecalho">
              <div className="card-relatorio-item__data-bloco">
                <span className="card-relatorio-item__data-rotulo">
                  {formatarDataCurta(tr.data).toUpperCase()}
                </span>
                <span className="card-relatorio-item__id-curto">
                  #{tr.id.slice(0, 6)}
                </span>
              </div>

              {tr.gruposMusculares && tr.gruposMusculares.length > 0 && (
                <div className="card-relatorio-item__grupos">
                  {tr.gruposMusculares.map((g) => (
                    <span key={g} className="card-relatorio-item__grupo-chip">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="card-relatorio-item__metricas-grade">
              <div className="card-relatorio-item__metrica">
                <span className="card-relatorio-item__metrica-rotulo">
                  {t("SÉRIES", idioma)}
                </span>
                <span className="card-relatorio-item__metrica-valor">
                  {tr.totalSeries}
                </span>
              </div>

              <div className="card-relatorio-item__metrica">
                <span className="card-relatorio-item__metrica-rotulo">
                  {t("VOLUME", idioma)}
                </span>
                <span className="card-relatorio-item__metrica-valor">
                  {tr.volumeKg ? `${tr.volumeKg} kg` : "—"}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="botao-acao-relatorio"
              disabled={carregandoId === tr.id}
              onClick={() => abrirSticker(tr.id)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>
                {carregandoId === tr.id
                  ? t("Carregando...", idioma)
                  : t("Gerar Imagem / Sticker Story", idioma)}
              </span>
            </button>
          </div>
        ))}
      </div>

      {metricasAtivas && (
        <RelatorioPosTreino
          metricas={metricasAtivas}
          idioma={idioma}
          onFechar={() => setMetricasAtivas(null)}
        />
      )}
    </>
  );
}
