import { createRoot } from "react-dom/client";
import SeletorMetricasHome from "@/components/seletor-metricas-home";
import CartaoCheckin from "@/components/cartao-checkin";
import type { Idioma } from "@/lib/dados/idioma";
import "@/app/globals.css";

const params = new URLSearchParams(location.search);
const idioma = (params.get("idioma") ?? "pt-BR") as Idioma;
document.documentElement.dataset.tema = params.get("tema") ?? "branco-ouro";
const vazio = params.has("vazio");
const todos = params.has("todos");
const grupos = vazio ? [] : todos ? ["PEITO", "BICEPS", "TRICEPS", "OMBRO", "COSTAS", "QUADRICEPS", "POSTERIOR_COXA", "PANTURRILHA", "GLUTEO", "ABDOMEN", "ANTEBRACO", "ADUTOR", "ABDUTOR", "TRAPEZIO", "LOMBAR"] : ["COSTAS", "BICEPS", "OMBRO"];
const seriesPorGrupo = grupos.map((grupo, i) => ({ grupo, series: todos ? 2 : [10, 5, 2][i] }));
const historico = vazio ? [] : [4800, 6500, 5700, 6800, 4300, 6100, 8100, 7000].slice(0, Number(params.get("sessoes") ?? 8)).map((volume, i) => ({ data: `2026-09-${16 + i}`, volume, series: [12, 18, 15, 20, 10, 18, 24, 17][i] }));
createRoot(document.getElementById("raiz")!).render(<SeletorMetricasHome
  idioma={idioma}
  checkin={<CartaoCheckin hoje="2026-10-02" usuarioId="bancada-sintetica" idioma={idioma} embutido checkinInicial={params.has("pendente") ? null : { dia: "2026-10-02", sono: 4, energia: 5, dorMuscular: 2, estresse: 1 }} />}
  volumeFormatado={{ valor: vazio ? "0" : "7,0", unidade: vazio ? "kg" : "t" }}
  seriesValendo={vazio ? 0 : seriesPorGrupo.reduce((total, g) => total + g.series, 0)} treinosNaSemana={vazio ? 0 : 1}
  historicoBarras={historico} seriesPorGrupo={seriesPorGrupo}
  volumePorGrupo={seriesPorGrupo.map(g => ({ grupo: g.grupo, volumeKg: params.has("semcarga") ? 0 : g.series * (g.grupo === "BICEPS" ? 100 : 200) }))}
/>);
