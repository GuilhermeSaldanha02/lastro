import type { GrupoComRecencia } from "@/lib/analise/recencia";
import type { Idioma } from "@/lib/dados/idioma";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import { t } from "@/lib/texto/i18n";

/** Não afoga a tela com todo grupo já treinado — só os mais parados importam aqui. */
const MAX_GRUPOS_MOSTRADOS = 5;

export default function GruposSemEstimulo({
  grupos,
  idioma,
}: {
  grupos: GrupoComRecencia[];
  idioma: Idioma;
}) {
  // Sem histórico ainda: nada de "0 dias" para todo grupo, isso seria
  // inventar um número (Regra da Presença) — o card simplesmente não existe.
  if (grupos.length === 0) return null;

  const maisParados = grupos.slice(0, MAX_GRUPOS_MOSTRADOS);

  return (
    <section className="recencia-card" aria-label={t("Grupos sem estímulo recente", idioma)}>
      <h2 className="recencia-card__titulo">{t("Grupos sem estímulo recente", idioma)}</h2>
      <p className="recencia-card__subtitulo">
        {t("Dias desde a última série valendo de cada grupo.", idioma)}
      </p>
      <ul className="recencia-lista">
        {maisParados.map((g) => (
          <li className="recencia-item" key={g.grupo}>
            <span className="recencia-item__nome">{formatarGrupoMuscular(g.grupo, idioma)}</span>
            <span className="recencia-item__dias">
              {g.diasSemEstimulo === 0
                ? t("Hoje", idioma)
                : `${g.diasSemEstimulo} ${t(g.diasSemEstimulo === 1 ? "dia" : "dias", idioma)}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
