// lastro · D6 — fila de sincronização (SDD da Fase 2 ainda não escrito;
// módulo fundacional, testado isoladamente antes de ligar na UI/SW).
import { db, type MutacaoPendente, type TipoMutacao } from "./db";

export async function enfileirar(
  tipo: TipoMutacao,
  payload: Record<string, unknown>,
): Promise<void> {
  await db.outbox.add({ tipo, payload, criadoEm: Date.now(), tentativas: 0 });
}

export async function contarPendentes(): Promise<number> {
  return db.outbox.count();
}

export type Executores = Record<
  TipoMutacao,
  (payload: Record<string, unknown>) => Promise<void>
>;

export type ResultadoSincronizacao = {
  sincronizados: number;
  falhou: boolean;
};

/**
 * Processa a fila em ordem de criação (FIFO). Para no primeiro item que
 * falhar — preserva a ordem em vez de tentar pular pra frente, porque uma
 * série sincronizada antes do seu treino quebraria a referência no servidor.
 * Os itens já sincronizados antes da falha saem da fila; o que falhou fica,
 * com a contagem de tentativas incrementada, pra próxima chamada tentar de novo.
 */
export async function sincronizar(
  executores: Executores,
): Promise<ResultadoSincronizacao> {
  const pendentes = await db.outbox.orderBy("criadoEm").toArray();
  let sincronizados = 0;

  for (const item of pendentes) {
    try {
      await executores[item.tipo](item.payload);
      await db.outbox.delete(item.id as number);
      sincronizados++;
    } catch {
      await db.outbox.update(item.id as number, {
        tentativas: item.tentativas + 1,
      });
      return { sincronizados, falhou: true };
    }
  }

  return { sincronizados, falhou: false };
}

export type { MutacaoPendente, TipoMutacao };
