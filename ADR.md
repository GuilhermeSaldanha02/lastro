# ADR.md — `lastro`

> **Contrato de decisões.** Append-only por entrada: decisão nova é entrada nova, **nunca reescrever antiga**. O histórico de mudanças fica em `DECISIONS.md`; o estado atual da arquitetura, em `ARCHITECTURE.md`.

---

## ADR-001 — Ferramenta pessoal, não produto de mercado

**Contexto.** A diretriz de bootstrap exige que a ideia mire monopólio de nicho. No portão de entrevista, o dono definiu uso **pessoal/fechado**, com a chave da Gemini dele.

**Decisão.** O alvo não é monopólio de mercado — é **profundidade máxima no treino real de uma pessoa**. Persona única, sem features de crescimento.

**Consequências.** Sem rate limit, sem billing, sem onboarding para estranhos, sem defesa anti-abuso no MVP. Nenhuma decisão do produto pode se justificar por "outros usuários poderiam querer".

**TODO — premissa não verificada.** Esta decisão assume que a quota disponível cobre um usuário com folga. **Isso ainda não foi medido** (`KNOWLEDGE.md` §3.2: as fontes públicas se contradizem e houve corte de quota em dez/2025). Enquanto a tarefa 1.0c não ler o valor real no console, "sem teto de gasto" é aposta, não conclusão.

**Alternativa descartada.** Produto público desde o MVP — exigiria limite por usuário, teto de gasto e defesa contra abuso do chat, aumentando o escopo em ~30% sem servir ao dono.

**Como reverter.** Custoso, mas não impossível: o proxy server-side já isola a chave, então abrir ao público exige acrescentar contador de uso e limite — não reescrever a arquitetura.

---

## ADR-002 — A chave da Gemini nunca toca o cliente

**Contexto.** Chave embarcada em bundle web é lida no DevTools em segundos.

**Decisão.** Toda chamada à Gemini passa por route handler no servidor. O cliente nunca importa o SDK do modelo nem vê a chave.

**Consequências.** Obriga a existir camada de servidor — o que elimina hospedagem puramente estática. Vira as fitness functions FF1 e FF2.

**Alternativa descartada.** Chamada direta do cliente com a chave em variável de ambiente pública. Inegociável: vaza.

---

## ADR-003 — A Análise calcula antes de perguntar

**Contexto.** É a peça-assinatura. O maior risco não é o modelo escrever mal — é ele **errar a aritmética** e entregar um parecer confiante sobre número falso.

**Decisão.** Fluxo obrigatório: `séries → agregador determinístico (TypeScript, testado) → resumo compacto → prompt`. O LLM recebe métricas já calculadas e **apenas interpreta**. Nunca recebe linhas cruas de série.

**Consequências.** O agregador é o núcleo do produto e recebe o rigor mais alto do projeto (TDD estrito). Vira FF3. Efeito colateral bom: o prompt fica pequeno e barato.

**Alternativa descartada.** Mandar o histórico bruto e deixar o modelo raciocinar. Mais simples de escrever, e é exatamente o modo de falha que a peça-assinatura não sobrevive.

---

## ADR-004 — Stack (Stack Grill, camada por camada)

Partindo sempre da opção mais boring; cada peça extra justifica o custo. Consenso com o dono na aprovação do plano de bootstrap.

| Camada | Decidido | Alternativa descartada — e o motivo real |
|---|---|---|
| App shell | **Next.js (App Router)** | *Astro* — o dono já conhece, e **Astro tem endpoints de servidor**; não foi descartado por isso. Foi descartado por ser app inteiramente autenticado, com estado offline e navegação de aplicativo: fora do ponto forte dele, que é conteúdo estático. |
| Hospedagem | **Vercel** | *Netlify* — tecnicamente equivalente; Vercel ganha por integração de primeira parte com Next. |
| Auth + Banco | **Supabase** — Google OAuth + e-mail, Postgres, RLS por `auth.uid()` | *Auth.js + Postgres separado* — mais peças para manter num projeto de uma pessoa. |
| Offline | **IndexedDB (Dexie) + fila outbox + service worker (Serwist)** | *PowerSync / ElectricSQL* — motor de sync completo é peso desproporcional para um usuário. |
| Gráficos | **Recharts** | *Chart.js* — Recharts integra melhor em React; a diferença real é pequena. |
| IA | **Gemini via route handler** (`@google/genai`, `gemini-3.6-flash` — corrigido 2026-08-05, ver DECISIONS.md) | *Chamada do cliente* — ADR-002. |
| Catálogo de exercícios | **~100 curados em PT-BR, seed no Supabase** | *ExerciseDB (1500+ com GIF)* — procedência das mídias nebulosa e nomes em inglês; tradução automática produz lixo ("Bent Over Row" → "Fileira Curvada"). |
| Testes | **Vitest** (unitário) + **Playwright** (E2E, proporcional ao risco) | *Jest* — Vitest é o padrão do ecossistema Vite/Next moderno e mais rápido. |

---

## ADR-005 — Metodologia: híbrida, com o agregador dominando

**Princípio da diretriz:** a camada que mais dói se quebrar domina a metodologia.

Aqui, a camada que mais dói é o **agregador de métricas**: se ele erra, a peça-assinatura mente com confiança e o produto perde a única razão de existir.

| Camada | Metodologia | Rigor |
|---|---|---|
| Agregador de métricas (`src/lib/analise/`) | **TDD estrito** — teste antes do código, casos conferidos à mão | Máximo |
| Prompts e integração com a Gemini | **SDD** + avaliação por leitura humana do parecer (saída não-determinística não tem teste verde) | Alto |
| Sincronização offline | **SDD** + teste E2E com rede desligada | Alto |
| UI, telas, catálogo | **SDD** + gate visual em navegador real | Padrão |

O glossário do `KNOWLEDGE.md` é a **linguagem ubíqua** do projeto: nomes de tabela, campo e função usam esses termos, sem sinônimo.

---

## ADR-006 — Fitness functions

Asserções objetivas, checadas ao fim de cada fase do roadmap. Falhou um eixo → apresentar opções ao dono, aguardar decisão, registrar em `DECISIONS.md`.

| # | Asserção | Como se checa |
|---|---|---|
| **FF1** | Nenhum módulo do cliente importa o SDK da Gemini | Busca por `@google/genai` fora de `src/app/api/` |
| **FF2** | A chave não aparece no bundle | Busca pela string da chave no build de produção |
| **FF3** | O agregador não faz chamada de rede | Sem import de `fetch`, cliente HTTP ou Supabase em `src/lib/analise/` |
| **FF4** | Aquecimento nunca entra em volume, e1RM ou frequência | Teste de fixture com aquecimento + valendo misturados |
| **FF5** | Toda tabela com dado de usuário tem RLS por `auth.uid()` | Query no catálogo do Postgres; contagem de tabelas sem policy = 0 |
| **FF6** | Série registrada sem rede persiste e sincroniza sozinha | E2E com rede desligada + verificação no servidor |
| **FF7** | Nenhuma dica de execução de exercício é gerada por LLM | Toda dica vem do seed curado; revisão do seed |

---

## ADR-007 — Conteúdo de execução é curado, nunca gerado

**Contexto.** Instrução de forma de movimento gerada por LLM é conteúdo inventado (E3) em domínio onde o erro machuca.

**Decisão.** Dicas de execução vêm exclusivamente do catálogo curado e revisado, com aviso visível de que não substituem acompanhamento profissional. O coach 24h responde dúvidas gerais, mas não improvisa técnica de movimento.

**Consequências.** Vira FF7. O catálogo de ~100 exercícios é trabalho de redação real, não import de API — e é parte do custo do MVP, não acabamento.

**Alternativa descartada.** Gerar as dicas com a Gemini no momento da exibição — barato, escalável e irresponsável.

---

## ADR-008 — Sem tela de rotina; o padrão se deriva dos dados

**Contexto.** Para responder "meu volume está equilibrado?", o caminho óbvio é o usuário declarar a divisão de treino e comparar o executado com o planejado.

**Decisão.** Não existe configuração de rotina. A Análise **detecta o padrão real** a partir das séries registradas e aponta grupos negligenciados.

**Consequências.** Elimina uma tela do MVP e mede o que foi feito em vez do que foi prometido — que é a única coisa que interessa numa ferramenta de honestidade sobre o próprio treino.

**Alternativa descartada.** Configurador de divisão ABC/Upper-Lower/Full body — mais tela, mais manutenção, e a comparação com o plano declarado tende a lisonjear.

---

## ADR-009 — Lista de exercícios reaproveitável (`modelo_treino`) não é a rotina que a ADR-008 proibiu

**Contexto.** ADR-008 decidiu "sem tela de rotina" pela razão registrada ali: evitar que a Análise compare executado vs. planejado, porque essa comparação tende a lisonjear e o produto existe para medir o que foi feito, não o que foi prometido. Em 2026-08-13 o dono aprovou uma tela nova, dentro de `/ajustes`, onde a pessoa pode (opcional) montar uma lista de exercícios que costuma fazer — só a lista, nunca série/peso/reps — e no dia do treino escolher entre um treino "já montado" (a lista pré-selecionada) ou "treino novo" (fluxo atual, do zero). `KNOWLEDGE.md` §3.8 registra a pesquisa preliminar que embasa esta entrada, inclusive o precedente de mercado (Hevy *routine* vs. *program* — ver §3.8 item 1).

Esta entrada não reescreve a ADR-008 — ela continua valendo como registro da razão original. Esta entrada existe porque a nova tela toca a mesma palavra ("rotina"/"treino pré-montado") sem tocar a mesma razão, e isso precisa estar demonstrado, não só afirmado.

**Decisão.** Aprovada a tabela `modelo_treino` (+ `modelo_treino_exercicio`), com uma restrição estrutural, não de prosa: **nenhum módulo de `src/lib/analise/` importa, consulta ou recebe dado de `modelo_treino`/`modelo_treino_exercicio`, em nenhuma forma — nem linha crua, nem métrica derivada, nem menção em prompt à Gemini.** A tabela guarda exclusivamente `exercicio_id` + `ordem`; não existe coluna de série, peso, reps, rir ou tipo, e não pode passar a existir sem uma entrada nova de ADR.

**Por que isso não fere a razão da ADR-008.** A razão da ADR-008 é sobre a Análise: não comparar executado vs. planejado, não deixar o dono declarar uma divisão que a Análise usaria como vara de medir a si mesma. `modelo_treino` nunca chega perto da Análise — é conveniência de preenchimento do formulário em `treino-detalhe.tsx` (pré-seleciona quais exercícios abrir, nada além disso). O agregador (`src/lib/analise/`) continua recebendo só `serie` — o que foi de fato registrado — exatamente como antes desta tela existir. Se `modelo_treino` um dia for lido por `src/lib/analise/`, a razão original volta a valer e a ADR-008 foi violada de fato, não só de nome; a fitness function abaixo é o que impede isso de acontecer em silêncio.

**Fitness function nova — FF8.** Vive aqui, não na tabela de `ADR-006`, porque `ADR-006` é append-only e esta função nasceu depois. A Revisão de Arquitetura ao fim de cada fase lê `ADR-006` **e** toda fitness function declarada em ADR posterior — FF8 não é opcional só por morar fora da tabela original.

| # | Asserção | Como se checa |
|---|---|---|
| **FF8** | Nenhum módulo de `src/lib/analise/` importa `modelo_treino`/`modelo_treino_exercicio`, direta ou indiretamente | Busca por `modelo_treino` em `src/lib/analise/`: zero ocorrências. Busca complementar por `from("modelo_treino` e `.modelo_treino_exercicio` em todo `src/`: só aparecem em `src/lib/dados/` (camada de dados) e nos componentes de `/ajustes`/formulário de treino — nunca em `src/lib/analise/` nem em `src/app/api/analise/` (route handler da Gemini) |

**Consequências.** A escolha "treino já montado vs. treino novo" acontece inteiramente na camada de UI/preenchimento (`src/lib/dados/treino.ts`, `treino-detalhe.tsx`) — o registro em `serie` continua idêntico nos dois casos, e é isso, não a escolha de origem, que a Análise enxerga. Especificação técnica completa (schema, migration, decisão de offline, fluxo de UI, o que fica de fora) em `SDD.md` §9.

**Alternativa descartada.** Guardar a lista como "sugestão" dentro do próprio fluxo de Análise (ex.: usar `modelo_treino` para prever o próximo treino ou alimentar o prompt da Gemini) — isso seria exatamente a comparação executado vs. planejado que a ADR-008 proibiu, com um nome diferente.

## ADR-010 — Cliente admin (service role) só para excluir a própria conta

**Contexto.** Backlog C5 pede a porta de UI para excluir a conta — a exclusão em cascata no schema já existia e já era verificada (`qa-treino-helper.sh limpar-usuario`), mas nunca foi exposta ao dono. `auth.users` não é alcançável pela `anon key`/RLS comum: apagar uma linha ali exige `auth.admin.deleteUser`, que só funciona com a `service_role key` — uma chave nova neste projeto, que ignora toda RLS. Isso é dependência sensível o bastante pra merecer entrada própria, não só um comentário no código (mesmo padrão do ADR-004: dependência nova pede justificativa de uma linha e registro aqui).

**Decisão.** `src/lib/supabase/cliente-admin.ts` — único ponto do projeto que usa `SUPABASE_SERVICE_ROLE_KEY`. Duas garantias estruturais, não só de prosa:

1. **Nunca recebe um id vindo do cliente.** `excluirConta()` (`src/lib/dados/conta.ts`) não tem parâmetro nenhum — o alvo é sempre `auth.getUser()` da sessão corrente, obtido pelo cliente normal (`criarClienteServidor`) **antes** de o cliente admin ser criado. Não existe caminho de código em que um usuário apague a conta de outro.
2. **Escopo de uso travado a uma função.** O cliente admin só é chamado por `auth.admin.deleteUser`. Qualquer uso novo (ex.: outra rotina administrativa) exige passar pelo mesmo raciocínio e ganhar entrada própria — não é "já que a chave existe, reaproveita".

**Por que não RLS/policy comum.** RLS filtra linha dentro de uma tabela que o Postgres deixa o `authenticated` tocar; `auth.users` é schema gerenciado pelo Supabase, sem `grant delete` disponível pro role `authenticated` mesmo com policy favorável — não é uma omissão de configuração, é o desenho do produto. A `service_role key` é o único caminho documentado pelo próprio Supabase para excluir uma conta pelo backend.

**Consequência de segurança prática.** `SUPABASE_SERVICE_ROLE_KEY` não tem prefixo `NEXT_PUBLIC_` (nunca entra no bundle do cliente) e vive só em `.env.local` (`.gitignore` já cobre `.env.*`). `cliente-admin.ts` não tem `"use client"` nem é importado por nenhum Client Component — só por `src/lib/dados/conta.ts`, que é `"use server"`.
