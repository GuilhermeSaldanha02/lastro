/**
 * lastro · sessão fora do padrão do próprio usuário (AN-08 F0-ANOMALIA).
 *
 * MATEMÁTICA PURA, como o resto de `src/lib/analise/`. Compara o volume de
 * uma sessão com a mediana das sessões anteriores DO MESMO TIPO, e só do
 * próprio usuário. Não afirma causa, não fala em risco: diz "acima" ou
 * "abaixo do seu padrão", com o número e a régua à vista.
 *
 * Regras, deliberadas (decisão do dono, 2026-09-29):
 * - tipo = família pelo grupo principal do dia: peito → empurrar,
 *   costas → puxar, grupo de perna → pernas. Sessão que mistura peito e
 *   costas, ou perna com peito/costas, não tem com quem comparar e fica de
 *   fora (null), assim como sessão só de braço, ombro ou abdômen;
 * - mediana, não média: uma sessão atípica no passado não arrasta a régua;
 * - sem `PADRAO_PISO_SESSOES` sessões anteriores do mesmo tipo, não há
 *   padrão, e o app não diz nada.
 */
import {
  INSIGHTS_HOME_JANELA_DIAS,
  INSIGHTS_HOME_MAX,
  PADRAO_DESVIO,
  PADRAO_JANELA_SESSOES,
  PADRAO_PISO_SESSOES,
} from "./limiares";
import { paraDataUTC, paraISO, somarDias } from "./semanas";

export type FamiliaSessao = "empurrar" | "puxar" | "pernas";

export type SessaoParaPadrao = {
  treinoId: string;
  data: string;
  /** Chaves do banco (`grupo_muscular.id`) dos exercícios com série valendo. */
  grupos: string[];
  /** Volume das séries valendo, pela mesma `volumeDeSerie` do resto do app. */
  volume: number;
};

export type ComparacaoPadrao = {
  treinoId: string;
  data: string;
  familia: FamiliaSessao;
  volume: number;
  /** Mediana das sessões comparadas. */
  padrao: number;
  sessoesComparadas: number;
  /** (volume − padrão) / padrão; 0,4 = 40% acima. */
  desvio: number;
  direcao: "acima" | "abaixo" | "dentro";
};

const PERNAS = new Set(["quadriceps", "posterior_coxa", "gluteo", "panturrilha"]);

export function familiaDaSessao(grupos: string[]): FamiliaSessao | null {
  const peito = grupos.includes("peito");
  const costas = grupos.includes("costas");
  const pernas = grupos.some((g) => PERNAS.has(g));
  if ((peito && costas) || (pernas && (peito || costas))) return null;
  if (peito) return "empurrar";
  if (costas) return "puxar";
  if (pernas) return "pernas";
  return null;
}

export function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = ordenados.length >> 1;
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/**
 * Compara `sessao` com as `anteriores` (qualquer ordem; só entram as do
 * mesmo tipo, as `PADRAO_JANELA_SESSOES` mais recentes). `null` quando a
 * sessão não tem tipo ou não há padrão ainda.
 */
export function compararComPadrao(
  sessao: SessaoParaPadrao,
  anteriores: SessaoParaPadrao[],
): ComparacaoPadrao | null {
  const familia = familiaDaSessao(sessao.grupos);
  if (!familia || sessao.volume <= 0) return null;

  const mesmas = anteriores
    .filter((s) => s.treinoId !== sessao.treinoId && s.volume > 0 && familiaDaSessao(s.grupos) === familia)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, PADRAO_JANELA_SESSOES);
  if (mesmas.length < PADRAO_PISO_SESSOES) return null;

  const padrao = mediana(mesmas.map((s) => s.volume));
  if (padrao <= 0) return null;
  const desvio = (sessao.volume - padrao) / padrao;
  const direcao = desvio > PADRAO_DESVIO ? "acima" : desvio < -PADRAO_DESVIO ? "abaixo" : "dentro";

  return {
    treinoId: sessao.treinoId,
    data: sessao.data,
    familia,
    volume: sessao.volume,
    padrao,
    sessoesComparadas: mesmas.length,
    desvio,
    direcao,
  };
}

/**
 * Posições (0–100) da barra do pós-treino (B1, direção C): o maior dos dois
 * valores fica em 80% da largura, para sobrar respiro à direita; a marca é o
 * padrão, o preenchimento é a sessão.
 */
export function posicoesDaBarra(c: Pick<ComparacaoPadrao, "volume" | "padrao">): { sessao: number; padrao: number } {
  const escala = Math.max(c.volume, c.padrao) / 0.8;
  if (escala <= 0) return { sessao: 0, padrao: 0 };
  return { sessao: Math.round((c.volume / escala) * 100), padrao: Math.round((c.padrao / escala) * 100) };
}

/**
 * As sessões fora do padrão para a Home (B2). `sessoes` vem da MAIS
 * RECENTE para a mais antiga (a ordem do carregador da Home): cada uma se
 * compara só com as que vêm DEPOIS dela na lista. Entram as dos últimos
 * `INSIGHTS_HOME_JANELA_DIAS` dias, no máximo `INSIGHTS_HOME_MAX`, a mais
 * recente primeiro. Passada a janela, a percepção some sozinha.
 */
export function sessoesForaDoPadrao(sessoes: SessaoParaPadrao[], hojeISO: string): ComparacaoPadrao[] {
  const inicioJanela = paraISO(somarDias(paraDataUTC(hojeISO), -(INSIGHTS_HOME_JANELA_DIAS - 1)));
  const achadas: ComparacaoPadrao[] = [];
  for (let i = 0; i < sessoes.length && achadas.length < INSIGHTS_HOME_MAX; i += 1) {
    const sessao = sessoes[i];
    if (sessao.data > hojeISO) continue;
    if (sessao.data < inicioJanela) break;
    const comparacao = compararComPadrao(sessao, sessoes.slice(i + 1));
    if (comparacao && comparacao.direcao !== "dentro") achadas.push(comparacao);
  }
  return achadas;
}
