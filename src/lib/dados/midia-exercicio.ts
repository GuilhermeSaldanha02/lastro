import manifestoMidia from './exercicios-midia.json';

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

/**
 * Retorna as informações de mídia por slug do exercício.
 */
export function obterMidiaExercicioPorSlug(slug: string): ExercicioMidia | null {
  return MAPA_MIDIA_POR_SLUG.get(slug) ?? null;
}
