/**
 * lastro · LEITURA determinística do resumo — o texto que o dono vê quando
 * a Gemini não responde.
 *
 * POR QUE ISTO SUBSTITUI O TEMPLATE ANTERIOR. O fallback antigo era um
 * despejo de fatos, uma linha por número ("Volume total em 2026-08-24:
 * 60751."). Honesto, e o pior rosto possível para a peça-assinatura de um
 * produto cuja tese é "o log e o gráfico são infraestrutura; o produto é a
 * leitura" (`PRD.md` §1). Quando a IA falhava, o app entregava um extrato.
 *
 * E a IA falha com frequência real: medição de 2026-09-04 no console do AI
 * Studio (`DECISIONS.md`) mostrou `503` recorrente — 2 em 1/set, 11 em
 * 3/set, 1 em 4/set. Não é caso de borda.
 *
 * O QUE ISTO É E O QUE NÃO É. É **ordenação e comparação** sobre métricas
 * que `agregar.ts` já calculou — nenhuma conta nova, nenhum modelo. Cobre o
 * território de DIAGNÓSTICO (perguntas 1 a 4 do `PRD.md` §3: progresso,
 * empaque, equilíbrio de volume, frequência).
 *
 * **Não cobre a pergunta 5 ("o que mudar na próxima semana"), de
 * propósito.** Prescrição por regra viraria o "plano gerado
 * automaticamente" que o `PRD.md` §5 proíbe — e é a mesma linha que o §11
 * traça entre o que fica com o aluno e o que vai para o personal.
 *
 * FRONTEIRA COM O PARECER REAL. Este texto continua acompanhado do aviso
 * de falha interpretativa, e continua NÃO tendo veredito destacado: o
 * guard de `avisoFalhaInterpretativa` impede que `separarVeredito` promova
 * a primeira frase (PR #177/#181). Ler melhor não pode virar passar-se por.
 */
import type { ResumoCompacto } from "./tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { formatarPercentual, formatarPeso } from "@/lib/texto/formatar-delta";
import { formatarDataCurta } from "@/lib/tempo";

/** Delta de e1RM abaixo disto não conta como "subiu" nem "caiu". Mesma zona-morta do bloco de evidência (`evidencia.ts`). */
const ZONA_MORTA_PCT = 1;

type Frases = {
  cobertura: (semana: string, com: number, total: number) => string;
  subiramVarios: (n: number, total: number, exercicio: string, pct: string) => string;
  subiuUm: (exercicio: string, pct: string) => string;
  nenhumSubiu: () => string;
  caiu: (lista: string) => string;
  parados: (lista: string) => string;
  acimaDaFaixa: (lista: string) => string;
  abaixoDaFaixa: (lista: string) => string;
  semEstimulo: (lista: string) => string;
  frequenciaComMedia: (treinos: number, media: string) => string;
  frequenciaSemMedia: (treinos: number) => string;
  prs: (lista: string) => string;
  seriesDificeis: (dificeis: number, valendo: number) => string;
  /** "A", "B" e "C" — a conjunção muda por idioma. */
  juntar: (itens: string[]) => string;
  /** "leg press (há 4 semanas)" */
  paradoItem: (exercicio: string, semanas: number) => string;
  quedaItem: (exercicio: string, pct: string) => string;
  prItem: (exercicio: string, valor: string, anterior: string) => string;
};

function juntarCom(itens: string[], e: string): string {
  if (itens.length === 0) return "";
  if (itens.length === 1) return itens[0];
  return `${itens.slice(0, -1).join(", ")} ${e} ${itens[itens.length - 1]}`;
}

const POR_IDIOMA: Record<Idioma, Frases> = {
  "pt-BR": {
    cobertura: (semana, com, total) =>
      `Semana de ${semana}, com ${com} de ${total} semanas da janela com dados.`,
    subiramVarios: (n, total, exercicio, pct) =>
      `${n} dos ${total} exercícios acompanhados subiram, e o ${exercicio} liderou com ${pct} de e1RM.`,
    subiuUm: (exercicio, pct) =>
      `Só o ${exercicio} subiu de e1RM na janela: ${pct}.`,
    nenhumSubiu: () => `Nenhum exercício acompanhado subiu de e1RM nesta janela.`,
    caiu: (lista) => `Em queda real: ${lista}.`,
    parados: (lista) => `Parados sem novo máximo: ${lista}.`,
    acimaDaFaixa: (lista) => `Acima da faixa de referência de séries: ${lista}.`,
    abaixoDaFaixa: (lista) => `Abaixo da faixa: ${lista}.`,
    semEstimulo: (lista) => `Sem nenhum estímulo nesta semana: ${lista}.`,
    frequenciaComMedia: (treinos, media) =>
      `Foram ${treinos} treinos na semana, contra média de ${media} nas anteriores.`,
    frequenciaSemMedia: (treinos) => `Foram ${treinos} treinos na semana.`,
    prs: (lista) => `Recorde pessoal em ${lista}.`,
    seriesDificeis: (dificeis, valendo) =>
      `${dificeis} das ${valendo} séries valendo foram difíceis (RIR baixo).`,
    juntar: (itens) => juntarCom(itens, "e"),
    paradoItem: (exercicio, semanas) =>
      `${exercicio} (há ${semanas} ${semanas === 1 ? "semana" : "semanas"})`,
    quedaItem: (exercicio, pct) => `${exercicio} (${pct})`,
    prItem: (exercicio, valor, anterior) => `${exercicio} (${valor}, antes ${anterior})`,
  },
  en: {
    cobertura: (semana, com, total) =>
      `Week of ${semana}, with ${com} of ${total} weeks in the window having data.`,
    subiramVarios: (n, total, exercicio, pct) =>
      `${n} of the ${total} tracked exercises went up, and ${exercicio} led with ${pct} in e1RM.`,
    subiuUm: (exercicio, pct) => `Only ${exercicio} gained e1RM in the window: ${pct}.`,
    nenhumSubiu: () => `No tracked exercise gained e1RM in this window.`,
    caiu: (lista) => `Actually declining: ${lista}.`,
    parados: (lista) => `Stalled with no new max: ${lista}.`,
    acimaDaFaixa: (lista) => `Above the reference set range: ${lista}.`,
    abaixoDaFaixa: (lista) => `Below the range: ${lista}.`,
    semEstimulo: (lista) => `No stimulus at all this week: ${lista}.`,
    frequenciaComMedia: (treinos, media) =>
      `${treinos} workouts this week, against an average of ${media} in previous ones.`,
    frequenciaSemMedia: (treinos) => `${treinos} workouts this week.`,
    prs: (lista) => `Personal record in ${lista}.`,
    seriesDificeis: (dificeis, valendo) =>
      `${dificeis} of the ${valendo} working sets were hard sets (low RIR).`,
    juntar: (itens) => juntarCom(itens, "and"),
    paradoItem: (exercicio, semanas) =>
      `${exercicio} (${semanas} ${semanas === 1 ? "week" : "weeks"})`,
    quedaItem: (exercicio, pct) => `${exercicio} (${pct})`,
    prItem: (exercicio, valor, anterior) => `${exercicio} (${valor}, was ${anterior})`,
  },
  es: {
    cobertura: (semana, com, total) =>
      `Semana del ${semana}, con ${com} de ${total} semanas de la ventana con datos.`,
    subiramVarios: (n, total, exercicio, pct) =>
      `${n} de los ${total} ejercicios seguidos subieron, y ${exercicio} lideró con ${pct} de e1RM.`,
    subiuUm: (exercicio, pct) => `Solo ${exercicio} subió de e1RM en la ventana: ${pct}.`,
    nenhumSubiu: () => `Ningún ejercicio seguido subió de e1RM en esta ventana.`,
    caiu: (lista) => `En caída real: ${lista}.`,
    parados: (lista) => `Estancados sin nuevo máximo: ${lista}.`,
    acimaDaFaixa: (lista) => `Por encima del rango de referencia de series: ${lista}.`,
    abaixoDaFaixa: (lista) => `Por debajo del rango: ${lista}.`,
    semEstimulo: (lista) => `Sin ningún estímulo esta semana: ${lista}.`,
    frequenciaComMedia: (treinos, media) =>
      `Fueron ${treinos} entrenamientos en la semana, contra un promedio de ${media} en las anteriores.`,
    frequenciaSemMedia: (treinos) => `Fueron ${treinos} entrenamientos en la semana.`,
    prs: (lista) => `Récord personal en ${lista}.`,
    seriesDificeis: (dificeis, valendo) =>
      `${dificeis} de las ${valendo} series válidas fueron difíciles (RIR bajo).`,
    juntar: (itens) => juntarCom(itens, "y"),
    paradoItem: (exercicio, semanas) =>
      `${exercicio} (hace ${semanas} ${semanas === 1 ? "semana" : "semanas"})`,
    quedaItem: (exercicio, pct) => `${exercicio} (${pct})`,
    prItem: (exercicio, valor, anterior) => `${exercicio} (${valor}, antes ${anterior})`,
  },
};

/**
 * `formatarDataCurta` é PT-only (meses abreviados fixos) — decisão herdada
 * do template anterior, registrada e não escondida: en/es ficam com a data
 * ISO crua, e a única conta real deste app está sempre em pt-BR.
 */
function semanaLegivel(iso: string, idioma: Idioma): string {
  return idioma === "pt-BR" ? formatarDataCurta(iso) : iso;
}

/**
 * Monta a leitura. Cada frase só entra quando o dado que a sustenta existe
 * — Regra da Presença (`evidencia.ts`): nada de "0 exercícios em queda".
 */
export function leituraDeterministica(resumo: ResumoCompacto, idioma: Idioma): string {
  const f = POR_IDIOMA[idioma];
  const paragrafo1: string[] = [];
  const paragrafo2: string[] = [];
  const paragrafo3: string[] = [];

  paragrafo1.push(
    f.cobertura(
      semanaLegivel(resumo.periodo.semana_atual_inicio, idioma),
      resumo.periodo.semanas_com_dados,
      resumo.periodo.janela_semanas,
    ),
  );

  // --- Progresso: quem subiu, quem caiu (tendência de e1RM) ---
  const tendencias = [...resumo.tendencia_e1rm].sort((a, b) => b.delta_pct - a.delta_pct);
  const subiram = tendencias.filter((t) => t.delta_pct > ZONA_MORTA_PCT);
  // Quedas do PIOR para o menos pior. `tendencias` está ordenada por delta
  // decrescente (serve para achar o líder de alta); manter essa ordem aqui
  // listaria "-9,3% e -29,8%", que lê ao contrário do que importa.
  const cairam = tendencias
    .filter((t) => t.delta_pct < -ZONA_MORTA_PCT)
    .sort((a, b) => a.delta_pct - b.delta_pct);

  if (tendencias.length > 0) {
    if (subiram.length > 1) {
      const lider = subiram[0];
      paragrafo1.push(
        f.subiramVarios(
          subiram.length,
          tendencias.length,
          lider.exercicio,
          formatarPercentual(lider.delta_pct, idioma),
        ),
      );
    } else if (subiram.length === 1) {
      paragrafo1.push(
        f.subiuUm(subiram[0].exercicio, formatarPercentual(subiram[0].delta_pct, idioma)),
      );
    } else {
      paragrafo1.push(f.nenhumSubiu());
    }
  }

  if (cairam.length > 0) {
    paragrafo1.push(
      f.caiu(
        f.juntar(
          cairam.map((t) => f.quedaItem(t.exercicio, formatarPercentual(t.delta_pct, idioma))),
        ),
      ),
    );
  }

  // --- Empaque ---
  if (resumo.estagnacoes.length > 0) {
    paragrafo1.push(
      f.parados(
        f.juntar(
          resumo.estagnacoes.map((e) => f.paradoItem(e.exercicio, e.semanas_sem_progresso)),
        ),
      ),
    );
  }

  // --- Equilíbrio de volume ---
  const acima = resumo.volume_por_grupo_muscular.filter((g) => g.posicao_na_faixa === "acima");
  const abaixo = resumo.volume_por_grupo_muscular.filter((g) => g.posicao_na_faixa === "abaixo");

  if (acima.length > 0) {
    paragrafo2.push(
      f.acimaDaFaixa(
        f.juntar(acima.map((g) => `${g.grupo_muscular} (${g.series_valendo})`)),
      ),
    );
  }
  if (abaixo.length > 0) {
    paragrafo2.push(
      f.abaixoDaFaixa(
        f.juntar(abaixo.map((g) => `${g.grupo_muscular} (${g.series_valendo})`)),
      ),
    );
  }
  if (resumo.frequencia.grupos_sem_estimulo.length > 0) {
    paragrafo2.push(f.semEstimulo(f.juntar(resumo.frequencia.grupos_sem_estimulo)));
  }

  // --- Frequência e esforço ---
  const { treinos_semana_atual, media_semanas_anteriores } = resumo.frequencia;
  paragrafo3.push(
    media_semanas_anteriores !== undefined
      ? f.frequenciaComMedia(
          treinos_semana_atual,
          formatarPeso(media_semanas_anteriores, idioma),
        )
      : f.frequenciaSemMedia(treinos_semana_atual),
  );

  if (resumo.series_dificeis) {
    paragrafo3.push(
      f.seriesDificeis(
        resumo.series_dificeis.total,
        resumo.series_dificeis.series_valendo,
      ),
    );
  }

  if (resumo.prs.length > 0) {
    paragrafo3.push(
      f.prs(
        f.juntar(
          resumo.prs.map((p) =>
            f.prItem(
              p.exercicio,
              formatarPeso(p.valor, idioma),
              formatarPeso(p.valor_anterior, idioma),
            ),
          ),
        ),
      ),
    );
  }

  return [paragrafo1, paragrafo2, paragrafo3]
    .filter((p) => p.length > 0)
    .map((p) => p.join(" "))
    .join("\n\n");
}
