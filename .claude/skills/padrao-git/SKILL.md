---
name: padrao-git
description: Carregar antes de qualquer operação de git neste projeto — criar branch, montar commit, preparar PR, ou restaurar arquivo. Define nomenclatura, gates de pré-commit e a armadilha de CRLF no Windows.
---

# Git

- **Nunca commitar na `main`** — branch `feat/`, `fix/` ou `chore/` a partir de `main`.
- **Conventional Commits em pt-BR:** `<type>: <Descrição imperativa com inicial maiúscula>`, sem ponto final, ≤ 72 chars no título.
- **Pré-commit por stack detectada:** formatação + lint + type-check **bloqueantes**; testes run-if-present; stack desconhecida pula checks de stack.
- **Staging inteligente:** mesmo domínio = 1 commit; escopos distintos = commits separados (propor a sequência antes).
- **Antes do PR:** `git status --short`, `git diff --stat`, `git diff --check`, depois os gates da stack.
- **Windows, restaurar binário:** `git checkout SHA -- caminho` — **nunca** `git show > arquivo` (CRLF corrompe).

## Ciclo por tarefa

seção do SDD → implementa → verificação por nível de risco → `PROGRESS.md` com evidência → commit → próximo item.

Commits frequentes e descritivos são a **memória recuperável entre sessões**. Um commit que diz "ajustes" desperdiça a única coisa que sobrevive ao fim do contexto.

## Neste projeto

Repo privado `GuilhermeSaldanha02/lastro`, branch padrão `main`. Uma branch por fase do `PROGRESS.md`, PR ao fim de cada fase.

**Nunca commitar:** `.env`, chave da Gemini, credencial do Supabase. Antes de todo push, confira que nenhum segredo entrou no diff — a chave é o ativo mais sensível do projeto.
