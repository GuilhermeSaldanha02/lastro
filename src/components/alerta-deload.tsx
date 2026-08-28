import type { SinalDeload } from "@/lib/analise/alerta-deload";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

function formatarPct(fracao: number, idioma: Idioma): string {
  return `${Math.round(fracao * 100).toLocaleString(idioma)}%`;
}

/**
 * Alerta PASSIVO — nunca decide nada, nunca reescreve o modelo de treino
 * sozinho (ADR-010: write-back só pelo caminho do `+`, deliberado). O
 * dono decide se aplica ou ignora.
 */
export default function AlertaDeload({
  sinal,
  idioma,
}: {
  sinal: SinalDeload | null;
  idioma: Idioma;
}) {
  if (!sinal) return null;

  return (
    <section className="alerta-deload" role="status">
      <p className="alerta-deload__texto">
        {t("Suas séries valendo estão mais difíceis do que o normal:", idioma)}{" "}
        <strong>{formatarPct(sinal.proporcaoDificeisSemanaAtual, idioma)}</strong>{" "}
        {t("delas foram próximas da falha esta semana, contra", idioma)}{" "}
        <strong>{formatarPct(sinal.proporcaoDificeisJanelaAnterior, idioma)}</strong>{" "}
        {t("nas semanas anteriores. Pode ser hora de uma semana mais leve.", idioma)}
      </p>
    </section>
  );
}
