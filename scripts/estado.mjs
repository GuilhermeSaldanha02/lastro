#!/usr/bin/env node
/**
 * estado.mjs — o handshake de abertura de sessão, em um comando.
 *
 * Responde "o que aconteceu aqui desde a minha última vez?" sem que o agente
 * precise lembrar de rodar três comandos e abrir um arquivo. Existe porque a
 * regra vale 100% das vezes e é mecânica — logo, é script, não parágrafo.
 *
 *   node scripts/estado.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd();
  } catch {
    return null;
  }
};

if (git(['rev-parse', '--git-dir']) === null) {
  console.error('Nao parece um repositorio git.');
  process.exit(1);
}

const branch = git(['branch', '--show-current']) || '(detached)';
const sujo = git(['status', '--short']) || '';

console.log(`\n=== BRANCH: ${branch} ===\n`);

/* ---- 1. quem mexeu, no que, e quando ---- */

const log = git(['log', '--pretty=format:%h|%an|%ad|%s|%(trailers:key=Agente,valueonly,separator=%x2C)', '--date=short', '-12']);
if (log) {
  console.log('ULTIMOS COMMITS (agente = trailer `Agente:`):');
  for (const l of log.split('\n')) {
    const [sha, autor, data, assunto, agente] = l.split('|');
    const quem = (agente || '').trim() || autor;
    console.log(`  ${sha}  ${data}  [${quem}]  ${assunto}`);
  }
  console.log('');
}

/* ---- 2. sobrou trabalho de alguem? ---- */

if (sujo) {
  console.log('WORKING TREE SUJO — pode ser trabalho em andamento de outro agente.');
  console.log('PARE e pergunte ao dono antes de commitar ou descartar por cima.\n');
  for (const l of sujo.split('\n')) console.log(`  ${l}`);
  console.log('');
} else {
  console.log('Working tree limpo.\n');
}

/* ---- 3. o bloco de handoff ---- */

const caminhos = ['PROGRESS.md', 'docs/PROGRESS.md'];
const progresso = caminhos.find((c) => existsSync(c));

if (!progresso) {
  console.log('Nenhum PROGRESS.md encontrado — sem bloco de handoff para ler.');
} else {
  const texto = readFileSync(progresso, 'utf8');
  const m = texto.match(/^##\s*ESTADO ATUAL\s*$([\s\S]*?)(?=^##\s|\Z)/m);
  if (!m) {
    console.log(`${progresso} nao tem bloco "## ESTADO ATUAL".`);
    console.log('Ele e o handoff entre sessoes — criar no topo do arquivo (ver AGENTS.md).');
  } else {
    console.log(`ESTADO ATUAL (${progresso}):`);
    for (const l of m[1].split('\n')) if (l.trim()) console.log(`  ${l}`);
  }
}

console.log('');
