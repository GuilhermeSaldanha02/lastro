"use client";

import { useId, useState } from "react";
import type { Idioma } from "@/lib/dados/idioma";
import { distribuirGrupos, type GrupoComValor } from "@/lib/metricas/distribuicao-grupos";
import { chamadaGrupo, TOKENS_MAPA_GRUPOS as desenho, type VistaAnatomia } from "@/lib/metricas/tokens-mapa-grupos";
import { GEOMETRIA_ANATOMIA } from "@/lib/stickers/anatomia";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import { t } from "@/lib/texto/i18n";

export default function MapaGruposHome({ grupos, metrica, idioma }: {
  grupos: readonly GrupoComValor[];
  metrica: "series" | "volume";
  idioma: Idioma;
}) {
  const distribuicao = distribuirGrupos(grupos);
  const [vistaEscolhida, setVista] = useState<VistaAnatomia | null>(null);
  const vista = vistaEscolhida ?? (distribuicao.some(({ grupo }) => chamadaGrupo(grupo, "frente")) ? "frente" : "costas");
  const outraVista = vista === "frente" ? "costas" : "frente";
  const marcadorId = useId().replace(/:/g, "");
  const ativos = new Set(distribuicao.map(({ grupo }) => grupo));
  const visiveis = distribuicao.flatMap((item) => {
    const chamada = chamadaGrupo(item.grupo, vista);
    return chamada ? [{ ...item, chamada }] : [];
  });
  const fora = distribuicao.filter(({ grupo }) => !chamadaGrupo(grupo, vista) && chamadaGrupo(grupo, outraVista));
  const percentual = (valor: number) => `${valor.toLocaleString(idioma, { maximumFractionDigits: 1 })}%`;
  const legenda = t(metrica === "series" ? "Participação nas séries da semana" : "Participação no volume da semana", idioma);

  if (distribuicao.length === 0) return <p className="mapa-grupos__legenda">{t("Sem dados para esta métrica", idioma)}</p>;

  return (
    <div className="mapa-grupos">
      <p className="mapa-grupos__legenda">{legenda}</p>
      <div className="mapa-grupos__vistas" role="group" aria-label={t("Vista do corpo", idioma)}>
        {(["frente", "costas"] as const).map((opcao) => (
          <button type="button" key={opcao} aria-pressed={vista === opcao} onClick={() => setVista(opcao)}>
            {t(opcao === "frente" ? "Frente" : "Costas", idioma)}
          </button>
        ))}
      </div>
      <div className="mapa-grupos__canvas">
        <svg className="mapa-grupos__svg" viewBox={`0 0 ${desenho.largura} ${desenho.altura}`} aria-hidden="true" focusable="false">
          <defs>
            <marker id={marcadorId} markerWidth={desenho.marcador.tamanho} markerHeight={desenho.marcador.tamanho} refX={desenho.marcador.referencia} refY={desenho.marcador.tamanho / 2} orient="auto">
              <path className="mapa-grupos__seta" d={desenho.marcador.caminho} />
            </marker>
          </defs>
          <g transform={`translate(${desenho.deslocamentoCorpo} ${desenho.topoCorpo})`}>
            <path className="mapa-grupos__silhueta" d={GEOMETRIA_ANATOMIA.silhueta} />
            {GEOMETRIA_ANATOMIA[vista].map(({ grupo, d }) => (
              <path key={grupo} data-grupo={grupo} className={`mapa-grupos__musculo${ativos.has(grupo) ? " mapa-grupos__musculo--ativo" : ""}`} d={d} />
            ))}
          </g>
          {visiveis.map(({ grupo, chamada }) => (
            <path key={grupo} className="mapa-grupos__linha" markerEnd={`url(#${marcadorId})`} d={`M${chamada.x + desenho.deslocamentoCorpo} ${chamada.y + desenho.topoCorpo} L${chamada.lado === "esquerda" ? desenho.fimEsquerda : desenho.fimDireita} ${chamada.rotuloY}`} />
          ))}
        </svg>
        {visiveis.map(({ grupo, percentual: participacao, chamada }) => (
          <div className={`mapa-grupos__rotulo mapa-grupos__rotulo--${chamada.lado}`} key={grupo} style={{ top: `${chamada.rotuloY / desenho.altura * 100}%` }}>
            <span className="mapa-grupos__nome">{formatarGrupoMuscular(grupo, idioma)}</span>
            <strong className="mapa-grupos__percentual">{percentual(participacao)}</strong>
          </div>
        ))}
      </div>
      {fora.length > 0 && (
        <div className="mapa-grupos__fora">
          <span>{t("Na outra vista", idioma)}</span>
          {fora.map(({ grupo, percentual: participacao }) => (
            <button type="button" key={grupo} onClick={() => setVista(outraVista)}>
              {formatarGrupoMuscular(grupo, idioma)} · {percentual(participacao)}
            </button>
          ))}
        </div>
      )}
      <details className="mapa-grupos__detalhes" open={distribuicao.some(({ grupo }) => !chamadaGrupo(grupo, "frente") && !chamadaGrupo(grupo, "costas"))}>
        <summary>{t("Todos os grupos e valores", idioma)}</summary>
        <ul className="mapa-grupos__lista" aria-label={legenda}>
          {distribuicao.map(({ grupo, valor, percentual: participacao }) => (
            <li key={grupo}>
              <span>{formatarGrupoMuscular(grupo, idioma)}</span>
              <span>{valor.toLocaleString(idioma, { maximumFractionDigits: 1 })} {metrica === "series" ? t("séries", idioma) : "kg"}</span>
              <strong>{percentual(participacao)}</strong>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
