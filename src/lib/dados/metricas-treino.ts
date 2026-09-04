/**
 * lastro · Métricas determinísticas do treino finalizado (Relatório Pós-Treino).
 *
 * Calcula tonelagem total (volume em kg), duração real da sessão,
 * contagem de séries válidas, detalhamento por exercício e PRs do dia.
 */

/**
 * Duração da SESSÃO em segundos — **definição única**, usada tanto pelo
 * relatório da tela de treino quanto pelo de `/ajustes/relatorios`.
 *
 * POR QUE ESTA FUNÇÃO EXISTE. Os dois relatórios mediam coisas diferentes e
 * por isso nunca batiam (relato de uso real, 2026-09-04): a tela usava o
 * cronômetro ao vivo (`localStorage`, contando desde que o treino foi
 * ABERTO no aparelho) e o servidor reconstruía `última série − primeira
 * série` — que descarta o aquecimento antes da 1ª e tudo depois da última.
 * A diferença era sistemática, não arredondamento.
 *
 * A definição escolhida usa as duas âncoras que **existem no banco** e que
 * os dois lados enxergam igual: `treino.iniciado_em` (migration 0001) e o
 * `criado_em` da última série. Não depende de `localStorage`, então não
 * muda de aparelho para aparelho.
 *
 * Limite conhecido e aceito: o tempo DEPOIS da última série (desmontar,
 * alongar) não entra — o banco não guarda um `finalizado_em`. Fechar essa
 * lacuna é migration, decisão do dono (ver PROGRESS.md).
 */
export function duracaoSessaoSegundos(
  iniciadoEmIso: string,
  ultimaSerieEmIso?: string,
): number {
  const inicio = new Date(iniciadoEmIso).getTime();
  const fim = ultimaSerieEmIso ? new Date(ultimaSerieEmIso).getTime() : NaN;
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return 0;
  return Math.max(0, Math.round((fim - inicio) / 1000));
}

/** `criado_em` mais recente entre as séries — o fim da sessão, por ora. */
export function ultimaSerieEm(series: { criadoEm: string }[]): string | undefined {
  let maior: number | undefined;
  let iso: string | undefined;
  for (const s of series) {
    const t = new Date(s.criadoEm).getTime();
    if (Number.isNaN(t)) continue;
    if (maior === undefined || t > maior) {
      maior = t;
      iso = s.criadoEm;
    }
  }
  return iso;
}

export type SerieParaMetricas = {
  id: string;
  exercicioId: string;
  exercicioNome: string;
  reps: number;
  peso: number;
  tipo: "aquecimento" | "valendo";
  pesoPorLado?: boolean;
  ehRecordePessoal?: boolean;
  /** Dado curado do catálogo — fonte real do foco/divisão (ver `inferirFocoPorGrupo`). */
  exercicioGrupoMuscular?: string;
};

export type MetricasSessao = {
  duracaoMinutos: number;
  tonelagemTotalKg: number;
  totalSeriesValendo: number;
  totalSeriesAquecimento: number;
  totalExercicios: number;
  exerciciosDetalhados: { exercicioNome: string; totalSeries: number; pesoMaximo: number }[];
  prsBatidos: { exercicioNome: string; reps: number; peso: number }[];
  focoOuDivisao?: string;
  identificadorTreino?: string;
  fraseAssinatura?: string;
};

export type OpcoesMetricasSessao = {
  focoOuDivisao?: string;
  identificadorTreino?: string;
  fraseAssinatura?: string;
};

/**
 * Fallback, só usado quando `exercicioGrupoMuscular` não veio preenchido
 * em NENHUMA série (dado legado). Chuta o grupo pelo TEXTO do nome do
 * exercício — é exatamente o método que causou o achado do dono
 * (2026-08-31): treino de pernas rotulado "SUPERIORES" porque o nome do
 * exercício usado não batia com nenhuma palavra-chave da lista de pernas.
 * `inferirFocoPorGrupo` (abaixo) é a fonte real e correta; esta função
 * não deve ganhar mais palavra-chave — o problema não é a lista estar
 * incompleta, é o método.
 */
function inferirFoco(nomesExercicios: string[]): string {
  if (nomesExercicios.length === 0) return "TREINO";

  const texto = nomesExercicios.join(" ").toLowerCase();
  const temPernas = /agachamento|leg|extensora|flexora|panturrilha|quadr[ií]ceps|stiff|b[uú]lgaro|passada|abdut|adut|gl[uú]teo|sum[oô]|eleva[cç][aã]o p[eé]lvica/.test(texto);
  const temPeito = /supino|crucifixo|peck|cross|peitoral|paralelas/.test(texto);
  const temCostas = /puxada|remada|barra fixa|pulldown|pullover|serrote|dorsal|cavalinho/.test(texto);
  const temOmbros = /desenvolvimento|lateral|frontal|deltoide|face pull|arnold/.test(texto);
  const temBracos = /rosca|tr[ií]ceps|b[ií]ceps|antebra[cç]o|testa|corda|martelo|scott|francesa/.test(texto);

  const contagemGrupos = [temPernas, temPeito, temCostas, temOmbros, temBracos].filter(Boolean).length;
  const temSuperiores = temPeito || temCostas || temOmbros || temBracos;

  // FULL BODY é pernas + qualquer grupo superior na mesma sessão — não
  // "3 grupos ou mais" (achado do dono, 2026-09-02: peito+ombro+tríceps,
  // um dia de empurrar clássico com 3 grupos, todos superiores, caía
  // aqui por engano). Sem pernas, por mais grupos superiores que hajam,
  // continua sendo um dia de superiores.
  if (temPernas && temSuperiores) return "FULL BODY";
  if (temPernas && contagemGrupos === 1) return "PERNAS";
  if (temPeito && contagemGrupos === 1) return "PEITORAL";
  if (temCostas && contagemGrupos === 1) return "COSTAS";
  if (temOmbros && contagemGrupos === 1) return "OMBROS";
  if (temBracos && contagemGrupos === 1) return "BRAÇOS";
  if (temSuperiores) return "SUPERIORES";
  if (temPernas) return "PERNAS";

  return "TREINO";
}

/** As 10 categorias reais do catálogo (`select id from grupo_muscular`, conferido no banco 2026-08-31). */
type Categoria = "pernas" | "peito" | "costas" | "ombros" | "bracos" | "abdomen";
const CATEGORIA_POR_GRUPO: Record<string, Categoria> = {
  quadriceps: "pernas",
  posterior_coxa: "pernas",
  gluteo: "pernas",
  panturrilha: "pernas",
  peito: "peito",
  costas: "costas",
  ombro: "ombros",
  biceps: "bracos",
  triceps: "bracos",
  abdomen: "abdomen",
};

/**
 * Fonte real do foco/divisão — classifica pelo `grupo_muscular_primario`
 * curado do catálogo, nunca pelo texto do nome do exercício (achado do
 * dono, 2026-08-31, ver `inferirFoco` acima). Devolve `null` quando
 * nenhuma série tem o dado (aí quem chama cai no fallback por nome).
 */
function inferirFocoPorGrupo(gruposMusculares: string[]): string | null {
  const categorias = new Set(
    gruposMusculares
      .map((g) => CATEGORIA_POR_GRUPO[g])
      .filter((c): c is Categoria => Boolean(c)),
  );
  if (categorias.size === 0) return null;

  const temPernas = categorias.has("pernas");
  const temPeito = categorias.has("peito");
  const temCostas = categorias.has("costas");
  const temOmbros = categorias.has("ombros");
  const temBracos = categorias.has("bracos");
  const temAbdomen = categorias.has("abdomen");

  const temSuperiores = temPeito || temCostas || temOmbros || temBracos;

  // FULL BODY é pernas + qualquer grupo superior na mesma sessão — não
  // "mais de 2 categorias" (achado do dono, 2026-09-02: peito+ombro+
  // tríceps, um dia de empurrar clássico com 3 categorias, todas
  // superiores, caía aqui por engano; mesma classe do bug de 2026-08-31,
  // "SUPERIORES" virando "PERNAS"). Sem pernas, por mais categorias
  // superiores que hajam na sessão, continua sendo um dia de superiores
  // — abdômen junto não conta como "grupo extra" pra esse cálculo.
  if (temPernas && temSuperiores) return "FULL BODY";
  if (temPernas && categorias.size === 1) return "PERNAS";
  if (temPeito && categorias.size === 1) return "PEITORAL";
  if (temCostas && categorias.size === 1) return "COSTAS";
  if (temOmbros && categorias.size === 1) return "OMBROS";
  if (temBracos && categorias.size === 1) return "BRAÇOS";
  if (temAbdomen && categorias.size === 1) return "ABDÔMEN";
  if (temSuperiores) return "SUPERIORES";
  if (temPernas) return "PERNAS";
  if (temAbdomen) return "ABDÔMEN";

  return "TREINO";
}

export function calcularMetricasSessao(
  series: SerieParaMetricas[],
  iniciadoEmOuSegundos: string | number,
  finalizadoEmIso?: string,
  opcoes?: OpcoesMetricasSessao
): MetricasSessao {
  let duracaoMinutos = 1;
  if (typeof iniciadoEmOuSegundos === "number") {
    duracaoMinutos = Math.max(1, Math.round(iniciadoEmOuSegundos / 60));
  } else {
    const inicio = new Date(iniciadoEmOuSegundos).getTime();
    const fim = finalizadoEmIso ? new Date(finalizadoEmIso).getTime() : Date.now();
    const duracaoMs = Math.max(0, fim - inicio);
    duracaoMinutos = Math.max(1, Math.round(duracaoMs / 60000));
  }

  let tonelagemTotalKg = 0;
  let totalSeriesValendo = 0;
  let totalSeriesAquecimento = 0;
  const exerciciosUnicosValendo = new Set<string>();
  const mapaExercicios = new Map<string, { exercicioNome: string; totalSeries: number; pesoMaximo: number }>();
  const prsBatidos: { exercicioNome: string; reps: number; peso: number }[] = [];
  const nomesExercicios: string[] = [];
  const gruposMusculares: string[] = [];

  for (const s of series) {
    const pesoEfetivo = s.pesoPorLado ? s.peso * 2 : s.peso;
    const volumeSerie = s.reps * pesoEfetivo;

    let ex = mapaExercicios.get(s.exercicioId);
    if (!ex) {
      ex = { exercicioNome: s.exercicioNome, totalSeries: 0, pesoMaximo: 0 };
      mapaExercicios.set(s.exercicioId, ex);
      nomesExercicios.push(s.exercicioNome);
      if (s.exercicioGrupoMuscular) gruposMusculares.push(s.exercicioGrupoMuscular);
    }
    ex.totalSeries++;
    ex.pesoMaximo = Math.max(ex.pesoMaximo, s.peso);

    if (s.tipo === "valendo") {
      exerciciosUnicosValendo.add(s.exercicioId);
      totalSeriesValendo++;
      tonelagemTotalKg += volumeSerie;
      
      if (s.ehRecordePessoal) {
        prsBatidos.push({
          exercicioNome: s.exercicioNome,
          reps: s.reps,
          peso: s.peso,
        });
      }
    } else {
      totalSeriesAquecimento++;
    }
  }

  const focoOuDivisao = (
    opcoes?.focoOuDivisao ||
    inferirFocoPorGrupo(gruposMusculares) ||
    inferirFoco(nomesExercicios)
  ).toUpperCase();
  const identificadorTreino = opcoes?.identificadorTreino || "TREINO 404B";
  const fraseAssinatura = opcoes?.fraseAssinatura || "Mais uma sessão no histórico.";

  return {
    duracaoMinutos,
    tonelagemTotalKg: Math.round(tonelagemTotalKg * 10) / 10,
    totalSeriesValendo,
    totalSeriesAquecimento,
    totalExercicios: exerciciosUnicosValendo.size || (series.length > 0 ? 1 : 0),
    exerciciosDetalhados: Array.from(mapaExercicios.values()),
    prsBatidos,
    focoOuDivisao,
    identificadorTreino,
    fraseAssinatura,
  };
}
