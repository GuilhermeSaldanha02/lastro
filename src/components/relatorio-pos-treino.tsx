"use client";

import { useRouter } from "next/navigation";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type RelatorioPosTreinoProps = {
  metricas: MetricasSessao;
  idioma: Idioma;
  onFechar: () => void;
};

export default function RelatorioPosTreino({
  metricas,
  idioma,
  onFechar,
}: RelatorioPosTreinoProps) {
  const router = useRouter();

  function concluirTreino() {
    onFechar();
    router.push("/treino");
  }

  return (
    <div className="pos-treino-overlay" role="dialog" aria-modal="true">
      <div className="pos-treino-modal">
        {/* Cabeçalho de Celebração */}
        <div className="pos-treino-header">
          <div className="pos-treino-badge-trofeu">🏆</div>
          <h2 className="pos-treino-titulo">{t("Treino Concluído!", idioma)}</h2>
          <p className="pos-treino-subtitulo">
            {t("Sessão finalizada com sucesso. Aqui está o seu resumo:", idioma)}
          </p>
        </div>

        {/* Grid de Estatísticas Principais (Estilo Strava) */}
        <div className="pos-treino-grid-metricas">
          {/* Card 1: Duração */}
          <div className="pos-treino-card-metrica">
            <span className="pos-treino-metrica-rotulo">{t("Duração", idioma)}</span>
            <div className="pos-treino-metrica-valor">
              {metricas.duracaoMinutos}
              <span className="pos-treino-metrica-unidade">min</span>
            </div>
          </div>

          {/* Card 2: Tonelagem Total */}
          <div className="pos-treino-card-metrica pos-treino-card-metrica--destaque">
            <span className="pos-treino-metrica-rotulo">{t("Carga Total", idioma)}</span>
            <div className="pos-treino-metrica-valor">
              {metricas.tonelagemTotalKg.toLocaleString("pt-BR")}
              <span className="pos-treino-metrica-unidade">kg</span>
            </div>
          </div>

          {/* Card 3: Séries Valendo */}
          <div className="pos-treino-card-metrica">
            <span className="pos-treino-metrica-rotulo">{t("Séries Válidas", idioma)}</span>
            <div className="pos-treino-metrica-valor">
              {metricas.totalSeriesValendo}
              <span className="pos-treino-metrica-unidade">séries</span>
            </div>
          </div>

          {/* Card 4: Exercícios */}
          <div className="pos-treino-card-metrica">
            <span className="pos-treino-metrica-rotulo">{t("Exercícios", idioma)}</span>
            <div className="pos-treino-metrica-valor">
              {metricas.totalExercicios}
              <span className="pos-treino-metrica-unidade">itens</span>
            </div>
          </div>
        </div>

        {/* Bloco de Recordes Pessoais Batidos (se houver) */}
        {metricas.prsBatidos.length > 0 && (
          <div className="pos-treino-bloco-prs">
            <div className="pos-treino-prs-titulo">
              <span>🔥</span>
              <span>{t("Novos Recordes Pessoais:", idioma)}</span>
            </div>
            <div className="pos-treino-prs-lista">
              {metricas.prsBatidos.map((pr, idx) => (
                <div key={idx} className="pos-treino-pr-item">
                  <span className="pos-treino-pr-nome">{pr.exercicioNome}</span>
                  <span className="pos-treino-pr-detalhe">
                    {pr.reps} × {pr.peso} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Fechamento */}
        <div className="pos-treino-acoes">
          <button
            type="button"
            className="botao-primario"
            onClick={concluirTreino}
            style={{ width: "100%" }}
          >
            {t("Concluir e Voltar ao Início", idioma)}
          </button>
        </div>
      </div>
    </div>
  );
}
