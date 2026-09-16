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
  | "atualizar_descanso_serie"
  | "excluir_serie"
  | "excluir_treino";

export type MutacaoPendente = {
  id?: number;
  tipo: TipoMutacao;
  payload: Record<string, unknown>;
  /** FIFO: uma série não pode sincronizar antes do treino a que pertence. */
  criadoEm: number;
  tentativas: number;
  /**
   * Conta que registrou o item (achado M1, QA, 2026-09-13). A fila é uma só
   * por NAVEGADOR, não por conta: num aparelho compartilhado, a série
   * pendente da conta A era enviada com a sessão da conta B, o servidor
   * respondia "treino_id inexistente" (a RLS esconde o treino de A) e a
   * fila parava ali — com a série de B atrás. Ausente nos itens gravados
   * antes desta mudança; esses seguem a regra antiga (qualquer sessão).
   * Campo sem índice: não muda o schema do Dexie.
   */
  usuarioId?: string;
};

/**
 * Item que saiu da fila porque o erro é permanente (dado que o servidor
 * sempre vai rejeitar, ex.: RIR fora da faixa) — retry infinito não
 * resolveria (achado OF-02, QA.md 2026-08-28). Guardado aqui em vez de
 * simplesmente descartado, pra não desaparecer sem rastro: `outbox.ts`
 * decide sair da fila, nenhum código apaga isto sozinho.
 */
export type MutacaoFalha = MutacaoPendente & {
  falhouEm: number;
  erro: string;
};

class LastroDB extends Dexie {
  outbox!: EntityTable<MutacaoPendente, "id">;
  falhas!: EntityTable<MutacaoFalha, "id">;

  constructor() {
    super("lastro");
    this.version(1).stores({
      outbox: "++id, tipo, criadoEm",
    });
    this.version(2).stores({
      outbox: "++id, tipo, criadoEm",
      falhas: "++id, tipo, criadoEm, falhouEm",
    });
  }
}

export const db = new LastroDB();
