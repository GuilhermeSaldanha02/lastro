"use client";
import { useEffect, useState } from "react";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import type { Idioma } from "@/lib/dados/idioma";
import { MODELOS_STICKER, type ModeloSticker } from "./modelos";
import { carregarLogoSticker, gerarPngSticker, lerTemaSticker } from "./imagem";

type ImagemSticker = { blob: Blob; url: string };
const CHAVE_MODELO = "lastro-sticker-modelo";

export function useStickers(metricas: MetricasSessao, idioma: Idioma) {
  const [modelo, setModelo] = useState<ModeloSticker>("minimalista");
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState<{ metricas: MetricasSessao; idioma: Idioma; tentativa: number; imagens: Partial<Record<ModeloSticker, ImagemSticker>>; erro: boolean } | null>(null);
  const atual = resultado?.metricas === metricas && resultado.idioma === idioma && resultado.tentativa === tentativa;
  const imagens = atual ? resultado.imagens : {};
  const erro = atual ? resultado.erro : false;
  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      try {
        const salvo = localStorage.getItem(CHAVE_MODELO);
        if (ativo && MODELOS_STICKER.some((item) => item.id === salvo)) setModelo(salvo as ModeloSticker);
      } catch { /* A escolha funciona mesmo sem armazenamento local. */ }
    });
    return () => { ativo = false; };
  }, []);
  useEffect(() => {
    let ativo = true;
    const urls: string[] = [];
    async function preparar() {
      try {
        const logo = await carregarLogoSticker();
        const tema = lerTemaSticker();
        const imagensProntas: Partial<Record<ModeloSticker, ImagemSticker>> = {};
        // Rasterizar um por vez limita o pico de memória no celular.
        for (const { id } of MODELOS_STICKER) {
          const blob = await gerarPngSticker(id, metricas, idioma, logo, tema);
          if (!ativo) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          imagensProntas[id] = { blob, url };
        }
        if (ativo) setResultado({ metricas, idioma, tentativa, imagens: imagensProntas, erro: false });
      } catch {
        if (ativo) setResultado({ metricas, idioma, tentativa, imagens: {}, erro: true });
      }
    }
    void preparar();
    return () => { ativo = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [metricas, idioma, tentativa]);
  function escolher(id: ModeloSticker) {
    setModelo(id);
    try { localStorage.setItem(CHAVE_MODELO, id); } catch { /* Opcional. */ }
  }
  return { modelo, escolher, imagens, imagem: imagens[modelo], erro, repetir: () => setTentativa((valor) => valor + 1) };
}
