"use client";

import { useId, useState } from "react";
import { useStickers } from "@/lib/stickers/use-stickers";
import { MODELOS_STICKER } from "@/lib/stickers/modelos";
import { useRouter } from "next/navigation";
import type { MetricasSessao } from "@/lib/dados/metricas-treino";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { posicoesDaBarra, type ComparacaoPadrao } from "@/lib/analise/fora-do-padrao";
import { formatarToneladas, textosBlocoPadrao } from "@/lib/analise/texto-fora-do-padrao";

type RelatorioPosTreinoProps = {
  metricas: MetricasSessao;
  idioma: Idioma;
  onFechar: () => void;
  /**
   * AN-08 B1: a sessão contra o padrão do próprio usuário. Só a tela de
   * treino passa isto, logo depois de finalizar; os relatórios reabertos
   * pelo histórico não passam (lá o padrão teria de ser o daquela época).
   */
  comparacao?: ComparacaoPadrao | null;
};

export default function RelatorioPosTreino({
  metricas,
  idioma,
  onFechar,
  comparacao,
}: RelatorioPosTreinoProps) {
  const router = useRouter();
  const tituloId = useId();
  const stickers = useStickers(metricas, idioma);
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

  async function gerarBlobImagemTransparente(): Promise<Blob | null> {
    return stickers.imagem?.blob ?? null;
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
        title: t("Treino LASTRO", idioma),
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
    <div className="pos-treino-overlay" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
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
          <span className="pos-treino-share-titulo" id={tituloId}>
            {t("Compartilhar Treino", idioma)}
          </span>
          <div className="pos-treino-header-espaco" />
        </div>

        <div className={`pos-treino-previa${mostrandoTransparencia ? " pos-treino-previa--xadrez" : ""}`} aria-busy={!stickers.imagem && !stickers.erro}>
          {stickers.imagem ? (
            <img src={stickers.imagem.url} alt={t("Prévia do sticker do treino", idioma)} className="pos-treino-previa-imagem" />
          ) : stickers.erro ? (
            <div role="alert">
              <p>{t("Não foi possível gerar a imagem do treino.", idioma)}</p>
              <button type="button" className="botao-secundario" onClick={stickers.repetir}>{t("Tentar novamente", idioma)}</button>
            </div>
          ) : <span role="status">{t("Carregando...", idioma)}</span>}
        </div>
        <p className="pos-treino-sticker-ajuda">{t("Escolha o sticker para colocar sobre sua foto no Story.", idioma)}</p>
        <div className="pos-treino-modelos" role="group" aria-label={t("Modelo do sticker", idioma)}>
          {MODELOS_STICKER.map(({ id, nome }) => (
            <button key={id} type="button" className="pos-treino-modelo" aria-pressed={stickers.modelo === id} onClick={() => stickers.escolher(id)} disabled={!stickers.imagens[id]}>
              {stickers.imagens[id] && <img src={stickers.imagens[id]!.url} alt="" className="pos-treino-modelo-imagem" />}
              <span>{t(nome, idioma)}</span>
            </button>
          ))}
        </div>

        {/* AN-08 B1 (direção C do portão de 2026-09-29): fora do cartão
            acima de propósito, para não sair na imagem compartilhada. Só
            aparece quando a sessão ficou fora do padrão; sem rede, sem
            padrão ou dentro dele, a tela fica como sempre foi. */}
        {comparacao && comparacao.direcao !== "dentro" && (() => {
          const textos = textosBlocoPadrao(comparacao, idioma);
          const barra = posicoesDaBarra(comparacao);
          return (
            <section className="pos-treino-padrao">
              <span className="pos-treino-padrao__rotulo">{textos.rotulo}</span>
              <div className="pos-treino-padrao__numeros">
                <span className="pos-treino-padrao__volume">{formatarToneladas(comparacao.volume, idioma)}</span>
                <span className={`pos-treino-padrao__pct pos-treino-padrao__pct--${comparacao.direcao}`}>{textos.pct}</span>
              </div>
              <div className="pos-treino-padrao__barra" aria-hidden="true">
                <div
                  className={`pos-treino-padrao__sessao pos-treino-padrao__sessao--${comparacao.direcao}`}
                  style={{ width: `${barra.sessao}%` }}
                />
                <div className="pos-treino-padrao__marca" style={{ left: `${barra.padrao}%` }} />
              </div>
              <div className="pos-treino-padrao__legenda">
                <span>{textos.legenda}</span>
                <span>{textos.janela}</span>
              </div>
            </section>
          );
        })()}

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
              disabled={!stickers.imagem || salvando}
              title={t("Copiar imagem transparente", idioma)}
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
              disabled={!stickers.imagem || salvando}
              title={t("Salvar imagem transparente", idioma)}
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
              disabled={!stickers.imagem || salvando}
              title={t("Mais opções de compartilhamento", idioma)}
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
