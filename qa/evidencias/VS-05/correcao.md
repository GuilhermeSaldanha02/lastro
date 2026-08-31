# Correção aplicada — 2026-08-31

## O achado

O dono relatou que a barra de envio do Coach ("Pergunte ao coach…") não muda de
cor ao trocar de tema. Investigação em `src/app/sistema.css` achou duas causas
na mesma área (item T5/T6 do `docs/BACKLOG-PROXIMA-FASE.md`):

1. **`.barra-conversa`** (o "pill" da barra) tinha `background: rgba(7, 9, 13,
   0.92)` — obsidiana **cravada**, não token. Sempre a mesma cor escura,
   qualquer tema.
2. **Regra duplicada.** O comentário em `sistema.css:1878` já dizia que uma
   segunda `.barra-conversa` "foi FUNDIDA" numa regra única em 2026-08-27 — mas
   só o seletor-mãe tinha sido de fato removido. `.barra-conversa__input` e
   `.barra-conversa__botao` continuavam declarados DUAS vezes; a cópia de baixo
   (linha ~3497) vencia a cascata por ordem de fonte (mesma especificidade) e:
   - derrubava o `min-height: 48px` do `__input` (regressão de alvo de toque,
     item T6 do backlog);
   - cravava `color: #07090D` no ícone do `__botao` em vez de
     `var(--lastro-acao-txt)` (não seguia tema).

## O que mudou

- `.barra-conversa`: `background` trocado por `var(--lastro-vidro-nav-opaco)`
  (fallback opaco) + `@supports` com `var(--lastro-vidro-nav)` +
  `var(--lastro-vidro-desfoque)` (translúcido com blur) — mesmo par que `.nav`
  (aba inferior) já usa. Dois tokens que já variam por tema
  (`tokens.css:181-182` escuro, `:259-260` claro).
- Removida a cópia duplicada de `.barra-conversa__input`/`__botao` (linhas
  ~3497-3531) — a versão de cima (~1909-1955), já correta com tokens, é a
  única fonte agora.
- **T6, item extra resolvido na mesma leva:** `.botao-texto` ("Cadastre-se"/
  "Fazer login" em `/login`) media ~33px de altura, abaixo do piso de 48px
  (D1). Adicionado `min-height: var(--lastro-alvo-min)` + `display: inline-flex`
  + centralização.

## T6 — achado durante a investigação: 3 dos 4 itens já estavam corrigidos

O backlog (`docs/BACKLOG-PROXIMA-FASE.md`, T6, 2026-08-21) listava 4 alvos de
toque abaixo de 48px: "Ver Todos" (catálogo), chips do catálogo, "Voltar" +
avatar do cabeçalho, "Cadastre-se". Medido agora contra o código real:

| Item | Estado real |
|---|---|
| "Ver Todos" | já corrigido (comentário datado em `sistema.css:2943`) |
| Chips do catálogo (`.chip-filtro`) | já corrigido — regra de piso de toque em `sistema.css:5058`, comentário próprio explicando a correção |
| "Voltar" (`.topo-pro__voltar`) + avatar (`.topo-pro__avatar-link`) | já corrigidos — regras de piso de toque em `sistema.css:5007` e `:5046` |
| "Cadastre-se" (`.botao-texto`) | **não estava** — corrigido nesta PR |

Ou seja: alguma sessão anterior já fechou 3 dos 4, sem atualizar o backlog
(mesmo padrão de drift documental já achado em `docs/RELATORIO-ESTADO-PROJETO.md`
quanto ao redesenho Nível 2/3). Registrado aqui para não reabrir esses 3 como
pendência numa sessão futura.

## Prova

- **Verificação minha (implementador — ALEGADO até auditoria confirmar):**
  navegador real, usuário QA descartável (`qa.coachbar@lastro.test`, apagado ao
  final, cascade = 0).
  - `/login`: `.botao-texto` medido via `getBoundingClientRect()` — 48px de
    altura (era ~33px).
  - `/coach`, tema Padrão (Obsidian Ouro): barra escura, indicador visual OK.
  - Trocado pro tema Claro (Marfim & Ouro Imperial) em `/ajustes/temas`,
    voltado pra `/coach`: barra agora **branca**, acompanhando o tema.
  - Medido `.barra-conversa__input` (48px altura) e `.barra-conversa__botao`
    (48×48px, `color: rgb(15, 23, 42)` — o token `--lastro-acao-txt`, não mais
    `#07090D` cravado).
- **4 gates verdes:** `tsc --noEmit` · `test` 238/238 · `lint` 0 erros · `build`.

## O que NÃO foi verificado

- Os outros 5 temas além de Padrão e Claro — a correção usa os mesmos tokens
  (`--lastro-vidro-nav`/`-opaco`) que `.nav` já usa em todos os 7 temas, então
  o risco é baixo, mas não medi cada um individualmente.
- Screenshot não salvo como arquivo (mesma limitação registrada em OF-03) —
  evidência é a medição via `javascript_tool`, citada aqui.
