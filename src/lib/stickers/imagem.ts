import { gerarSvgSticker, type ModeloSticker, type TemaSticker } from "./modelos";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import type { Idioma } from "@/lib/dados/idioma";

export async function carregarLogoSticker(): Promise<string> {
  const resposta = await fetch("/logo-lastro.png");
  if (!resposta.ok) throw new Error("Logo indisponível");
  const blob = await resposta.blob();
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Falha ao ler logo"));
    leitor.readAsDataURL(blob);
  });
}

export function lerTemaSticker(): TemaSticker {
  const estilo = getComputedStyle(document.documentElement);
  const valor = (nome: string) => {
    const resultado = estilo.getPropertyValue(`--lastro-sticker-${nome}`).trim();
    if (!resultado) throw new Error(`Token ausente: ${nome}`);
    return resultado;
  };
  return { ouro: valor("ouro"), branco: valor("branco"), preto: valor("preto"), papel: valor("papel"), sombra: valor("sombra"), fonte: valor("fonte"), fonteNumeros: valor("fonte-num") };
}

/** O mesmo PNG alimenta a prévia e todas as formas de exportação. */
export async function gerarPngSticker(modelo: ModeloSticker, metricas: MetricasSessao, idioma: Idioma, logo: string, tema: TemaSticker): Promise<Blob> {
  const { svg, largura, altura } = gerarSvgSticker(modelo, metricas, idioma, logo, tema);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  let canvas: HTMLCanvasElement | undefined;
  try {
    const imagem = new Image();
    await new Promise<void>((resolve, reject) => {
      imagem.onload = () => resolve();
      imagem.onerror = () => reject(new Error("Falha ao renderizar sticker"));
      imagem.src = url;
    });
    canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = Math.ceil(altura * canvas.width / largura);
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Canvas indisponível");
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const canvasPronto = canvas;
    return await new Promise<Blob>((resolve, reject) => canvasPronto.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao exportar sticker")), "image/png"));
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    URL.revokeObjectURL(url);
  }
}
