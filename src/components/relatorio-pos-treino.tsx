"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type RelatorioPosTreinoProps = {
  metricas: MetricasSessao;
  idioma: Idioma;
  onFechar: () => void;
};

export default function RelatorioPosTreino({
  metricas,
  idioma,
  onFechar,
}: RelatorioPosTreinoProps) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function concluirTreino() {
    onFechar();
    router.push("/treino");
  }

  /**
   * Gera a imagem PNG em alta resolução (1080x1080) com fundo 100% transparente
   * e o logo do LASTRO destacado no canto inferior direito.
   */
  async function gerarBlobImagemTransparente(): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fundo 100% transparente
    ctx.clearRect(0, 0, 1080, 1080);

    // 1. Métricas no lado esquerdo (Estilo Strava)
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const startX = 110;

    // Carga Total / Tonelagem
    ctx.font = "700 34px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(t("Carga Total", idioma).toUpperCase(), startX, 220);

    ctx.font = "900 92px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${metricas.tonelagemTotalKg.toLocaleString("pt-BR")} kg`, startX, 300);

    // Séries Válidas
    ctx.font = "700 34px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(t("Séries Válidas", idioma).toUpperCase(), startX, 450);

    ctx.font = "900 92px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${metricas.totalSeriesValendo} séries`, startX, 530);

    // Tempo de Treino
    ctx.font = "700 34px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(t("Tempo", idioma).toUpperCase(), startX, 680);

    ctx.font = "900 92px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${metricas.duracaoMinutos} min`, startX, 760);

    // 2. Logo Oficial do LASTRO Ampliado no Canto Inferior Direito
    try {
      const imgLogo = new Image();
      imgLogo.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        imgLogo.onload = () => resolve();
        imgLogo.onerror = () => resolve();
        imgLogo.src = "/logo-lastro.png";
      });

      if (imgLogo.complete && imgLogo.naturalWidth > 0) {
        const logoSize = 180;
        const logoX = 1080 - logoSize - 100;
        const logoY = 1080 - logoSize - 140;
        ctx.drawImage(imgLogo, logoX, logoY, logoSize, logoSize);

        // Marca textual LASTRO
        ctx.textAlign = "center";
        ctx.font = "900 40px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#D4AF37"; // Ouro champagne
        ctx.letterSpacing = "6px";
        ctx.fillText("LASTRO", logoX + logoSize / 2, logoY + logoSize + 40);
      }
    } catch {
      // Ignora erro de imagem se offline
    }

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  /**
   * Copia a imagem transparente para a área de transferência (Clipboard)
   * para colar diretamente no Story do Instagram.
   */
  async function copiarParaClipboard() {
    try {
      const blob = await gerarBlobImagemTransparente();
      if (!blob) return;

      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      } else {
        salvarImagem();
      }
    } catch (err) {
      console.warn("Erro ao copiar imagem:", err);
      salvarImagem();
    }
  }

  /**
   * Faz o download do arquivo PNG transparente.
   */
  async function salvarImagem() {
    setSalvando(true);
    try {
      const blob = await gerarBlobImagemTransparente();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lastro-treino-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setSalvando(false);
    }
  }

  /**
   * Compartilha via Web Share API
   */
  async function compartilharNativo() {
    try {
      const blob = await gerarBlobImagemTransparente();
      if (!blob) return;
      const file = new File([blob], "lastro-treino.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Treino LASTRO",
          text: `Carga total: ${metricas.tonelagemTotalKg} kg | Duração: ${metricas.duracaoMinutos} min`,
        });
      } else {
        await copiarParaClipboard();
      }
    } catch {
      // Cancelado ou não suportado
    }
  }

  return (
    <div className="pos-treino-overlay" role="dialog" aria-modal="true">
      <div className="pos-treino-share-container">
        {/* Barra de Topo */}
        <div className="pos-treino-share-header">
          <button
            type="button"
            className="pos-treino-btn-fechar-topo"
            onClick={concluirTreino}
          >
            {t("Fechar", idioma)}
          </button>
          <span className="pos-treino-share-titulo">
            {t("Compartilhar Treino", idioma)}
          </span>
          <div style={{ width: "40px" }} />
        </div>

        {/* Card Central com Fundo Transparente (Padrão Xadrez Estilo Strava) */}
        <div className="pos-treino-card-transparente-wrapper">
          <div className="pos-treino-tag-transparente">
            <span>TRANSPARENT</span>
          </div>

          <div className="pos-treino-card-dados-flutuantes">
            {/* Carga Total */}
            <div className="pos-treino-dado-item">
              <span className="pos-treino-dado-rotulo">{t("Carga Total", idioma)}</span>
              <span className="pos-treino-dado-valor">
                {metricas.tonelagemTotalKg.toLocaleString("pt-BR")} kg
              </span>
            </div>

            {/* Séries Válidas */}
            <div className="pos-treino-dado-item">
              <span className="pos-treino-dado-rotulo">{t("Séries Válidas", idioma)}</span>
              <span className="pos-treino-dado-valor">
                {metricas.totalSeriesValendo} séries
              </span>
            </div>

            {/* Tempo */}
            <div className="pos-treino-dado-item">
              <span className="pos-treino-dado-rotulo">{t("Tempo", idioma)}</span>
              <span className="pos-treino-dado-valor">
                {metricas.duracaoMinutos} min
              </span>
            </div>
          </div>

          {/* Logo do Lastro Ampliado no Canto Inferior Direito */}
          <div className="pos-treino-logo-canto">
            <img
              src="/logo-lastro.png"
              alt="LASTRO"
              className="pos-treino-logo-canto__img"
              width={64}
              height={64}
            />
            <span className="pos-treino-logo-canto__txt">LASTRO</span>
          </div>
        </div>

        {/* Notificação / Toast de confirmação */}
        {copiado && (
          <div className="pos-treino-toast-copiado">
            ✨ Sticker copiado com fundo transparente! Cole no Instagram Story.
          </div>
        )}

        {/* Rodapé de Ações: Share to */}
        <div className="pos-treino-share-footer">
          <span className="pos-treino-share-to-label">
            {t("Compartilhar com", idioma)}
          </span>

          <div className="pos-treino-botoes-share-grid">
            {/* 1. Instagram Story */}
            <button
              type="button"
              className="pos-treino-btn-acao-share"
              onClick={copiarParaClipboard}
              title="Copiar sticker para o Instagram Story"
            >
              <div className="pos-treino-icone-circulo pos-treino-icone-instagram">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <span className="pos-treino-rotulo-acao">Instagram Story</span>
            </button>

            {/* 2. Copy to Clipboard */}
            <button
              type="button"
              className="pos-treino-btn-acao-share"
              onClick={copiarParaClipboard}
              title="Copiar imagem transparente"
            >
              <div className="pos-treino-icone-circulo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
              <span className="pos-treino-rotulo-acao">
                {copiado ? "Copiado!" : "Copiar"}
              </span>
            </button>

            {/* 3. Save */}
            <button
              type="button"
              className="pos-treino-btn-acao-share"
              onClick={salvarImagem}
              disabled={salvando}
              title="Salvar imagem transparente"
            >
              <div className="pos-treino-icone-circulo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span className="pos-treino-rotulo-acao">
                {salvando ? "Salvando..." : "Salvar"}
              </span>
            </button>

            {/* 4. More */}
            <button
              type="button"
              className="pos-treino-btn-acao-share"
              onClick={compartilharNativo}
              title="Mais opções de compartilhamento"
            >
              <div className="pos-treino-icone-circulo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <span className="pos-treino-rotulo-acao">Mais</span>
            </button>
          </div>

          {/* Botão de Fechar e Concluir */}
          <button
            type="button"
            className="botao-primario"
            onClick={concluirTreino}
            style={{ width: "100%", marginTop: "var(--lastro-e-4)", borderRadius: "var(--lastro-raio-pilula)" }}
          >
            {t("Concluir e Voltar ao Início", idioma)}
          </button>
        </div>
      </div>
    </div>
  );
}
