---
name: projeto-retomada
description: Protocolo para entrar num projeto que já existe e tem histórico. Use ao retomar projeto pausado, ao trabalhar pela primeira vez numa base que você não construiu, ao auditar o que já existe, ao refatorar, ao redesenhar algo que já está no ar, ou quando o dono disser que algo "não ficou como pediu". Define os passos read-only obrigatórios antes de qualquer edição e as regras que protegem o comportamento que já funciona.
---

# Retomar um projeto que já existe

**O comportamento que já funciona é o ativo mais valioso da base.** Todo este protocolo existe para não gastá-lo por acidente.

Diferença de fundo em relação a começar do zero: lá o risco é decidir escopo errado; aqui o risco é **quebrar o que funciona e refatorar no escuro**.

## PROIBIÇÃO DE ABERTURA

**Não edite nenhum arquivo de código até concluir o Passo 4 e o dono aprovar a triagem.** Os passos 1 a 4 são read-only. Se durante o reconhecimento você identificar algo urgente, **reporte — não conserte**.

---

## Passo 1 — Reconhecimento [READ-ONLY, delegue]

Mapeie o que existe **sem encher o seu contexto**. Exploração de codebase é o cenário que mais estoura contexto: delegue a um subagente e peça no máximo 20 linhas de volta.

O que o retorno precisa ter: stack real (a que está no código, não a que o README afirma), estrutura de pastas, documentos `.md` existentes, estado do git, o que roda e como se roda.

Comece por `node scripts/estado.mjs` — ele já responde branch, quem commitou o quê e o bloco de handoff.

**Working tree sujo → PARE e avise o dono** antes de qualquer coisa.

## Passo 2 — Baseline executável [OBRIGATÓRIO]

Estabeleça **como se prova que o sistema funciona hoje**, antes de tocar em nada. Rode build, testes e lint e registre a saída real. Se as jornadas críticas são visuais, capture o estado atual.

Sem baseline não existe refatoração segura: o "antes" é o que transforma *"não quebrei nada"* de alegação em prova.

**Apague o diretório gerado antes de medir** (`.next/`, `dist/`, cache de tipos). "Passou na minha máquina" e "passa em ambiente limpo" são afirmações diferentes, e a diferença mora justamente no que o `.gitignore` esconde.

Se não houver teste nenhum na área que vai ser tocada, **diga isso explicitamente** — cobrir com check de caracterização passa a ser a primeira tarefa do plano, não um item opcional depois.

## Passo 3 — Entrevista [uma pergunta de cada vez]

Cave: o que dói hoje, **o que já foi tentado e falhou (e por quê)**, o que é INTOCÁVEL, o que o dono já pediu e não veio como esperado, o que ele tem medo de quebrar.

**O histórico de tentativas falhadas é o dado mais valioso desta sessão** — é o que impede repetir a abordagem que já não funcionou. Ninguém oferece isso espontaneamente; tem que ser perguntado.

## Passo 4 — Auditoria e triagem [PORTÃO: o dono aprova antes de qualquer edição]

Compare o que foi pedido/documentado com o que existe de fato. Classifique cada achado:

| Tipo | O que é |
|---|---|
| **drift de documentação** | o doc diz uma coisa, o código faz outra |
| **dívida técnica** | funciona, mas custa caro mudar |
| **bug** | não faz o que deveria |
| **pedido não atendido** | foi pedido e não chegou — ou chegou como retoque quando era estrutural |
| **sobra morta** | código, rota ou arquivo que ninguém usa |

Depois ordene por risco × valor e apresente **o que entra nesta rodada e o que fica fora**.

**Declare o ESCOPO NEGATIVO explícito:** a lista de arquivos, módulos e comportamentos que NÃO serão tocados. Refatoração sem escopo negativo vira reescrita acidental.

Nomeie também a **peça-assinatura** e diga honestamente se ela hoje funciona, existe pela metade ou nunca foi construída — a ordem do plano depende disso.

## Passo 5 — Estratégia de ataque

Escolha uma e justifique:

- **Cirurgia pontual** — mudança localizada, comportamento preservado.
- **Strangler incremental** — o caminho novo nasce ao lado do velho, os call sites migram um a um, o velho é deletado no fim. É o padrão para mudança estrutural em sistema que precisa continuar funcionando.
- **Reconstrução com portão** — só quando a base impede o objetivo. Exige Blueprint: desenhar a estrutura-alvo **inteira** antes de fatiar, com aprovação do dono na primeira fatia vertical.

Se o pedido do dono for estrutural, **é proibido entregá-lo como sequência de retoques seguros que nunca somam estrutura**. E se você acha que o pedido não justifica reestruturar, **diga** — não decida por baixo em silêncio.

## Passo 6 — Reconciliar a documentação

Documento existente **não é sobrescrito, é reconciliado**. O `ARCHITECTURE.md` descreve como o sistema **É** hoje, não como gostaríamos. `PRD.md` e `SDD.md` são reconstruídos a partir da realidade + da intenção do dono, com TODO visível onde faltar dado real. O `ADR.md` recebe as decisões recuperáveis do código e do `git log`, **marcadas como reconstruídas**.

Doc que contradiz outro se reconcilia **antes** de codar, apresentando as opções ao dono — nunca no meio da implementação.

Conteúdo antigo relevante migra para `KNOWLEDGE.md` ou `PROGRESS-archive.md` antes de qualquer poda.

## Passo 7 — Poda do que já existe

Se o projeto já tinha um `CLAUDE.md`, aplique o **teste de poda linha a linha**: *"remover isto causaria erro do agente?"* Se não, corta. E **mostre ao dono o que propõe cortar antes de cortar** — poda em documento que ele escreveu não é decisão sua.

Sai obrigatoriamente: valor duplicado que já vive em outro arquivo (P7), tutorial do que se descobre lendo o código, e convenção padrão da linguagem. Regra que precisa valer 100% das vezes não fica como texto — vira hook ou entra no `AGENTS.md`.

Documento acima de ~300 linhas de histórico: arquive os concluídos antes de continuar acumulando. Arquivo gordo deixa de ser lido por inteiro, e aí para de cumprir a função.

## Passo 8 — Plano e QA

`PROGRESS.md` ordenado por risco decrescente dentro do escopo aprovado. Toda tarefa com estado, `[AFK]`/`[HITL]` e **check executável**. Tarefa que muda contrato de módulo, cruza módulos, toca a peça-assinatura ou altera comportamento observável → `[HITL]`.

O `QA.md` recebe o mapa de áreas derivado da estrutura real. **Não invente itens** — eles se preenchem na primeira auditoria de verdade (skill `qa-registro`).

---

## As regras que protegem a base

- **R1 — Baseline antes de tocar.** Sem estado "antes" registrado, não se inicia mudança.
- **R2 — Comportamento preservado se prova por comparação.** Mesmo teste/fixture/jornada na branch e na base. Verde sozinho esconde regressão.
- **R3 — Refatoração e feature nunca no mesmo commit.** Misturar torna o diff impossível de revisar e a regressão impossível de bissectar.
- **R4 — Mudança estrutural usa strangler, não big-bang.** Big-bang só com portão do dono e Blueprint aprovado.
- **R5 — Escopo negativo explícito por rodada**, escrito antes de começar.
- **R6 — Área sem check não se refatora.** Criar o check de caracterização é a primeira tarefa, não uma opcional.
- **R7 — Bug descoberto durante refatoração é registrado, não consertado junto.** Consertar no mesmo diff faz o diff mentir sobre o que mudou.
- **R8 — Dependência nova não entra em refatoração** sem justificativa no `DECISIONS.md`. Refatorar é reduzir custo, não trocá-lo de lugar.
- **R9 — Código morto é deletado, não comentado.** O git guarda a história.
- **R10 — Documento contraditório se reconcilia antes de codar**, com as opções na mesa.
- **R11 — Não repetir abordagem que já falhou.** Consulte o histórico da entrevista e o `KNOWLEDGE.md` antes de propor. Se a proposta se parece com algo já tentado, diga isso e explique **o que muda desta vez**.
- **R12 — Duas correções falhas na mesma área = pare.** Não tente a terceira: registre a lição, limpe a sessão, reescreva o prompt com o aprendizado.
- **R13 — Doc vigente vence memória de treino.** API ou lib versionada que a base já usa: consulte a documentação atual antes de mudar uma chamada. Assinatura que mudou depois do corte de treino não dá erro de leitura — dá bug plausível, e num projeto em andamento ele se mistura com os já existentes.

**Reconstrução grande, obrigatório:** dupla auditoria (o que falhou e por quê) + Blueprint (a tese inteira) antes de fatiar, com portão do dono na etapa da peça-assinatura. Desvio consciente do Blueprint é permitido, mas registrado com motivo — desviar em silêncio não.

---

## O que a instalação da diretriz NÃO fez por você

Ela criou o que faltava e preservou o que existia. Ela **não** reescreveu documento com conteúdo real, não refatorou código e não corrigiu convenção retroativamente — fazer isso automaticamente seria o big-bang que a R4 proíbe.

O ajuste ao padrão é este protocolo, com os portões. O diagnóstico impresso pela instalação é o ponto de partida da auditoria do Passo 4, não o resultado dela.
