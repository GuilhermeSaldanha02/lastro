/**
 * Rótulo legível para o grupo muscular.
 *
 * O banco guarda a chave em caixa alta com underscore
 * (`POSTERIOR_COXA`), e até aqui a UI vinha imprimindo essa chave crua.
 * Isto traduz para leitura humana sem inventar nome: acentuação e
 * espaço, nada além.
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

export function formatarGrupoMuscular(chave: string): string {
  if (!chave) return "";
  const conhecido = ROTULOS[chave.toUpperCase()];
  if (conhecido) return conhecido;

  // Chave nova no catálogo que ainda não tem rótulo: degrada para algo
  // legível em vez de imprimir underscore na tela. Nunca inventa nome —
  // só troca separador e caixa.
  const limpa = chave.replace(/_/g, " ").toLowerCase();
  return limpa.charAt(0).toUpperCase() + limpa.slice(1);
}
