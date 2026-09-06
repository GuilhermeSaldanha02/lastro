"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  formatarMinutosSegundos,
  tocarBipConclusao,
  vibrarConclusao,
  desbloquearAudio,
} from "@/lib/audio/som-timer";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import {
  iniciarSessaoLocal,
  segundosDecorridos,
  temInicioLocal,
} from "@/lib/treino/marcos-treino";

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

  // Pode DISPARAR o descanso entre séries? Só depende de o treino não ter
  // acabado. Não precisa de marca local: o timer de descanso é estado
  // local puro (`ativo`, `fimTimestampRef`) e nunca lê
  // `lastro_inicio_treino_*`.
  //
  // Antes disto (2026-09-05) este gate era `cronometroAoVivo`, que exigia
  // `segundosLocais !== null` — ou seja, exigia a marca de início. O nome
  // falava do cronômetro, mas o mostrador do tempo de treino nunca
  // consultou esse booleano: ele exibe `segundosTreino` direto, que já cai
  // sozinho na duração reconstruída quando não há marca. O único
  // consumidor era este botão, e para ele a exigência estava errada.
  //
  // O sintoma: a marca de início só é gravada em treino recém-criado
  // (`sessaoComecaAqui`, único ponto de escrita no repo). Quem recarregou
  // com o storage limpo, ou continuou o treino em outro navegador, seguia
  // registrando série normalmente — mas o botão de descanso sumia. Mesma
  // família do defeito de 2026-09-03 (o gate do render discordando do que
  // a ação de fato exige), sintoma invertido: lá o botão mentia dizendo
  // que funcionava, aqui ele desaparecia sem dizer nada.
  const podeDescansar = !treinoFinalizado;

  // 2. Timer de Descanso entre Séries
  const [ativo, setAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(duracaoPadraoSegundos);
  const [duracaoTotal, setDuracaoTotal] = useState(duracaoPadraoSegundos);
  const [finalizado, setFinalizado] = useState(false);

  // Timestamp absoluto para resiliência a bloqueio de tela
  const fimTimestampRef = useRef<number | null>(null);

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


  const iniciarTimer = useCallback((segundos: number) => {
    desbloquearAudio();
    setDuracaoTotal(segundos);
    setSegundosRestantes(segundos);
    fimTimestampRef.current = Date.now() + segundos * 1000;
    setAtivo(true);
    setPausado(false);
    setFinalizado(false);
  }, []);

  const pausarTimer = useCallback(() => {
    setPausado(true);
    fimTimestampRef.current = null;
  }, []);

  const retomarTimer = useCallback(() => {
    desbloquearAudio();
    fimTimestampRef.current = Date.now() + segundosRestantes * 1000;
    setPausado(false);
  }, [segundosRestantes]);

  const adicionarTempo = useCallback((segundosExtras: number) => {
    desbloquearAudio();
    setSegundosRestantes((atual) => {
      const novoTempo = atual + segundosExtras;
      setDuracaoTotal((tot) => Math.max(tot, novoTempo));
      if (fimTimestampRef.current) {
        fimTimestampRef.current += segundosExtras * 1000;
      }
      return novoTempo;
    });
    setFinalizado(false);
  }, []);

  const fecharTimer = useCallback(() => {
    setAtivo(false);
    setPausado(false);
    setFinalizado(false);
    fimTimestampRef.current = null;
  }, []);

  // Descanso e treino finalizado não coexistem: acabou o treino, acabou o
  // descanso. Antes isso era `setAtivo(false)` dentro do efeito do
  // cronômetro (o `setState` síncrono que reprovava o lint); derivar entrega
  // o mesmo resultado sem encadear render, e sem perder o estado de quem
  // reabrir a tela — `ativo` continua intacto por baixo.
  const descansoAtivo = ativo && !treinoFinalizado;
  const descansoFinalizado = finalizado && !treinoFinalizado;

  // Loop de contagem regressiva baseado em timestamp absoluto
  useEffect(() => {
    if (!descansoAtivo || pausado) return;

    const intervalo = setInterval(() => {
      if (!fimTimestampRef.current) return;

      const agora = Date.now();
      const restanteMs = fimTimestampRef.current - agora;
      const restanteSeg = Math.ceil(restanteMs / 1000);

      if (restanteSeg <= 0) {
        setSegundosRestantes(0);
        setAtivo(false);
        setFinalizado(true);
        fimTimestampRef.current = null;
        clearInterval(intervalo);
        
        // Alertas de conclusão garantidos
        tocarBipConclusao();
        vibrarConclusao();
      } else {
        setSegundosRestantes(restanteSeg);
      }
    }, 250);

    return () => clearInterval(intervalo);
  }, [descansoAtivo, pausado]);

  const porcentagemRestante =
    duracaoTotal > 0 ? (segundosRestantes / duracaoTotal) * 100 : 0;

  return (
    <div className="timer-topo-container" ref={containerRef}>
      <div className="barra-status-treino">
        {/* Esquerda: Tempo Total de Treino Decorrido */}
        <div className="status-tempo-treino" title="Tempo total da sessão de treino">
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

        {/* Direita: Módulo de Descanso (Parado, Ativo ou Concluído) */}
        <div
          className={
            descansoAtivo || descansoFinalizado
              ? "status-descanso-wrapper status-descanso-wrapper--ativo"
              : "status-descanso-wrapper"
          }
        >
          {/* `!treinoFinalizado` é o que faltava aqui, e é o defeito exato
              do relato de uso real (2026-09-03). Sem ele, com o treino
              finalizado o botão CONTINUAVA visível e clicável — mas
              `descansoAtivo = ativo && !treinoFinalizado` já nascia false,
              então `iniciarTimer` rodava e a cápsula nunca aparecia. Um
              botão que mente é pior que um botão ausente: o dono clicou
              várias vezes achando que era ele. Acabou o treino, some o
              descanso. */}
          {podeDescansar && !descansoAtivo && !descansoFinalizado && (
            <button
              type="button"
              className="timer-topo-botao-disparar"
              onClick={() => iniciarTimer(duracaoPadraoSegundos)}
              title="Iniciar descanso entre séries"
            >
              <span className="timer-topo-disparar-rotulo">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <span>{t("Descanso", idioma)}</span>
              </span>
              <span className="timer-topo-duracao-tag">
                {formatarMinutosSegundos(duracaoPadraoSegundos)}
              </span>
            </button>
          )}

          {descansoAtivo && (
            <div className="timer-topo-card-ativo">
              <div className="timer-topo-conteudo">
                <div className="timer-topo-tempo-bloco">
                  <span className="timer-topo-tempo-txt">
                    {formatarMinutosSegundos(segundosRestantes)}
                  </span>
                </div>

                <div className="timer-topo-acoes">
                  <button
                    type="button"
                    className="timer-topo-chip-tempo"
                    onClick={() => adicionarTempo(30)}
                  >
                    +30s
                  </button>

                  <button
                    type="button"
                    className="timer-topo-btn-controle"
                    onClick={pausado ? retomarTimer : pausarTimer}
                  >
                    {pausado ? t("Retomar", idioma) : t("Pausar", idioma)}
                  </button>

                  <button
                    type="button"
                    className="timer-topo-btn-fechar"
                    onClick={fecharTimer}
                    aria-label="Pular descanso"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Barra de progresso linear fina */}
              <div className="timer-topo-barra-trilho">
                <div
                  className="timer-topo-barra-progresso"
                  style={{ width: `${porcentagemRestante}%` }}
                />
              </div>
            </div>
          )}

          {descansoFinalizado && (
            <div className="timer-topo-card-concluido">
              <span className="timer-topo-concluido-txt">
                {t("Pronto!", idioma)}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="timer-topo-chip-tempo"
                  onClick={() => iniciarTimer(duracaoPadraoSegundos)}
                >
                  +{formatarMinutosSegundos(duracaoPadraoSegundos)}
                </button>
                <button
                  type="button"
                  className="timer-topo-btn-fechar"
                  onClick={fecharTimer}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
