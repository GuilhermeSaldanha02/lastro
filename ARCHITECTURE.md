# ARCHITECTURE.md — `lastro`

> **Snapshot vivo.** Descreve o estado **ATUAL**. Toda mudança estrutural atualiza este arquivo junto com `DECISIONS.md`.
>
> **Estado em 2026-08-06:** construído e em produção (Vercel + Supabase). 8 rotas, CRUD completo de treino/série, home com resumo real, catálogo e coach implementados. O que falta está listado em `PROGRESS.md` — pendências consolidadas.

---

## Topologia

```
Celular (PWA instalado)  ──┐
                            ├──> Next.js na Vercel ──> Supabase (Auth + Postgres + RLS)
PC (navegador)          ──┘         │
                                     └──> route handler /api/* ──> Gemini API
                                          (única coisa que enxerga a chave)
```

**Duas fronteiras que não se cruzam:**
1. **A chave da Gemini vive só no servidor.** Cliente nunca importa o SDK — só `src/app/api/analise/gemini.ts` e `route.ts` importam `@google/genai`; `src/app/api/coach/route.ts` reusa `ClienteParecerGemini` de lá em vez de importar o SDK de novo. (FF1, FF2)
2. **O agregador não fala com o mundo.** Recebe séries, devolve métricas. Sem rede, sem banco, sem I/O. (FF3)

---

## Camadas

| Camada | Responsabilidade | Caminho real |
|---|---|---|
| **UI** (telas) | Rotas, formulários | `src/app/{page,login,treino,analise,catalogo,coach}/**` |
| **Design system** | Tokens (fonte única de cor/espaço/tipo) e as classes que os usam | `src/app/tokens.css`, `src/app/sistema.css` |
| **Componentes** | Peças reusadas entre telas | `src/components/*.tsx` |
| **Persistência local** | IndexedDB via Dexie + fila outbox | `src/lib/offline/db.ts`, `outbox.ts` |
| **Sincronização** | Drenar a outbox para o Supabase | `src/lib/offline/sincronizacao-em-segundo-plano.ts` + o `sincronizarPendentes` de cada componente que enfileira |
| **Acesso a dados** | Server Actions/queries ao Supabase — CRUD de treino, série, catálogo, resumo da home | `src/lib/dados/{treino,auth,resumo-home}.ts` |
| **Agregador** | Volume, e1RM, séries difíceis, frequência, estagnação, PRs | `src/lib/analise/*.ts` — TDD estrito, sem chamada de rede |
| **API server-side** | Proxy da Gemini: recebe o resumo do agregador, monta o prompt, devolve o parecer/resposta | `src/app/api/{analise,coach}/**` |
| **Middleware** | Refresca sessão, protege rota privada | `src/proxy.ts` |
| **Dados** (Supabase) | Postgres com RLS `for all using (usuario_id = auth.uid())` | `supabase/migrations/*.sql` |

**Camada que o ADR previu e não existe:** `src/lib/local/` e `src/lib/sync/` (nomes do ADR-004) nunca foram criados como tal — o que existe é `src/lib/offline/`, cobrindo o mesmo papel com outro nome. Documentado aqui para quem procurar pelo nome do ADR e não achar.

---

## Rotas (2026-08-06)

| Rota | Pública/privada | O que é |
|---|---|---|
| `/` | Pública (conteúdo muda com sessão) | Porta de entrada única do app — `manifest.webmanifest` e os dois fluxos de login (e-mail, Google) voltam pra cá. Sem sessão: marca + botão Entrar. Com sessão: painel com resumo real da semana, ação de continuar/iniciar treino, atalho pra Análise, treinos recentes. |
| `/login` | Pública | E-mail/senha ou Google OAuth. |
| `/auth/callback` | Pública (route handler) | Troca o código OAuth do Google por sessão. |
| `/treino` | Privada | Lista de treinos, excluir treino (com confirmação), iniciar treino de hoje. |
| `/treino/[id]` | Privada | Treino em andamento — registrar, editar, excluir série. A tela mais usada do app. |
| `/analise` | Privada | A peça-assinatura: escolher pergunta → parecer da Gemini sobre dado real. |
| `/catalogo` | Privada | Exercícios agrupados por grupo muscular, com dica de execução onde já foi escrita. |
| `/coach` | Privada | Chat de dúvidas — única tela do app onde balão de conversa é correto. |

Middleware (`src/proxy.ts`) protege por prefixo: `/treino`, `/analise`, `/catalogo`, `/coach`. Rota nova que esquecer essa lista fica pública por omissão.

---

## O caminho da peça-assinatura

```
séries registradas
   ↓
agregador determinístico (TypeScript, TDD estrito)
   ↓
resumo compacto  ← o LLM vê SÓ isto
   ↓
route handler monta o prompt + chama a Gemini
   ↓
parecer citando exercícios e números reais do dono
```

O ponto de falha que este desenho existe para evitar: o modelo fazendo aritmética. Ele interpreta; não calcula.

A home (`/`) e o Coach (`/coach`) seguem a mesma regra por extensão: `resumo-home.ts` reusa `calcularVolume` do agregador em vez de duplicar a conta (E10), e o Coach nunca recebe dado de treino no prompt — ele responde dúvida geral, não lê os números do dono.

---

## O caminho do registro, edição e exclusão (offline-first)

```
usuário registra/edita/exclui série
   ↓
grava no IndexedDB e a UI já confirma  ← nunca espera a rede
   ↓
entra na fila outbox (criar_serie | atualizar_serie | excluir_serie)
   ↓
service worker/listener `online` drena quando há rede
   ↓
Supabase
```

Regra que decide o produto: **registrar (e corrigir) série nunca depende de rede.** Se a UI esperar o servidor, o app morre no subsolo da academia — que é o caso de uso real.

**Exclusão de treino inteiro é a exceção deliberada:** é `excluir_treino`, mas roda **online-only**, sem passar pela fila. É ação mais rara, tipicamente feita revendo o histórico com calma — não a cena que D6 protege. (`DECISIONS.md` 2026-08-06.)

---

## Entidades

Nomes seguem o glossário de `KNOWLEDGE.md` §1 — linguagem ubíqua, sem sinônimo.

- **exercicio** — catálogo curado. Nome PT-BR, grupo muscular primário, dicas de execução (curadas, nunca geradas — FF7). **Hoje só 3 exercícios placeholder de teste existem no banco** — o catálogo real de ~100 é trabalho de redação pendente (ver `PROGRESS.md`, Fase 4).
- **treino** — uma ida à academia. Data, usuário. CRUD completo: criar, listar, buscar com séries, excluir (cascade).
- **serie** — pertence a treino + exercicio. Campos: `tipo` (aquecimento | valendo), `reps`, `peso`, `unidade`, `rir` (opcional), `unilateral`, `peso_corporal_incluso`. CRUD completo: criar, editar (não o exercício — trocar de exercício é operação diferente), excluir.

---

## Dependências externas

| Serviço | Para quê | Se cair |
|---|---|---|
| Supabase | Auth + banco | Registro continua funcionando offline; sincroniza depois |
| Gemini | Análise e coach | Log e gráficos continuam. **A Análise é a única coisa que para** |
| Vercel | Hospedagem | PWA instalado continua abrindo e registrando offline |

O desenho garante que **a função crítica — anotar a série no meio do treino — não depende de nenhum dos três.**

---

## Drift conhecido vs. `ADR.md`

O ADR é append-only e não se reescreve; os desvios de execução ficam registrados aqui e em `DECISIONS.md` (2026-08-06, "Stack real diverge do ADR-004"):

- **Offline:** ADR previu Serwist. O que existe é um `public/sw.js` **hand-rolled mínimo** (install/activate/fetch passthrough), sem estratégia de cache. Funciona para o caso de uso atual; Serwist não foi adotado.
- **Testes:** ADR previu Vitest + Playwright. **Só Vitest existe** — nenhum E2E foi escrito. Playwright não está instalado.
