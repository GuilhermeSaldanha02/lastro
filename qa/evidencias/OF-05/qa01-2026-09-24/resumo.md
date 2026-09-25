# OF-05 — QA-01 2026-09-24 (auditoria independente, produção, conta do dono, 375×812)

**Prova:** "Iniciar treino de hoje" sem rede não derruba a tela.

## Método
1. Para expor o botão "Iniciar Treino de Hoje" na Home (o dia já tinha o treino de QA aberto), o treino de QA
   foi finalizado pela UI ("Finalizar Treino" → confirmar) e a Home passou a mostrar o botão de iniciar.
2. `page.context().setOffline(true)`.
3. Clique em "Iniciar Treino de Hoje".
4. Verificado: URL, título da página, texto da tela, console.
5. Rede religada, treino de QA reaberto pela UI ("Reabrir treino").

## Obtido
- URL permaneceu em `/` (nenhuma navegação, nenhuma página de erro do Next).
- `document.title` = "lastro" (não "lastro — sem conexão" nem a página de erro em inglês).
- Texto na tela: **"Sem conexão. Conecte-se à internet para iniciar o treino."** em pt-BR, sob o botão.
- Console: 0 erros relacionados (só avisos de preload de fonte, mesmos de sempre).
- Nenhum treino novo foi criado: `select * from treino where usuario_id = '4638f1fe...' and iniciado_em >
  now() - interval '1 day'` devolveu só o treino de QA `9db03743...`, `finalizado_em: null` (após reabrir).

## Veredito
PASSOU. O clique offline nem chega a chamar a Server Function (`navigator.onLine` checado antes, em
`form-iniciar-treino.tsx`) — mostra aviso e mantém a tela de pé, consistente com a correção M3 documentada
no código.

## Estado do treino de QA ao final deste item
Reaberto com sucesso pela UI; banco confirma `finalizado_em: null`.
