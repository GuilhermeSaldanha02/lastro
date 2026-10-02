"use client";

import { useId, useState, type ReactNode, type KeyboardEvent } from "react";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { distribuirGrupos } from "@/lib/metricas/distribuicao-grupos";
import GraficoSessoesHome, { type SessaoGrafico } from "./grafico-sessoes-home";
import MapaGruposHome from "./mapa-grupos-home";

type Props = {
  checkin: ReactNode;
  volumeFormatado: { valor: string; unidade: string };
  seriesValendo: number;
  treinosNaSemana: number;
  historicoBarras: SessaoGrafico[];
  seriesPorGrupo: { grupo: string; series: number }[];
  volumePorGrupo: { grupo: string; volumeKg: number }[];
  idioma: Idioma;
};
const ABAS = ["checkin", "volume", "series", "grupos"] as const;
type Aba = typeof ABAS[number];
const ROTULOS = { checkin: "Check-in", volume: "Volume", series: "Séries", grupos: "Grupos" };

export default function SeletorMetricasHome({ checkin, volumeFormatado, seriesValendo, treinosNaSemana, historicoBarras, seriesPorGrupo, volumePorGrupo, idioma }: Props) {
  const [aba, setAba] = useState<Aba>("checkin");
  const [metrica, setMetrica] = useState<"series" | "volume">("series");
  const id = useId();
  const grupos = metrica === "series" ? seriesPorGrupo.map(g => ({ grupo: g.grupo, valor: g.series })) : volumePorGrupo.map(g => ({ grupo: g.grupo, valor: g.volumeKg }));
  const quantidadeGrupos = distribuirGrupos(seriesPorGrupo.map(g => ({ grupo: g.grupo, valor: g.series }))).length;
  function navegar(evento: KeyboardEvent<HTMLButtonElement>, atual: Aba) {
    const indice = ABAS.indexOf(atual);
    const destino = evento.key === "ArrowRight" ? (indice + 1) % ABAS.length : evento.key === "ArrowLeft" ? (indice + ABAS.length - 1) % ABAS.length : evento.key === "Home" ? 0 : evento.key === "End" ? ABAS.length - 1 : -1;
    if (destino < 0) return;
    evento.preventDefault();
    setAba(ABAS[destino]);
    document.getElementById(`${id}-aba-${ABAS[destino]}`)?.focus();
  }
  return (
    <section className="metrica-switcher-card" aria-label={t("Resumo de hoje e da semana", idioma)}>
      <div className="metrica-switcher__tabs" role="tablist" aria-label={t("Resumo de hoje e da semana", idioma)}>
        {ABAS.map(opcao => <button key={opcao} id={`${id}-aba-${opcao}`} type="button" role="tab" aria-selected={aba === opcao} aria-controls={`${id}-painel-${opcao}`} tabIndex={aba === opcao ? 0 : -1} className={`metrica-tab${aba === opcao ? " metrica-tab--ativa" : ""}`} onClick={() => setAba(opcao)} onKeyDown={e => navegar(e, opcao)}>{t(ROTULOS[opcao], idioma)}</button>)}
      </div>
      {/* Mantém o check-in montado: trocar abas não reinicia sua rotina diária/offline. */}
      <div role="tabpanel" id={`${id}-painel-checkin`} aria-labelledby={`${id}-aba-checkin`} hidden={aba !== "checkin"}>{checkin}</div>
      {ABAS.filter(opcao => opcao !== "checkin").map(opcao => (
        <div key={opcao} role="tabpanel" id={`${id}-painel-${opcao}`} aria-labelledby={`${id}-aba-${opcao}`} hidden={aba !== opcao} tabIndex={0}>
          <div className="metrica-switcher__bloco">
            <div className="metrica-switcher__topo">
              <div>
                <div className="metrica-switcher__grande">
                  {opcao === "volume" ? volumeFormatado.valor : opcao === "series" ? seriesValendo : quantidadeGrupos}
                  <span className="metrica-switcher__unidade">{opcao === "volume" ? volumeFormatado.unidade : opcao === "series" ? t("séries", idioma) : t(quantidadeGrupos === 1 ? "grupo" : "grupos", idioma)}</span>
                </div>
                {opcao !== "grupos" && <p className="metrica-switcher__subtitulo">{t(opcao === "volume" ? "Volume acumulado na semana" : "Séries valendo nesta semana", idioma)}</p>}
              </div>
              {opcao !== "grupos" && <span className="metrica-switcher__delta">{treinosNaSemana > 0 ? `${treinosNaSemana} ${t(treinosNaSemana === 1 ? "sessão" : "sessões", idioma)}` : t("Sem treinos", idioma)}</span>}
              {opcao === "grupos" &&
              <div className="metrica-switcher__subtabs" role="group" aria-label={t("Métrica dos grupos", idioma)}>
                {(["series", "volume"] as const).map(m => <button type="button" key={m} aria-pressed={metrica === m} className={`metrica-subtab${metrica === m ? " metrica-subtab--ativa" : ""}`} onClick={() => setMetrica(m)}>{t(m === "series" ? "Séries" : "Volume", idioma)}</button>)}
              </div>}
            </div>
            {opcao === "grupos" ? <>
              <p className="metrica-switcher__subtitulo">{t(metrica === "series" ? "Participação nas séries da semana" : "Participação no volume da semana", idioma)}</p>
              <MapaGruposHome grupos={grupos} metrica={metrica} idioma={idioma} />
            </> : <GraficoSessoesHome sessoes={historicoBarras} metrica={opcao} idioma={idioma} />}
          </div>
        </div>
      ))}
    </section>
  );
}
