# Correção aplicada — 2026-08-28

## Causa raiz

`src/app/treino/[id]/page.tsx` gatava `exerciciosPreSelecionados` por
`treino.series.length === 0` — TREINO INTEIRO, não por exercício. O
componente cliente (`treino-detalhe.tsx`, `pendentesDoModelo`) já filtra
corretamente POR EXERCÍCIO via `jaTemGrupo`, mas esse filtro nunca
chegava a rodar porque o servidor zerava a lista inteira assim que
existia qualquer série no treino.

## O que mudou

Removida a condição `treino.series.length === 0`. Agora
`exerciciosPreSelecionados` é buscado sempre que existe `modeloId` na
URL, independente de quantas séries o treino já tem. Quem decide o que
ainda está pendente é só o filtro por exercício do cliente, que já
estava certo.

## Prova

**Reprodução ao vivo (Playwright, mesma sequência exata do achado
original):** treino novo a partir do modelo "Peito e Tríceps QA" (2
exercícios: Supino reto com barra 10×70kg, Tríceps testa com barra sem
plano cadastrado).

1. Registrei a série de Supino pelo atalho "+". **Antes da correção**, o
   card de "Tríceps testa com barra" sumia da tela neste ponto. **Depois
   da correção**, ele continua visível, com "+" ativo.
2. Cliquei no "+" de Tríceps testa — abriu com fallback 0/0 (sem plano
   nem histórico, comportamento correto). Preenchi 12×35kg e registrei.
3. Conferi `modelo_treino_exercicio` direto no Postgres: as DUAS linhas
   do modelo agora têm reps/peso gravados (write-back do ADR-010
   funcionando pros dois exercícios, não só o primeiro):
   - Supino reto com barra: reps=10, peso=70.00
   - Tríceps testa com barra: reps=12, peso=35.00

**Suite completa:** `npx tsc --noEmit` limpo, 238/238 testes, `npm run
lint` 0 erros, `npm run build` sem falhas.
