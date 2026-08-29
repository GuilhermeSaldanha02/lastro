# Auditoria independente — TR-04

Auditor: sessão separada (Inspetor QA), sem acesso de escrita a `src/**`.
Ferramenta: Playwright MCP, Chrome real, dev server em `http://localhost:3000`.
Usuário: `qa.persona@lastro.test` (login real pela tela `/login`).
Treino usado: `bcb92a76-8026-4397-b336-c34a19e7accc` (treino de hoje, 1 série,
já vinha com a flag `lastro_fim_treino_bcb92a76-...` de uma finalização
anterior — cenário exato do bug).

## Cenário 1 — treino JÁ finalizado (cenário do bug original)

Reload completo (`browser_navigate` para a mesma URL, não navegação por link)
repetido 3x seguidas nesse mesmo treino, com `localStorage` já contendo
`lastro_fim_treino_bcb92a76-...`:

- Reload 1: console sem erros (0 erros/0 warnings). Snapshot mostra botão
  "Ver Relatório do Treino" desde a primeira leitura — sem flash de
  "Finalizar Treino".
- Reload 2: console sem erros. Screenshot: `tr04-reload2.png`.
- Reload 3: console sem erros. Snapshot confirma "Ver Relatório do Treino"
  estável.

Nenhuma ocorrência de "Hydration failed" ou qualquer outro erro em nenhuma
das 3 recargas.

## Cenário 2 — treino EM ANDAMENTO (ainda não finalizado) — regressão

Removi a flag `lastro_fim_treino_bcb92a76-...` do `localStorage` via
`browser_evaluate` (guardando o valor anterior) para simular o estado "não
finalizado" no mesmo treino, e recarreguei 2x:

- Reload 1: console sem erros. Botão mostrou "Finalizar Treino" corretamente
  desde a primeira pintura.
- Reload 2: console sem erros. Mesmo resultado.

## Cenário 3 — transição ao vivo (clique em "Finalizar Treino")

Com o treino no estado "em andamento" do Cenário 2, cliquei no botão
"Finalizar Treino": grava a flag, abre o relatório pós-treino, e o rótulo do
botão de fundo já muda para "Ver Relatório do Treino" no mesmo render —
console sem erros durante toda a transição.

Fechei o relatório e recarreguei mais uma vez a mesma URL: console sem
erros, botão "Ver Relatório do Treino" estável.
Screenshot: `tr04-final-finalizado.png`.

## Achado extra (fora de escopo, só registro)

Nenhum novo erro de hidratação encontrado em nenhuma variação testada
(reload seguido de reload, reload no meio da transição finalizar→relatório).
O ponto já registrado em `correcao.md` sobre o timer de descanso continuar
clicável (mas inerte) num treino já finalizado permanece válido como lacuna
de affordance menor — não investiguei mais a fundo por já estar documentado
como intencional e fora do escopo do TR-04.

## Veredito

PASSOU. 3 recargas consecutivas do treino já finalizado, mais 2 recargas do
caso "em andamento" (regressão) e 1 transição ao vivo — 0 erros de
hidratação ou qualquer outro erro de console em todos os casos.
