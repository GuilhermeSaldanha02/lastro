import manifestoMidia from './exercicios-midia.json';
import traducoesBiomecanica from './exercicios-midia-traducao.json';
import type { Idioma } from './idioma';

export interface ExercicioMidia {
  id: string;
  nomePt?: string;
  nomeEn: string;
  nomeEs: string;
  slug: string;
  folderOrigem?: string;
  arquivoOrigem?: string;
  videoUrl: string;
  aliasUrl: string;
  totalFrames: number;
  thumbnailUrl: string;
  estilo_visual?: string;
  creditos?: string;
  grupoMuscular?: string;
  grupoMuscularId?: string;
  unilateral?: boolean;
  pesoPorLado?: boolean;
  musculo_alvo?: string;
  musculos_sinergistas?: string;
  mecanica_articular?: string;
}

const MAPA_MIDIA_POR_ID = new Map<string, ExercicioMidia>();
const MAPA_MIDIA_POR_SLUG = new Map<string, ExercicioMidia>();

for (const item of manifestoMidia as ExercicioMidia[]) {
  MAPA_MIDIA_POR_ID.set(item.id, item);
  MAPA_MIDIA_POR_SLUG.set(item.slug, item);
}

/**
 * Retorna as informações de mídia e vídeo/GIF do exercício por ID.
 */
export function obterMidiaExercicio(exercicioId: string): ExercicioMidia | null {
  return MAPA_MIDIA_POR_ID.get(exercicioId) ?? null;
}

const TRADUCOES_BIOMECANICA = traducoesBiomecanica as Record<string, { en: string; es: string }>;

/**
 * Músculo alvo, sinergistas e mecânica articular vêm do manifesto só em
 * português (UX3-16). A tradução é um dicionário fixo por texto inteiro,
 * escrito uma vez e revisável, sem IA em produção — mesmo método do A1.
 * Texto sem tradução cai no português em vez de sumir.
 */
export function traduzirBiomecanica(texto: string, idioma: Idioma): string {
  if (idioma === 'pt-BR') return texto;
  return TRADUCOES_BIOMECANICA[texto]?.[idioma] ?? texto;
}

/**
 * Retorna as informações de mídia por slug do exercício.
 */
export function obterMidiaExercicioPorSlug(slug: string): ExercicioMidia | null {
  return MAPA_MIDIA_POR_SLUG.get(slug) ?? null;
}
