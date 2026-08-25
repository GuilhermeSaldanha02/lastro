import { describe, it, expect } from 'vitest';
import { obterMidiaExercicio, obterMidiaExercicioPorSlug } from './midia-exercicio';

describe('midia-exercicio', () => {
  it('retorna a mídia para um exercício existente por ID', () => {
    // Lower Ab Crunch
    const midia = obterMidiaExercicio('d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b');
    expect(midia).not.toBeNull();
    expect(midia?.slug).toBe('lower-ab-crunch');
    expect(midia?.videoUrl).toBe('/videos/exercicios/d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b.gif');
    expect(midia?.thumbnailUrl).toContain('0.jpg');
  });

  it('retorna a mídia por slug', () => {
    const midia = obterMidiaExercicioPorSlug('lower-ab-crunch');
    expect(midia).not.toBeNull();
    expect(midia?.id).toBe('d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b');
  });

  it('retorna null para ID inexistente', () => {
    expect(obterMidiaExercicio('00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
