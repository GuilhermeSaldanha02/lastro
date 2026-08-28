# Acesso de QA persistente

Existe um usuário de teste **deliberadamente mantido vivo no banco**, por pedido explícito
do dono (2026-08-28) — desvio consciente da regra padrão do projeto (`.claude/agents/qa-treino.md`,
`AGENTS.md`) de sempre apagar usuário de teste ao final de uma auditoria. Registrado aqui
para não se perder e para a próxima sessão não precisar recriar do zero.

## O que é

- **E-mail:** `qa.persona@lastro.test`
- **Senha:** vive só em `.qa-credentials.local`, na raiz do repo — arquivo **não versionado**
  (`.gitignore`), nunca leia/cole o conteúdo dele em nenhum lugar que saia da sua máquina.
- **user_id:** `8a327cc9-9b09-4f14-bd6b-a54d2639cd22`
- Criado via `./scripts/qa-treino-helper.sh criar-usuario <email> <senha>` — já vem com
  e-mail confirmado (bypassa o fluxo de confirmação por e-mail), pronto pra logar direto
  na tela `/login` como um usuário real faria.

## Risco que isso abre, e por que foi aceito assim mesmo

Um usuário vivo, autenticável pela mesma API pública (`sb_publishable_...`) que o app usa,
é uma porta de entrada permanente — qualquer um com o e-mail e a senha loga como esse
usuário. É exatamente o motivo pelo qual o protocolo padrão manda apagar ao final. Mitigado
com senha aleatória forte (24 bytes) e a senha nunca commitada. Ainda assim, se este arquivo
ou a senha vazarem, revogue: `./scripts/qa-treino-helper.sh limpar-usuario qa.persona@lastro.test`.

## Como usar em sessões futuras

```bash
# Login pela tela de verdade (recomendado — testa a UI real, não injeta sessão):
# abrir /login, usar o e-mail acima + senha de .qa-credentials.local

# Ou, pra chamadas diretas via API (sem passar pela tela):
./scripts/qa-treino-helper.sh logar qa.persona@lastro.test "$(grep senha .qa-credentials.local | cut -d' ' -f2)"
```

## Dado de teste que já existe nesta conta

- 1 treino (28/08/2026, via modelo "Peito e Tríceps QA") com 2 séries: Supino reto com
  barra 10×70kg, Tríceps testa com barra 12×30kg. O treino de teste anterior (grupo Peito
  isolado) foi apagado antes deste, pra testar o fluxo de modelo do zero.
- 3 modelos de treino: "Peito e Tríceps QA" (criado nesta sessão, 2 exercícios) + "triceps"
  e "peito" (herdados de sessão anterior, não mexidos).
- Fila offline (outbox) local do navegador **vazia** — foi limpa manualmente depois dos
  testes adversariais de 28/08 (achado OF-02 em `QA.md`, item que ficava preso pra sempre
  foi removido do IndexedDB do navegador de teste; o banco em si nunca teve dado inválido).

Achados de bug desta sessão de teste adversarial: ver `QA.md` (itens OF-02, VS-03, TR-02,
TR-03, VS-04) e as evidências em `qa/evidencias/`.
