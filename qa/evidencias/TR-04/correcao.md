# Correção aplicada — 2026-08-28

## O que mudou

`src/components/treino-detalhe.tsx`: `treinoConcluido` trocou de
`useState` com inicializador que lia `localStorage` direto (divergente
entre servidor e cliente) para `useSyncExternalStore` — mesmo padrão já
usado em `timer-topo.tsx` pro cronômetro. `getServerSnapshot` sempre
devolve `false`, igual ao que o inicializador antigo já fazia no
servidor; `getSnapshot` no cliente lê o `localStorage` de verdade. Os
dois concordam na primeira pintura (`false`/"Finalizar Treino"), então
não há mais divergência pra hidratação reclamar. O valor real aparece no
PRÓXIMO render depois do mount (ou depois do clique em "Finalizar
Treino", que já dispara outro `setState` no mesmo handler e força esse
re-render) — sem inicializador divergente e sem `setState` dentro de
`useEffect` (o que reprovaria o lint `react-hooks/set-state-in-effect`,
como reprovou numa tentativa anterior com `useEffect` puro).

## Prova

**Reprodução ao vivo:** registrei uma série, cliquei "Finalizar Treino"
(grava a flag no `localStorage`), e recarreguei a MESMA URL do zero
(`page.goto`, navegação completa, não soft-nav). Console limpo — 0
erros, nenhum "Hydration failed" — em três recargas consecutivas do
mesmo treino já finalizado. Antes da correção, a mensagem de erro citada
em `console.txt` (capturada no histórico da mesma sessão de navegador,
antes do fix) reproduzia exatamente esse cenário.

**Sobre os sintomas colaterais:** o avatar "AT" (VS-04) e o timer de
descanso "sem resposta" registrados pelas auditorias como possíveis
consequências do erro de hidratação — testei o timer de descanso num
treino JÁ finalizado (depois do fix, sem erro de hidratação) e ele
realmente não inicia: é comportamento **correto e deliberado**
(`timer-topo.tsx`: `descansoAtivo = ativo && !treinoFinalizado` — não
faz sentido contar descanso depois que o treino acabou). O botão
continua clicável sem indicar visualmente que está inerte nesse estado —
é uma lacuna de affordance menor, não um bug funcional, e não mexi nisso
agora (fora do que foi pedido).

**Suite completa:** `npx tsc --noEmit` limpo, 238/238 testes, `npm run
lint` 0 erros (a versão com `useEffect` tinha reprovado com
`react-hooks/set-state-in-effect` — corrigida antes de chegar aqui),
`npm run build` sem falhas.
