# E2E-02 — J2-Análise (fluxo assíncrono) — 2026-09-02

## O que os 2 testes cobrem

`e2e/j2-analise.spec.ts`, atualizado pro fluxo assíncrono (`SDD.md` §11.5,
commit `253cec8`). A rota real de `/api/analise` agora devolve `202` na
hora e gera o parecer via `after()` — o parecer nunca mais chega pro
navegador que perguntou, então o E2E não pode mais verificar o texto de
um parecer real (isso é responsabilidade da verificação ao vivo, ver
`qa/evidencias/AA-01/`). O que os 2 testes provam:

1. **Rota certa, pergunta certa, reação certa ao `202`** — `/api/analise`
   é interceptada no navegador (`page.route`, a Gemini real nunca é
   chamada, cota preservada); o teste confirma que o botão "Solicitar
   Análise" dispara `{ pergunta: 5 }` (a pergunta primária) e que a tela
   trava o botão (`aria-disabled="true"`) e mostra "Confira em Ajustes >
   Relatórios em instantes." ao receber `202`.
2. **Rascunho pronto em Pareceres salvos** — semeia um `parecer` com
   `status='pronto', confirmado=false` direto no banco (mesmo padrão dos
   outros helpers E2E, autenticado como o próprio usuário, não
   `service_role`), navega pra `/ajustes/relatorios`, confirma que o
   texto do rascunho aparece e que clicar "Salvar" faz o botão
   "Descartar" sumir e `confirmado` virar `true` no banco.

## Saída real — `npx playwright test e2e/j2-analise.spec.ts --reporter=list`

```
Running 2 tests using 1 worker

  ok 1 [chromium] › e2e\j2-analise.spec.ts:39:5 › pede a Análise Semanal —
       botão dispara a pergunta certa e a tela devolve controle na hora
       (A6, SDD.md §11, sem gastar cota real da Gemini) (5.6s)
  ok 2 [chromium] › e2e\j2-analise.spec.ts:75:5 › rascunho pronto aparece
       em Pareceres salvos com Salvar/Descartar (SDD.md §11.4) (3.9s)

  2 passed (44.8s)
```

(O `webServer` do Playwright — `next build` + `next start` reais contra o
Supabase hospedado — domina o tempo total; os 2 testes em si somam 9.5s.)

## Contexto: suíte completa também verde

Rodada junto com `j1-treino.spec.ts` e `j3-duvida.spec.ts` no mesmo
schema (a migration `0018` alterou a tabela `parecer`, compartilhada só
com a área de análise — confirmado que as outras duas jornadas não
quebraram):

```
npx playwright test e2e/ --reporter=list
  ok 1 e2e\j1-treino.spec.ts:36:5 (5.9s)
  ok 2 e2e\j2-analise.spec.ts:39:5 (2.4s)
  ok 3 e2e\j2-analise.spec.ts:75:5 (2.7s)
  ok 4 e2e\j3-duvida.spec.ts:25:5 (3.0s)
  4 passed (33.8s)
```

## Resultado

E2E-02 confirmado verde nesta rodada (commit `b1972c0`), registrado em
`QA.md` junto com AA-01.
