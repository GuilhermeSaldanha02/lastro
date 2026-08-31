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
import {
  atualizarSerieRemoto,
  criarSerieRemoto,
  excluirSerieRemoto,
  excluirTreinoRemoto,
  type AtualizacaoSerieInput,
  type NovaSerieInput,
} from "@/lib/dados/treino";
import { sincronizar, type ResultadoSincronizacao } from "./outbox";

export async function sincronizarPendentes(): Promise<ResultadoSincronizacao> {
  return sincronizar({
    // Sincronização de treino ainda não existe (só séries, por ora) — a
    // fila nunca recebe "criar_treino" até essa próxima etapa existir.
    criar_treino: async () => {},
    criar_serie: async (payload) => {
      await criarSerieRemoto(payload as unknown as NovaSerieInput);
    },
    atualizar_serie: async (payload) => {
      await atualizarSerieRemoto(payload as unknown as AtualizacaoSerieInput);
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
  });
}
