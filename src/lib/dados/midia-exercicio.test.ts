import { describe, it, expect } from 'vitest';
import { obterMidiaExercicio, obterMidiaExercicioPorSlug, traduzirBiomecanica } from './midia-exercicio';
import manifesto from './exercicios-midia.json';
import traducoes from './exercicios-midia-traducao.json';

describe('midia-exercicio', () => {
  it('retorna a mídia para um exercício existente por ID', () => {
    // Abdominal infra
    const midia = obterMidiaExercicio('d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b');
    expect(midia).not.toBeNull();
    expect(midia?.slug).toBe('abdominal-infra');
    expect(midia?.videoUrl).toBe('/videos/exercicios/d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b.gif');
    expect(midia?.thumbnailUrl).toContain('.gif');
  });

  it('nenhum exercício com GIF fica com o texto genérico de preenchimento (CAT-BIOMEC)', () => {
    // 30 exercícios mostravam "Musculatura Alvo Principal" etc. na página do
    // exercício, o que parece erro. Todo exercício precisa dos três campos reais.
    const genericos = ['Musculatura Alvo Principal', 'Músculos Estabilizadores', 'Padrão Biomecânico Anatômico'];
    const ruins = (manifesto as Array<{ nomePt?: string; musculo_alvo?: string; musculos_sinergistas?: string; mecanica_articular?: string }>)
      .filter((e) => [e.musculo_alvo, e.musculos_sinergistas, e.mecanica_articular].some((c) => !c || genericos.includes(c)))
      .map((e) => e.nomePt);
    expect(ruins).toEqual([]);
  });

  it('retorna a mídia por slug', () => {
    const midia = obterMidiaExercicioPorSlug('abdominal-infra');
    expect(midia).not.toBeNull();
    expect(midia?.id).toBe('d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b');
  });

  it('retorna null para ID inexistente', () => {
    expect(obterMidiaExercicio('00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});

describe("traduzirBiomecanica (UX3-16)", () => {
  const CAMPOS = ["musculo_alvo", "musculos_sinergistas", "mecanica_articular"] as const;
  const textosDoCatalogo = new Set(
    (manifesto as Array<Record<string, unknown>>).flatMap((e) =>
      CAMPOS.map((c) => e[c]).filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  );
  const dicionario = traducoes as Record<string, { en?: string; es?: string }>;

  it("todo texto de biomecânica do catálogo tem tradução em inglês e espanhol", () => {
    const faltando = [...textosDoCatalogo].filter((t) => !dicionario[t]?.en || !dicionario[t]?.es);
    expect(faltando).toEqual([]);
  });

  it("o dicionário não guarda texto que não existe mais no catálogo", () => {
    expect(Object.keys(dicionario).filter((t) => !textosDoCatalogo.has(t))).toEqual([]);
  });

  it("traduz em en/es, mantém em pt e cai no português se faltar", () => {
    expect(traduzirBiomecanica("Latíssimo do Dorso", "en")).toBe("Latissimus Dorsi");
    expect(traduzirBiomecanica("Latíssimo do Dorso", "es")).toBe("Dorsal Ancho");
    expect(traduzirBiomecanica("Latíssimo do Dorso", "pt-BR")).toBe("Latíssimo do Dorso");
    expect(traduzirBiomecanica("Texto inexistente", "en")).toBe("Texto inexistente");
  });
});
