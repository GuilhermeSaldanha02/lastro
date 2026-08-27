import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fitness function da ADR-009 — a parte dela que NÃO foi revertida.
 *
 * Em 2026-08-27 o dono aprovou guardar `reps`/`peso` no modelo de treino
 * (migração 0015, ADR-010). Isso reverteu UMA frase da ADR-009. A
 * restrição estrutural continua valendo integralmente, e é ela que
 * carregava a razão da ADR-008:
 *
 *   nenhum módulo de `src/lib/analise/` importa, consulta ou recebe dado
 *   de `modelo_treino` / `modelo_treino_exercicio` — nem linha crua, nem
 *   métrica derivada, nem menção em prompt.
 *
 * O motivo: se a Análise enxergar o PLANEJADO, ela passa a poder comparar
 * executado contra planejado. Essa comparação tende a lisonjear ("você
 * cumpriu o programa!") num produto que existe para dizer o que os
 * números do dono realmente mostram.
 *
 * Até aqui a proibição vivia só em prosa (ADR + comentário de migração).
 * Agora que o modelo guarda carga, quebrá-la ficou tentador — um `join`
 * "só para comparar" resolveria uma pergunta fácil e destruiria a tese.
 * Por isso virou teste.
 */
describe("ADR-009 — o agregador nunca enxerga o modelo de treino", () => {
  const DIR = join(process.cwd(), "src", "lib", "analise");
  const PROIBIDOS = ["modelo_treino", "modeloTreino", "modelo-treino"];

  const arquivosDeProducao = readdirSync(DIR).filter(
    (nome) => nome.endsWith(".ts") && !nome.endsWith(".test.ts"),
  );

  it("existe código de agregador para verificar (o teste não pode passar vazio)", () => {
    expect(arquivosDeProducao.length).toBeGreaterThan(5);
  });

  it.each(arquivosDeProducao)("%s não menciona modelo de treino", (nome) => {
    const conteudo = readFileSync(join(DIR, nome), "utf8");

    // Comentário que cita a proibição é legítimo; código que a viola, não.
    // Remover comentários antes de procurar evita que a própria explicação
    // reprove o teste.
    const semComentarios = conteudo
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/.*$/gm, "$1");

    for (const termo of PROIBIDOS) {
      expect(
        semComentarios.includes(termo),
        `${nome} referencia "${termo}" — ADR-009 proíbe o agregador conhecer o planejado`,
      ).toBe(false);
    }
  });
});
