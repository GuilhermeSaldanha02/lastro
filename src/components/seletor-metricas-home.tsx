"use client";

import { useState } from "react";

type MetricasHomeProps = {
  volumeFormatado: { valor: string; unidade: string };
  seriesValendo: number;
  treinosNaSemana: number;
};

export default function SeletorMetricasHome({
  volumeFormatado,
  seriesValendo,
  treinosNaSemana,
}: MetricasHomeProps) {
  const [abaAtiva, setAbaAtiva] = useState<"volume" | "cargas" | "series">("volume");

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
          aria-selected={abaAtiva === "cargas"}
          className={`metrica-tab${abaAtiva === "cargas" ? " metrica-tab--ativa" : ""}`}
          onClick={() => setAbaAtiva("cargas")}
        >
          Cargas
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
                {treinosNaSemana > 0 ? `${treinosNaSemana} sessões` : "Sem treinos"}
              </span>
            </div>

            {/* Onda SVG com gradiente dinâmico */}
            <div className="metrica-wave-wrapper">
              <svg className="metrica-wave-svg" viewBox="0 0 350 75" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradTeal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="strokeGradTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="60%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
                <path d="M 0,55 Q 50,60 100,45 T 200,50 T 290,15 T 350,8 L 350,75 L 0,75 Z" fill="url(#waveGradTeal)" />
                <path d="M 0,55 Q 50,60 100,45 T 200,50 T 290,15 T 350,8" fill="none" stroke="url(#strokeGradTeal)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="290" cy="15" r="4.5" fill="#D4AF37" stroke="#0E1218" strokeWidth="2" />
              </svg>
            </div>
          </div>
        )}

        {abaAtiva === "cargas" && (
          <div className="metrica-switcher__bloco">
            <div className="metrica-switcher__topo">
              <div>
                <div className="metrica-switcher__grande">
                  {treinosNaSemana > 0 ? "Alta" : "—"}
                  <span className="metrica-switcher__unidade">1RM</span>
                </div>
                <p className="metrica-switcher__subtitulo">Evolução de cargas nos principais exercícios</p>
              </div>
              <span className="metrica-switcher__delta">Progressão</span>
            </div>

            <div className="metrica-wave-wrapper">
              <svg className="metrica-wave-svg" viewBox="0 0 350 75" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradGold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,60 Q 60,50 120,40 T 240,25 T 350,10 L 350,75 L 0,75 Z" fill="url(#waveGradGold)" />
                <path d="M 0,60 Q 60,50 120,40 T 240,25 T 350,10" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />
                <circle cx="350" cy="10" r="4.5" fill="#10B981" stroke="#0E1218" strokeWidth="2" />
              </svg>
            </div>
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
                <p className="metrica-switcher__subtitulo">Séries valendo concluídas (aquecimento excluído)</p>
              </div>
              <span className="metrica-switcher__delta">Faixa Ideal</span>
            </div>

            <div className="metrica-wave-wrapper">
              <svg className="metrica-wave-svg" viewBox="0 0 350 75" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,50 Q 70,30 140,45 T 280,20 T 350,15 L 350,75 L 0,75 Z" fill="url(#waveGradCyan)" />
                <path d="M 0,50 Q 70,30 140,45 T 280,20 T 350,15" fill="none" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
                <circle cx="280" cy="20" r="4.5" fill="#D4AF37" stroke="#0E1218" strokeWidth="2" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
