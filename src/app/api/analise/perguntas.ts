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

/**
 * A pergunta que assume o DESTAQUE quando a prescrição sai do produto
 * (direção "Troca de posto", escolhida pelo dono no gate visual da §11.4.2,
 * 2026-09-11).
 *
 * 2 = "Onde eu empaquei?". Não é a sobra da lista: das quatro que o aluno
 * vinculado mantém, é a única que aponta um alvo específico em vez de
 * descrever um estado geral — o que mais se aproxima de ação sem atravessar
 * a linha da prescrição. E é exatamente o sinal que o personal também
 * recebe na fila (`estagnacao_exercicio`), então aluno e personal olham o
 * mesmo problema pelos dois lados.
 *
 * O lugar do destaque não pode ficar vazio (§11.4.2: "ausência não é
 * resposta"), e um card sem ação no lugar mais nobre da peça-assinatura lê
 * como app quebrado. Por isso o destaque recebe outra pergunta em vez de
 * receber um aviso.
 */
export const PERGUNTA_PRIMARIA_VINCULADO: NumeroPergunta = 2;

export type PerguntasDaTela = {
  /** A que vira o card em destaque. */
  primaria: NumeroPergunta;
  /** As demais, na ordem da lista. NUNCA inclui a primária. */
  secundarias: NumeroPergunta[];
};

/**
 * Quais perguntas a tela mostra, e qual delas fica em destaque.
 *
 * Fica aqui, e não no componente, por dois motivos: é testável sem DOM, e
 * era uma derivação por exclusão dentro do JSX (`filter(n => n !==
 * PERGUNTA_PRIMARIA)`) — o tipo de código que silenciosamente passa a
 * mostrar a pergunta errada quando um segundo caso aparece.
 *
 * Sob vínculo a prescrição não vira card desabilitado nem card nenhum: ela
 * SAI da lista. Quem informa para onde ela foi é o rodapé da lista, não um
 * alvo de toque que não responde.
 */
export function perguntasDaTela(temPersonal: boolean): PerguntasDaTela {
  const todas: NumeroPergunta[] = [1, 2, 3, 4, 5];
  const primaria = temPersonal ? PERGUNTA_PRIMARIA_VINCULADO : PERGUNTA_PRIMARIA;
  const secundarias = todas.filter(
    (numero) =>
      numero !== primaria && !(temPersonal && numero === PERGUNTA_PRESCRICAO),
  );
  return { primaria, secundarias };
}

export function perguntaValida(valor: unknown): valor is NumeroPergunta {
  return valor === 1 || valor === 2 || valor === 3 || valor === 4 || valor === 5;
}
