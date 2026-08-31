# Verificação — 2026-08-31 (não é correção, é conferência de código já existente)

## Contexto

`docs/RELATORIO-ESTADO-PROJETO.md` (2026-08-26) listava C5 ("excluir a
própria conta") como pendente. Investigação em 2026-08-31 achou que
`src/components/excluir-conta.tsx` **já existe**, já está montado em
`src/app/ajustes/page.tsx`, com confirmação inline (nunca `window.confirm`)
e o texto listando exatamente o que some — só nunca tinha sido **clicado**
numa sessão real, porque o teste apaga a conta que faz o teste.

## Verificação ao vivo

Usuário QA descartável `qa.i18nlive@lastro.test`, idioma trocado pra
English em `/ajustes` (parte da mesma sessão de verificação do IX-01).

1. Clique em "Delete account" → abre a confirmação inline (`get_page_text`
   confirmou o texto exato: *"Deleting your account erases your profile,
   all logged workouts and sets, workout templates, and plate
   configuration — everything, no exceptions. This can't be undone."*)
   com botões "Cancel"/"Delete account" — **nenhum `window.confirm()`**.
2. Clique em "Delete account" (confirmação) → app redirecionou sozinho
   pra `/login` (sessão encerrada de verdade, não só UI mudando de
   estado).
3. Confirmado no banco via `qa-treino-helper.sh limpar-usuario`: `sobrou:
   0` — nenhum dado órfão pra esse e-mail.

## Resultado

C5 funciona ponta a ponta, exatamente como especificado no backlog
(`docs/BACKLOG-PROXIMA-FASE.md`, item C5): confirmação explícita inline,
texto dizendo o que some, cascade completo. Nenhum código foi escrito ou
alterado — item fecha por verificação, não por implementação.
