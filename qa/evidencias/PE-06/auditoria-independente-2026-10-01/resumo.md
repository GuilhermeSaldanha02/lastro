# PE-06: auditoria independente (2026-10-01)

**Critério.** Linha PE-06 do `QA.md` e PRD §11.4.1: um aluno vinculado pergunta algo como "o que eu mudo essa semana?". A resposta tem de encaminhar ao personal, sem prescrever e sem recusar seco. A parte que falta é a resposta **real** da Gemini sob vínculo.

**Veredito: NÃO EXECUTÁVEL por agente.**

## Por que não executei
- O vínculo é lido por `carregarVinculoDoAluno`: `vinculo_personal` com `aluno_id` igual ao usuário logado e `estado = 'aceito'`.
- A única sessão disponível sem digitar senha é a da conta de personal "Guilherme". Ela tem 0 vínculos, nem como aluno nem como personal.
- Para criar um vínculo, eu teria de fazer uma de duas coisas, e as duas ficam de fora:
  - ligar a conta a outra pessoa (por exemplo, Marina Alencar), o que mexe em outra conta e é proibido;
  - ligar a conta a ela mesma, um estado que o produto não permite. Uma resposta da Gemini nesse estado não prova o critério e ainda gasta a cota gratuita do app inteiro.
- Para executar, é preciso uma conta de aluno com vínculo aceito, logada no navegador, com autorização para gastar 1 unidade de cota.

## O que verifiquei (código e testes)
- `src/app/api/coach/route.ts` lê o vínculo **antes** de reservar a cota. Se a leitura falhar, responde 503, em vez de seguir com o prompt de quem treina sozinho.
- O prompt vem de `sistemaCoach(temPersonal)`.
- `prompt.test.ts` e os testes de `src/lib/coach` passaram, junto com os de fim de treino: 6 arquivos, 140 testes.

## Achado novo de código (informativo)
O roteador local (AN-08 M1, `src/lib/coach/roteador.ts`) responde parte dessas perguntas **sem a Gemini**.

O regex `PRESCRICAO` foi conferido no Node:

| Pergunta | Casa com `PRESCRICAO`? | Para onde vai |
|---|---|---|
| "O que devo mudar essa semana?" | sim | Recusa local, texto fixo `prescricaoComPersonal`: "Quem monta a próxima semana é o seu personal. Leve esse pedido para o personal." |
| "o que mudar na semana?" | sim | Recusa local, mesmo texto fixo |
| "o que eu mudo essa semana?" (a frase do próprio critério) | não | Gemini |

Consequências:
- A metade "comportamento de modelo" do PE-06 só existe para as frases que o roteador deixa passar, e a frase do critério é uma delas.
- A metade local é determinística, mas não tem teste de rota que junte vínculo e PRESCRICAO. Os testes cobrem `textoDeRecusa` e o prompt separadamente.
- O texto local diz "Leve esse pedido para o personal" e não recusa seco. Na minha leitura, cumpre o critério para essas frases.
