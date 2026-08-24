/**
 * Rótulo legível para o grupo muscular.
 *
 * O banco guarda a chave em caixa alta com underscore
 * (`POSTERIOR_COXA`), e até aqui a UI vinha imprimindo essa chave crua.
 * Isto traduz para leitura humana sem inventar nome: acentuação e
 * espaço, nada além.
 *
 * Idioma (módulo de idiomas, 2026-08-24): esta função roda 100% no
 * cliente (`seletor-metricas-home.tsx`), então não pode fazer round-trip
 * ao banco só pra formatar um rótulo — por isso EN/ES vivem aqui como
 * mapa estático, igual PT-BR, em vez de ler `grupo_muscular_traducao`
 * (migração 0012). São os mesmos 10 grupos reais do catálogo; se um
 * grupo novo aparecer sem rótulo aqui, degrada pro heurístico de baixo,
 * nunca quebra.
 */
const ROTULOS: Record<string, string> = {
  ABDOMEN: "Abdômen",
  BICEPS: "Bíceps",
  COSTAS: "Costas",
  GLUTEO: "Glúteo",
  OMBRO: "Ombro",
  PANTURRILHA: "Panturrilha",
  PEITO: "Peito",
  POSTERIOR_COXA: "Posterior de coxa",
  QUADRICEPS: "Quadríceps",
  TRICEPS: "Tríceps",
  ANTEBRACO: "Antebraço",
  TRAPEZIO: "Trapézio",
  LOMBAR: "Lombar",
  ADUTOR: "Adutor",
  ABDUTOR: "Abdutor",
};

const ROTULOS_EN: Record<string, string> = {
  ABDOMEN: "Abs",
  BICEPS: "Biceps",
  COSTAS: "Back",
  GLUTEO: "Glutes",
  OMBRO: "Shoulders",
  PANTURRILHA: "Calves",
  PEITO: "Chest",
  POSTERIOR_COXA: "Hamstrings",
  QUADRICEPS: "Quadriceps",
  TRICEPS: "Triceps",
};

const ROTULOS_ES: Record<string, string> = {
  ABDOMEN: "Abdomen",
  BICEPS: "Bíceps",
  COSTAS: "Espalda",
  GLUTEO: "Glúteos",
  OMBRO: "Hombro",
  PANTURRILHA: "Pantorrilla",
  PEITO: "Pecho",
  POSTERIOR_COXA: "Isquiotibiales",
  QUADRICEPS: "Cuádriceps",
  TRICEPS: "Tríceps",
};

export function formatarGrupoMuscular(
  chave: string,
  idioma: "pt-BR" | "en" | "es" = "pt-BR",
): string {
  if (!chave) return "";
  const mapa = idioma === "en" ? ROTULOS_EN : idioma === "es" ? ROTULOS_ES : ROTULOS;
  const conhecido = mapa[chave.toUpperCase()];
  if (conhecido) return conhecido;

  // Chave nova no catálogo que ainda não tem rótulo (ou idioma sem mapa
  // pra ela): degrada para algo legível em vez de imprimir underscore na
  // tela. Nunca inventa nome — só troca separador e caixa. Fica em
  // PT-BR mesmo fora do idioma pt-BR: é melhor que nada, e é raro (só
  // acontece pra chave que ainda nem tem tradução no catálogo).
  const limpa = chave.replace(/_/g, " ").toLowerCase();
  return limpa.charAt(0).toUpperCase() + limpa.slice(1);
}
