"use client";

import { useState } from "react";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { TOKENS_HISTORICO as desenho } from "@/lib/metricas/tokens-historico";

export type SessaoGrafico = { data: string; volume: number; series: number };

/** Cada ponto/coluna representa uma sessão real, inclusive duas no mesmo dia. */
export default function GraficoSessoesHome({ sessoes, metrica, idioma }: { sessoes: SessaoGrafico[]; metrica: "volume" | "series"; idioma: Idioma }) {
  const [escolhida, setEscolhida] = useState<number | null>(null);
  if (!sessoes.length) return <p className="metrica-switcher__vazio">{t("Os treinos que você registrar aparecem aqui como histórico.", idioma)}</p>;
  const indice = Math.min(escolhida ?? sessoes.length - 1, sessoes.length - 1);
  const valores = sessoes.map(s => Math.max(0, s[metrica]));
  const maximo = Math.max(...valores, 1);
  const pontos = valores.map((valor, i) => ({ x: (i + 0.5) * desenho.largura / sessoes.length, y: desenho.base - valor / maximo * desenho.amplitude }));
  const selecionada = sessoes[indice];
  const formatar = (valor: number) => `${valor.toLocaleString(idioma, { maximumFractionDigits: 1 })} ${metrica === "volume" ? "kg" : t(valor === 1 ? "série" : "séries", idioma)}`;
  const data = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString(idioma, { day: "2-digit", month: "short", timeZone: "UTC" });
  return <div className="historico-metrica">
    <p className="historico-metrica__titulo">{t("Últimos treinos", idioma)}</p>
    <svg className="historico-metrica__grafico" viewBox={`0 0 ${desenho.largura} ${desenho.altura}`} aria-hidden="true" focusable="false">
      {desenho.grade.alturas.map(y => <line key={y} className="historico-metrica__grade" x1={desenho.grade.inicio} x2={desenho.grade.fim} y1={y} y2={y} />)}
      {metrica === "volume" ? <>
        <polyline className="historico-metrica__linha" points={pontos.map(p => `${p.x},${p.y}`).join(" ")} />
        {pontos.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === indice ? desenho.ponto.ativo : desenho.ponto.normal} className={i === indice ? "historico-metrica__ponto historico-metrica__ponto--ativo" : "historico-metrica__ponto"} />)}
      </> : pontos.map((p, i) => <rect key={i} x={p.x - desenho.coluna.largura / 2} y={p.y} width={desenho.coluna.largura} height={desenho.base - p.y} rx={desenho.coluna.raio} className={i === indice ? "historico-metrica__coluna historico-metrica__coluna--ativa" : "historico-metrica__coluna"} />)}
    </svg>
    <div className="historico-metrica__datas" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${sessoes.length}, 1fr)` }}>{sessoes.map((s, i) => <span key={i}>{s.data.slice(8, 10)}</span>)}</div>
    <div className="historico-metrica__selecao">
      <button type="button" disabled={indice === 0} onClick={() => setEscolhida(indice - 1)} aria-label={t("Treino anterior", idioma)}>‹</button>
      <div aria-live="polite" aria-atomic="true"><strong>{formatar(selecionada[metrica])}</strong><span>{data(selecionada.data)} · {indice + 1}/{sessoes.length}</span></div>
      <button type="button" disabled={indice === sessoes.length - 1} onClick={() => setEscolhida(indice + 1)} aria-label={t("Próximo treino", idioma)}>›</button>
    </div>
    <p className="historico-metrica__nota">{t("Cada marca é um treino. Aquecimentos não entram.", idioma)}</p>
  </div>;
}
