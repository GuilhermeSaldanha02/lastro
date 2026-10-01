/**
 * lastro · a frase de "Lastro percebeu" (AN-08 B2 e B1). Pura: recebe a
 * comparação já calculada e devolve o texto em três partes, para a tela
 * destacar o número. Nada de causa, risco ou lesão: só "acima" ou "abaixo
 * do seu padrão", com o volume e o percentual.
 */
import type { Idioma } from "@/lib/dados/idioma";
import { formatarDataCurta } from "@/lib/tempo";
import { formatarPeso } from "@/lib/texto/formatar-delta";
import type { ComparacaoPadrao, FamiliaSessao } from "./fora-do-padrao";

const FAMILIA: Record<Idioma, Record<FamiliaSessao, string>> = {
  "pt-BR": { empurrar: "empurrar", puxar: "puxar", pernas: "pernas" },
  en: { empurrar: "push", puxar: "pull", pernas: "legs" },
  es: { empurrar: "empuje", puxar: "tirón", pernas: "piernas" },
};

/** Volume em toneladas com uma casa (14,6 t), no separador do idioma. */
export function formatarToneladas(kg: number, idioma: Idioma): string {
  return `${formatarPeso(Math.round(kg / 100) / 10, idioma)} t`;
}

export type FrasePercebida = { antes: string; numero: string; depois: string };

export function frasePercebida(c: ComparacaoPadrao, idioma: Idioma): FrasePercebida {
  const familia = FAMILIA[idioma][c.familia];
  const data = formatarDataCurta(c.data, idioma);
  const pct = Math.round(Math.abs(c.desvio) * 100);
  const numero = formatarToneladas(c.volume, idioma);
  const acima = c.direcao === "acima";

  if (idioma === "en") {
    return acima
      ? { antes: `Your ${familia} workout on ${data} moved `, numero, depois: `, ${pct}% above your usual.` }
      : { antes: `Your ${familia} workout on ${data} came in at `, numero, depois: `, ${pct}% below your usual.` };
  }
  if (idioma === "es") {
    return acima
      ? { antes: `En el entrenamiento de ${familia} del ${data} moviste `, numero, depois: `, ${pct}% por encima de tu patrón.` }
      : { antes: `El entrenamiento de ${familia} del ${data} quedó en `, numero, depois: `, ${pct}% por debajo de tu patrón.` };
  }
  return acima
    ? { antes: `No treino de ${familia} de ${data} você moveu `, numero, depois: `, ${pct}% acima do seu padrão.` }
    : { antes: `O treino de ${familia} de ${data} ficou em `, numero, depois: `, ${pct}% abaixo do seu padrão.` };
}
