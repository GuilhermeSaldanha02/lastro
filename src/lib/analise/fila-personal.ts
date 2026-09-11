/**
 * A fila de trabalho do personal — PRD §11.4, restrições 4, 5, 6 e 7.
 *
 * MATEMÁTICA PURA. Nenhum import de rede, HTTP ou Supabase (invariante do
 * `CLAUDE.md`). Entra resumo já calculado, sai a lista de alertas que o
 * personal vai ver. Quem lê do banco e quem desenha a tela ficam fora
 * daqui, de propósito: este arquivo é o único lugar onde "seletividade é
 * o produto" (§11.4.6) existe como regra executável, e regra que não é
 * executável volta a ser violada.
 *
 * TRÊS COISAS QUE ESTE MÓDULO NÃO FAZ, e cada uma é uma restrição:
 *
 * 1. Não cria julgamento novo (§11.4.4). Todo sinal aqui é RE-ROTEAMENTO
 *    de um número que o agregador determinístico já calculou e testou.
 *    Nenhuma chamada de LLM, nenhuma heurística nova sobre série crua.
 * 2. Não devolve "tudo que é verdade" (§11.4.6). Devolve no máximo
 *    `TETO_ALERTAS_ALUNO_SEMANA`, priorizado — e cala o que já foi dito
 *    nas últimas `SEMANAS_SUPRESSAO_ALERTA` semanas.
 * 3. Não inventa tendência a partir de uma sessão. Os três tipos são
 *    tendência POR CONSTRUÇÃO; ver o comentário de cada detector.
 */
import {
  DIAS_SEM_ESTIMULO_PARA_ALERTA,
  QUEDAS_VOLUME_PARA_ALERTA,
  SEMANAS_ESTAGNACAO,
  SEMANAS_SUPRESSAO_ALERTA,
  TETO_ALERTAS_ALUNO_SEMANA,
} from "./limiares";
import { diferencaEmSemanas } from "./semanas";
import type { ResumoCompacto } from "./tipos";
import type { GrupoComRecencia } from "./recencia";

/**
 * Os três tipos de sinal que chegam ao personal. A AUSÊNCIA de um quarto
 * é a decisão mais importante deste módulo — "grupo abaixo da faixa de
 * referência" foi cortado porque dispara para quase todo grupo de quase
 * todo aluno toda semana, que é o modo de morte do §11.4.6 por escrito.
 */
export type TipoAlerta =
  | "grupo_sem_estimulo"
  | "estagnacao_exercicio"
  | "queda_volume";

export type AlertaPersonal = {
  tipo: TipoAlerta;
  /** Grupo muscular (chave do banco) ou nome do exercício, conforme o tipo. */
  alvo: string;
  /**
   * Quanto maior, mais cedo na fila. Escala documentada em
   * `PRIORIDADE_BASE` — é ordenação, não unidade de medida.
   */
  prioridade: number;
  /**
   * Os números que vão para a tela e para a mensagem, na ordem que o P2
   * pediu (o que aconteceu → há quanto tempo → qual evidência). São
   * sempre valores JÁ CALCULADOS pelo agregador, nunca recontados aqui.
   */
  evidencia: EvidenciaAlerta;
};

export type EvidenciaAlerta =
  | { tipo: "grupo_sem_estimulo"; diasSemEstimulo: number }
  | {
      tipo: "estagnacao_exercicio";
      semanasSemProgresso: number;
      e1rmEstavelEm?: number;
      volumeEstavelEm?: number;
    }
  | {
      tipo: "queda_volume";
      semanas: number;
      volumeInicial: number;
      volumeAtual: number;
      quedaPct: number;
    };

/** Alerta já emitido antes, como vem da tabela `alerta_personal`. */
export type AlertaEmitido = {
  tipo: TipoAlerta;
  alvo: string;
  /** Segunda-feira ISO da semana em que foi emitido. */
  semanaInicio: string;
};

/**
 * A faixa de prioridade de cada tipo. Os três não competem pelo mesmo
 * espaço numérico: um grupo parado há três semanas vence qualquer
 * estagnação, e qualquer estagnação vence qualquer queda de volume.
 *
 * Por que ESSA ordem, e não outra: é a ordem da AÇÃO, não a da gravidade
 * teórica. Grupo parado resolve com uma mensagem ("você sumiu do treino
 * de costas") — é o alerta que mais fecha com um clique, e o §11.4.7 diz
 * que agir é o objetivo. Estagnação pede ajuste de ficha, que é trabalho.
 * Queda de volume é contexto: pode ser viagem, prova, gripe.
 *
 * Os 300 pontos de folga dentro de cada faixa são a magnitude do sinal
 * (mais dias parado vem antes), com teto para não invadir a faixa acima.
 */
const PRIORIDADE_BASE: Record<TipoAlerta, number> = {
  grupo_sem_estimulo: 700,
  estagnacao_exercicio: 400,
  queda_volume: 100,
};
const FOLGA_MAXIMA = 299;

function comFolga(tipo: TipoAlerta, magnitude: number): number {
  return PRIORIDADE_BASE[tipo] + Math.min(Math.round(magnitude), FOLGA_MAXIMA);
}

/**
 * Grupo muscular parado há `DIAS_SEM_ESTIMULO_PARA_ALERTA` dias ou mais.
 *
 * Tendência por construção: o limiar É uma janela de tempo (21 dias). Não
 * existe semana ruim que dispare isto — para o grupo entrar, ele precisa
 * estar ausente de três semanas de treino seguidas.
 *
 * `diasSemEstimuloPorGrupo` (`recencia.ts`) só devolve grupo que a pessoa
 * JÁ treinou alguma vez. Isso é o que queremos: "você parou de treinar
 * costas" é acionável; "você nunca treinou panturrilha" é escolha de
 * programa, não sinal de abandono — e o app não prescreve programa
 * (PRD §5).
 */
function detectarGruposSemEstimulo(
  recencia: GrupoComRecencia[],
): AlertaPersonal[] {
  return recencia
    .filter((g) => g.diasSemEstimulo >= DIAS_SEM_ESTIMULO_PARA_ALERTA)
    .map((g) => ({
      tipo: "grupo_sem_estimulo" as const,
      alvo: g.grupo,
      prioridade: comFolga("grupo_sem_estimulo", g.diasSemEstimulo),
      evidencia: {
        tipo: "grupo_sem_estimulo" as const,
        diasSemEstimulo: g.diasSemEstimulo,
      },
    }));
}

/**
 * Exercício sem progresso há `SEMANAS_ESTAGNACAO` semanas.
 *
 * Tendência por construção, e de graça: `resumo.estagnacoes` já aplica o
 * limiar de 4 semanas em `estagnacao.ts`, testado desde a Fase 1. Este
 * detector não recalcula nada — só transporta, que é exatamente o que o
 * §11.4.4 manda ("o alerta ROTEIA um sinal que já existe").
 *
 * A magnitude usa as semanas ALÉM do limiar, ×20: duas estagnações
 * distintas do mesmo aluno se desempatam pela mais antiga, sem que um
 * caso extremo (15 semanas) estoure a faixa e passe na frente de um
 * grupo abandonado.
 */
function detectarEstagnacoes(resumo: ResumoCompacto): AlertaPersonal[] {
  return resumo.estagnacoes.map((e) => ({
    tipo: "estagnacao_exercicio" as const,
    alvo: e.exercicio,
    prioridade: comFolga(
      "estagnacao_exercicio",
      (e.semanas_sem_progresso - SEMANAS_ESTAGNACAO) * 20,
    ),
    evidencia: {
      tipo: "estagnacao_exercicio" as const,
      semanasSemProgresso: e.semanas_sem_progresso,
      e1rmEstavelEm: e.e1rm_estavel_em,
      volumeEstavelEm: e.volume_estavel_em,
    },
  }));
}

/**
 * Volume total em queda CONTÍNUA por `QUEDAS_VOLUME_PARA_ALERTA` semanas.
 *
 * Por que volume e não "queda de frequência", que é o nome que a §11.2
 * usa: o resumo traz `frequencia.treinos_semana_atual` contra a média das
 * anteriores — isso é UMA semana contra uma média, e uma semana é
 * oscilação, não tendência. Uma viagem dispararia. O `volume_semanal`, ao
 * contrário, já vem com as quatro semanas da janela, e exigir queda em
 * TODAS as três transições é tendência literal. A queda de frequência
 * continua inteira na Análise do próprio aluno (§11.2) — o que não entra
 * é ela virar alerta de uma semana só.
 *
 * Semana com volume 0 participa: zero é fato conhecido no
 * `volume_semanal` (o tipo documenta isso), não ausência de informação.
 */
function detectarQuedaDeVolume(resumo: ResumoCompacto): AlertaPersonal[] {
  const serie = resumo.volume_semanal;
  const necessarias = QUEDAS_VOLUME_PARA_ALERTA + 1;
  if (serie.length < necessarias) return [];

  const janela = serie.slice(-necessarias);
  for (let i = 1; i < janela.length; i += 1) {
    if (janela[i].volume_total >= janela[i - 1].volume_total) return [];
  }

  const volumeInicial = janela[0].volume_total;
  const volumeAtual = janela[janela.length - 1].volume_total;
  // Volume inicial 0 com queda contínua depois é impossível (0 não cai),
  // mas a divisão fica protegida de qualquer jeito — percentual sobre 0
  // é `Infinity`, e `Infinity` numa prioridade quebra a ordenação em
  // silêncio.
  const quedaPct =
    volumeInicial > 0
      ? ((volumeInicial - volumeAtual) / volumeInicial) * 100
      : 0;

  return [
    {
      tipo: "queda_volume",
      // O alvo é o aluno inteiro, não um grupo: é o volume TOTAL. A
      // string fica estável porque ela entra no índice único de
      // `alerta_personal` (vinculo, semana, tipo, alvo) e na supressão.
      alvo: "volume_total",
      prioridade: comFolga("queda_volume", quedaPct),
      evidencia: {
        tipo: "queda_volume",
        semanas: QUEDAS_VOLUME_PARA_ALERTA,
        volumeInicial,
        volumeAtual,
        quedaPct,
      },
    },
  ];
}

/**
 * Silencia o que já foi dito há menos de `SEMANAS_SUPRESSAO_ALERTA`
 * semanas. Sem isto, um exercício empacado há seis semanas produz os
 * mesmos dois alertas em seis segundas-feiras seguidas — "Peito: atenção"
 * repetido no eixo do TEMPO mata o módulo igual a quatro grupos repetidos
 * no eixo do espaço, que é o caso que o P2 nomeou.
 */
function naoFoiDitoRecentemente(
  alerta: AlertaPersonal,
  emitidos: AlertaEmitido[],
  semanaAtual: string,
): boolean {
  return !emitidos.some((e) => {
    if (e.tipo !== alerta.tipo || e.alvo !== alerta.alvo) return false;
    // `diferencaEmSemanas(a, b)` é `a - b`: a semana atual vem PRIMEIRO,
    // senão a conta sai negativa e suprime tudo para sempre.
    const semanasAtras = diferencaEmSemanas(semanaAtual, e.semanaInicio);
    // A PRÓPRIA semana (0) não suprime, e isto não é detalhe: a fila é
    // recalculada a cada abertura da tela e gravada de forma idempotente.
    // Se a semana corrente contasse, o personal que abrisse a fila de
    // manhã e voltasse à tarde encontraria a tela VAZIA — o alerta teria
    // suprimido a si mesmo.
    return semanasAtras > 0 && semanasAtras < SEMANAS_SUPRESSAO_ALERTA;
  });
}

/**
 * A fila de um aluno, já priorizada, suprimida e cortada no teto.
 *
 * `semanaInicio` é a segunda-feira ISO da semana sendo montada — a mesma
 * convenção de `semanas.ts`, nunca uma segunda definição.
 */
export function montarFilaDoAluno(entrada: {
  resumo: ResumoCompacto;
  recencia: GrupoComRecencia[];
  semanaInicio: string;
  alertasEmitidos: AlertaEmitido[];
}): AlertaPersonal[] {
  const candidatos = [
    ...detectarGruposSemEstimulo(entrada.recencia),
    ...detectarEstagnacoes(entrada.resumo),
    ...detectarQuedaDeVolume(entrada.resumo),
  ];

  return candidatos
    .filter((a) =>
      naoFoiDitoRecentemente(a, entrada.alertasEmitidos, entrada.semanaInicio),
    )
    // Desempate por `alvo` para a ordem ser TOTAL e estável: duas
    // prioridades iguais não podem sair em ordem diferente a cada
    // carregamento da tela, senão o corte do teto abaixo vira sorteio.
    .sort((a, b) => b.prioridade - a.prioridade || a.alvo.localeCompare(b.alvo))
    .slice(0, TETO_ALERTAS_ALUNO_SEMANA);
}
