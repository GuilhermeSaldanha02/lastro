// lastro · D6 — nenhuma ação de registro espera resposta de rede.
// Fila local (IndexedDB via Dexie) de mutações pendentes: a UI grava aqui
// na hora e confirma, sem esperar o servidor. `sincronizar` (outbox.ts)
// esvazia a fila quando a rede volta.
import Dexie, { type EntityTable } from "dexie";

export type TipoMutacao = "criar_treino" | "criar_serie";

export type MutacaoPendente = {
  id?: number;
  tipo: TipoMutacao;
  payload: Record<string, unknown>;
  /** FIFO: uma série não pode sincronizar antes do treino a que pertence. */
  criadoEm: number;
  tentativas: number;
};

class LastroDB extends Dexie {
  outbox!: EntityTable<MutacaoPendente, "id">;

  constructor() {
    super("lastro");
    this.version(1).stores({
      outbox: "++id, tipo, criadoEm",
    });
  }
}

export const db = new LastroDB();
