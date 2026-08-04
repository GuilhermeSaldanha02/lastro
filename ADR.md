# ADR.md — `lastro`

> **Contrato de decisões.** Append-only por entrada: decisão nova é entrada nova, **nunca reescrever antiga**. O histórico de mudanças fica em `DECISIONS.md`; o estado atual da arquitetura, em `ARCHITECTURE.md`.

---

## ADR-001 — Ferramenta pessoal, não produto de mercado

**Contexto.** A diretriz de bootstrap exige que a ideia mire monopólio de nicho. No portão de entrevista, o dono definiu uso **pessoal/fechado**, com a chave da Gemini dele.

**Decisão.** O alvo não é monopólio de mercado — é **profundidade máxima no treino real de uma pessoa**. Persona única, sem features de crescimento.

**Consequências.** Sem rate limit, sem billing, sem onboarding para estranhos, sem defesa anti-abuso no MVP. O free tier da Gemini cobre um usuário com folga. Nenhuma decisão do produto pode se justificar por "outros usuários poderiam querer".

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
| IA | **Gemini via route handler** (`@google/genai`, `gemini-2.5-flash`) | *Chamada do cliente* — ADR-002. |
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
