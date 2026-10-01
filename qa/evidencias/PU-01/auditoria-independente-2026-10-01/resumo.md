# PU-01: auditoria independente (2026-10-01)

**Critério.** Linha PU-01 do `QA.md`.
- O que já tinha sido medido: itens (1), (2), (3) e (5)-401, na auditoria de 2026-09-24.
- O que falta: o item (4) e o 503 do item (5).
  - (4): a notificação chega com o app fechado no iPhone do dono (tela de início, iOS 16.4+), e tocar nela abre o treino.
  - (5): a rota responde 503 quando as variáveis não existem.

**Veredito: NÃO EXECUTÁVEL por agente.**
- O item (4) exige o iPhone físico do dono. Por ordem da tarefa, não tentei.
- O 503 sem variáveis exigiria tirar variáveis de ambiente da produção. Isso fica fora do que um auditor pode fazer.

Nada foi executado nem gravado para este item. A linha segue ALEGADO até o dono testar no iPhone.
