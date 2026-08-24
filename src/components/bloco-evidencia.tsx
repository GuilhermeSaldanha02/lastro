// lastro · DESIGN.md §3.6.3 — o bloco de evidência, peça 09. Três linhas
// (exercício, número, procedência) + coluna de sinal à esquerda + delta à
// direita. Cor NUNCA é o único canal (§3.2 nota C): o sinal tem ícone,
// palavra ("Alta"/"Platô"/"Queda") e o texto do delta — três canais, um
// deles a cor.
import type { BlocoEvidencia as TipoBloco } from "@/app/api/analise/evidencia";
import { formatarDelta, formatarPeso } from "@/lib/texto/formatar-delta";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

const ICONE: Record<TipoBloco["sinal"], string> = {
  alta: "↑",
  plato: "—",
  queda: "↓",
};

const ROTULO: Record<TipoBloco["sinal"], string> = {
  alta: "Alta",
  plato: "Platô",
  queda: "Queda",
};

export default function BlocoEvidencia({
  bloco,
  janelaSemanas,
  idioma,
}: {
  bloco: TipoBloco;
  janelaSemanas: number;
  idioma: Idioma;
}) {
  return (
    <div className={`evidencia evidencia--${bloco.sinal}`}>
      <div className="evidencia__sinal">
        <span className="evidencia__icone" aria-hidden="true">
          {ICONE[bloco.sinal]}
        </span>
        <span className="evidencia__rotulo">{t(ROTULO[bloco.sinal], idioma)}</span>
      </div>
      <div className="evidencia__corpo">
        <p className="evidencia__exercicio">{bloco.exercicio}</p>
        <p className="evidencia__numero">
          {formatarPeso(bloco.peso_referencia, idioma)}
          <span className="evidencia__un">kg</span>
          {" × "}
          {bloco.reps_referencia}
        </p>
        <p className="evidencia__procedencia">
          {janelaSemanas} {t("semanas", idioma)} · {bloco.series_valendo} {t("séries valendo", idioma)} ·{" "}
          {t("calculado no dispositivo", idioma)}
        </p>
      </div>
      <p className="evidencia__delta">{formatarDelta(bloco, janelaSemanas, idioma)}</p>
    </div>
  );
}
