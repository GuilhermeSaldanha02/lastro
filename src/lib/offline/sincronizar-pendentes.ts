// lastro · achado do dono (2026-08-30): a fila offline só drenava dentro
// de `treino-detalhe.tsx` (`/treino/[id]`) — o listener `online` e o aviso
// do Service Worker (Background Sync) estavam ligados só naquele
// componente. Registrar série offline, sair da tela do treino e reconectar
// em qualquer outro lugar do app (Home, Análise, Ajustes…) não drenava a
// fila: a série ficava presa no IndexedDB até o dono reabrir aquele treino
// específico. O dado não se perdia, mas "sincroniza sozinho quando a rede
// volta" não era verdade fora de uma tela.
//
// Esta função é a wiring dos executores (mesma de antes, só extraída pra
// ser importável de dois lugares): `treino-detalhe.tsx` continua chamando
// pra alimentar o indicador visual de sync (D7); `sincronizador-global.tsx`
// (montado no layout raiz) chama a mesma função em qualquer tela.
//
// Achado da auditoria independente (PR #158, 2026-08-30): com os dois
// listeners coexistindo em `/treino/[id]` (o global e o local), o evento
// `online` disparava DUAS chamadas concorrentes. `sincronizar()` lê
// `db.outbox.toArray()` sem lock — as duas leem o mesmo item pendente,
// as duas tentam `criarSerieRemoto`, uma vence no servidor e a outra
// recebe "duplicate key" do Postgres. Como esse erro bate no padrão de
// `ehErroPermanente`, a chamada perdedora descartava para `db.falhas` uma
// série que JÁ TINHA sido gravada com sucesso pela vencedora — dado
// íntegro no banco, mas o registro da fila mentia que ela tinha sido
// perdida. Mutex de módulo: uma segunda chamada enquanto a primeira roda
// não inicia outra passada — ela recebe a MESMA promise e espera o
// resultado da que já está em andamento. Isso é o que torna a função
// genuinamente idempotente sob chamada concorrente (antes só era
// idempotente em sequência, nunca em paralelo).
//
// Achado A1 (QA, 2026-09-13): o erro permanente é marcado AQUI, no
// cliente, a partir do valor que a Server Function devolve — não mais
// lançado do servidor com o prefixo, que o build de produção apagava (ver
// `ResultadoGravacaoSerie` em `src/lib/dados/treino.ts`).
import {
  atualizarDescansoSerieRemoto,
  atualizarSerieRemoto,
  criarSerieRemoto,
  excluirSerieRemoto,
  excluirTreinoRemoto,
  type AtualizacaoDescansoSerieInput,
  type AtualizacaoSerieInput,
  type NovaSerieInput,
  type ResultadoGravacaoSerie,
} from "@/lib/dados/treino";
import { contaDaSessao } from "./conta-da-sessao";
import { marcarComoPermanente } from "./erro-permanente";
import { sincronizar, type ResultadoSincronizacao } from "./outbox";

/** Recusa do banco vira erro permanente: a fila tira o item e segue. */
function exigirGravado(resultado: ResultadoGravacaoSerie): void {
  if (!resultado.ok) throw new Error(marcarComoPermanente(resultado.mensagem));
}

let emAndamento: Promise<ResultadoSincronizacao> | null = null;

export async function sincronizarPendentes(): Promise<ResultadoSincronizacao> {
  if (emAndamento) return emAndamento;
  emAndamento = executarSincronizacao().finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}

async function executarSincronizacao(): Promise<ResultadoSincronizacao> {
  // Só os itens da conta logada agora (achado M1): num aparelho
  // compartilhado, a série pendente de outra conta espera por ela.
  const usuarioId = await contaDaSessao();
  return sincronizar({
    // Sincronização de treino ainda não existe (só séries, por ora) — a
    // fila nunca recebe "criar_treino" até essa próxima etapa existir.
    criar_treino: async () => {},
    criar_serie: async (payload) => {
      exigirGravado(await criarSerieRemoto(payload as unknown as NovaSerieInput));
    },
    atualizar_serie: async (payload) => {
      exigirGravado(await atualizarSerieRemoto(payload as unknown as AtualizacaoSerieInput));
    },
    atualizar_descanso_serie: async (payload) => {
      exigirGravado(
        await atualizarDescansoSerieRemoto(
          payload as unknown as AtualizacaoDescansoSerieInput,
        ),
      );
    },
    excluir_serie: async (payload) => {
      await excluirSerieRemoto((payload as { id: string }).id);
    },
    // Excluir o TREINO inteiro é ação online-only, disparada da lista
    // (`/treino`, via `ExcluirTreino`) — decisão consciente, não omissão:
    // é ação rara, geralmente feita revendo o histórico com calma, não no
    // meio do treino sem sinal (D6 protege o registro, não a limpeza).
    // Este handler existe só para a fila nunca ficar com um tipo sem
    // executor, caso algo venha a enfileirar isto no futuro.
    excluir_treino: async (payload) => {
      await excluirTreinoRemoto((payload as { id: string }).id);
    },
  }, { usuarioId });
}
