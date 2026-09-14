// lastro · D6 — fila de sincronização (SDD da Fase 2 ainda não escrito;
// módulo fundacional, testado isoladamente antes de ligar na UI/SW).
import { db, type MutacaoFalha, type MutacaoPendente, type TipoMutacao } from "./db";
import { ehErroPermanente } from "./erro-permanente";

/** `usuarioId`: a conta dona do item (ver `MutacaoPendente.usuarioId`). */
export async function enfileirar(
  tipo: TipoMutacao,
  payload: Record<string, unknown>,
  usuarioId?: string,
): Promise<void> {
  await db.outbox.add({
    tipo,
    payload,
    criadoEm: Date.now(),
    tentativas: 0,
    ...(usuarioId ? { usuarioId } : {}),
  });
}

export async function contarPendentes(): Promise<number> {
  return db.outbox.count();
}

/** Itens permanentemente inválidos, fora da fila ativa (ver `sincronizar`). */
export async function contarFalhas(): Promise<number> {
  return db.falhas.count();
}

export type Executores = Record<
  TipoMutacao,
  (payload: Record<string, unknown>) => Promise<void>
>;

export type ResultadoSincronizacao = {
  sincronizados: number;
  falhou: boolean;
  /** Itens permanentemente inválidos, movidos para `db.falhas` nesta chamada. */
  descartados: number;
};

async function moverParaFalhas(item: MutacaoPendente, erro: unknown): Promise<void> {
  const falha: Omit<MutacaoFalha, "id"> = {
    tipo: item.tipo,
    payload: item.payload,
    criadoEm: item.criadoEm,
    tentativas: item.tentativas + 1,
    falhouEm: Date.now(),
    erro: erro instanceof Error ? erro.message : String(erro),
  };
  await db.transaction("rw", db.outbox, db.falhas, async () => {
    await db.falhas.add(falha);
    await db.outbox.delete(item.id as number);
  });
}

/**
 * Processa a fila em ordem de criação (FIFO). Para no primeiro item que
 * falhar de forma TRANSITÓRIA (rede fora, sessão expirando) — preserva a
 * ordem em vez de tentar pular pra frente, porque uma série sincronizada
 * antes do seu treino quebraria a referência no servidor. Os itens já
 * sincronizados antes da falha saem da fila; o que falhou fica, com a
 * contagem de tentativas incrementada, pra próxima chamada tentar de novo.
 *
 * Um item PERMANENTEMENTE inválido (`ehErroPermanente` — dado que o
 * servidor sempre vai rejeitar, ex.: RIR fora da faixa) não entra nessa
 * regra: retry nunca resolveria, e deixá-lo na cabeça da fila travaria
 * toda série registrada depois dele pra sempre (achado OF-02, QA.md
 * 2026-08-28). Esse item sai para `db.falhas` e o loop CONTINUA para o
 * próximo — a ordem FIFO segue preservada entre os itens que restam.
 *
 * `conta` (achado M1, 2026-09-13): quando informada, só entram os itens
 * DESSA conta (e os antigos, sem dono). Item de outra conta fica na fila,
 * intocado, para quando ela entrar de novo — nunca é enviado com a sessão
 * errada, nunca trava a conta atual e nunca conta como falha. `usuarioId:
 * null` é "sem sessão": nada é enviado. Sem `conta`, a regra antiga (todos).
 */
export async function sincronizar(
  executores: Executores,
  conta?: { usuarioId: string | null },
): Promise<ResultadoSincronizacao> {
  const todos = await db.outbox.orderBy("criadoEm").toArray();
  const pendentes = conta
    ? todos.filter((item) => !item.usuarioId || item.usuarioId === conta.usuarioId)
    : todos;
  if (conta && conta.usuarioId === null) {
    return { sincronizados: 0, falhou: pendentes.length > 0, descartados: 0 };
  }
  let sincronizados = 0;
  let descartados = 0;

  for (const item of pendentes) {
    try {
      await executores[item.tipo](item.payload);
      await db.outbox.delete(item.id as number);
      sincronizados++;
    } catch (erro) {
      if (ehErroPermanente(erro)) {
        await moverParaFalhas(item, erro);
        descartados++;
        continue;
      }
      await db.outbox.update(item.id as number, {
        tentativas: item.tentativas + 1,
      });
      return { sincronizados, falhou: true, descartados };
    }
  }

  return { sincronizados, falhou: false, descartados };
}

export type { MutacaoFalha, MutacaoPendente, TipoMutacao };
