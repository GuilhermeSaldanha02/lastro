import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

import { PROPRIEDADES_NAO_VISIVEIS, TEXTOS_PERMITIDOS } from "./textos-i18n-permitidos.mjs";

const MIGRADOS = [];
const DIRETORIOS = ["src/app", "src/components"];
const EXTENSOES = new Set([".tsx", ".jsx"]);

function normalizar(texto) {
  return texto.replace(/\s+/g, " ").trim();
}

function deveIgnorar(texto) {
  return !/\p{L}/u.test(texto) || TEXTOS_PERMITIDOS.has(texto);
}

function listarArquivos(diretorio) {
  return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const arquivo = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(arquivo);
    return EXTENSOES.has(path.extname(entrada.name)) ? [arquivo] : [];
  });
}

function estaDentroDeT(no) {
  for (let atual = no.parent; atual; atual = atual.parent) {
    if (
      ts.isCallExpression(atual) &&
      ts.isIdentifier(atual.expression) &&
      atual.expression.text === "t"
    ) {
      return true;
    }
  }
  return false;
}

function linhaDoNo(arquivo, no) {
  return arquivo.getLineAndCharacterOfPosition(no.getStart(arquivo)).line + 1;
}

function adicionarAchado(achados, arquivo, no, texto) {
  const normalizado = normalizar(texto);
  if (!deveIgnorar(normalizado)) {
    const caminho = path.isAbsolute(arquivo.fileName) ? path.relative(process.cwd(), arquivo.fileName) : arquivo.fileName;
    achados.push(`${caminho}:${linhaDoNo(arquivo, no)}: ${normalizado}`);
  }
}

function estaEmPropriedadeNaoVisivel(no) {
  return ts.isJsxAttribute(no.parent) && PROPRIEDADES_NAO_VISIVEIS.has(no.parent.name.text);
}

function adicionarExpressaoVisivel(achados, arquivo, expressao) {
  if (ts.isStringLiteral(expressao) || ts.isNoSubstitutionTemplateLiteral(expressao)) {
    adicionarAchado(achados, arquivo, expressao, expressao.text);
    return;
  }

  if (ts.isTemplateExpression(expressao)) {
    adicionarAchado(achados, arquivo, expressao.head, expressao.head.text);
    for (const trecho of expressao.templateSpans) {
      adicionarAchado(achados, arquivo, trecho.literal, trecho.literal.text);
    }
    return;
  }

  if (ts.isConditionalExpression(expressao)) {
    adicionarExpressaoVisivel(achados, arquivo, expressao.whenTrue);
    adicionarExpressaoVisivel(achados, arquivo, expressao.whenFalse);
  }
}

export function encontrarTextosSemI18n(codigo, caminho) {
  const arquivo = ts.createSourceFile(caminho, codigo, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const achados = [];

  function visitar(no) {
    if (ts.isJsxText(no) && !estaDentroDeT(no)) {
      adicionarAchado(achados, arquivo, no, no.text);
    }

    if (
      ts.isJsxAttribute(no) &&
      no.initializer &&
      ts.isStringLiteral(no.initializer) &&
      !PROPRIEDADES_NAO_VISIVEIS.has(no.name.text) &&
      !estaDentroDeT(no)
    ) {
      adicionarAchado(achados, arquivo, no.initializer, no.initializer.text);
    }

    if (ts.isJsxExpression(no) && no.expression && !estaDentroDeT(no) && !estaEmPropriedadeNaoVisivel(no)) {
      adicionarExpressaoVisivel(achados, arquivo, no.expression);
    }

    ts.forEachChild(no, visitar);
  }

  visitar(arquivo);
  return achados;
}

function executar() {
  const arquivosMigrados = new Set(MIGRADOS.map((arquivo) => path.normalize(arquivo)));
  const arquivos = DIRETORIOS.flatMap(listarArquivos).filter((arquivo) => arquivosMigrados.has(path.normalize(arquivo)));
  const achados = arquivos.flatMap((arquivo) => encontrarTextosSemI18n(fs.readFileSync(arquivo, "utf8"), arquivo));

  if (achados.length > 0) {
    console.error(achados.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Textos i18n: OK");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  executar();
}
