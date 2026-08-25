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
  slug,
  musculoAlvo = "",
  modo,
  fase,
}: IlustracaoAnatomica3DProps) {
  const s = slug.toLowerCase();
  const m = musculoAlvo.toLowerCase();

  // Classificação rigorosa dos padrões biomecânicos e equipamentos
  const isTricepsCorda = s.includes("pushdown") || s.includes("pulley") || s.includes("corda") || s.includes("polia") || (s.includes("triceps") && (s.includes("cable") || s.includes("unilateral") || s.includes("high-pulley")));
  const isTricepsTesta = !isTricepsCorda && (s.includes("skull") || s.includes("testa") || s.includes("lying-triceps") || (s.includes("triceps") && (s.includes("lying") || s.includes("barra"))));
  const isTricepsFrances = !isTricepsCorda && !isTricepsTesta && (s.includes("overhead") || s.includes("frances") || s.includes("french"));
  const isParalelas = s.includes("dip") || s.includes("paralela") || s.includes("mergulho");

  const isSupino = !isParalelas && (s.includes("bench") || s.includes("supino") || s.includes("chest-press") || s.includes("floor-press") || s.includes("push-up") || s.includes("flexao"));
  const isCrucifixo = s.includes("fly") || s.includes("crossover") || s.includes("crucifixo") || s.includes("pec-deck") || s.includes("peck-deck");

  const isPuxada = s.includes("pulldown") || s.includes("puxada") || s.includes("pull-up") || s.includes("chin-up") || s.includes("dominada") || s.includes("lat-pull");
  const isRemo = !isPuxada && (s.includes("row") || s.includes("remo") || s.includes("remada") || s.includes("t-bar") || s.includes("cavalinho"));

  const isElevLateral = s.includes("lateral-raise") || s.includes("elevacao-lateral") || (s.includes("lateral") && m.includes("deltoide"));
  const isElevFrontal = s.includes("front-raise") || s.includes("elevacao-frontal");
  const isDesenvOmbro = !isElevLateral && !isElevFrontal && (s.includes("shoulder-press") || s.includes("overhead") || s.includes("military") || s.includes("militar") || s.includes("desenvolvimento") || s.includes("arnold") || m.includes("deltoide anterior"));

  const isRoscaBiceps = s.includes("curl") || s.includes("rosca") || m.includes("bíceps");

  const isLegPress = s.includes("leg-press") || s.includes("prensa");
  const isExtensora = s.includes("leg-extension") || s.includes("extensora") || s.includes("extensao-de-pernas");
  const isFlexora = s.includes("leg-curl") || s.includes("flexora") || s.includes("curl-femoral");
  const isHipThrust = s.includes("thrust") || s.includes("bridge") || s.includes("elevacao-pelvica") || s.includes("ponte");
  const isDeadlift = s.includes("deadlift") || s.includes("stiff") || s.includes("rdl") || s.includes("good-morning") || s.includes("peso-muerto");
  const isAgachamento = !isLegPress && !isExtensora && !isFlexora && !isHipThrust && !isDeadlift && (s.includes("squat") || s.includes("agachamento") || s.includes("lunge") || s.includes("step-up") || s.includes("passada") || s.includes("bulgaro") || s.includes("hack"));

  const isPanturrilha = s.includes("calf") || s.includes("panturrilha") || s.includes("talon");
  const isPrancha = s.includes("plank") || s.includes("prancha");
  const isAbdominal = !isPrancha && (s.includes("crunch") || s.includes("ab") || s.includes("abdominal") || s.includes("leg-raise") || m.includes("reto abdominal") || m.includes("oblíquo"));

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
          {/* Corpo em volume 3D monocromático */}
          <linearGradient id="corpo3DGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Músculo Alvo Neon Brilhante */}
          <linearGradient id="musculoNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          {/* Brilho Neon Fluorescente */}
          <filter id="glowFoco" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. CENA: EXTENSÃO DE TRÍCEPS NA POLIA ALTA (PULLEY / CORDA / BARRA) */}
        {isTricepsCorda && (
          <g className="cena-3d triceps-polia-em-pe">
            {/* Torre de Cabos e Roldana Superior */}
            <rect x="290" y="20" width="22" height="260" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="280" cy="45" r="14" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="280" cy="45" r="4" fill="#38bdf8" />
            <line x1="280" y1="45" x2="215" y2="135" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 2" />

            {/* Cabeça e Tronco (Em pé, leve inclinação para a frente) */}
            <ellipse cx="145" cy="85" rx="14" ry="16" fill="url(#corpo3DGrad)" />
            <path d="M140 100 L170 120 L160 195 L130 185 Z" fill="url(#corpo3DGrad)" />

            {/* Pernas e Pés firmes no chão */}
            <path d="M135 185 L125 240 L120 280" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M155 190 L165 240 L165 280" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M110 280 L135 280" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
            <path d="M155 280 L180 280" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />

            {/* Braço superior fixo ao lado do tronco */}
            <path d="M165 115 L180 160" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" />

            {/* MÚSCULO FOCO: TRÍCEPS BRAQUIAL EM VERMELHO NEON */}
            <path d="M162 115 Q176 138 178 160" fill="none" stroke="url(#musculoNeonGrad)" strokeWidth="16" strokeLinecap="round" filter="url(#glowFoco)" />
            <path d="M162 115 Q176 138 178 160" fill="none" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

            {/* Antebraço estendendo para baixo com a Corda/Barra */}
            <g className="triceps-polia-antebraco">
              <path d="M180 160 L215 135" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="10" strokeLinecap="round" />
              {/* Mão e Pegador da Corda */}
              <circle cx="215" cy="135" r="7" fill="#f8fafc" />
              <line x1="210" y1="130" x2="225" y2="145" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <circle cx="225" cy="145" r="5" fill="#0284c7" />
            </g>

            {/* Arco de Trajetória do Pulley */}
            <path d="M 215 135 A 45 45 0 0 1 205 210" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" />
            <polygon points="202,210 209,208 206,217" fill="#10b981" />
          </g>
        )}

        {/* 2. CENA: TRÍCEPS TESTA COM BARRA W NO BANCO */}
        {isTricepsTesta && (
          <g className="cena-3d triceps-testa">
            {/* Banco Reto e Pés */}
            <rect x="70" y="185" width="260" height="18" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="100" y1="203" x2="100" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="280" y1="203" x2="280" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="80" y1="280" x2="120" y2="280" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="260" y1="280" x2="300" y2="280" stroke="#475569" strokeWidth="5" strokeLinecap="round" />

            {/* Atleta deitado */}
            <ellipse cx="115" cy="170" rx="14" ry="16" fill="url(#corpo3DGrad)" />
            <path d="M125 175 Q170 172 220 178 Q215 188 135 188 Z" fill="url(#corpo3DGrad)" stroke="#334155" strokeWidth="1" />
            <path d="M210 178 Q245 180 265 190 L250 205 L205 190 Z" fill="#64748b" />
            <path d="M260 190 L285 230 L285 275" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M285 275 L305 275" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />

            {/* Braço superior vertical */}
            <circle cx="140" cy="165" r="11" fill="url(#corpo3DGrad)" />

            {/* MÚSCULO FOCO: TRÍCEPS BRAQUIAL EM VERMELHO NEON */}
            <path d="M140 165 Q150 135 160 110" fill="none" stroke="url(#musculoNeonGrad)" strokeWidth="18" strokeLinecap="round" filter="url(#glowFoco)" />
            <path d="M136 162 Q148 135 158 112" fill="none" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

            {/* Antebraço & Barra W com Anilhas */}
            <g className="triceps-antebraco-movimento">
              <path d="M160 110 L125 115" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="11" strokeLinecap="round" />
              <line x1="120" y1="80" x2="130" y2="150" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />
              <circle cx="125" cy="115" r="14" fill="#0f172a" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="125" cy="115" r="5" fill="#f8fafc" />
            </g>

            <path d="M 125 115 A 35 35 0 0 1 160 75" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.9" />
            <polygon points="163,73 155,73 160,80" fill="#10b981" />
          </g>
        )}

        {/* 3. CENA: SUPINO RETO COM BARRA OLÍMPICA NO BANCO */}
        {(isSupino || isCrucifixo) && !isTricepsCorda && !isTricepsTesta && (
          <g className="cena-3d supino-peito">
            {/* Banco Reto e Suportes Verticais da Barra */}
            <rect x="70" y="190" width="260" height="18" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="90" y1="120" x2="90" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="100" y1="208" x2="100" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="280" y1="208" x2="280" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />

            {/* Atleta deitado */}
            <ellipse cx="115" cy="175" rx="14" ry="16" fill="url(#corpo3DGrad)" />

            {/* MÚSCULO FOCO: PEITORAL MAIOR EM VERMELHO NEON */}
            <path d="M135 165 Q180 155 215 170 Q180 185 135 180 Z" fill="url(#musculoNeonGrad)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glowFoco)" />
            <path d="M140 168 Q180 160 210 172" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.7" />

            {/* Tronco, Quadril e Pernas no chão */}
            <path d="M210 178 Q245 180 265 190 L250 205 L205 190 Z" fill="url(#corpo3DGrad)" />
            <path d="M260 190 L285 230 L285 275" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M285 275 L305 275" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />

            {/* Braços com Mãos na Barra */}
            <g className="peito-bracos-movimento">
              <path d="M150 170 L170 120 L170 80" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
              {/* Mão segurando a barra */}
              <circle cx="170" cy="78" r="8" fill="#f8fafc" />
              {/* Barra Olímpica e Anilhas Grandes */}
              <line x1="50" y1="75" x2="290" y2="75" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
              <rect x="55" y="45" width="14" height="60" rx="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="270" y="45" width="14" height="60" rx="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            </g>

            {/* Trajetória Vertical em Esmeralda */}
            <line x1="170" y1="135" x2="170" y2="80" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" />
            <polygon points="167,78 173,78 170,72" fill="#10b981" />
          </g>
        )}

        {/* 4. CENA: ELEVAÇÃO LATERAL COM HALTERES (OMBROS) */}
        {isElevLateral && !isSupino && !isTricepsCorda && !isTricepsTesta && (
          <g className="cena-3d elevacao-lateral-completa">
            {/* Solo */}
            <line x1="100" y1="280" x2="300" y2="280" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Cabeça e Tronco ereto em pé */}
            <ellipse cx="200" cy="70" rx="14" ry="16" fill="url(#corpo3DGrad)" />
            <path d="M180 85 L220 85 L215 180 L185 180 Z" fill="url(#corpo3DGrad)" />

            {/* Pernas e Pés firmes */}
            <path d="M190 180 L185 240 L180 280" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M210 180 L215 240 L220 280" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M170 280 L190 280" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
            <path d="M210 280 L230 280" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />

            {/* MÚSCULO FOCO: DELTÓIDES LATERAIS EM VERMELHO NEON */}
            <circle cx="170" cy="90" r="14" fill="url(#musculoNeonGrad)" filter="url(#glowFoco)" />
            <circle cx="230" cy="90" r="14" fill="url(#musculoNeonGrad)" filter="url(#glowFoco)" />
            <circle cx="170" cy="90" r="6" fill="#fef08a" opacity="0.7" />
            <circle cx="230" cy="90" r="6" fill="#fef08a" opacity="0.7" />

            {/* Braços com Mãos Segurando os Halteres */}
            <g className="ombro-bracos-movimento">
              <path d="M170 90 L125 105 L95 105" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" />
              <path d="M230 90 L275 105 L305 105" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" />
              {/* Mãos */}
              <circle cx="95" cy="105" r="7" fill="#f8fafc" />
              <circle cx="305" cy="105" r="7" fill="#f8fafc" />
              {/* Halteres nas mãos */}
              <rect x="80" y="93" width="12" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="98" y="93" width="12" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="86" y1="105" x2="104" y2="105" stroke="#f1f5f9" strokeWidth="4" />

              <rect x="290" y="93" width="12" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="308" y="93" width="12" height="24" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="296" y1="105" x2="314" y2="105" stroke="#f1f5f9" strokeWidth="4" />
            </g>

            {/* Arcos de Elevação Lateral */}
            <path d="M 120 160 A 60 60 0 0 1 95 105" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <path d="M 280 160 A 60 60 0 0 0 305 105" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
          </g>
        )}

        {/* 5. CENA: PUXADA FRENTE NO PULLEY (LAT PULLDOWN) */}
        {isPuxada && !isSupino && !isTricepsCorda && !isTricepsTesta && (
          <g className="cena-3d puxada-costas">
            {/* Torre de Pulley, Cabo e Barra Curva Larga */}
            <rect x="188" y="10" width="24" height="270" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="200" cy="30" r="16" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
            <line x1="200" y1="30" x2="200" y2="55" stroke="#cbd5e1" strokeWidth="3" />

            {/* Banco e Roletes de Travamento das Coxas */}
            <rect x="150" y="210" width="100" height="14" rx="3" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="200" y1="224" x2="200" y2="280" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <circle cx="160" cy="180" r="10" fill="#334155" stroke="#94a3b8" strokeWidth="2" />

            {/* Cabeça e Tronco de Costas */}
            <ellipse cx="200" cy="105" rx="14" ry="16" fill="url(#corpo3DGrad)" />

            {/* MÚSCULO FOCO: LATÍSSIMO DO DORSO EM VERMELHO NEON */}
            <path d="M175 120 Q200 110 225 120 L235 175 Q200 190 165 175 Z" fill="url(#musculoNeonGrad)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glowFoco)" />
            <path d="M185 125 Q200 115 215 125" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.8" />

            {/* Braços Puxando a Barra Larga */}
            <g className="costas-bracos-movimento">
              <path d="M180 125 L130 90 L110 55" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M220 125 L270 90 L290 55" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              {/* Mãos */}
              <circle cx="110" cy="55" r="7" fill="#f8fafc" />
              <circle cx="290" cy="55" r="7" fill="#f8fafc" />
              {/* Barra Larga Curvada */}
              <path d="M70 65 Q200 48 330 65" fill="none" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
            </g>

            <line x1="200" y1="55" x2="200" y2="100" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="197,102 203,102 200,108" fill="#10b981" />
          </g>
        )}

        {/* 6. CENA: AGACHAMENTO LIVRE COM BARRA NAS COSTAS */}
        {(isAgachamento || isLegPress || isExtensora) && !isPuxada && !isSupino && !isTricepsCorda && !isTricepsTesta && !isElevLateral && (
          <g className="cena-3d agachamento-completo">
            {/* Solo */}
            <line x1="80" y1="280" x2="320" y2="280" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Gaiola de Suporte ao fundo */}
            <line x1="110" y1="60" x2="110" y2="280" stroke="#334155" strokeWidth="4" />
            <line x1="290" y1="60" x2="290" y2="280" stroke="#334155" strokeWidth="4" />

            {/* Cabeça e Tronco ereto com Barra nas Costas */}
            <ellipse cx="200" cy="80" rx="14" ry="16" fill="url(#corpo3DGrad)" />
            <path d="M185 95 L215 95 L215 165 L185 165 Z" fill="url(#corpo3DGrad)" />

            {/* Barra Olímpica com Anilhas sobre os Ombros */}
            <line x1="120" y1="92" x2="280" y2="92" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
            <circle cx="130" cy="92" r="16" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
            <circle cx="270" cy="92" r="16" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Mãos segurando a barra */}
            <circle cx="165" cy="92" r="7" fill="#f8fafc" />
            <circle cx="235" cy="92" r="7" fill="#f8fafc" />

            {/* MÚSCULO FOCO: QUADRÍCEPS & GLÚTEO EM VERMELHO NEON */}
            <path d="M185 165 Q170 205 185 240 L195 240 Q180 205 195 165 Z" fill="url(#musculoNeonGrad)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glowFoco)" />
            <path d="M205 165 Q220 205 205 240 L215 240 Q230 205 215 165 Z" fill="url(#musculoNeonGrad)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glowFoco)" />

            {/* Pernas e Pés firmes */}
            <path d="M185 240 L185 280" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" />
            <path d="M215 240 L215 280" stroke="url(#corpo3DGrad)" strokeWidth="12" strokeLinecap="round" />
            <path d="M175 280 L195 280" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
            <path d="M205 280 L225 280" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />

            <line x1="200" y1="85" x2="200" y2="135" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="197,137 203,137 200,143" fill="#10b981" />
          </g>
        )}

        {/* 7. CENA: ROSCA BÍCEPS */}
        {isRoscaBiceps && !isAgachamento && !isPuxada && !isSupino && !isTricepsCorda && !isTricepsTesta && !isElevLateral && (
          <g className="cena-3d rosca-biceps">
            <line x1="100" y1="280" x2="300" y2="280" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="180" cy="80" rx="14" ry="16" fill="url(#corpo3DGrad)" />
            <path d="M165 95 L200 95 L195 180 L165 180 Z" fill="url(#corpo3DGrad)" />

            {/* Pernas */}
            <path d="M175 180 L170 280" stroke="url(#corpo3DGrad)" strokeWidth="13" strokeLinecap="round" />
            <path d="M190 180 L195 280" stroke="url(#corpo3DGrad)" strokeWidth="13" strokeLinecap="round" />

            {/* MÚSCULO FOCO: BÍCEPS BRAQUIAL EM VERMELHO NEON */}
            <path d="M165 105 Q152 135 165 160" fill="none" stroke="url(#musculoNeonGrad)" strokeWidth="18" strokeLinecap="round" filter="url(#glowFoco)" />
            <path d="M165 105 Q152 135 165 160" fill="none" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

            {/* Antebraço flexionando com Halter */}
            <g className="triceps-antebraco-movimento">
              <path d="M165 160 L140 115" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="11" strokeLinecap="round" />
              <circle cx="140" cy="115" r="7" fill="#f8fafc" />
              <rect x="126" y="105" width="10" height="20" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="144" y="105" width="10" height="20" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="131" y1="115" x2="149" y2="115" stroke="#f1f5f9" strokeWidth="4" />
            </g>

            <path d="M 165 180 A 35 35 0 0 1 140 115" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" />
            <polygon points="138,113 144,113 141,107" fill="#10b981" />
          </g>
        )}

        {/* 8. CENA: HIP THRUST / STIFF / GLÚTEOS */}
        {(isHipThrust || isDeadlift || isFlexora) && !isAgachamento && !isPuxada && !isSupino && !isTricepsCorda && !isTricepsTesta && !isElevLateral && (
          <g className="cena-3d gluteo-isquiotibiais">
            <rect x="80" y="190" width="70" height="40" rx="3" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M120 190 L180 190 L210 230 Z" fill="url(#corpo3DGrad)" />

            {/* MÚSCULO FOCO: GLÚTEO MÁXIMO & ISQUIOTIBIAIS EM VERMELHO NEON */}
            <circle cx="185" cy="205" r="18" fill="url(#musculoNeonGrad)" filter="url(#glowFoco)" />
            <path d="M185 205 L215 245" stroke="url(#musculoNeonGrad)" strokeWidth="14" strokeLinecap="round" filter="url(#glowFoco)" />

            <circle cx="185" cy="185" r="12" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="160" y1="185" x2="210" y2="185" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />

            <path d="M 185 220 L 185 175" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="182,173 188,173 185,167" fill="#10b981" />
          </g>
        )}

        {/* 9. CENA: ABDOMINAL / CORE */}
        {(isAbdominal || isPrancha) && !isAgachamento && !isLegPress && !isExtensora && !isFlexora && !isHipThrust && !isDeadlift && !isPanturrilha && !isSupino && !isTricepsCorda && !isTricepsTesta && !isElevLateral && (
          <g className="cena-3d abdomen-cena">
            <line x1="60" y1="240" x2="340" y2="240" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="120" cy="190" rx="14" ry="16" fill="url(#corpo3DGrad)" />

            {/* MÚSCULO FOCO: RETO ABDOMINAL EM VERMELHO NEON */}
            <path d="M140 190 Q180 180 220 200 L215 225 Q175 220 135 220 Z" fill="url(#musculoNeonGrad)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glowFoco)" />
            <path d="M150 195 Q180 188 210 205" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.8" />

            <path d="M220 200 L260 170 L280 240" fill="none" stroke="url(#corpo3DGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />

            <path d="M 120 190 A 40 40 0 0 1 155 160" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="158,158 150,158 155,165" fill="#10b981" />
          </g>
        )}
      </svg>
    </div>
  );
}
