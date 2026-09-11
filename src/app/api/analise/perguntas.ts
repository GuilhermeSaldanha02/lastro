/**
 * lastro · SDD.md §6.1 — as 5 perguntas padrão da Análise Semanal (PRD §3).
 * Texto fixo, sem lógica — a pergunta escolhida indexa este array.
 *
 * Módulo de idiomas (2026-08-24, etapa 3/4): o texto da pergunta entra
 * LITERALMENTE no prompt da Gemini (`prompt.ts`) — não é só rótulo de
 * botão. Por isso vive traduzido aqui, junto com as outras 4, em vez de
 * ficar em algum dicionário de strings de UI (etapa 4/4): quem monta o
 * prompt e quem desenha o botão leem da mesma fonte, nunca divergem.
 */
import type { Idioma } from "@/lib/dados/idioma";

export type NumeroPergunta = 1 | 2 | 3 | 4 | 5;

const PERGUNTAS_POR_IDIOMA: Record<Idioma, Record<NumeroPergunta, string>> = {
  "pt-BR": {
    1: "Estou progredindo?",
    2: "Onde eu empaquei?",
    3: "Meu volume está equilibrado?",
    4: "Estou treinando demais ou de menos?",
    5: "O que mudar na próxima semana?",
  },
  en: {
    1: "Am I progressing?",
    2: "Where have I plateaued?",
    3: "Is my volume balanced?",
    4: "Am I training too much or too little?",
    5: "What should I change next week?",
  },
  es: {
    1: "¿Estoy progresando?",
    2: "¿Dónde me estanqué?",
    3: "¿Mi volumen está equilibrado?",
    4: "¿Estoy entrenando de más o de menos?",
    5: "¿Qué debo cambiar la próxima semana?",
  },
};

export function perguntasDoIdioma(idioma: Idioma): Record<NumeroPergunta, string> {
  return PERGUNTAS_POR_IDIOMA[idioma];
}

/** A única pergunta que produz ação — decidido pelo dono em 2026-08-13
 *  (backlog B1/B2). É a que vira o card primário e em destaque em
 *  /analise (2026-09-02: botão dedicado "Solicitar Análise" removido —
 *  duplicava a mesma ação do card primário). */
export const PERGUNTA_PRIMARIA: NumeroPergunta = 5;

/**
 * A pergunta que PRESCREVE — a que sai do produto sob vínculo com personal
 * (PRD §11.2, restrição §11.4.1).
 *
 * Hoje é o mesmo 5 de `PERGUNTA_PRIMARIA`, e é DE PROPÓSITO que sejam duas
 * constantes: os papéis não são o mesmo. `PERGUNTA_PRIMARIA` é de LAYOUT —
 * qual card fica em destaque. Esta é de ESCOPO — qual pergunta pertence ao
 * humano contratado. Se um dia o destaque mudar de pergunta, só um dos dois
 * números muda, e unificá-los agora esconderia isso.
 */
export const PERGUNTA_PRESCRICAO: NumeroPergunta = 5;

export function perguntaValida(valor: unknown): valor is NumeroPergunta {
  return valor === 1 || valor === 2 || valor === 3 || valor === 4 || valor === 5;
}
