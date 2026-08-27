# Relatório de estado do projeto — `lastro`

> Auditoria completa pedida pelo dono em **2026-08-26**. Escrita por `claude`.
>
> **Método:** leitura dos 13 documentos de contrato (`PRD`, `ADR`, `SDD`, `DESIGN`, `DECISIONS`, `KNOWLEDGE`, `PROGRESS`, `ARCHITECTURE`, `QA`…), varredura do código real (137 arquivos em `src/`), consulta ao banco hospedado, e execução dos 4 gates (`tsc`, `vitest`, `lint`, `build`).
>
> **Tudo aqui foi medido, não estimado.** Onde não deu para medir, está escrito que não deu.

---

## 1. O que o projeto é

Um app de treino **pessoal**, para **um único usuário** (o dono), que registra cada série executada e, uma vez por semana, entrega um **parecer em português sobre o que aqueles números significam**.

**Tese (PRD §1):** *o log e o gráfico são infraestrutura; o produto é a leitura.*

A regra de arquitetura que sustenta a tese: **o LLM nunca recebe linha crua de série.** Um agregador determinístico e testado calcula tudo primeiro; o modelo só interpreta o resumo. Se o modelo fizesse a conta, ele erraria a conta — e um parecer confiante com número errado é o modo de falha que este produto não sobrevive.

### Números do projeto, hoje

| | |
|---|---|
| Rotas | 21 (17 páginas + 4 API/callback) |
| Arquivos em `src/` | 137 (`.ts`/`.tsx`) |
| Componentes React | 37 |
| Arquivos de teste | 26 · **185 testes, todos passando** |
| Migrações aplicadas | 14 |
| Exercícios no catálogo | **102** |
| Idiomas | 3 (pt-BR, en, es) |
| Temas visuais | 7 |
| Commits | 50 (histórico atual, desde 2026-08-21) |
| Gates | `tsc` ✅ · `vitest` 185/185 ✅ · `lint` 0 erros ✅ · `build` ✅ |

---

## 2. O que já está pronto

### A peça-assinatura funciona ponta a ponta
A Análise Semanal — a razão de o projeto existir — está **completa e no ar**: as 5 perguntas do PRD §3, agregador local, `/api/analise` com Gemini real, parecer renderizado como documento (cabeçalho de emissão, veredito, blocos de evidência com procedência, prosa), e os 4 estados (gerando / sem dados / erro de API / pronto).

### O agregador é a parte mais bem construída do projeto
`src/lib/analise/` — 12 módulos, 12 arquivos de teste, **97,8% de cobertura de statements** (85,95% de branches). É exatamente onde a cobertura precisa estar alta: é o código que não pode mentir sobre número. Verificado que ele **não importa `fetch`, cliente HTTP nem Supabase** (critérios A4/A7 do PRD — cumpridos).

### Registro de treino, offline-first
Grava local (IndexedDB/Dexie) primeiro, fila outbox, Background Sync via service worker. `setSeries` acontece **antes** do `await` de rede — a UI confirma na hora (D6). Editar e excluir série, excluir treino, tudo na mesma fila.

### O resto do MVP
Login e-mail + Google · catálogo de 102 exercícios com 310 GIFs · Coach 24h · gráfico de progressão em pequenos múltiplos · perfil com upload de foto · treinos salvos (modelos) · calculadora de anilhas · meta semanal · 7 temas · 3 idiomas · CI no GitHub Actions rodando os 4 gates em toda PR.

---

## 3. O que ainda vai ser feito

Isto **já está levantado e priorizado** — não precisa ser redescoberto. As fontes são autocontidas:

- **`docs/BACKLOG-PROXIMA-FASE.md`** — itens A1–A2 (bugs), B1–B2 (achados do dono), C1–C5 (features aprovadas pelo dono), T1–T7 (auditoria pós-Apex Pro). Vários já resolvidos e marcados.
- **`docs/BACKLOG-REDESENHO.md`** — Trilha B do redesenho: Nível 1 fechado (E1–E4), **Nível 2 (M1–M9) e Nível 3 (H1–H4) não começados**.
- **`PROGRESS.md` §Fase 6** — integração final: nunca iniciada.

### O que sobra, resumido

| Item | Onde | Estado |
|---|---|---|
| **Fase 6 inteira** — review integral, fitness functions automatizadas, E2E das 3 jornadas, gate visual em celular físico | `PROGRESS.md` | ⬜ Não iniciada |
| **T5** — campo do coach 9px sob a aba inferior (360×640) | Backlog | ⬜ ALTA, medido |
| **T6** — alvos de toque abaixo de 48px ("Ver Todos" mede 20px) | Backlog | ⬜ Viola D1 |
| **T7** — 6 achados menores (erro cru em inglês, texto de sucesso com estilo de erro, "abaixo" apontando pra cima…) | Backlog | ⬜ |
| **T3b parte 1** — remedir os 14 pares de contraste de `DESIGN.md` §4.2 contra o Apex Pro | Backlog | ⬜ Só C3 remedido |
| **C1/C2/C4** — histórico por exercício + repetir a série *do exercício* + PR na linha | Backlog | ⬜ Uma consulta serve aos 3 |
| **C5** — excluir a própria conta (cascade já funciona, falta a porta na UI) | Backlog | ⬜ |
| **Nível 2 e 3 do redesenho** (M1–M9, H1–H4) | Backlog redesenho | ⬜ |
| **Sync offline em celular real** (modo avião → reconectar) | `PROGRESS.md` | ⬜ Nunca testado em aparelho |

---

## 4. O que deveria implementar

> Recomendação, não menu. **A regra que organiza tudo abaixo: terminar o que o PRD já prometeu antes de adicionar qualquer coisa nova.** O app hoje tem mais recurso do que contrato cumprido.

### 1º — As 102 dicas de execução + o aviso de saúde  ⭐ *a mais importante*

O catálogo curado é **1 das 3 coisas que a persona quer** (PRD §2, item 3: "tirar dúvida de execução sem se machucar"). Medido no banco hospedado agora:

```
total: 102   |   com dica_execucao: 0
```

**Zero.** O critério A9 do PRD ("todo exercício tem dica de execução revisada, contagem de campos vazios = 0") não é atendido por nenhum exercício. E o `PRD.md` §4.5 exige junto um **aviso de que não substitui acompanhamento profissional** — que não existe em lugar nenhum do código.

Por que é a prioridade: FF7/ADR-007 proíbe gerar essas dicas por LLM (é assunto de saúde). Ou seja, **é o único item da lista que nenhum agente pode fazer sozinho** — depende de redação humana revisada. Todo o resto pode esperar; isto só anda com o dono. O aviso de saúde, por outro lado, custa quase nada e deveria entrar já.

### 2º — Mostrar os recordes pessoais que já estão calculados

`src/lib/analise/prs.ts` está **pronto, testado e invisível**: calcula PRs corretamente e só alimenta o texto do parecer. **Nenhuma tela do app mostra um PR.** É funcionalidade construída e desperdiçada — o menor esforço com maior retorno percebido de toda a lista, porque a lógica difícil já passou no teste.

### 3º — Testes onde o dono realmente toca

A cobertura de 97,8% é verdadeira, mas o `vitest.config.ts` a limita a `src/lib/analise/**`. Fora dali:

- **37 componentes React, 0 testes.**
- **0 testes E2E**, apesar de o Playwright estar instalado e ter sido adotado formalmente (`DECISIONS.md`).
- O **CI não roda as fitness functions A4/A5/A7**, que o próprio PRD define como critérios verificáveis — hoje são conferência manual, então na prática ninguém confere.

O agregador — a parte que não pode mentir sobre número — está genuinamente bem coberto. **Tudo que o dono vê e toca, não está.** Os 3 primeiros E2E deveriam ser exatamente as 3 jornadas do PRD §6 (treino / análise / dúvida).

---

## 5. Falhas

### 5.1 Divergências entre o que está no ar e o que os documentos dizem
*Não são "features proibidas" — são decisões que precisam ser confirmadas e registradas. O app é do dono; ele pode mudar de ideia. O problema é o registro não refletir a decisão.*

#### D1 · Compartilhamento em Instagram Story vs. escopo negativo — **precisa de decisão**

`src/components/relatorio-pos-treino.tsx` implementa um fluxo completo de compartilhamento: botão "Compartilhar Treino", seção "Compartilhar com", botão dedicado de **Instagram Story**, geração de sticker PNG 1080×1080 transparente com a marca LASTRO, cópia para clipboard, download e Web Share API nativa.

O `PRD.md` está **congelado** e diz:

> §5 — ❌ Qualquer coisa social: feed, seguir, comparar, ranking, **compartilhar**.
> §1 — Não é app social, não é rede de fitness, não é plataforma.

**Não há Scope Change registrado em `DECISIONS.md`** para isso — e o protocolo do próprio PRD exige um.

**Sendo justo com a natureza do que foi construído:** é geração de imagem 100% no cliente + Web Share API. Não há feed, não há seguir, não há grafo social, não há servidor envolvido, nenhum dado sai para lugar nenhum sem o dono mandar. Está mais perto de "exportar uma imagem" do que de "rede social".

**A pergunta é para o dono:** foi você que pediu isso ao antigravity? Se sim, é só registrar o Scope Change e emendar o §5. Se não, é decidir se fica ou sai. Das duas, uma — mas hoje o documento diz uma coisa e o app faz outra.

#### D2 · Timer de descanso vs. PRD §5 — **só falta registrar**

O `PRD.md` §5 exclui "**Cronômetro de descanso** … — **na v1**. Nenhum está descartado para sempre; estão fora do MVP". O timer existe e está no ar.

**Duas ressalvas importantes, para o registro ficar correto:**

1. `DECISIONS.md:862` registra como não aprovado o "cronômetro de descanso **automático**". O que foi construído é **manual** (`onClick`, disparo pelo usuário) — então **essa linha não proíbe o que existe**. Quem se aplica é só a exclusão do §5.
2. **O dono dirigiu esta feature pessoalmente** na sessão de 2026-08-26, escolheu o layout do gatilho e mandou mergear. Não há dúvida de consentimento aqui.

Ou seja: é apenas a documentação que ficou para trás. Uma linha no `PRD.md` §5 e uma entrada em `DECISIONS.md` resolvem.

---

### 5.2 Contrato do PRD não cumprido

| # | Falha | Evidência |
|---|---|---|
| **F1** | **Critério A9 não atendido** — 102 exercícios, **0 dicas de execução** | Medido no banco: `count(dica_execucao) = 0` |
| **F2** | **Aviso "não substitui acompanhamento profissional" (§4.5) não existe** — assunto de saúde | Busca em `src/`: nenhuma ocorrência |
| **F3** | **A4/A5/A7 nunca automatizados** — o PRD os define como verificáveis, mas nenhum roda no CI | `.github/workflows/ci.yml` roda só lint/test/build/tsc |

*Verificado e **em ordem**: as ressalvas obrigatórias de `KNOWLEDGE.md` §3.6/§3.7 (faixa de volume e "estagnação é convenção de mercado, não critério clínico") **estão** na UI — `parecer.tsx:93` e `:98`.*

### 5.3 Defeitos no código

| # | Falha | Onde |
|---|---|---|
| **F4** | `totalExercicios` conta exercício que só teve série de **aquecimento** — infla o relatório pós-treino, contra o espírito do FF4 | `src/lib/dados/metricas-treino.ts:29` |
| **F5** | **14 strings sem tradução** — renderizam português no meio da tela em `en`/`es`. Concentradas exatamente nas features mais novas (timer, relatório pós-treino, player) | `timer-topo.tsx`, `relatorio-pos-treino.tsx`, `player-execucao-exercicio.tsx` |
| **F6** | **Emojis remanescentes** (🏆, 🔥) — o commit `204353b` anunciou "remove emojis" mas não tocou este arquivo | `relatorio-pos-treino.tsx:31,79` |
| **F7** | **Hydration mismatch** no console a cada carga: `data-tema` diverge entre servidor e cliente (tema decidido só no cliente) | `layout.tsx` / troca de tema |
| **F8** | Título "Treino em andamento" sai com reticências (~185px disponíveis vs ~237px pedidos) | `/treino/[id]`, regressão aberta desde 2026-08-13 |

### 5.4 Documentação inconsistente

| # | Falha |
|---|---|
| **F9** | **`DESIGN.md` §3.3 item 5 afirma que "Serwist faz precache dos arquivos de fonte"** e que *"é isso que torna verdadeira a frase 'não depende de rede'"*. **Serwist não está no `package.json`**, e o `public/sw.js` cacheia apenas `/offline.html`. `ARCHITECTURE.md` e `DECISIONS.md` já registram esse drift corretamente — o `DESIGN.md` ficou para trás. |
| **F10** | **`DESIGN.md` §3.1/§3.2/§4.2** — 16 linhas da tabela de contraste e 13 dos 14 pares C1–C14 seguem com números da paleta "Areia" (que não existe mais desde o Apex Pro). O próprio documento avisa, mas o gate de contraste continua sem número real para conferir. É o T3b parte 1. |
| **F11** | **`QA.md` está vazio** — a seção 2 ("Estado por Item") não tem uma única linha. O registro incremental de verificação, que existe justamente para não reverificar o que já passou, nunca foi preenchido. |

### 5.5 Higiene

| # | Falha |
|---|---|
| **F12** | **`public/` tem 27 arquivos de artefato de desenvolvimento** (~2,4 MB): mockups, comparações de tema, `design-concept-pro.html`, `galeria_conceitos.html`. Como estão em `public/`, o Next os serve na raiz do site — pelo contrato do framework, ficam publicamente acessíveis no domínio. Não checei o deploy; a afirmação é sobre o que o framework faz com esses arquivos. |
| **F13** | **`public/videos` pesa 92 MB** (310 GIFs). Vai inteiro para o repositório e para o build. Funciona, mas é o tipo de peso que só piora. |
| **F14** | **19 branches remotas já mergeadas** nunca apagadas. Nenhuma tem trabalho pendente (`--no-merged` = vazio), então é limpeza segura. |

---

## 6. Leitura final

**O projeto está saudável no que mais importa.** A peça-assinatura funciona, o agregador — a parte que não pode errar — é a mais bem testada do código, os 4 gates passam, e a disciplina de documentação é acima da média (13 documentos de contrato, `DECISIONS.md` com 1.250 linhas de rastro).

**O risco real não é técnico, é de foco.** Nos últimos dias entraram GIFs, player 3D, timer, relatório pós-treino e compartilhamento — enquanto **os 102 exercícios seguem sem uma linha de dica de execução** e o aviso de saúde do §4.5 nunca foi escrito. O app está ganhando recurso mais rápido do que está cumprindo o próprio contrato.

**As duas decisões que só o dono pode tomar:**
1. O compartilhamento em Instagram Story fica (e o PRD §5 é emendado) ou sai?
2. Quando as 102 dicas de execução vão ser escritas? É o único item da lista que nenhum agente pode fazer sozinho.
