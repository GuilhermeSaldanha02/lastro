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

// `core.quotepath` vem ligado por padrão e faz o git escapar caminho não-ASCII
// como "an\303\241lise.ts" — com as aspas fazendo parte da string. O regex de
// extensão, ancorado em $, deixava passar todo arquivo com acento no nome, que
// num projeto em português não é caso raro. Verificado em teste.
function git(args) {
  try {
    return execFileSync("git", ["-c", "core.quotepath=false", ...args], {
      cwd: raiz,
      encoding: "utf8",
    });
  } catch {
    return null;
  }
}

// Os dois escopos são avaliados SEPARADAMENTE, de propósito. Juntar as duas
// listas de caminhos faria um PROGRESS.md já commitado na branch mascarar
// código sujo no working tree — o gate silenciaria pelo resto da branch.
function falta_evidencia(caminhos) {
  if (!caminhos) return false;
  const lista = caminhos.filter(Boolean);
  const tem_codigo = lista.some((p) => EXT_CODIGO.test(p));
  const tocou_progress = lista.some((p) => /PROGRESS\.md$/i.test(p));
  return tem_codigo && !tocou_progress;
}

// Escopo A — working tree: código escrito e ainda não commitado.
const status = git(["status", "--porcelain"]);
// Fora de repo git, ou git indisponível: não é função deste hook reclamar.
if (status === null) process.exit(0);
const nao_commitado = status.split("\n").map((l) => l.slice(3).trim());

// Escopo B — branch vs main: código commitado sem nunca tocar o PROGRESS
// deixa o working tree limpo e passaria batido se olhássemos só o escopo A.
const diff_branch = git(["diff", "--name-only", "main...HEAD"]);
const na_branch = diff_branch ? diff_branch.split("\n") : null;

const motivo = falta_evidencia(nao_commitado)
  ? "Há código modificado e ainda não commitado, e o PROGRESS.md não foi tocado."
  : falta_evidencia(na_branch)
    ? "Esta branch alterou código e em nenhum commit tocou o PROGRESS.md."
    : null;

if (motivo) {
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        motivo +
        " Atualizar o PROGRESS.md é a ação final obrigatória de toda tarefa:" +
        " registre o estado da tarefa e a EVIDÊNCIA da verificação — a saída" +
        " real do comando, não 'build limpo'. Depois encerre o turno.",
    }),
  );
}

process.exit(0);
