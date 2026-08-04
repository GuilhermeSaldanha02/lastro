# ARCHITECTURE.md — `lastro`

> **Snapshot vivo.** Descreve o estado **ATUAL**. Toda mudança estrutural atualiza este arquivo junto com `DECISIONS.md`.
>
> **Estado em 2026-08-04:** nenhum código escrito. O que segue é a arquitetura **semeada pelo ADR**, ainda não construída. Enquanto houver esta nota, este arquivo descreve intenção, não realidade.

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
1. **A chave da Gemini vive só no servidor.** Cliente nunca importa o SDK. (FF1, FF2)
2. **O agregador não fala com o mundo.** Recebe séries, devolve métricas. Sem rede, sem banco, sem I/O. (FF3)

---

## Camadas

| Camada | Responsabilidade | Não pode |
|---|---|---|
| **UI** (`src/app/**`) | Telas, formulários, gráficos | Importar SDK da Gemini; calcular métrica |
| **Persistência local** (`src/lib/local/`) | IndexedDB via Dexie + fila outbox | Assumir que há rede |
| **Sincronização** (`src/lib/sync/`) | Drenar a outbox para o Supabase, resolver conflito | Bloquear o registro de série |
| **Agregador** (`src/lib/analise/`) | Volume, e1RM, séries difíceis, frequência, estagnação, detecção de padrão | Fazer qualquer chamada de rede |
| **API** (`src/app/api/**`) | Proxy da Gemini: recebe o resumo do agregador, monta o prompt, devolve o parecer | Receber ou repassar linhas cruas de série |
| **Dados** (Supabase) | Postgres com RLS por `auth.uid()` | Ter tabela de usuário sem policy |

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

---

## O caminho do registro offline

```
usuário registra série
   ↓
grava no IndexedDB e a UI já confirma  ← nunca espera a rede
   ↓
entra na fila outbox
   ↓
service worker drena quando há rede
   ↓
Supabase
```

Regra que decide o produto: **registrar série nunca depende de rede.** Se a UI esperar o servidor, o app morre no subsolo da academia — que é o caso de uso real.

---

## Entidades

Nomes seguem o glossário de `KNOWLEDGE.md` §1 — linguagem ubíqua, sem sinônimo.

- **exercicio** — catálogo curado. Nome PT-BR, grupo muscular primário, dicas de execução (curadas, nunca geradas — FF7).
- **treino** — uma ida à academia. Data, usuário.
- **serie** — pertence a treino + exercicio. Campos que **não podem faltar desde o início**, sob pena de migração: `tipo` (aquecimento | valendo), `reps`, `peso`, `unidade`, `rir` (opcional), `unilateral`, `peso_corporal_incluso`.

---

## Dependências externas

| Serviço | Para quê | Se cair |
|---|---|---|
| Supabase | Auth + banco | Registro continua funcionando offline; sincroniza depois |
| Gemini | Análise e coach | Log e gráficos continuam. **A Análise é a única coisa que para** |
| Vercel | Hospedagem | PWA instalado continua abrindo e registrando offline |

O desenho garante que **a função crítica — anotar a série no meio do treino — não depende de nenhum dos três.**
