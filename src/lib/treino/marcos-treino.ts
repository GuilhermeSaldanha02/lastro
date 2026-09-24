/**
 * lastro · marcos de uma sessão de treino (início e fim) no `localStorage`.
 *
 * POR QUE ESTE MÓDULO EXISTE. As duas chaves eram lidas e escritas em DOIS
 * componentes ao mesmo tempo — `timer-topo.tsx` (via `garantirMarcosTreino`)
 * e `treino-detalhe.tsx` (no `onClick` de "Finalizar Treino"), cada um com
 * sua própria cópia do nome da chave. Foi essa duplicação que permitiu o
 * defeito relatado em uso real em 2026-09-03: um toque acidental em
 * "Finalizar" gravava a marca de fim, o cronômetro congelava, e **nenhum
 * dos dois lados sabia apagá-la** — o treino ficava travado para sempre.
 * Um dono só para as duas chaves.
 *
 * As funções de aritmética (`segundosEntre`, `inicioAoReabrir`) são PURAS e
 * ficam separadas de propósito: é onde mora a parte que erra em silêncio, e
 * o ambiente de teste é `node`, sem `localStorage`.
 */

export const chaveInicioTreino = (treinoId: string) => `lastro_inicio_treino_${treinoId}`;
export const chaveFimTreino = (treinoId: string) => `lastro_fim_treino_${treinoId}`;

export type MarcosTreino = {
  /** `null` quando o treino nunca foi aberto neste aparelho. */
  inicioMs: number | null;
  /** `null` enquanto o treino está em andamento. */
  fimMs: number | null;
};

/* ------------------------------------------------------------------ */
/* Aritmética — pura, testável sem localStorage                        */
/* ------------------------------------------------------------------ */

/**
 * Segundos decorridos da sessão. Congelado em `fim - início` quando o
 * treino terminou; corrente (`agora - início`) enquanto roda.
 */
export function segundosEntre(
  { inicioMs, fimMs }: MarcosTreino,
  agoraMs: number,
): number {
  if (inicioMs === null) return 0;
  const ateMs = fimMs ?? agoraMs;
  return Math.floor(Math.max(0, ateMs - inicioMs) / 1000);
}

/**
 * Novo instante de início ao REABRIR um treino finalizado.
 *
 * Não basta apagar a marca de fim: o decorrido é `agora - início`, então um
 * treino de 1h finalizado às 10h e reaberto às 14h passaria a mostrar
 * **5 horas**. Deslocar o início preserva o que já tinha corrido — o
 * cronômetro volta de onde parou, que é o que "reabrir" promete.
 *
 * Sem marcos completos não há o que preservar: começa agora.
 */
export function inicioAoReabrir(
  { inicioMs, fimMs }: MarcosTreino,
  agoraMs: number,
): number {
  if (inicioMs === null || fimMs === null) return agoraMs;
  const decorridoMs = Math.max(0, fimMs - inicioMs);
  return agoraMs - decorridoMs;
}

/* ------------------------------------------------------------------ */
/* Armazenamento                                                       */
/* ------------------------------------------------------------------ */

/** `null` no servidor, onde `localStorage` não existe. */
function armazenamento(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/* ------------------------------------------------------------------ */
/* Assinatura — para `useSyncExternalStore`                            */
/* ------------------------------------------------------------------ */

const ouvintes = new Set<() => void>();

/**
 * Notifica quem observa os marcos. `treino-detalhe.tsx` derivava
 * "finalizado" de um `useSyncExternalStore` com assinatura VAZIA e contava
 * com algum outro `setState` do mesmo handler forçar o render — o próprio
 * comentário de lá dizia isso. Funcionava por sorte, e "reabrir" não tinha
 * essa sorte: o clique muda só o `localStorage`. Com assinatura de verdade
 * a releitura é consequência da escrita, não coincidência.
 */
function notificar(): void {
  for (const ouvinte of ouvintes) ouvinte();
}

export function assinarMarcos(aoMudar: () => void): () => void {
  ouvintes.add(aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
  };
}

function paraMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Leitura **pura** — seguro de chamar durante o render (`getSnapshot`). */
export function lerMarcos(treinoId: string): MarcosTreino {
  const store = armazenamento();
  if (!store) return { inicioMs: null, fimMs: null };
  return {
    inicioMs: paraMs(store.getItem(chaveInicioTreino(treinoId))),
    fimMs: paraMs(store.getItem(chaveFimTreino(treinoId))),
  };
}

export function segundosDecorridos(treinoId: string): number {
  return segundosEntre(lerMarcos(treinoId), Date.now());
}

export function estaFinalizado(treinoId: string): boolean {
  return lerMarcos(treinoId).fimMs !== null;
}

/**
 * Existe marca de início neste APARELHO? É o que separa "a sessão está
 * acontecendo aqui" de "estou só olhando um treino".
 */
export function temInicioLocal(treinoId: string): boolean {
  return lerMarcos(treinoId).inicioMs !== null;
}

/**
 * Marca que a sessão começou NESTE aparelho. Idempotente.
 *
 * Chamar isto incondicionalmente ao abrir qualquer treino era o defeito
 * relatado em 2026-09-04: abrir um treino de ontem gravava `agora` como
 * início e o cronômetro saía contando do zero, ao vivo, num treino que já
 * tinha acabado. Quem decide se a sessão é daqui é o chamador — hoje,
 * `timer-topo.tsx` só chama quando o treino ainda não tem série nenhuma
 * (foi criado agora e o dono está prestes a treinar).
 */
export function iniciarSessaoLocal(treinoId: string): void {
  const store = armazenamento();
  if (!store) return;
  const chave = chaveInicioTreino(treinoId);
  if (!store.getItem(chave)) {
    store.setItem(chave, new Date().toISOString());
  }
}

/**
 * Idempotente: reapertar "Finalizar" não move o fim já gravado.
 *
 * Fim NOVO nasce sem confirmação do servidor: a marca de confirmação é
 * apagada aqui. Sem isso, um "Finalizar" sem rede num treino já espelhado
 * (confirmação "1" desde a abertura) seria lido na próxima abertura como
 * "reaberto em outro aparelho" — e o treino reabria sozinho.
 */
export function marcarFim(treinoId: string): void {
  const store = armazenamento();
  if (!store) return;
  const chave = chaveFimTreino(treinoId);
  if (!store.getItem(chave)) {
    store.setItem(chave, new Date().toISOString());
    store.removeItem(chaveFimConfirmado(treinoId));
    notificar();
  }
}

/**
 * Desfaz a finalização preservando o tempo já decorrido (ver
 * `inicioAoReabrir`). Sem efeito num treino que não está finalizado.
 */
export function reabrir(treinoId: string): void {
  const store = armazenamento();
  if (!store) return;

  const marcos = lerMarcos(treinoId);
  if (marcos.fimMs === null) return;

  // Só desloca o início quando existe um início LOCAL para preservar. Sem
  // ele não há tempo decorrido neste aparelho, e gravar `agora` faria o
  // cronômetro recomeçar do zero ao vivo — o mesmo defeito que
  // `iniciarSessaoLocal` deixou de causar. Nesse caso o treino volta a ser
  // lido pela duração reconstruída do banco.
  if (marcos.inicioMs !== null) {
    store.setItem(
      chaveInicioTreino(treinoId),
      new Date(inicioAoReabrir(marcos, Date.now())).toISOString(),
    );
  }
  store.removeItem(chaveFimTreino(treinoId));
  notificar();
}

/* ------------------------------------------------------------------ */
/* Espelho do servidor (migration 20260924152633)                      */
/* ------------------------------------------------------------------ */

/**
 * Confirmação de que a marca de fim deste aparelho ESPELHA o servidor.
 * Marca de fim sem confirmação = pendente de envio (código antigo ou
 * "Finalizar" sem rede). Ver `decidirReconciliacao` em `fim-treino.ts`.
 */
export const chaveFimConfirmado = (treinoId: string) => `lastro_fim_servidor_${treinoId}`;

export function fimConfirmadoPeloServidor(treinoId: string): boolean {
  return armazenamento()?.getItem(chaveFimConfirmado(treinoId)) === "1";
}

/**
 * "Finalizado?" — leitura pura, segura no `getSnapshot`. Sem confirmação
 * local, o servidor decide (é o que o HTML já mostrou, então a primeira
 * pintura não troca de estado); uma marca pendente também conta, porque o
 * dono finalizou aqui e o envio ainda não chegou.
 */
export function estaFinalizadoComServidor(
  treinoId: string,
  finalizadoNoServidor: boolean,
): boolean {
  if (!armazenamento()) return finalizadoNoServidor;
  const fimLocal = lerMarcos(treinoId).fimMs !== null;
  return fimConfirmadoPeloServidor(treinoId) ? fimLocal : fimLocal || finalizadoNoServidor;
}

/**
 * Faz a marca local seguir o servidor e grava a confirmação. Servidor
 * aberto com marca local = reaberto em outro aparelho: passa por `reabrir`,
 * que desloca o início e preserva o decorrido.
 *
 * Servidor e aparelho finalizados: fica o fim LOCAL. Nos treinos antigos o
 * servidor tem o fim reconstruído (última série), mais cedo que o real
 * deste aparelho; trocar mudaria o cronômetro congelado que o dono já viu.
 */
export function espelharServidor(treinoId: string, finalizadoEmIso: string | null): void {
  const store = armazenamento();
  if (!store) return;
  store.setItem(chaveFimConfirmado(treinoId), "1");
  if (finalizadoEmIso === null) {
    reabrir(treinoId);
  } else if (!store.getItem(chaveFimTreino(treinoId))) {
    store.setItem(chaveFimTreino(treinoId), finalizadoEmIso);
  }
  notificar();
}

/** Volta os marcos ao que eram — "Reabrir" que o servidor não aceitou. */
export function restaurarMarcos(treinoId: string, { inicioMs, fimMs }: MarcosTreino): void {
  const store = armazenamento();
  if (!store) return;
  if (inicioMs === null) store.removeItem(chaveInicioTreino(treinoId));
  else store.setItem(chaveInicioTreino(treinoId), new Date(inicioMs).toISOString());
  if (fimMs === null) store.removeItem(chaveFimTreino(treinoId));
  else store.setItem(chaveFimTreino(treinoId), new Date(fimMs).toISOString());
  notificar();
}
