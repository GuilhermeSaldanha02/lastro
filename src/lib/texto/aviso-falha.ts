/**
 * lastro · a frase que explica POR QUE o parecer saiu sem prosa da IA.
 *
 * Antes da migration 0019 existia uma frase só, genérica, porque o banco
 * guardava um booleano. Quatro causas muito diferentes viravam o mesmo
 * texto — e a frase original chegava a MENTIR: dizia "duas tentativas
 * rejeitadas" mesmo quando a API não tinha respondido (nenhuma tentativa
 * foi rejeitada; não houve resposta para rejeitar).
 *
 * Cada frase aqui é verdadeira só para a sua causa, e diz o que o dono
 * pode fazer a respeito — que é diferente em cada caso: esperar minutos
 * (indisponibilidade), esperar a cota renovar, ou nada (rejeição do
 * validador, que é o sistema funcionando).
 *
 * `null` cobre os pareceres anteriores à coluna: não dá pra inventar
 * retroativamente a causa, então a frase genérica continua ali para eles.
 */
import type { FalhaMotivo } from "@/lib/dados/parecer";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

/** Comum a todas: o que o dono está lendo no lugar da prosa. */
const RABICHO =
  "O texto abaixo é um resumo determinístico dos seus dados, sem prosa gerada — não é o parecer normal.";

const CAUSA: Record<FalhaMotivo, string> = {
  api_indisponivel:
    "A IA não respondeu desta vez — o serviço estava indisponível. Tentar de novo em alguns minutos costuma resolver.",
  cota_excedida:
    "O limite de uso da IA foi atingido por enquanto. Ela volta a funcionar quando a cota renovar.",
  modelo_ausente:
    "A IA não pôde ser consultada: o modelo não estava disponível. Isso é falha nossa, não sua.",
  api_erro: "A IA não respondeu desta vez, por um erro que não soubemos identificar.",
  // Esta é a única em que o sistema funcionou como devia — e por isso a
  // frase não pede paciência, explica a proteção.
  validador_rejeitou:
    "A interpretação gerada citou números que não batem com os seus dados, então foi descartada.",
};

const GENERICA = "Não foi possível gerar a interpretação por IA desta vez.";

export function textoAvisoFalha(
  motivo: FalhaMotivo | null | undefined,
  idioma: Idioma,
): string {
  const causa = motivo ? CAUSA[motivo] : GENERICA;
  return `${t(causa, idioma)} ${t(RABICHO, idioma)}`;
}
