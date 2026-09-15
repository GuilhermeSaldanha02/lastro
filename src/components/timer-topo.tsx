"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { formatarMinutosSegundos } from "@/lib/audio/som-timer";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import {
  iniciarSessaoLocal,
  segundosDecorridos,
  temInicioLocal,
} from "@/lib/treino/marcos-treino";
import type { ControleDescansoReal } from "./use-descanso-real";

type TimerTopoProps = {
  treinoId: string;
  idioma: Idioma;
  duracaoPadraoSegundos?: number;
  /**
   * Duração reconstruída do BANCO (`iniciado_em` → última série), usada
   * quando não há marca de início neste aparelho. É o que impede o
   * cronômetro de contar do zero ao vivo num treino que não está
   * acontecendo aqui (relato de uso real, 2026-09-04).
   */
  duracaoReconstruidaSegundos: number;
  /**
   * O treino ainda não tem série nenhuma — foi criado agora e a sessão
   * começa aqui. É a ÚNICA condição em que este componente grava a marca
   * de início local.
   */
  sessaoComecaAqui: boolean;
  treinoFinalizado?: boolean;
  descanso: ControleDescansoReal;
};

/**
 * Fonte de mudança do cronômetro: um tique por segundo. `useSyncExternalStore`
 * chama isto para saber QUANDO reler o snapshot — o que ele lê é
 * `calcularSegundosTreino`. Fica fora do componente porque a identidade da
 * função precisa ser estável entre renders.
 */
function assinarSegundo(aoMudar: () => void): () => void {
  const id = setInterval(aoMudar, 1000);
  return () => clearInterval(id);
}

export default function TimerTopo({
  treinoId,
  idioma,
  duracaoPadraoSegundos = 90,
  duracaoReconstruidaSegundos,
  sessaoComecaAqui,
  treinoFinalizado = false,
  descanso,
}: TimerTopoProps) {
  // 1. Cronômetro Contínuo da Sessão de Treino (Persistido e Congelável)
  //
  // `useSyncExternalStore` é a ferramenta desenhada exatamente para isto:
  // um valor que vive FORA do React (localStorage + relógio) e precisa de
  // uma resposta diferente no servidor.
  //
  // As duas tentativas anteriores falharam cada uma de um jeito, e as duas
  // aparecem nos comentários acima por honestidade:
  //   · `useState(0)` + `setState` no corpo do efeito → encadeava render e
  //     reprovava o lint do CI (react-hooks/set-state-in-effect);
  //   · `useState(() => calcular…)` → o inicializador lê localStorage, que
  //     no servidor não existe: ao REABRIR um treino em andamento o
  //     servidor renderizava "00:00" e o cliente "02:15", e o React
  //     descartava a árvore inteira com erro de hidratação (achado do
  //     passo 13 do teste de jornada, 2026-08-27).
  // Aqui o servidor tem snapshot próprio (0) e o cliente lê o valor real
  // depois da hidratação, sem divergência e sem `setState` em efeito.
  // Com marca local, o cronômetro é da SESSÃO deste aparelho (ao vivo ou
  // congelado no fim). Sem marca, o app não tem como saber quando a sessão
  // acabou — então mostra a duração reconstruída do banco, PARADA, em vez
  // de fingir que está correndo. Era exatamente isso que abrir um treino
  // antigo fazia: contava do zero, ao vivo, num treino já encerrado.
  const segundosLocais = useSyncExternalStore(
    assinarSegundo,
    () => (temInicioLocal(treinoId) ? segundosDecorridos(treinoId) : null),
    () => null,
  );
  const segundosTreino = segundosLocais ?? duracaoReconstruidaSegundos;

  // Altura real deste container, publicada como variável CSS pra quem
  // precisa reservar espaço por baixo dele (`.corpo--treino-detalhe`) ou
  // dizer ao navegador pra não rolar conteúdo pra debaixo dele
  // (`scroll-margin-top` em `seletor-grupo-muscular.tsx`) — achado VS-03
  // (QA.md, 2026-08-28): a altura varia de ~65px (parado) a ~125px
  // (descanso ativo, cápsula quebra linha em tela estreita), então um
  // número fixo no CSS sempre fica desatualizado num dos dois estados.
  // `useLayoutEffect` mede antes da pintura (evita o flash com o valor de
  // fallback do CSS); `ResizeObserver` mantém atualizado quando o estado
  // do timer muda a altura depois disso.
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const elemento = containerRef.current;
    if (!elemento) return;

    function publicarAltura(altura: number) {
      document.documentElement.style.setProperty(
        "--lastro-timer-topo-altura",
        `${Math.ceil(altura)}px`,
      );
    }
    publicarAltura(elemento.getBoundingClientRect().height);

    // `entrada.contentRect` é content-box — não inclui padding. Esse
    // container tem padding vertical (~16-17px) que a MEDIÇÃO INICIAL
    // acima (`getBoundingClientRect`, border-box) capturava certo, mas o
    // ResizeObserver não — deixando a altura publicada sistematicamente
    // curta depois da primeira atualização (achado da auditoria
    // independente, QA.md VS-03, 2026-08-28: ~17px de erro tanto parado
    // quanto com descanso ativo, confirmado casualmente — injetar o
    // valor certo destravava o clique que a diferença quebrava).
    // `getBoundingClientRect` de novo aqui mantém as duas medições no
    // mesmo box model.
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) publicarAltura(entrada.target.getBoundingClientRect().height);
    });
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      document.documentElement.style.removeProperty("--lastro-timer-topo-altura");
    };
  }, []);

  // Este componente só marca o INÍCIO, e só quando a sessão começa aqui
  // (treino recém-criado, sem série). A marca de fim tem um dono só,
  // `treino-detalhe.tsx` (finalizar/reabrir) — antes os dois escreviam a
  // mesma chave, e foi essa duplicação que deixou o treino travado no
  // relato de 2026-09-03. Ver `src/lib/treino/marcos-treino.ts`.
  useEffect(() => {
    if (sessaoComecaAqui) iniciarSessaoLocal(treinoId);
  }, [treinoId, sessaoComecaAqui]);

  const totalDaMeta = descanso.segundosReais + descanso.segundosRestantes;
  const porcentagemRestante =
    totalDaMeta > 0 ? (descanso.segundosRestantes / totalDaMeta) * 100 : 0;
  return (
    <div className="timer-topo-container" ref={containerRef}>
      <div className="barra-status-treino">
        {/* Esquerda: Tempo Total de Treino Decorrido */}
        <div className="status-tempo-treino" title={t("Tempo total da sessão de treino", idioma)}>
          <span className="status-tempo-treino__icone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div className="status-tempo-treino__conteudo">
            <span className="status-tempo-treino__rotulo">{t("Treino", idioma)}</span>
            <span className="status-tempo-treino__valor">
              {formatarMinutosSegundos(segundosTreino)}
            </span>
          </div>
        </div>

        {/* Direita: descanso medido e persistido, pertencente à última série. */}
        <div
          className={
            descanso.ativo
              ? "status-descanso-wrapper status-descanso-wrapper--ativo"
              : "status-descanso-wrapper"
          }
        >
          {!treinoFinalizado && !descanso.ativo && (
            <button
              type="button"
              className="timer-topo-botao-disparar"
              onClick={descanso.iniciar}
              disabled={!descanso.podeIniciar}
              aria-label={t("Iniciar descanso entre séries", idioma)}
              title={t(
                descanso.podeIniciar
                  ? "Iniciar descanso entre séries"
                  : "Registre uma série para iniciar o descanso",
                idioma,
              )}
            >
              <span className="timer-topo-disparar-rotulo">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <span>{t("Descanso", idioma)}</span>
              </span>
              <span className="timer-topo-duracao-tag">
                {formatarMinutosSegundos(duracaoPadraoSegundos)}
              </span>
            </button>
          )}

          {!treinoFinalizado && descanso.ativo && (
            <div className="timer-topo-card-ativo">
              <div className="timer-topo-conteudo">
                <div className="timer-topo-tempo-bloco">
                  <span className="timer-topo-tempo-txt">
                    {formatarMinutosSegundos(descanso.segundosRestantes)}
                  </span>
                </div>

                <div className="timer-topo-acoes">
                  <button
                    type="button"
                    className="timer-topo-chip-tempo"
                    onClick={() => descanso.adicionarTempo(30)}
                  >
                    +30s
                  </button>

                  <button
                    type="button"
                    className="timer-topo-btn-controle"
                    onClick={descanso.pausado ? descanso.retomar : descanso.pausar}
                  >
                    {descanso.pausado ? t("Retomar", idioma) : t("Pausar", idioma)}
                  </button>

                  <button
                    type="button"
                    className="timer-topo-btn-fechar"
                    onClick={() => void descanso.concluir()}
                    aria-label={t("Encerrar descanso", idioma)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="timer-topo-barra-trilho" aria-hidden="true">
                <div
                  className="timer-topo-barra-progresso"
                  style={{ width: `${porcentagemRestante}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
