# Auditoria independente — TR-03

**Data:** 2026-08-28 · **Auditor:** Claude (sessão isolada, "Inspetor QA") · **SHA sob auditoria:** 5d392dc

## O que testei

Login via `/login` com `qa.persona@lastro.test`. O treino real de hoje já
tinha série nos dois exercícios do modelo (não servia pra reproduzir o
cenário "primeiro exercício com série, segundo sem"), então criei um
treino novo e limpo pra data 2026-08-27, sem série nenhuma, direto no
Postgres (ambiente de QA, dado sintético descartável — ver limpeza ao
final):

```sql
insert into treino (usuario_id, data)
values ('8a327cc9-9b09-4f14-bd6b-a54d2639cd22', '2026-08-27')
returning id;
-- bf07838b-b62d-4d79-ab6f-65e89676b847
```

E acessei a URL exata que o fluxo real de "Iniciar treino de hoje → modelo"
produz (`criarTreinoComModelo`, `src/lib/dados/treino.ts:475`):
`/treino/bf07838b-b62d-4d79-ab6f-65e89676b847?modelo=8ea7c187-e31d-46eb-abc5-402e0bf48722`
(id do modelo "Peito e Tríceps QA", 2 exercícios: Supino reto com barra,
Tríceps testa com barra).

1. Confirmei que os dois exercícios apareciam com atalho "+" (10×70 e
   12×35, valores do modelo).
2. Cliquei "+" em Supino, formulário abriu pré-preenchido (10×70), cliquei
   "Registrar série".
3. **Ponto crítico:** conferi se o card "Tríceps testa com barra" com o
   atalho "+" continuava na tela. Continuou — visível, ativo, com "12 × 35
   kg +" (ver screenshot `tr-03-atalho-triceps-continua-visivel.png`).
4. Cliquei "+" em Tríceps, registrei 12×35 também.
5. Conferi `modelo_treino_exercicio` direto no Postgres: as duas linhas do
   modelo "Peito e Tríceps QA" têm reps/peso gravados —
   Supino reto com barra (reps=10, peso=70.00) e Tríceps testa com barra
   (reps=12, peso=35.00) — write-back do ADR-010 funcionando pros dois
   exercícios.

## Limpeza pós-teste

Removi o dado sintético criado só pra este teste (treino de 27/ago e suas
2 séries), pra não poluir a conta de QA:

```sql
delete from serie where treino_id = 'bf07838b-b62d-4d79-ab6f-65e89676b847';
delete from treino where id = 'bf07838b-b62d-4d79-ab6f-65e89676b847';
```

## Veredito

**PASSOU.** Removida a condição `treino.series.length === 0` (que zerava
a lista inteira do treino), o filtro por exercício do cliente
(`pendentesDoModelo`) agora roda de verdade — o atalho do segundo
exercício sobrevive ao registro do primeiro.
