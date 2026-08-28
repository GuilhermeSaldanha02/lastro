# Correção aplicada — 2026-08-28

## O que mudou

1. **Raiz do problema** — `src/components/formulario-serie.tsx` e
   `src/components/editar-serie.tsx` declaravam `min={0} max={10}` no input de
   RIR, mas a validação em JS só checava se era número finito, nunca o
   intervalo. Agora checam contra `RIR_MINIMO`/`RIR_MAXIMO`
   (`src/lib/dados/limites-serie.ts`, fonte única, espelha a constraint
   `serie_rir_valido` do schema) e bloqueiam com a mensagem "RIR precisa
   estar entre 0 e 10." antes de qualquer chamada de rede — o dado inválido
   nunca chega a entrar na fila offline.

2. **Defesa em profundidade na fila** — `src/lib/offline/outbox.ts` agora
   distingue erro permanente (dado que o servidor sempre vai rejeitar) de
   erro transitório (rede fora). Um erro permanente sai da fila para
   `db.falhas` (tabela nova, `src/lib/offline/db.ts`) e o loop CONTINUA para
   o próximo item, em vez de travar tudo atrás dele pra sempre. O sinal de
   "permanente" nasce em `src/lib/dados/treino.ts`
   (`criarSerieRemoto`/`atualizarSerieRemoto`), lendo o código de erro do
   Postgres (classes `22`/`23` — dado/integridade, nunca resolvidas com
   retry) e viaja como PREFIXO na mensagem do erro
   (`src/lib/offline/erro-permanente.ts`), não como subclasse — porque essas
   funções rodam atrás de `"use server"` e o Next reconstrói só um `Error`
   genérico do lado do cliente ao atravessar essa fronteira; `instanceof`
   quebraria em silêncio.

## Prova

- **Reprodução ao vivo (Playwright, mesma sequência exata do achado original):**
  digitei RIR=99 no formulário de registro de série do treino real
  (`c7226a05-d101-4ea4-851f-6faa274e75bb`). Resultado: bloqueado no cliente,
  mensagem "RIR precisa estar entre 0 e 10.", **zero requisição de rede**,
  série não registrada. Ver `correcao-print.png`.
- **Automatizado (`src/lib/offline/outbox.test.ts`, descreve "item
  permanentemente inválido (OF-02)")**: 3 testes novos provam que (a) um
  item permanente sai da fila e o próximo item válido sincroniza na mesma
  chamada; (b) o item descartado fica registrado em `db.falhas` com o erro;
  (c) um erro transitório comum (ex.: "sem rede") continua parando a fila
  normalmente, mesmo após 5 tentativas — a defesa nova NUNCA descarta dado
  válido só porque a rede está ruim por um tempo.
- **Suite completa**: `npx tsc --noEmit` limpo, 238/238 testes (era 210 antes
  desta sessão), `npm run lint` 0 erros, `npm run build` sem falhas.

## O que NÃO foi feito, por decisão consciente

- O indicador de sincronização (`treino-detalhe.tsx`, D7) continua com só
  dois estados ("sincronizado" / "salvo no aparelho") — não criei um
  terceiro estado visível de "falhou permanentemente". D7 é uma decisão de
  produto registrada (nunca alarmar o usuário); mudar isso é decisão do
  dono, não algo para o agente decidir sozinho no meio de uma correção de
  bug. Os itens descartados ficam em `db.falhas`, auditáveis via
  `contarFalhas()`, prontos para virar UI se o dono quiser.
