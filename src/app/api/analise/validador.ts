// lastro · SDD.md §6.4 — validador determinístico da resposta do LLM.
// Função PURA, sem rede: a alavanca FORTE contra número inventado (a
// instrução de prompt é a alavanca fraca).
import type { ResumoCompacto } from "@/lib/analise/tipos";

export type ResultadoValidacao =
  | { ok: true; citados: number[] }
  | { ok: false; motivo: "intrusos"; intrusos: number[] }
  | { ok: false; motivo: "sem_numero_do_dono" };

const TOLERANCIA_ABSOLUTA_MINIMA = 0.05;
const TOLERANCIA_RELATIVA = 0.01;

function dentroDaTolerancia(x: number, y: number): boolean {
  return (
    Math.abs(x - y) <=
    Math.max(TOLERANCIA_ABSOLUTA_MINIMA, TOLERANCIA_RELATIVA * Math.abs(y))
  );
}

/** Normaliza vírgula decimal ("66,7" → 66.7) e converte para número. */
function normalizarToken(token: string): number {
  return Number(token.replace(",", "."));
}

/**
 * Extrai todo token numérico do parecer (SDD §6.4, passo 4).
 *
 * Duas correções sobre a versão original, achadas testando com dados
 * realistas (persona "Consistente Pesado", qa-treino, 2026-08-05) — sem
 * elas, TODO parecer que citasse uma data ISO ou o termo "e1RM" era
 * rejeitado por engano, mesmo com números corretos:
 *
 * 1. Data ISO ("2026-07-27") tem hífen antes do mês e do dia — o regex
 *    original lia isso como SINAL DE MENOS, produzindo "-07" e "-27"
 *    (negativos), que nunca batem com os componentes de data POSITIVOS
 *    do conjunto CONTEXTO. Corrigido separando a data em componentes
 *    (espaço no lugar do hífen) ANTES da extração genérica.
 * 2. Sigla técnica com dígito embutido ("e1RM") tinha o "1" extraído como
 *    se fosse número citado. Corrigido com lookbehind negativo de letra:
 *    um dígito colado a uma letra IMEDIATAMENTE ANTES não conta como
 *    início de número (mas "80kg", com letra DEPOIS, continua válido —
 *    só a letra antes é o sinal de "isto é parte de uma palavra").
 * 3. Separador de milhar PT-BR ("12.480") era lido como decimal — o "."
 *    vira separador de milhar aqui, não de casas decimais (que é a
 *    vírgula). Sem isso, "12.480" virava 12.48 e nunca batia com o dado
 *    real (achado real, revisão estática qa-treino, 2026-08-05).
 */
function extrairTokens(parecer: string): number[] {
  const semDatasIso = parecer.replace(
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    "$1 $2 $3",
  );
  const semMilhar = semDatasIso.replace(
    /\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b/g,
    (bruto) => bruto.replace(/\./g, ""),
  );
  const brutos = semMilhar.match(/(?<![a-zA-Z])-?\d+(?:[.,]\d+)?/g) ?? [];
  return brutos.map(normalizarToken).filter((n) => Number.isFinite(n));
}

/** Componentes numéricos de uma data ISO (YYYY-MM-DD): ano, mês, dia, ano curto. */
function componentesData(dataIso: string): number[] {
  const [anoStr, mesStr, diaStr] = dataIso.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);
  if (![ano, mes, dia].every(Number.isFinite)) return [];
  return [ano, mes, dia, ano % 100];
}

/** Fim da semana (`semana_atual_inicio` + 6 dias), em componentes numéricos. */
function componentesFimDeSemana(semanaInicioIso: string): number[] {
  const inicio = new Date(`${semanaInicioIso}T00:00:00Z`);
  if (Number.isNaN(inicio.getTime())) return [];
  inicio.setUTCDate(inicio.getUTCDate() + 6);
  const fimIso = inicio.toISOString().slice(0, 10);
  return componentesData(fimIso);
}

/**
 * Conjunto DADOS (SDD §6.4) — valores numéricos substantivos de `resumo`,
 * que provam que o parecer é sobre ESTE dono. Convenções/estrutura (janela,
 * faixa de referência, contagem de itens, datas) NÃO entram aqui — ver
 * `coletarContextoEstrutural`.
 */
function coletarDados(resumo: ResumoCompacto): number[] {
  const dados: number[] = [];

  for (const v of resumo.volume_semanal) {
    dados.push(v.volume_total);
  }

  for (const g of resumo.volume_por_grupo_muscular) {
    dados.push(g.series_valendo, g.volume);
    if (g.delta_series_pct !== undefined) dados.push(g.delta_series_pct);
    if (g.delta_volume_pct !== undefined) dados.push(g.delta_volume_pct);
  }

  for (const e of resumo.volume_por_exercicio) {
    dados.push(e.series_valendo, e.volume, e.peso_referencia, e.reps_referencia);
    if (e.delta_volume_pct !== undefined) dados.push(e.delta_volume_pct);
  }

  for (const t of resumo.tendencia_e1rm) {
    dados.push(t.e1rm_atual, t.e1rm_inicial, t.delta_pct, t.sessoes);
  }

  if (resumo.series_dificeis) {
    dados.push(
      resumo.series_dificeis.total,
      resumo.series_dificeis.series_valendo_com_rir,
      resumo.series_dificeis.series_valendo,
    );
  }
  if (resumo.cobertura_rir_insuficiente) {
    dados.push(
      resumo.cobertura_rir_insuficiente.series_valendo_com_rir,
      resumo.cobertura_rir_insuficiente.series_valendo,
    );
  }

  dados.push(resumo.frequencia.treinos_semana_atual);
  if (resumo.frequencia.media_semanas_anteriores !== undefined) {
    dados.push(resumo.frequencia.media_semanas_anteriores);
  }

  for (const e of resumo.estagnacoes) {
    dados.push(e.semanas_sem_progresso);
    if (e.e1rm_estavel_em !== undefined) dados.push(e.e1rm_estavel_em);
    if (e.volume_estavel_em !== undefined) dados.push(e.volume_estavel_em);
  }

  for (const p of resumo.prs) {
    dados.push(p.valor, p.valor_anterior);
  }

  return dados;
}

/**
 * Conjunto CONTEXTO estrutural derivado do próprio `resumo` — não prova
 * especificidade, só evita falso intruso (SDD §6.4 + correção de data).
 */
function coletarContextoEstrutural(resumo: ResumoCompacto): number[] {
  const inicio = resumo.periodo.semana_atual_inicio;
  return [
    resumo.periodo.janela_semanas,
    resumo.periodo.semanas_com_dados,
    ...resumo.faixa_referencia_series,
    ...componentesData(inicio),
    ...componentesFimDeSemana(inicio),
  ];
}

/**
 * Expande cada valor com seus arredondamentos a 0 e 1 casa decimal (passo 3)
 * e com o módulo — prosa em português descreve queda ("caiu 12,5%") sem
 * escrever o sinal de menos que só existe no `delta_pct` numérico; sem o
 * módulo, todo parecer correto sobre uma queda virava intruso (achado real,
 * revisão estática qa-treino, 2026-08-05). Não perde especificidade: o
 * módulo de um positivo é ele mesmo, então isto só afasta o sinal, nunca a
 * magnitude — o número ainda precisa vir do dado real.
 */
function expandirComArredondamentos(valores: number[]): number[] {
  const expandido: number[] = [];
  for (const v of valores) {
    for (const x of [v, Math.abs(v)]) {
      expandido.push(x, Math.round(x), Math.round(x * 10) / 10);
    }
  }
  return expandido;
}

function existeNoConjunto(x: number, conjunto: number[]): boolean {
  return conjunto.some((y) => dentroDaTolerancia(x, y));
}

/**
 * Valida se todo número citado no parecer existe literalmente nos dados
 * (SDD §6.4). `contexto` são os inteiros ESTRUTURAIS que o prompt injetou
 * além do que já vive em `resumo` (tamanho de listas, limiares citados no
 * texto, componentes da data de emissão) — nunca prova especificidade.
 */
export function validarNumeros(
  parecer: string,
  resumo: ResumoCompacto,
  contexto: number[],
): ResultadoValidacao {
  const dados = coletarDados(resumo);
  const contextoCompleto = [...contexto, ...coletarContextoEstrutural(resumo)];

  const conjuntoDadosCompleto = expandirComArredondamentos(dados);
  const conjuntoBrancoCompleto = expandirComArredondamentos([
    ...dados,
    ...contextoCompleto,
  ]);

  const tokens = extrairTokens(parecer);

  const intrusos: number[] = [];
  const citados: number[] = [];
  for (const token of tokens) {
    if (!existeNoConjunto(token, conjuntoBrancoCompleto)) {
      intrusos.push(token);
      continue;
    }
    if (existeNoConjunto(token, conjuntoDadosCompleto)) {
      citados.push(token);
    }
  }

  if (intrusos.length > 0) {
    return { ok: false, motivo: "intrusos", intrusos };
  }
  if (citados.length === 0) {
    return { ok: false, motivo: "sem_numero_do_dono" };
  }
  return { ok: true, citados };
}
