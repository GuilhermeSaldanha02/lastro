# Ajustes na pílula — perfil, Coach e Sair consolidados

**Data:** 2026-08-12
**Pedido do dono:** o item "Coach" da pílula de navegação vira "Ajustes" (engrenagem). Coach, edição de perfil (com upload de foto) e "Sair" — hoje espalhados ou inexistentes — passam a viver dentro de Ajustes, sem repetição em outro lugar.

**Motivação:** o item 9 do backlog (upload manual de foto pra quem cadastrou por e-mail, sem `avatar_url` do Google) não tinha tela pra existir. "Sair" só existia na Início. O dono pediu para consolidar os três num só lugar, tirando "Coach" da pílula direta.

---

## 1. Navegação — `src/components/aba-inferior.tsx`

O item `coach` do array `SECOES` é substituído por `ajustes`:

- `id: "ajustes"`, `href: "/ajustes"`, `rotulo: "Ajustes"`
- Ícone: engrenagem (novo `caminho` SVG, traçado — nunca preenchido, regra do padrão em `DESIGN.md`)
- O tipo `Secao` perde `"coach"` e ganha `"ajustes"`

`/coach` e a nova `/perfil` continuam como rotas próprias (sub-telas de Ajustes), e ambas renderizam `<AbaInferior ativa="ajustes">` — a pílula mostra "Ajustes" em destaque enquanto o usuário estiver em qualquer uma delas. Tocar em "Ajustes" de novo volta ao menu (`/ajustes`), que é o mecanismo de "voltar" — o projeto não tem botão de voltar próprio em nenhuma outra sub-tela (ex.: `/treino/[id]`), então não introduz um padrão novo.

**Nenhum token novo de cor.** O ícone/rótulo reusa exatamente as regras visuais que já existem para os outros 5 itens (peso, cor ativa/inativa, contraste já medidos em `DECISIONS.md` 2026-08-11).

---

## 2. Nova rota `/ajustes` — menu

Reaproveita o esqueleto de tela que toda página já usa (`<main className="tela">` + `<header className="barra-topo">` + `<AbaInferior>`), sem CSS novo:

- Card de perfil no topo: `<Avatar>` (componente existente) + nome, link para `/perfil`.
- Lista de duas linhas, separadas por divisor:
  - "Coach" → `/coach`
  - "Sair" → botão (client component), chama `supabase.auth.signOut()` e redireciona para `/login`

Server Component (busca `obterPerfil()` como `/coach` já faz hoje), só a linha "Sair" precisa de um client component pequeno para o clique.

---

## 3. Nova rota `/perfil` — editar

- Nome: somente leitura (fora de escopo — o pedido foi upload de foto, não edição de nome; não expandir).
- Foto atual (`<Avatar>`) + botão "Trocar foto" → `<input type="file" accept="image/jpeg,image/png">`.
- Client component novo (`src/components/editor-avatar.tsx` ou similar) pelo estado de upload/erro; a página em si continua Server Component buscando o perfil.

---

## 4. Upload de foto — `src/lib/dados/perfil.ts`

Nova função `atualizarAvatarManual(supabase, userId, arquivo)`, no mesmo padrão de `sincronizarAvatarGoogle` já existente:

1. `validarArquivoAvatar(arquivo)` — função pura, testável: tipo em `image/jpeg`/`image/png`, tamanho ≤ **5 MB**. Rejeita com mensagem específica por motivo (tipo vs tamanho).
2. Upload pro bucket `avatares/{uid}/avatar.{ext}` com `upsert: true` — o path já é coberto pela policy existente (`{auth.uid()}/...`), não precisa de policy nova.
3. Atualiza `usuario.avatar_url` com a URL pública.

Roda a partir do client component (mesma sessão do navegador, `criarClienteBrowser()`), diferente do fluxo do Google que roda server-side no callback — aqui é ação direta do usuário.

---

## 5. "Sair" sai da Início

`src/app/page.tsx` perde o botão "Sair" da `barra-topo__acoes` (era o único lugar). Passa a existir só em `/ajustes`, com a mesma chamada de `signOut()` + redirect que já existe hoje.

---

## 6. Testes e verificação

- **Unitário (Vitest):** `validarArquivoAvatar` — tipo inválido, tamanho excedido, caso válido (3 casos mínimo).
- **`tsc --noEmit` / `lint` / `build`** limpos, como todo commit no projeto.
- **Gate visual (navegador real, extensão Chrome — regra do projeto para mudança de nav/peça):**
  - Rótulo "Ajustes" não quebra linha nem estoura a faixa do item na pílula, em 375×812 e 390×844.
  - Contraste do ícone/texto novo (esperado igual aos outros itens, já medido — confirmar visualmente, não assumir).
  - Fluxo real de upload com usuário QA efêmero: trocar foto, ver `avatar_url` atualizada no Postgres, e o avatar novo aparecendo em `/`, `/treino`, `/analise`, `/catalogo`, `/ajustes` (todas as telas que usam `<Avatar>`).
  - Fluxo real de "Sair" a partir de `/ajustes`: sessão encerrada, redireciona pra `/login`.

## Fora de escopo (explicitamente)

- Edição de nome do perfil.
- Qualquer mudança em `/coach` além de deixar de ser link direto da pílula (o conteúdo do chat não muda).
- Botão de "voltar" genérico — não introduzido, não pedido.

## Impacto em arquivos

`src/components/aba-inferior.tsx` · `src/app/ajustes/page.tsx` (novo) · `src/app/perfil/page.tsx` (novo) · componente cliente de upload (novo) · componente cliente do botão Sair (novo) · `src/lib/dados/perfil.ts` (função nova) · `src/app/page.tsx` (remove Sair) · `src/app/coach/page.tsx` (`ativa="ajustes"`). Não mexe em `DESIGN.md`/tokens/`ARCHITECTURE.md`.
