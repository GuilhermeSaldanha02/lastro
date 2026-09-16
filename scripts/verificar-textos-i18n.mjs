import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

import { PROPRIEDADES_NAO_VISIVEIS, TEXTOS_PERMITIDOS } from "./textos-i18n-permitidos.mjs";

const MIGRADOS = [
  /src[\\/]app[\\/]personal[\\/]/,
  /src[\\/]app[\\/]ajustes[\\/]personal[\\/]/,
  /src[\\/]components[\\/](fila-personal|convites-personal|completar-cadastro-personal|vinculo-aluno|seletor-modo|escolha-tipo-conta|voltar-flutuante)\.tsx$/,
  /src[\\/]app[\\/]page\.tsx$/,
  /src[\\/]app[\\/]treino[\\/]/,
  /src[\\/]components[\\/](iniciar-treino|form-iniciar-treino|lista-treinos|treino-detalhe|formulario-serie|timer-topo|excluir-treino|relatorio-pos-treino)\.tsx$/,
  /src[\\/]app[\\/]catalogo[\\/]/,
  /src[\\/]app[\\/]ajustes[\\/](modelos|anilhas)[\\/]/,
  /src[\\/]app[\\/]@modal[\\/].*[\\/](modelos|anilhas)[\\/]/,
  /src[\\/]components[\\/](catalogo-interativo|lista-modelos|modelo-treino-form|excluir-modelo|anilhas-form|player-execucao-exercicio)\.tsx$/,
  /src[\\/]app[\\/](login|boas-vindas)[\\/]/,
  /src[\\/]app[\\/]not-found\.tsx$/,
  /src[\\/]app[\\/](ajustes|perfil)[\\/]/,
  /src[\\/]app[\\/]@modal[\\/].*[\\/](perfil)[\\/]/,
  /src[\\/]components[\\/](aba-inferior|cabecalho-pro|editar-perfil|idioma-form|meta-semanal-form|seletor-temas)\.tsx$/,
  /src[\\/]app[\\/](analise|coach)[\\/]/,
  /src[\\/]app[\\/]ajustes[\\/]relatorios[\\/]/,
  /src[\\/]app[\\/]api[\\/]parecer[\\/]/,
  /src[\\/]components[\\/](analise-interativa|coach-interativo|parecer|pareceres-salvos|parecer-detalhe-acoes|historico-relatorios-pos-treino)\.tsx$/,
];

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

function atributoPai(no) {
  if (ts.isJsxAttribute(no)) return no;
  return ts.isJsxExpression(no) && ts.isJsxAttribute(no.parent) ? no.parent : undefined;
}

function valueEhEstrutural(atributo) {
  const abertura = atributo.parent?.parent;
  if (!abertura || !ts.isJsxOpeningLikeElement(abertura)) return false;

  const tag = ts.isIdentifier(abertura.tagName) ? abertura.tagName.text.toLowerCase() : "";
  if (tag === "option") return true;
  if (tag !== "input") return false;

  const tipo = abertura.attributes.properties.find(
    (propriedade) =>
      ts.isJsxAttribute(propriedade) &&
      propriedade.name.text === "type" &&
      propriedade.initializer &&
      ts.isStringLiteral(propriedade.initializer),
  );
  const valorDoTipo = tipo && ts.isJsxAttribute(tipo) && ts.isStringLiteral(tipo.initializer)
    ? tipo.initializer.text
    : "text";
  return ["hidden", "checkbox", "radio"].includes(valorDoTipo);
}

function estaEmPropriedadeNaoVisivel(no) {
  const atributo = atributoPai(no);
  if (!atributo) return false;
  if (atributo.name.text === "value") return valueEhEstrutural(atributo);
  return PROPRIEDADES_NAO_VISIVEIS.has(atributo.name.text);
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
      !estaEmPropriedadeNaoVisivel(no) &&
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
  const arquivos = DIRETORIOS.flatMap(listarArquivos).filter((arquivo) =>
    MIGRADOS.some((migrado) => migrado.test(path.normalize(arquivo))),
  );
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
