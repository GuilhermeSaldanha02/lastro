import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type SerieApresentavel = {
  tipo: "aquecimento" | "valendo";
  reps: number;
};

type TipoMarcador = "aquecimento" | "valendo" | "recorde";

export type MarcadorSerie = {
  curto: string;
  completo: string;
  tipo: TipoMarcador;
};

const SIGLAS = {
  "pt-BR": { aquecimento: "AQ", valendo: "VAL", recorde: "RP" },
  es: { aquecimento: "CAL", valendo: "VÁL", recorde: "RP" },
  en: { aquecimento: "WU", valendo: "WORK", recorde: "PR" },
} as const;

export function resumirSeriesValendo(series: SerieApresentavel[], idioma: Idioma): string {
  const repeticoes = series
    .filter((serie) => serie.tipo === "valendo")
    .map((serie) => serie.reps)
    .sort((a, b) => a - b);
  const quantidade = repeticoes.length;
  const rotuloSeries = t(quantidade === 1 ? "série valendo" : "séries valendo", idioma);

  if (quantidade === 0) return `0 ${rotuloSeries}`;

  const menor = repeticoes[0];
  const maior = repeticoes[repeticoes.length - 1];
  const faixa = menor === maior ? `${menor}` : `${menor}–${maior}`;
  // O plural segue o número de repetições, não o de séries (TR-14): "12
  // repetição" saía sempre que havia uma série só.
  const rotuloRepeticoes = t(maior === 1 ? "repetição" : "repetições", idioma);

  return `${quantidade} ${rotuloSeries} · ${faixa} ${rotuloRepeticoes}`;
}

export function marcadoresDaSerie(
  tipo: "aquecimento" | "valendo",
  recorde: boolean,
  idioma: Idioma,
): MarcadorSerie[] {
  const marcadores: MarcadorSerie[] = [
    {
      curto: SIGLAS[idioma][tipo],
      completo: t(tipo === "aquecimento" ? "Aquecimento" : "Valendo", idioma),
      tipo,
    },
  ];

  if (recorde) {
    marcadores.push({
      curto: SIGLAS[idioma].recorde,
      completo: t("recorde pessoal", idioma),
      tipo: "recorde",
    });
  }

  return marcadores;
}

export function formatarDescansoReal(segundos: number | null): string {
  if (segundos === null) return "—";

  const total = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(total / 3_600);
  const minutos = Math.floor((total % 3_600) / 60);
  const segundosRestantes = total % 60;

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
  }

  return `${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
}
