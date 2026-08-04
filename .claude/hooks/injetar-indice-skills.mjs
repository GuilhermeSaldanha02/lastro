#!/usr/bin/env node
// Hook UserPromptSubmit: injeta skills/INDEX.md no contexto a cada prompt.
// Skill fora do disco não dispara sozinha — este hook é o que torna a
// triagem de skill possível sem depender de o agente lembrar de abrir o índice.
// Escrito em Node porque `jq` não existe por padrão no Windows.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let indice;
try {
  indice = readFileSync(join(raiz, "skills", "INDEX.md"), "utf8");
} catch {
  // Índice ausente não pode quebrar o turno do usuário.
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: indice,
    },
  }),
);
