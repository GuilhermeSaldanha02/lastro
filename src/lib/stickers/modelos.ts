import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import type { Idioma } from "@/lib/dados/idioma";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";
import { t } from "@/lib/texto/i18n";
import { desenharAnatomia } from "./anatomia";
import { TOKENS_STICKER as T } from "./tokens";

export const MODELOS_STICKER = [
  { id: "numeros", nome: "Números" },
  { id: "lateral", nome: "Lateral" },
  { id: "minimalista", nome: "Minimalista" },
  { id: "placa", nome: "Placa" },
  { id: "bilhete", nome: "Bilhete" },
  { id: "arco", nome: "Arco" },
  { id: "etiqueta", nome: "Etiqueta" },
  { id: "editorial", nome: "Editorial" },
  { id: "anatomico", nome: "Anatômico" },
] as const;

export type ModeloSticker = (typeof MODELOS_STICKER)[number]["id"];
export type TemaSticker = { ouro: string; branco: string; preto: string; papel: string; sombra: string; fonte: string; fonteNumeros: string };

function xml(texto: string): string {
  return texto.replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[caractere]!);
}

/** Quebra entre grupos: um nome composto nunca é dividido nem abreviado. */
function linhasDeGrupos(nomes: readonly string[], tamanho: number, largura: number): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const nome of nomes) {
    const candidato = atual ? `${atual} · ${nome}` : nome;
    if (atual && candidato.length * tamanho * T.larguraMediaLetra > largura) {
      linhas.push(atual);
      atual = nome;
    } else atual = candidato;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Renderizador puro usado em miniatura, prévia e conversão para PNG. */
export function gerarSvgSticker(modelo: ModeloSticker, metricas: MetricasSessao, idioma: Idioma, logoDataUrl: string, tema: TemaSticker): { svg: string; largura: number; altura: number } {
  const grupos = [...new Set((metricas.gruposMuscularesTreinados ?? []).map((id) => id.trim().toLowerCase()).filter(Boolean))];
  const nomes = grupos.length ? grupos.map((id) => formatarGrupoMuscular(id, idioma)) : [t("TREINO", idioma)];
  const lateral = modelo === "lateral";
  const compacto = modelo === "minimalista";
  const editorial = modelo === "editorial";
  const horizontal = modelo === "placa" || modelo === "etiqueta";
  const bilhete = modelo === "bilhete";
  const tamanhoTitulo = lateral || bilhete ? T.tituloLateral : compacto || modelo === "etiqueta" ? T.tituloCompacto : editorial ? T.tituloEditorial : T.titulo;
  const entrelinha = compacto ? T.entrelinhaCompacta : editorial ? T.entrelinhaEditorial : T.entrelinha;
  const margem = compacto || modelo === "etiqueta" ? T.margemCompacta : T.margem;
  // Também acomoda um grupo futuro longo, sem truncá-lo nem reduzir sua fonte.
  const dados = [
    { valor: metricas.duracaoMinutos, rotulo: "min" },
    { valor: metricas.totalSeriesValendo, rotulo: t(metricas.totalSeriesValendo === 1 ? "série" : "séries", idioma) },
    { valor: metricas.totalExercicios, rotulo: t(metricas.totalExercicios === 1 ? "exercício" : "exercícios", idioma) },
  ];
  const linhaCompacta = dados.map(({ valor, rotulo }) => `${valor} ${rotulo}`).join("  ·  ");
  const larguraBase = lateral ? T.larguraLateral : bilhete ? T.larguraBilhete : modelo === "placa" ? T.larguraPlaca : modelo === "etiqueta" ? T.larguraEtiqueta : T.largura;
  const espacoMarca = horizontal ? T.colunaMarca : 0;
  const larguraConteudo = Math.max(larguraBase, ...nomes.map((nome) => Math.ceil(nome.length * tamanhoTitulo * T.larguraMediaLetra) + margem * 2 + espacoMarca), compacto || modelo === "etiqueta" ? Math.ceil(linhaCompacta.length * T.numeroCompacto * T.larguraMediaLetra) + margem * 2 + espacoMarca : 0);
  const linhas = linhasDeGrupos(nomes, tamanhoTitulo, larguraConteudo - margem * 2 - espacoMarca);
  const partes: string[] = [];
  const meio = larguraConteudo / 2;
  let cursor: number = margem;
  const corTexto = modelo === "bilhete" ? tema.preto : tema.branco;
  const texto = (conteudo: string | number, x: number, y: number, tamanho: number, opcoes: { cor?: string; ancora?: string; peso?: number; italico?: boolean; numeros?: boolean } = {}) => `<text x="${x}" y="${y}" font-family="${xml(opcoes.numeros ? tema.fonteNumeros : tema.fonte)}" font-size="${tamanho}" font-weight="${opcoes.peso ?? 700}" text-anchor="${opcoes.ancora ?? "middle"}" fill="${xml(opcoes.cor ?? corTexto)}"${opcoes.italico ? ' font-style="italic"' : ""}>${xml(String(conteudo))}</text>`;
  const logo = (y: number, x = meio - T.logoLargura / 2) => `<image href="${xml(logoDataUrl)}" x="${x}" y="${y}" width="${T.logoLargura}" height="${T.logoAltura}" preserveAspectRatio="xMidYMid meet"/>`;
  const titulo = () => {
    for (const linha of linhas) {
      cursor += entrelinha;
      partes.push(texto(linha, editorial ? margem : meio, cursor, tamanhoTitulo, { ancora: editorial ? "start" : "middle", italico: editorial, cor: modelo === "arco" ? tema.ouro : corTexto }));
    }
  };
  const metricasColunas = (y: number, inicio: number = margem, tamanhoNumero: number = T.numero, alturaBloco: number = T.blocoMetricas) => {
    const larguraColuna = (larguraConteudo - margem - inicio) / dados.length;
    return dados.map(({ valor, rotulo }, i) => {
      const x = inicio + larguraColuna * (i + 0.5);
      return texto(valor, x, y + tamanhoNumero, tamanhoNumero, { cor: modelo === "numeros" ? tema.branco : tema.ouro, numeros: true }) + texto(rotulo, x, y + alturaBloco - T.espacoPequeno, T.rotulo, { peso: 500, cor: modelo === "numeros" ? tema.ouro : corTexto });
    }).join("");
  };

  if (horizontal) {
    const inicioDados = margem + T.colunaMarca;
    for (const linha of linhas) {
      cursor += entrelinha;
      partes.push(texto(linha, inicioDados, cursor, tamanhoTitulo, { ancora: "start" }));
    }
    cursor += T.espacoPequeno;
    if (modelo === "etiqueta") {
      cursor += T.entrelinhaCompacta;
      partes.push(texto(linhaCompacta, inicioDados, cursor, T.numeroCompacto, { ancora: "start", numeros: true, cor: tema.ouro }));
    } else {
      partes.push(metricasColunas(cursor, inicioDados, T.numeroPlaca, T.blocoMetricasPlaca));
      cursor += T.blocoMetricasPlaca;
    }
    // A marca ocupa a coluna esquerda e se centraliza ao crescer a lista.
    cursor = Math.max(cursor, margem + T.logoAltura);
    partes.push(logo(margem + (cursor - margem - T.logoAltura) / 2, margem));
  } else if (bilhete) {
    partes.push(logo(cursor));
    cursor += T.logoAltura + T.espacoPequeno;
    titulo();
    cursor += T.espaco;
    for (const { valor, rotulo } of dados) {
      partes.push(texto(valor, margem, cursor + T.numeroBilhete, T.numeroBilhete, { ancora: "start", numeros: true }), texto(rotulo, larguraConteudo - margem, cursor + T.numeroBilhete, T.rotuloBilhete, { ancora: "end", peso: 500 }));
      cursor += T.blocoMetricaBilhete;
    }
  } else if (compacto) {
    titulo();
    cursor += T.entrelinhaCompacta + T.espacoPequeno;
    partes.push(texto(linhaCompacta, meio, cursor, T.numeroCompacto, { numeros: true }));
    cursor += T.espaco;
    partes.push(logo(cursor));
    cursor += T.logoAltura;
  } else if (lateral) {
    partes.push(`<path d="M${margem} ${cursor} V${cursor + T.logoAltura}" stroke="${xml(tema.ouro)}" stroke-width="${T.filete}"/>`, logo(cursor));
    cursor += T.logoAltura + T.espacoPequeno;
    titulo();
    cursor += T.espaco;
    for (const { valor, rotulo } of dados) {
      partes.push(texto(valor, meio, cursor + T.numeroLateral, T.numeroLateral, { cor: tema.ouro, numeros: true }), texto(rotulo, meio, cursor + T.blocoMetricaLateral - T.espacoPequeno, T.rotulo, { peso: 500 }));
      cursor += T.blocoMetricaLateral;
    }
  } else if (modelo === "arco") {
    const primeira = linhas[0];
    const caminho = `M${margem} ${cursor + T.arcoLinhaBase} Q${meio} ${cursor - T.arcoAltura} ${larguraConteudo - margem} ${cursor + T.arcoLinhaBase}`;
    partes.push(`<defs><path id="titulo-arco" d="${caminho}"/></defs><text font-family="${xml(tema.fonte)}" font-size="${tamanhoTitulo}" font-weight="800" text-anchor="middle" fill="${xml(tema.ouro)}"><textPath href="#titulo-arco" startOffset="50%">${xml(primeira)}</textPath></text>`);
    cursor += T.arcoLinhaBase;
    for (const linha of linhas.slice(1)) {
      cursor += entrelinha;
      partes.push(texto(linha, meio, cursor, tamanhoTitulo, { cor: tema.ouro }));
    }
    cursor += T.espaco;
    partes.push(metricasColunas(cursor));
    cursor += T.blocoMetricas + T.espaco;
    partes.push(logo(cursor));
    cursor += T.logoAltura;
  } else if (modelo === "anatomico") {
    partes.push(logo(cursor));
    cursor += T.logoAltura + T.espacoPequeno;
    titulo();
    cursor += T.espaco;
    const a = T.anatomia;
    const larguraMapas = a.larguraVista * 2 + a.intervalo;
    partes.push(`<g transform="translate(${(larguraConteudo - larguraMapas) / 2} ${cursor})">${desenharAnatomia(grupos, tema.ouro, tema.branco, xml)}</g>`);
    cursor += a.altura;
    const inicioMapas = (larguraConteudo - larguraMapas) / 2;
    partes.push(texto(t("Frente", idioma), inicioMapas + a.larguraVista / 2, cursor, a.rotulo, { peso: 500 }), texto(t("Costas", idioma), inicioMapas + a.larguraVista + a.intervalo + a.larguraVista / 2, cursor, a.rotulo, { peso: 500 }));
    cursor += T.espacoPequeno;
    partes.push(metricasColunas(cursor));
    cursor += T.blocoMetricas;
  } else {
    titulo();
    cursor += T.espaco;
    if (editorial) {
      for (const { valor, rotulo } of dados) {
        cursor += T.entrelinha;
        partes.push(texto(`${valor} ${rotulo}`, margem, cursor, T.titulo, { ancora: "start", italico: true, numeros: true }));
      }
    } else {
      partes.push(metricasColunas(cursor));
      cursor += T.blocoMetricas;
    }
    cursor += T.espaco;
    partes.push(logo(cursor, editorial ? margem : meio - T.logoLargura / 2));
    cursor += T.logoAltura;
  }

  const alturaConteudo = cursor + margem;
  let fundo = "";
  if (modelo === "placa") {
    const c = T.chanfro;
    fundo = `<path d="M${c} 0 H${larguraConteudo - c} L${larguraConteudo} ${c} V${alturaConteudo - c} L${larguraConteudo - c} ${alturaConteudo} H${c} L0 ${alturaConteudo - c} V${c} Z" fill="${xml(tema.preto)}" stroke="${xml(tema.ouro)}" stroke-width="${T.filete}"/>`;
  } else if (modelo === "etiqueta") {
    fundo = `<rect width="${larguraConteudo}" height="${alturaConteudo}" rx="${T.raio}" fill="${xml(tema.preto)}"/>`;
  } else if (modelo === "bilhete") {
    // Recortes transparentes reais: a máscara não pinta a foto por baixo.
    const recortes = Array.from({ length: Math.floor(larguraConteudo / T.bilhetePasso) }, (_, i) => {
      const x = T.bilhetePasso * (i + 0.5);
      return `<circle cx="${x}" cy="0" r="${T.recorte}" fill="black"/><circle cx="${x}" cy="${alturaConteudo}" r="${T.recorte}" fill="black"/>`;
    }).join("");
    fundo = `<defs><mask id="recortes-bilhete"><rect width="${larguraConteudo}" height="${alturaConteudo}" fill="white"/>${recortes}</mask></defs><rect width="${larguraConteudo}" height="${alturaConteudo}" fill="${xml(tema.papel)}" mask="url(#recortes-bilhete)"/>`;
  }
  const largura = larguraConteudo + T.paddingSombra * 2;
  const altura = alturaConteudo + T.paddingSombra * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img"><title>${xml(nomes.join(" · "))}</title><defs><filter id="sombra-sticker" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="${T.sombraDesvio}" stdDeviation="${T.sombraBlur}" flood-color="${xml(tema.sombra)}"/></filter></defs><g transform="translate(${T.paddingSombra} ${T.paddingSombra})" filter="url(#sombra-sticker)">${fundo}${partes.join("")}</g></svg>`;
  return { svg, largura, altura };
}
