"use client";

import { useMemo } from "react";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

type RastreadorDisciplinaProps = {
  hojeISO: string;
  diasComTreino: string[]; // ISO format "YYYY-MM-DD"
  streakDias?: number;
  idioma: Idioma;
};

const NOMES_DIAS_POR_IDIOMA: Record<Idioma, string[]> = {
  "pt-BR": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

export default function RastreadorDisciplina({
  hojeISO,
  diasComTreino,
  streakDias,
  idioma,
}: RastreadorDisciplinaProps) {
  const diasDaSemana = useMemo(() => {
    const hoje = new Date(`${hojeISO}T00:00:00Z`);
    // Encontra a segunda-feira da semana ISO
    const diaSemana = hoje.getUTCDay(); // 0 = Dom, 1 = Seg, ...
    const offsetParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

    const segunda = new Date(hoje);
    segunda.setUTCDate(hoje.getUTCDate() + offsetParaSegunda);

    return NOMES_DIAS_POR_IDIOMA[idioma].map((nome, index) => {
      const dataDia = new Date(segunda);
      dataDia.setUTCDate(segunda.getUTCDate() + index);
      const iso = dataDia.toISOString().slice(0, 10);
      const diaNum = dataDia.getUTCDate();
      const temTreino = diasComTreino.includes(iso);
      const ehHoje = iso === hojeISO;

      return {
        nome,
        diaNum,
        iso,
        temTreino,
        ehHoje,
      };
    });
  }, [hojeISO, diasComTreino, idioma]);

  const totalTreinos = diasComTreino.length;
  const streak = streakDias ?? (totalTreinos > 0 ? totalTreinos : 0);

  return (
    <section className="disciplina-card" aria-label={t("Rastreador de disciplina semanal", idioma)}>
      <div className="disciplina-card__header">
        <span className="disciplina-card__titulo">{t("Disciplina Semanal", idioma)}</span>
        {streak > 0 && (
          // "dias seguidos", não "sessões seguidas": o que se conta é dia
          // de calendário consecutivo (`analise/sequencia.ts`). O rótulo
          // antigo prometia continuidade sobre uma contagem que não era
          // sequência — e o texto longo ainda quebrava em duas linhas a
          // 360px, empurrando o título do cartão junto.
          <span className="disciplina-card__streak">
            {streak} {t(streak === 1 ? "dia seguido" : "dias seguidos", idioma)}
          </span>
        )}
      </div>

      <div className="disciplina-grid">
        {diasDaSemana.map((d) => (
          <div
            key={d.iso}
            className={`disciplina-dia${d.temTreino ? " disciplina-dia--feito" : ""}${
              d.ehHoje ? " disciplina-dia--hoje" : ""
            }`}
          >
            <span className="disciplina-dia__nome">{d.nome}</span>
            <div className="disciplina-dia__circulo" title={`${d.nome}, ${d.diaNum}`}>
              {d.temTreino ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <span>{d.diaNum}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
