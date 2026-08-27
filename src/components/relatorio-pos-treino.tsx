"use client";

import { useState } from "react";
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
  const [salvando, setSalvando] = useState(false);
  /**
   * Resultado da última ação de compartilhar. Substitui o `copiado`
   * booleano, que só sabia dizer "deu certo" — e por isso todo caminho de
   * falha terminava mudo (achado do dono, 2026-08-27).
   *
   * `atencao` é âmbar, nunca `--lastro-erro`: não conseguir copiar um
   * sticker não é falha do treino nem culpa de quem tocou. Mesmo
   * raciocínio de D7 e de DESIGN.md §3.6.6.
   */
  const [aviso, setAviso] = useState<{
    texto: string;
    tom: "ok" | "atencao";
  } | null>(null);

  /** Xadrez de transparência: só durante a ação, nunca em repouso. */
  const [mostrandoTransparencia, setMostrandoTransparencia] = useState(false);

  function avisar(texto: string, tom: "ok" | "atencao") {
    setAviso({ texto, tom });
    window.setTimeout(() => setAviso(null), 4000);
  }

  /** Revela o fundo transparente por alguns segundos — chamado por quem
   *  entrega o arquivo (copiar/salvar/compartilhar), nunca no render. */
  function revelarTransparencia() {
    setMostrandoTransparencia(true);
    window.setTimeout(() => setMostrandoTransparencia(false), 3500);
  }

  function concluirTreino() {
    onFechar();
    router.push("/treino");
  }

  /**
   * Gera a imagem PNG em alta resolução (1080x1080) com fundo 100% transparente
   * com fidelidade visual 1:1 ao preview:
   * - Topo: Brasão oficial dourado do LASTRO
   * - Hero: "SESSÃO FINALIZADA" + "91 min"
   * - Divisor dourado com seta vetorial
   * - 3 Colunas: Séries, Exercícios e Foco/Divisão
   * - Rodapé: Frase sutil de assinatura + Badge dourado do treino
   */
  async function gerarBlobImagemTransparente(): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fundo 100% transparente (alpha 0)
    ctx.clearRect(0, 0, 1080, 1080);

    const startX = 100;
    const endX = 1080 - 100;

    // Sombra suave e nítida para contraste sobre qualquer foto/vídeo no Instagram
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // 1. Logotipo Oficial do LASTRO no Topo Esquerdo
    try {
      const imgLogo = new Image();
      imgLogo.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        imgLogo.onload = () => resolve();
        imgLogo.onerror = () => resolve();
        imgLogo.src = "/logo-lastro.png";
      });

      if (imgLogo.complete && imgLogo.naturalWidth > 0) {
        const logoSize = 135;
        const logoX = startX;
        const logoY = 90;

        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 16;
        ctx.drawImage(imgLogo, logoX, logoY, logoSize, logoSize);
      }
    } catch {
      // Continua sem quebrar se a imagem falhar
    }

    // 2. SESSÃO FINALIZADA
    const ySessao = 260;
    ctx.font = "800 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.letterSpacing = "4px";
    ctx.fillText(t("SESSÃO FINALIZADA", idioma).toUpperCase(), startX, ySessao);

    // 3. TEMPO EM DESTAQUE (Hero)
    const yTempo = ySessao + 46;
    ctx.font = "900 135px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.letterSpacing = "-3px";
    ctx.fillText(`${metricas.duracaoMinutos} min`, startX, yTempo);

    // 4. DIVISOR DOURADO COM SETA
    const yDivisor = yTempo + 185;
    ctx.strokeStyle = "#D4AF37"; // Dourado champagne
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(startX, yDivisor);
    ctx.lineTo(endX, yDivisor);
    ctx.stroke();

    // Seta vetorial na ponta direita
    ctx.fillStyle = "#D4AF37";
    ctx.beginPath();
    ctx.moveTo(endX - 16, yDivisor - 9);
    ctx.lineTo(endX + 2, yDivisor);
    ctx.lineTo(endX - 16, yDivisor + 9);
    ctx.closePath();
    ctx.fill();

    // 5. LINHA DE ESTATÍSTICAS (3 COLUNAS)
    const yStats = yDivisor + 45;

    // Coluna 1: Séries
    ctx.font = "900 78px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.letterSpacing = "-1px";
    ctx.textAlign = "left";
    const totalSeriesStr = String(metricas.totalSeriesValendo);
    ctx.fillText(totalSeriesStr, startX, yStats);
    const seriesNumWidth = ctx.measureText(totalSeriesStr).width;

    ctx.font = "800 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#D4AF37";
    ctx.letterSpacing = "2px";
    ctx.fillText(t("SÉRIES", idioma).toUpperCase(), startX + seriesNumWidth + 14, yStats + 48);

    // Coluna 2: Exercícios
    const xEx = startX + 330;
    ctx.font = "900 78px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.letterSpacing = "-1px";
    const totalExStr = String(metricas.totalExercicios);
    ctx.fillText(totalExStr, xEx, yStats);
    const exNumWidth = ctx.measureText(totalExStr).width;

    ctx.font = "800 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#D4AF37";
    ctx.letterSpacing = "2px";
    ctx.fillText(t("EXERCÍCIOS", idioma).toUpperCase(), xEx + exNumWidth + 14, yStats + 48);

    // Coluna 3: Grupo Muscular / Foco (alinhado à direita)
    const focoTexto = (metricas.focoOuDivisao || "TREINO").toUpperCase();
    ctx.font = "900 48px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.letterSpacing = "2px";
    ctx.textAlign = "right";
    ctx.fillText(focoTexto, endX, yStats + 22);

    // 6. RODAPÉ (Frase de assinatura + Badge Código)
    const yRodape = yStats + 180;

    // Lado esquerdo: Frase de assinatura
    ctx.textAlign = "left";
    ctx.font = "500 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.letterSpacing = "0px";
    const fraseTexto = t(metricas.fraseAssinatura || "Mais uma sessão no histórico.", idioma);
    ctx.fillText(fraseTexto, startX, yRodape + 14);

    // Lado direito: Badge Retangular Dourado
    const badgeTexto = (metricas.identificadorTreino || "TREINO 404B").toUpperCase();
    ctx.font = "800 22px system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "3px";
    const badgeTextWidth = ctx.measureText(badgeTexto).width;
    const badgeW = badgeTextWidth + 34;
    const badgeH = 46;
    const badgeX = endX - badgeW;
    const badgeY = yRodape;

    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    ctx.fillStyle = "#D4AF37";
    ctx.textAlign = "center";
    ctx.fillText(badgeTexto, badgeX + badgeW / 2, badgeY + 12);
    ctx.textAlign = "left";

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  /**
   * Copia a imagem transparente para a área de transferência (Clipboard)
   * para colar diretamente no Story do Instagram.
   */
  /**
   * Copiar o sticker para a área de transferência.
   *
   * Antes: em qualquer falha caía no `salvarImagem()` sem dizer nada, e o
   * `setCopiado(true)` só existia no ramo de sucesso — ou seja, o botão
   * "Copiar" **trocava silenciosamente de ação** e baixava um arquivo que
   * a pessoa não pediu, sem um único aviso na tela (achado do dono,
   * 2026-08-27). A permissão de escrever imagem no clipboard é negada por
   * padrão em vários navegadores, então esse ramo é o comum, não o raro.
   *
   * Agora toda saída termina em aviso. O fallback continua existindo — é
   * melhor que nada — mas passa a ser anunciado, nunca substituído às
   * escondidas.
   */
  async function copiarParaClipboard() {
    revelarTransparencia();
    const blob = await gerarBlobImagemTransparente();
    if (!blob) {
      avisar(t("Não foi possível gerar a imagem do treino.", idioma), "atencao");
      return;
    }

    const temClipboardDeImagem =
      typeof navigator.clipboard?.write === "function" &&
      typeof ClipboardItem !== "undefined";

    if (temClipboardDeImagem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        avisar(t("Sticker copiado! Cole no Story do Instagram.", idioma), "ok");
        return;
      } catch (erro) {
        console.warn("Clipboard recusou a imagem:", erro);
      }
    }

    const salvou = await baixarBlob(blob);
    avisar(
      salvou
        ? t("Seu aparelho não deixou copiar. A imagem foi salva.", idioma)
        : t("Não foi possível copiar nem salvar a imagem.", idioma),
      "atencao",
    );
  }

  /**
   * Faz o download do arquivo PNG transparente.
   */
  /** Dispara o download. Separado de `salvarImagem` para os outros
   *  caminhos poderem reaproveitá-lo como fallback ANUNCIADO. */
  async function baixarBlob(blob: Blob): Promise<boolean> {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lastro-treino-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (erro) {
      console.warn("Falha ao baixar a imagem:", erro);
      return false;
    }
  }

  async function salvarImagem() {
    revelarTransparencia();
    setSalvando(true);
    try {
      const blob = await gerarBlobImagemTransparente();
      if (!blob) {
        avisar(t("Não foi possível gerar a imagem do treino.", idioma), "atencao");
        return;
      }
      const salvou = await baixarBlob(blob);
      avisar(
        salvou
          ? t("Imagem salva no aparelho.", idioma)
          : t("Não foi possível salvar a imagem.", idioma),
        salvou ? "ok" : "atencao",
      );
    } finally {
      setSalvando(false);
    }
  }

  /**
   * Compartilha via Web Share API
   */
  /**
   * Compartilhar pela folha nativa do sistema — no celular é ESTE o
   * caminho que chega ao Instagram de verdade.
   *
   * O `catch {}` de antes engolia tudo em silêncio: sem folha nativa
   * (navegador de PC) e com o clipboard recusando, o toque não produzia
   * nada visível. Fechar a sessão sem `navigator.share` é caso normal, não
   * defeito, então a cadeia de fallback fica — só deixa de ser muda.
   */
  async function compartilharNativo() {
    revelarTransparencia();
    const blob = await gerarBlobImagemTransparente();
    if (!blob) {
      avisar(t("Não foi possível gerar a imagem do treino.", idioma), "atencao");
      return;
    }

    const arquivo = new File([blob], "lastro-treino.png", { type: "image/png" });
    const podeCompartilhar =
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [arquivo] });

    if (!podeCompartilhar) {
      await copiarParaClipboard();
      return;
    }

    try {
      await navigator.share({
        files: [arquivo],
        title: "Treino LASTRO",
        text: `${t("Tempo", idioma)}: ${metricas.duracaoMinutos} min · ${t("Séries Válidas", idioma)}: ${metricas.totalSeriesValendo}`,
      });
    } catch (erro) {
      // Fechar a folha de compartilhamento é escolha da pessoa, não erro:
      // avisar aqui seria acusar quem desistiu de propósito.
      if ((erro as Error)?.name === "AbortError") return;
      console.warn("Compartilhamento nativo falhou:", erro);
      await copiarParaClipboard();
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

        {/* Card Central com Preview 1:1 ao arquivo gerado.
            O xadrez de transparência é jargão de editor de imagem: para
            quem acabou de treinar ele só suja o cartão. Por padrão o
            preview aparece limpo, e o xadrez entra por alguns segundos
            SÓ quando a pessoa copia ou salva — que é o momento em que
            saber "o fundo vai sair transparente" importa de verdade
            (pedido do dono, 2026-08-27). */}
        <div
          className={`pos-treino-card-transparente-wrapper${
            mostrandoTransparencia ? " pos-treino-card-transparente-wrapper--xadrez" : ""
          }`}
        >
          {mostrandoTransparencia && (
            <div className="pos-treino-tag-transparente">
              <span>{t("Fundo transparente", idioma)}</span>
            </div>
          )}

          <div className="pos-treino-strava-conteudo pos-treino-sticker-novo">
            {/* Topo: Logo no Canto Superior Esquerdo */}
            <div className="pos-treino-sticker-logo-wrapper">
              <img
                src="/logo-lastro.png"
                alt="LASTRO"
                className="pos-treino-sticker-logo-img"
                width={52}
                height={52}
              />
            </div>

            {/* Bloco Hero */}
            <div className="pos-treino-sticker-hero">
              <span className="pos-treino-sticker-sessao-label">
                {t("SESSÃO FINALIZADA", idioma)}
              </span>
              <span className="pos-treino-sticker-tempo-destaque">
                {metricas.duracaoMinutos} min
              </span>
            </div>

            {/* Linha Divisória Dourada com Seta */}
            <div className="pos-treino-sticker-divisor" aria-hidden="true">
              <div className="pos-treino-sticker-divisor-traco" />
              <svg
                className="pos-treino-sticker-divisor-seta"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <path d="M1 1L9 5L1 9V1Z" />
              </svg>
            </div>

            {/* Linha das 3 Estatísticas */}
            <div className="pos-treino-sticker-stats-grid">
              <div className="pos-treino-sticker-stat-col">
                <span className="pos-treino-sticker-stat-num">{metricas.totalSeriesValendo}</span>
                <span className="pos-treino-sticker-stat-label">{t("SÉRIES", idioma)}</span>
              </div>
              <div className="pos-treino-sticker-stat-col">
                <span className="pos-treino-sticker-stat-num">{metricas.totalExercicios}</span>
                <span className="pos-treino-sticker-stat-label">{t("EXERCÍCIOS", idioma)}</span>
              </div>
              <div className="pos-treino-sticker-stat-foco">
                {metricas.focoOuDivisao || "TREINO"}
              </div>
            </div>

            {/* Rodapé: Frase + Badge */}
            <div className="pos-treino-sticker-rodape">
              <span className="pos-treino-sticker-frase">
                {t(metricas.fraseAssinatura || "Mais uma sessão no histórico.", idioma)}
              </span>
              <div className="pos-treino-sticker-badge">
                {metricas.identificadorTreino || "TREINO 404B"}
              </div>
            </div>
          </div>
        </div>

        {/* Resultado da última ação — sucesso E falha. `aria-live` porque
            quem usa leitor de tela precisa saber o que aconteceu tanto
            quanto quem enxerga o toast. */}
        {aviso && (
          <div
            className={`pos-treino-toast-copiado pos-treino-toast-copiado--${aviso.tom}`}
            role="status"
            aria-live="polite"
          >
            {aviso.texto}
          </div>
        )}

        {/* Rodapé de Ações: Share to */}
        <div className="pos-treino-share-footer">
          <span className="pos-treino-share-to-label">
            {t("Compartilhar com", idioma)}
          </span>

          <div className="pos-treino-botoes-share-grid">
            {/* O botão "Instagram Story" saiu a pedido do dono
                (2026-08-27). Ele chamava exatamente a mesma função de
                "Copiar" — a web não abre o Story de terceiro com imagem —,
                então prometia pela marca e pelo logo colorido algo que
                nenhum navegador entrega. Quem quer o Story usa "Mais", que
                abre a folha nativa do sistema e ali sim tem o Instagram.
                Sobram três ações, cada uma fazendo o que o rótulo diz. */}

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
              {/* O rótulo não vira "Copiado!" sozinho: quem conta o
                  desfecho é o aviso acima, que sabe distinguir copiado de
                  salvo-porque-não-deu-pra-copiar. */}
              <span className="pos-treino-rotulo-acao">{t("Copiar", idioma)}</span>
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
                {t(salvando ? "Salvando..." : "Salvar", idioma)}
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
              <span className="pos-treino-rotulo-acao">{t("Mais", idioma)}</span>
            </button>
          </div>

          {/* Botão de Fechar e Concluir */}
          <button
            type="button"
            className="botao-primario"
            onClick={concluirTreino}
            style={{ width: "100%", marginTop: "var(--lastro-e-3)", borderRadius: "var(--lastro-raio-pilula)" }}
          >
            {t("Concluir e Voltar ao Início", idioma)}
          </button>
        </div>
      </div>
    </div>
  );
}
