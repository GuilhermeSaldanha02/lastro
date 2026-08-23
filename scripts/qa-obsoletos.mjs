#!/usr/bin/env node
/**
 * qa-obsoletos.mjs — quais itens do QA.md precisam ser reverificados?
 *
 * Regra: um item verificado no commit <SHA> continua válido enquanto nenhum
 * caminho da área dele tiver mudado entre <SHA> e HEAD. Auditoria seguinte roda
 * só o que ficou obsoleto — é isso que impede reauditar tudo do zero.
 *
 *   node scripts/qa-obsoletos.mjs           # relatório legível
 *   node scripts/qa-obsoletos.mjs --json    # saída para script/hook
 *   node scripts/qa-obsoletos.mjs --qa docs/QA.md
 */

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
const comoJson = argv.includes('--json');
const iQa = argv.indexOf('--qa');
const caminhoQa = resolve(iQa !== -1 && argv[iQa + 1] ? argv[iQa + 1] : 'QA.md');

if (!existsSync(caminhoQa)) {
  console.error(`QA.md nao encontrado em ${caminhoQa}`);
  console.error('Crie o registro primeiro (skill qa-registro) ou aponte com --qa <caminho>.');
  process.exit(1);
}

/* ---------- leitura das tabelas markdown ---------- */

const linhas = readFileSync(caminhoQa, 'utf8').split(/\r?\n/);
const ehTabela = (l) => l.trim().startsWith('|');
const celulas = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const ehSeparador = (cs) => cs.length > 0 && cs.every((c) => /^:?-{2,}:?$/.test(c));

function blocosDeTabela() {
  const blocos = [];
  let atual = null;
  for (const l of linhas) {
    if (ehTabela(l)) {
      const cs = celulas(l);
      if (!atual) {
        atual = { cabecalho: cs.map((c) => c.toLowerCase()), linhas: [] };
      } else if (!ehSeparador(cs)) {
        atual.linhas.push(cs);
      }
    } else if (atual) {
      blocos.push(atual);
      atual = null;
    }
  }
  if (atual) blocos.push(atual);
  return blocos;
}

const blocos = blocosDeTabela();
const temCol = (bloco, termo) => bloco.cabecalho.some((c) => c === termo || c.startsWith(termo));
const acharTabela = (...termos) => blocos.find((b) => termos.every((t) => temCol(b, t)));
const iCol = (bloco, ...termos) => {
  for (const t of termos) {
    const exato = bloco.cabecalho.findIndex((c) => c === t);
    if (exato !== -1) return exato;
    const prefixo = bloco.cabecalho.findIndex((c) => c.startsWith(t));
    if (prefixo !== -1) return prefixo;
  }
  return -1;
};

const tabMapa = acharTabela('área', 'caminho') || acharTabela('area', 'caminho');
const tabItens = acharTabela('id', 'resultado', 'sha');

if (!tabMapa) {
  console.error('QA.md sem a tabela "Mapa de areas" (colunas: Area | Caminhos).');
  console.error('Sem mapa nao da para calcular obsolescencia — o registro vira lista morta.');
  process.exit(1);
}
if (!tabItens) {
  console.error('QA.md sem a tabela de itens (colunas: ID | Area | ... | Resultado | SHA | ...).');
  process.exit(1);
}

/* ---------- mapa de areas ---------- */

const iMapaArea = iCol(tabMapa, 'área', 'area');
const iMapaGlobs = iCol(tabMapa, 'caminho');
const mapa = new Map();
for (const l of tabMapa.linhas) {
  const area = l[iMapaArea];
  if (!area) continue;
  mapa.set(area, (l[iMapaGlobs] || '').split(/\s+/).filter(Boolean));
}

/* ---------- glob -> regex ----------
 * Percorre caractere a caractere de proposito: a versao com placeholder
 * intermediario foi o que introduziu um byte NUL invisivel no fonte, e o git
 * passou a tratar este arquivo como binario.
 * `**` casa qualquer profundidade, `*` casa um nivel, `?` casa um caractere.
 */

const META = /[.+^${}()|[\]\\]/;

function globParaRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      re += '.*';
      i++;
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if (META.test(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}
const casa = (arquivo, globs) => globs.some((g) => globParaRegex(g).test(arquivo));

/* ---------- git ---------- */

const cacheDiff = new Map();
function mudadosDesde(sha) {
  if (cacheDiff.has(sha)) return cacheDiff.get(sha);
  let r;
  try {
    const saida = execFileSync('git', ['diff', '--name-only', `${sha}..HEAD`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    r = saida.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    r = null; // SHA desconhecido neste historico
  }
  cacheDiff.set(sha, r);
  return r;
}

let head = 'HEAD';
try {
  head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  console.error('Nao parece um repositorio git — o calculo depende do historico.');
  process.exit(1);
}

/* ---------- classificacao ---------- */

const iId = iCol(tabItens, 'id');
const iArea = iCol(tabItens, 'área', 'area');
const iResultado = iCol(tabItens, 'resultado');
const iSha = iCol(tabItens, 'sha');
const iProva = iCol(tabItens, 'o que prova', 'prova');

const obsoletos = [];
const validos = [];
const alertas = [];

for (const l of tabItens.linhas) {
  const id = l[iId];
  if (!id) continue;
  const area = l[iArea] || '';
  const resultado = (l[iResultado] || '').toUpperCase();
  const sha = (l[iSha] || '').replace(/[`\s]/g, '');
  const prova = iProva !== -1 ? l[iProva] : '';
  const item = { id, area, resultado, sha, prova };

  if (resultado !== 'PASSOU') {
    obsoletos.push({ ...item, motivo: resultado ? `resultado ${resultado}` : 'sem resultado' });
    continue;
  }
  if (!mapa.has(area)) {
    alertas.push(`item ${id} aponta para a area "${area}", que nao existe no mapa`);
    obsoletos.push({ ...item, motivo: 'area fora do mapa (nunca expira sozinha)' });
    continue;
  }
  if (!sha || sha === '-') {
    obsoletos.push({ ...item, motivo: 'sem SHA registrado' });
    continue;
  }
  const mudados = mudadosDesde(sha);
  if (mudados === null) {
    obsoletos.push({ ...item, motivo: `SHA ${sha} nao encontrado no historico` });
    continue;
  }
  const atingidos = mudados.filter((f) => casa(f, mapa.get(area)));
  if (atingidos.length) {
    obsoletos.push({ ...item, motivo: `${atingidos.length} arquivo(s) da area mudaram`, arquivos: atingidos });
  } else {
    validos.push(item);
  }
}

for (const [area, globs] of mapa) {
  if (!globs.length) alertas.push(`area "${area}" sem nenhum caminho — nunca vai expirar`);
  if (!tabItens.linhas.some((l) => l[iArea] === area)) alertas.push(`area "${area}" sem nenhum item`);
}

/* ---------- saida ---------- */

if (comoJson) {
  console.log(JSON.stringify({ head, obsoletos, validos, alertas }, null, 2));
  process.exit(0);
}

const total = obsoletos.length + validos.length;
console.log(`QA em ${head} — ${total} itens · ${obsoletos.length} obsoletos · ${validos.length} ainda validos\n`);

if (obsoletos.length) {
  console.log('OBSOLETOS (auditar so estes):');
  for (const o of obsoletos) {
    const largura = Math.max(...obsoletos.map((x) => x.id.length));
    const amostra = o.arquivos ? `  ← ${o.arquivos.slice(0, 2).join(', ')}${o.arquivos.length > 2 ? ` +${o.arquivos.length - 2}` : ''}` : '';
    console.log(`  ${o.id.padEnd(largura)}  [${o.area}]  ${o.motivo}${amostra}`);
  }
  console.log('');
}

if (validos.length) {
  console.log(`VALIDOS (nao rodar de novo): ${validos.map((v) => v.id).join(', ')}\n`);
}

if (alertas.length) {
  console.log('ALERTAS DE FORMATO:');
  for (const a of alertas) console.log(`  ! ${a}`);
  console.log('');
}

if (!obsoletos.length) console.log('Nada a reauditar. Tudo que passou continua valido neste HEAD.');
