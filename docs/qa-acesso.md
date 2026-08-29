# Acesso de QA — revogado

Existiu um usuário de teste (`qa.persona@lastro.test`) deliberadamente mantido vivo no
banco, por pedido explícito do dono (2026-08-28), como desvio consciente da regra padrão
do projeto (`.claude/agents/qa-treino.md`, `AGENTS.md`) de sempre apagar usuário de teste
ao final de uma auditoria.

**Revogado em 2026-08-28**, também por pedido explícito do dono. Removido via
`./scripts/qa-treino-helper.sh limpar-usuario qa.persona@lastro.test`, confirmado por
contagem (`sobrou: 0` — o `on delete cascade` do schema levou todos os dados junto:
treinos, séries, modelos de treino). `.qa-credentials.local` (a senha, nunca commitada)
também foi apagado.

## Se uma sessão futura precisar de novo

O caminho é o mesmo de antes: `./scripts/qa-treino-helper.sh criar-usuario <email> <senha>`
— gera um usuário com e-mail confirmado, pronto pra logar direto em `/login`. Decida com o
dono se, desta vez, ele deve ser mantido vivo entre sessões ou apagado ao final (o padrão
do projeto é apagar; manter vivo é a exceção, e precisa de pedido explícito).

## Referências que ainda citam essa conta

As evidências em `qa/evidencias/*/` de 2026-08-28 (a sessão de teste adversarial que achou
6 bugs — ver `QA.md`) foram capturadas com esse usuário. Os achados e as correções
continuam válidos — a conta que os provou é que não existe mais.
