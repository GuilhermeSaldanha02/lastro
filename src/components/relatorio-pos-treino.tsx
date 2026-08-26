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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function concluirTreino() {
    onFechar();
    router.push("/treino");
  }

  /**
   * Gera a imagem PNG em alta resolução (1080x1080) com fundo 100% transparente
   * e o logo do LASTRO, pronta para ser colada como sticker no Instagram Story.
   */
  async function gerarBlobImagemTransparente(): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Garante que o fundo é 100% transparente (sem preenchimento)
    ctx.clearRect(0, 0, 1080, 1080);

    // Tipografia e Cores
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 1. Métrica 1: Carga Total / Tonelagem
    ctx.font = "600 36px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(t("Carga Total", idioma).toUpperCase(), 540, 180);

    ctx.font = "800 84px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${metricas.tonelagemTotalKg.toLocaleString("pt-BR")} kg`, 540, 255);

    // 2. Métrica 2: Séries Válidas
    ctx.font = "600 36px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(t("Séries Válidas", idioma).toUpperCase(), 540, 390);

    ctx.font = "800 84px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${metricas.totalSeriesValendo} séries`, 540, 465);

    // 3. Métrica 3: Tempo / Duração
    ctx.font = "600 36px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(t("Tempo", idioma).toUpperCase(), 540, 600);

    ctx.font = "800 84px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${metricas.duracaoMinutos} min`, 540, 675);

    // 4. Logo Oficial do LASTRO no Rodapé
    try {
      const imgLogo = new Image();
      imgLogo.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        imgLogo.onload = () => resolve();
        imgLogo.onerror = () => resolve(); // continua se der erro
        imgLogo.src = "/logo-lastro.png";
      });

      if (imgLogo.complete && imgLogo.naturalWidth > 0) {
        const logoSize = 130;
        ctx.drawImage(imgLogo, 540 - logoSize / 2, 780, logoSize, logoSize);
      }
    } catch {
      // Ignora erro no carregamento da imagem
    }

    // Marca textual LASTRO
    ctx.font = "900 48px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#D4AF37"; // Ouro champagne assinatura
    ctx.letterSpacing = "6px";
    ctx.fillText("LASTRO", 540, 945);

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
        // Fallback: download
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
      // Usuário cancelou ou navegador não suporta
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

            {/* Logo do Lastro Atual */}
            <div className="pos-treino-logo-box">
              <img
                src="/logo-lastro.png"
                alt="LASTRO"
                className="pos-treino-logo-img"
                width={50}
                height={50}
              />
              <span className="pos-treino-logo-txt">LASTRO</span>
            </div>
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
                📸
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
                📋
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
                ⬇️
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
                📤
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
