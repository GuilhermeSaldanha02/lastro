// lastro · D6 — nenhuma ação de registro espera resposta de rede.
// Fila local (IndexedDB via Dexie) de mutações pendentes: a UI grava aqui
// na hora e confirma, sem esperar o servidor. `sincronizar` (outbox.ts)
// esvazia a fila quando a rede volta.
import Dexie, { type EntityTable } from "dexie";

// Correção de série (editar/excluir) entra na MESMA fila que a criação, e
// não em caminho próprio: a cena de uso é a mesma de D6 — errar o peso no
// meio do treino, no subsolo sem sinal, e querer arrumar na hora. FIFO
// garante a ordem: uma série criada e depois excluída offline chega ao
// servidor como criação e então exclusão, nunca ao contrário.
export type TipoMutacao =
  | "criar_treino"
  | "criar_serie"
  | "atualizar_serie"
  | "excluir_serie"
  | "excluir_treino";

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
