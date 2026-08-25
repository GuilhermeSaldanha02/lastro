"use client";

import React from "react";

interface IlustracaoAnatomica3DProps {
  exercicioId: string;
  slug: string;
  musculoAlvo?: string;
  modo: "execucao" | "aparelho";
  fase: 0 | 1;
}

export default function IlustracaoAnatomica3D({
  exercicioId,
  slug,
  musculoAlvo = "",
  modo,
  fase,
}: IlustracaoAnatomica3DProps) {
  // Determina o padrão biomecânico pelo slug/músculo
  const isTriceps = slug.includes("triceps") || slug.includes("dip") || musculoAlvo.toLowerCase().includes("tríceps");
  const isBiceps = slug.includes("curl") || slug.includes("rosca") || musculoAlvo.toLowerCase().includes("bíceps");
  const isPeito = slug.includes("bench") || slug.includes("supino") || slug.includes("press") || slug.includes("fly") || slug.includes("push-up") || musculoAlvo.toLowerCase().includes("peitoral");
  const isCostas = slug.includes("row") || slug.includes("pull") || slug.includes("remo") || slug.includes("puxada") || slug.includes("lat") || musculoAlvo.toLowerCase().includes("latíssimo");
  const isOmbro = slug.includes("raise") || slug.includes("lateral") || slug.includes("military") || slug.includes("shoulder") || musculoAlvo.toLowerCase().includes("deltoide");
  const isPerna = slug.includes("squat") || slug.includes("leg") || slug.includes("lunge") || slug.includes("agachamento") || slug.includes("extens");
  const isPosteriorGluteo = slug.includes("deadlift") || slug.includes("thrust") || slug.includes("bridge") || slug.includes("stiff") || musculoAlvo.toLowerCase().includes("glúteo") || musculoAlvo.toLowerCase().includes("isquiotibiais");
  const isPanturrilha = slug.includes("calf") || slug.includes("panturrilha") || musculoAlvo.toLowerCase().includes("gastrocnêmio") || musculoAlvo.toLowerCase().includes("sóleo");

  const animClass = modo === "execucao" ? "anatomia-3d-animada" : fase === 1 ? "anatomia-3d-contracao" : "anatomia-3d-inicial";

  return (
    <div className={`player-3d-canvas-wrapper ${animClass}`}>
      <svg
        className="player-3d-svg"
        viewBox="0 0 400 300"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="corpoGradPadrao" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="musculoNeonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3333" />
            <stop offset="60%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <filter id="neonFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. PADRÃO TRÍCEPS (TESTA / CORDA / BANCO) */}
        {isTriceps && (
          <g className="grupo-anatomico triceps-cena">
            {/* Banco Reto Técnico */}
            <rect x="70" y="185" width="260" height="18" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="100" y1="203" x2="100" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="280" y1="203" x2="280" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="80" y1="280" x2="120" y2="280" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="260" y1="280" x2="300" y2="280" stroke="#475569" strokeWidth="5" strokeLinecap="round" />

            {/* Cabeça e Tronco */}
            <ellipse cx="115" cy="170" rx="14" ry="16" fill="url(#corpoGradPadrao)" />
            <path d="M125 175 Q170 172 220 178 Q215 188 135 188 Z" fill="url(#corpoGradPadrao)" stroke="#334155" strokeWidth="1" />
            <path d="M210 178 Q245 180 265 190 L250 205 L205 190 Z" fill="#64748b" />

            {/* Pernas dobradas no solo */}
            <path d="M260 190 L285 230 L285 275" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M285 275 L305 275" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />

            {/* Ombro */}
            <circle cx="140" cy="165" r="11" fill="url(#corpoGradPadrao)" />

            {/* MÚSCULO FOCO: TRÍCEPS BRAQUIAL EM VERMELHO NEON */}
            <path d="M140 165 Q150 135 160 110" fill="none" stroke="url(#musculoNeonGlow)" strokeWidth="18" strokeLinecap="round" filter="url(#neonFilter)" />
            <path d="M136 162 Q148 135 158 112" fill="none" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

            {/* Antebraço & Barra */}
            <g className="triceps-antebraco-movimento">
              <path d="M160 110 L125 115" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="11" strokeLinecap="round" />
              <line x1="120" y1="80" x2="130" y2="150" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />
              <circle cx="125" cy="115" r="14" fill="#0f172a" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="125" cy="115" r="5" fill="#f8fafc" />
            </g>

            {/* Arco de Movimento Biomecânico */}
            <path d="M 125 115 A 35 35 0 0 1 160 75" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.9" />
            <polygon points="163,73 155,73 160,80" fill="#10b981" />
          </g>
        )}

        {/* 2. PADRÃO PEITO (SUPINO / CRUCIFIXO / CROSSOVER) */}
        {isPeito && !isTriceps && (
          <g className="grupo-anatomico peito-cena">
            {/* Banco e Suporte */}
            <rect x="80" y="190" width="240" height="18" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="100" y1="208" x2="100" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="280" y1="208" x2="280" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />

            {/* Cabeça e Tronco */}
            <ellipse cx="115" cy="175" rx="14" ry="16" fill="url(#corpoGradPadrao)" />

            {/* MÚSCULO FOCO: PEITORAL MAIOR EM VERMELHO NEON */}
            <path d="M135 165 Q180 155 215 170 Q180 185 135 180 Z" fill="url(#musculoNeonGlow)" stroke="#ef4444" strokeWidth="1.5" filter="url(#neonFilter)" />

            {/* Abdômen e Quadril */}
            <path d="M210 178 Q245 180 265 190 L250 205 L205 190 Z" fill="url(#corpoGradPadrao)" />
            {/* Pernas */}
            <path d="M260 190 L285 230 L285 275" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />

            {/* Braços e Barra de Supino */}
            <g className="peito-bracos-movimento">
              <path d="M150 170 L170 120 L170 80" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="70" y1="75" x2="270" y2="75" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
              <rect x="75" y="55" width="12" height="40" rx="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="253" y="55" width="12" height="40" rx="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            </g>

            {/* Trajetória Vertical */}
            <line x1="170" y1="130" x2="170" y2="80" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="167,78 173,78 170,72" fill="#10b981" />
          </g>
        )}

        {/* 3. PADRÃO COSTAS (PUXADA / REMO / BARRA FIXA) */}
        {isCostas && !isPeito && !isTriceps && (
          <g className="grupo-anatomico costas-cena">
            {/* Banco / Máquina */}
            <rect x="140" y="210" width="80" height="14" rx="3" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="180" y1="224" x2="180" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />

            {/* Cabeça e Coluna */}
            <ellipse cx="180" cy="115" rx="14" ry="16" fill="url(#corpoGradPadrao)" />

            {/* MÚSCULO FOCO: LATÍSSIMO DO DORSO & ROMBÓIDES EM VERMELHO NEON */}
            <path d="M160 130 Q180 120 200 130 L210 180 Q180 195 150 180 Z" fill="url(#musculoNeonGlow)" stroke="#ef4444" strokeWidth="1.5" filter="url(#neonFilter)" />

            {/* Braços em Puxada */}
            <g className="costas-bracos-movimento">
              <path d="M165 135 L120 100 L110 50" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M195 135 L240 100 L250 50" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="70" y1="48" x2="290" y2="48" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
              <circle cx="180" cy="48" r="4" fill="#0ea5e9" />
              <line x1="180" y1="10" x2="180" y2="48" stroke="#94a3b8" strokeWidth="3" />
            </g>

            {/* Trajetória de Puxada */}
            <line x1="180" y1="50" x2="180" y2="95" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="177,97 183,97 180,103" fill="#10b981" />
          </g>
        )}

        {/* 4. PADRÃO OMBROS (DESENVOLVIMENTO / ELEVAÇÃO LATERAL) */}
        {isOmbro && !isCostas && !isPeito && !isTriceps && (
          <g className="grupo-anatomico ombro-cena">
            {/* Tronco */}
            <ellipse cx="180" cy="110" rx="14" ry="16" fill="url(#corpoGradPadrao)" />
            <path d="M160 125 L200 125 L195 210 L165 210 Z" fill="url(#corpoGradPadrao)" />

            {/* MÚSCULO FOCO: DELTÓIDES (ANTERIOR/LATERAL) EM VERMELHO NEON */}
            <circle cx="150" cy="130" r="14" fill="url(#musculoNeonGlow)" filter="url(#neonFilter)" />
            <circle cx="210" cy="130" r="14" fill="url(#musculoNeonGlow)" filter="url(#neonFilter)" />

            {/* Braços e Halteres */}
            <g className="ombro-bracos-movimento">
              <path d="M150 130 L110 130 L80 130" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="12" strokeLinecap="round" />
              <path d="M210 130 L250 130 L280 130" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="12" strokeLinecap="round" />
              <rect x="68" y="118" width="16" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="276" y="118" width="16" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            </g>

            {/* Arcos de Elevação */}
            <path d="M 100 170 A 50 50 0 0 1 85 130" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 260 170 A 50 50 0 0 0 275 130" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
          </g>
        )}

        {/* 5. PADRÃO PERNAS (AGACHAMENTO / LEG PRESS / HACK) */}
        {(isPerna || isPosteriorGluteo || isPanturrilha) && !isOmbro && !isCostas && !isPeito && !isTriceps && (
          <g className="grupo-anatomico perna-cena">
            {/* Tronco */}
            <ellipse cx="160" cy="90" rx="14" ry="16" fill="url(#corpoGradPadrao)" />
            <path d="M150 105 L175 105 L180 170 L155 170 Z" fill="url(#corpoGradPadrao)" />

            {/* Barra nas Costas */}
            <line x1="100" y1="100" x2="230" y2="100" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
            <circle cx="105" cy="100" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="225" cy="100" r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />

            {/* MÚSCULO FOCO: QUADRÍCEPS & GLÚTEOS EM VERMELHO NEON */}
            <path d="M170 170 Q195 210 185 240 Q165 240 160 170 Z" fill="url(#musculoNeonGlow)" stroke="#ef4444" strokeWidth="1.5" filter="url(#neonFilter)" />

            {/* Pernas e Panturrilhas */}
            <path d="M185 240 L185 285 L205 285" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />

            {/* Trajetória de Agachamento */}
            <line x1="165" y1="90" x2="165" y2="140" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="162,142 168,142 165,148" fill="#10b981" />
          </g>
        )}

        {/* 6. PADRÃO ABDÔMEN / GERAL (CRUNCH / PRANCHA / DEFAULT) */}
        {!isTriceps && !isPeito && !isCostas && !isOmbro && !isPerna && !isPosteriorGluteo && !isPanturrilha && (
          <g className="grupo-anatomico abdomen-cena">
            {/* Solo / Apoio */}
            <line x1="60" y1="240" x2="340" y2="240" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Tronco e Cabeça */}
            <ellipse cx="120" cy="190" rx="14" ry="16" fill="url(#corpoGradPadrao)" />

            {/* MÚSCULO FOCO: RETO ABDOMINAL EM VERMELHO NEON */}
            <path d="M140 190 Q180 180 220 200 L215 225 Q175 220 135 220 Z" fill="url(#musculoNeonGlow)" stroke="#ef4444" strokeWidth="1.5" filter="url(#neonFilter)" />

            {/* Pernas flexionadas */}
            <path d="M220 200 L260 170 L280 240" fill="none" stroke="url(#corpoGradPadrao)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />

            {/* Arco de Flexão */}
            <path d="M 120 190 A 40 40 0 0 1 155 160" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="158,158 150,158 155,165" fill="#10b981" />
          </g>
        )}
      </svg>
    </div>
  );
}
