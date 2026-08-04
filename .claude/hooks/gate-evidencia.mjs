#!/usr/bin/env node
// Hook Stop: bloqueia o fim do turno quando há código modificado no working
// tree e o PROGRESS.md não foi tocado. "Atualizar o PROGRESS é a ação final
// obrigatória de toda tarefa" é a regra que mais se viola na prática — por
// isso ela é hook (determinístico) e não texto (ignorável sob pressão).
// Escrito em Node porque `jq` não existe por padrão no Windows.

import { execFileSync } from "node:child_process";

const EXT_CODIGO = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|sql|astro|vue|svelte)$/i;

let entrada = {};
try {
  const { readFileSync } = await import("node:fs");
  entrada = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  entrada = {};
}

// Trava anti-loop: se este hook já bloqueou uma vez neste turno, libera.
if (entrada.stop_hook_active) process.exit(0);

const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let saida;
try {
  saida = execFileSync("git", ["status", "--porcelain"], {
    cwd: raiz,
    encoding: "utf8",
  });
} catch {
  // Fora de repo git, ou git indisponível: não é função deste hook reclamar.
  process.exit(0);
}

const caminhos = saida
  .split("\n")
  .map((l) => l.slice(3).trim())
  .filter(Boolean);

const tem_codigo = caminhos.some((p) => EXT_CODIGO.test(p));
const tocou_progress = caminhos.some((p) => /PROGRESS\.md$/i.test(p));

if (tem_codigo && !tocou_progress) {
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        "Há código modificado no working tree e o PROGRESS.md não foi tocado. " +
        "Atualizar o PROGRESS.md é a ação final obrigatória de toda tarefa: " +
        "registre o estado da tarefa e a EVIDÊNCIA da verificação (a saída real " +
        "do comando, não 'build limpo'). Depois encerre o turno.",
    }),
  );
}

process.exit(0);
