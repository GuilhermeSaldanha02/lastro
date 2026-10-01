# Backlog do lastro — arquivo único

> **Único lugar de pendências do projeto** (decisão do dono, 2026-10-01). Nenhum
> outro arquivo guarda lista de tarefas: `PROGRESS.md` guarda só o estado da
> sessão e o histórico; `QA.md` guarda o registro de testes; `DECISIONS.md`
> guarda o porquê. Item novo entra aqui; item feito vira uma linha em "Feito".
>
> Base: `main` em `243dd55` (2026-10-01). Confira com `git log --oneline -1`.

**Status:** `A FAZER` (aprovado, o agente pode fazer) · `DONO` (só o dono
resolve) · `CONFERIR` (item antigo trazido de outro documento, ainda não
conferido contra o código: pode já estar resolvido) · `DECIDIR` (o dono decide
se continua) · `CONGELADO` / `PARADO` (decisão do dono, não mexer).

**Importância:** Alta · Média · Baixa.

## 1. Ordem de execução (dono, 2026-09-29)

1. TR-17 e os bugs que a M3 trouxer (QA da M3 em produção).
2. Faxina.
3. Auditoria independente, depois DOC-03.
4. Check-in (A1) junto com a revisão da Política (POL-01).
5. **Por último (decisão do dono, 2026-10-01): SEGREDOS** — chave e senha expostas no repositório público. O risco fica aceito até lá.

## 2. Código e QA — o agente faz

| ID | O que é | Status | Importância |
|---|---|---|---|
| CAT-BIOMEC | Página de exercício com GIF ("Supino declinado com barra") mostra texto genérico em Músculo alvo, Músculos que ajudam e Movimento ("Musculatura Alvo Principal", "Padrão Biomecânico Anatômico") em vez do conteúdo real. Investigar se falta a entrada em `exercicios-midia.json` ou se é o fallback. | A FAZER | Média |
| FAXINA-3 | Apagar os 9 scripts antigos de `scripts/` que guardam a senha da conta QA e, em dois deles, a chave `service_role` (nenhum é usado por `package.json`, CI ou e2e). Só depois de o dono rotacionar (ver SEGREDOS). | No final, com SEGREDOS | Alta |
| BRANCHES-LOCAIS | Duas branches só na máquina do dono, sem PR e fora da `main`: `feat/propostas-evolucao-visual` (2 commits de 29/09, "três direções visuais", 4 arquivos de docs) e `feat/sticker-logo-direita-compacto` (1 commit de 27/08 no PROGRESS). O dono decide se viram PR ou se apagam. | DECIDIR | Baixa |
| UX-03-RESTO | O que a auditoria independente de 2026-10-01 não cobriu na §4c de `docs/qualidade/ux-03-auditoria-2026-09-26.md`: sobreposição de texto em inglês e espanhol (onde UX3-09 e UX3-10 apareceram) e a faixa de ação de `/treino/[id]` nas transições sem recarregar, com a aba visível. O resto da §4c PASSOU na medição. | A FAZER | Baixa |
| COACH-PRESC | O roteador local do Coach reconhece "O que devo mudar…" e encaminha ao personal sem Gemini, mas "o que eu mudo essa semana?" (a frase do critério do PE-06) não casa e vai para a Gemini. Ampliar o padrão `PRESCRICAO` e criar teste de rota de `/api/coach` com vínculo + prescrição. Achado da auditoria de 2026-10-01. | A FAZER | Baixa |
| FAIXA-REABRIR | A investigar: depois de "Reabrir treino" sem recarregar, a reserva de espaço da faixa de ação ficou 69 px com a faixa em 129 px (esconderia ~31 px do último cartão). Visto só com a aba em segundo plano, onde o `ResizeObserver` não roda. Reproduzir com a aba visível: finalizar, Reabrir, rolar até o fim. | A FAZER (conferir) | Baixa |
| E2E-PROD | O e2e roda contra o banco de produção com a `service_role` (`ci.yml`). Com usuários reais, um spec com defeito pode apagar dado real. Avaliar isolamento (branch do Supabase ou projeto de teste) antes de divulgar. Achado do agente técnico. | DECIDIR | Média |
| DOC-03 | Reconciliar o `DESIGN.md` (decisões, pendências e medições antigas misturadas). A auditoria independente já rodou (2026-10-01). | A FAZER | Baixa |
| QA-02 | Matriz Playwright aluno (treino livre e por modelo) e personal (modo trabalho e alternância), caminho normal e triste. A 2ª conta já existe. | A FAZER | Média |
| PE-01…09 | Auditar as telas de personal com a conta de personal. | A FAZER | Média |
| OF-04, OF-06 | QA que alterna duas contas na mesma sessão de navegador. | A FAZER | Baixa |
| LG-05…08 | Linguagem das telas de personal (`docs/qualidade/matriz-linguagem.md`, várias células PENDENTE também em LG-01…LG-10). | A FAZER | Baixa |
| TR-03 | Treino iniciado por modelo. Autorizado uma vez na conta de personal. | A FAZER | Baixa |
| AN-03, AN-04 | Reproduzir na conta de personal (gasta ~3 unidades da cota do dia). Autorizado uma vez. | A FAZER | Baixa |
| EST-DURACAO | Estudo: diferença entre a duração até a última série e `duracao_segundos` no relatório pós-treino. Esperar ~3 semanas de dado (hoje só 2 sessões têm o campo) e trazer opções. | A FAZER, sem prazo | Baixa |

## 3. AN-08 — motor determinístico (o que falta)

Texto original do dono: `docs/MISSAO-MOTOR-DETERMINISTICO.md` (a seção indicada).
Estudo aprovado: `docs/estudos/AN-08-motor-deterministico-estudo.md`. Cada
milestone só começa com autorização do dono. Revisado pelo dono em 2026-10-01.

| ID | O que é | Status | Importância |
|---|---|---|---|
| AN-08.A1 | **Check-in de recuperação.** Registro rápido de **sono, energia, dor muscular e estresse**, escala simples, **também em dia sem treino**. Dá contexto aos números; não vira diário médico, não diagnostica, não prescreve. Visível ao aluno e ao personal com vínculo. Feito na academia, então entra na fila offline (Dexie) como a série. Tabela nova `checkin`. Exige revisão da Política (junto com POL-01) e novo aceite de todos. (§13) | A FAZER, na ordem (depois da faxina e da auditoria) | Média |
| A1-ACEITE | Antes do A1: subir `VERSAO_DOCUMENTOS` manda para `/aceite` qualquer tela com a casca (`exigirTipoEscolhido`, `lib/dados/casca.ts`), provavelmente também o treino em andamento. Garantir que o reaceite não interrompe um treino. Também: o dono aprova o texto novo da Política. | A FAZER, antes do A1 | Média |
| POL-01 | A Política (`lib/legal/documentos.ts`, linhas ~63 e ~150) diz que o Coach **e a Análise** são IA; hoje parte do Coach e as perguntas 1–4, 6 e 7 da Análise são calculadas pelo lastro (só a pergunta 5 usa IA). Ajustar na mesma revisão do A1, para um aceite só. | A FAZER, com o A1 | Baixa |
| AN-08.A2 | **Prontidão.** Os sinais crus do check-in contra a média da própria pessoa, **sem índice único 0–100**. (§14) | A FAZER, depois do A1 | Baixa |
| AN-08.A3 | **Recuperação × desempenho.** Coincidência, nunca causa ("a queda coincidiu com sono abaixo da sua média"). (§15) | A FAZER, depois de ~8 semanas de check-in | Baixa |
| AN-08.F0-INSIGHT | `Insight` como dado estruturado. Hoje só Home e pós-treino usam o detector. | ADIADO: generalizar só quando um 3º lugar precisar | Baixa |
| AN-08.F0-CACHE | Cache de agregados. | CONGELADO (sem gargalo) | — |
| AN-08.D1 | Peso corporal. | CONGELADO (conflita com o PRD §5) | — |
| AN-08.D2 | Health Connect / Apple Health. | CONGELADO | — |

## 4. Com o dono

| ID | O que falta | Importância |
|---|---|---|
| SMTP | Configurar o Brevo grátis no Supabase (o SMTP padrão limita e-mails por hora: cadastro e recuperação). Antes de divulgar. | Alta |
| CALLBACK | Conferir `https://lastro-pi.vercel.app/auth/callback` na lista de redirect do Supabase Auth e testar uma recuperação de senha. | Alta |
| SEGREDOS | **Repositório público.** A chave `service_role` do projeto (vale até 2036, ignora a RLS: lê e apaga dados de todos) está em `scripts/auditoria-completa-qa.mjs` e `scripts/test-navegacao.mjs` desde 20/08, e a senha da conta QA `qa_player_tester@lastro.app` em 9 scripts. O dono: (1) rotaciona a `service_role` no Supabase; (2) atualiza a chave na Vercel (Production) e no secret `SUPABASE_SERVICE_ROLE_KEY` do GitHub; (3) troca a senha da conta QA ou apaga a conta. Depois o agente faz a FAXINA-3. Reescrever o histórico não resolve (o repo é público). **Adiado para o final por decisão do dono (2026-10-01).** | Alta |
| SYNC-CELULAR | Num treino real: registrar séries em modo avião, reconectar e conferir que subiram (tarefa 2.3, nunca feita em aparelho). | Média |
| IPHONE | Testar o aviso de fim do descanso (web push) no iPhone, com o app na tela de início. | Média |
| PWA-INICIO | Com o app instalado, abrir pelo ícone e conferir que abre em Início e que a barra superior não cobre conteúdo. Um minuto. | Baixa |
| DICAS | Revisar por amostra ~20 dicas dos exercícios que o dono usa (hoje 0 de 218 marcadas `humano`) e marcar `dica_execucao_origem = 'humano'` nas aprovadas. | Baixa |
| TESTE-DONO | Apagar os treinos de teste da conta do dono: `aa0cd9e6…` e `9db03743…`. | Baixa |
| GEMINI | Segue no plano gratuito (20/dia). Revisitar quando divulgar ou quando o contador da M3 mostrar aperto. | Média |
| P1 | Perguntar ao personal P1 o que é "mensagem padrão" e quantos alunos tem e perdeu em 6 meses. Só se o módulo Personal virar produto. | Baixa |

## 5. Itens antigos que continuam

Vindos do `PROGRESS.md`, revisados pelo dono em 2026-10-01.

| ID | O que é | Status | Importância |
|---|---|---|---|
| ANT-01 | Resolvido em `KNOWLEDGE.md` (§3.6 e §3.7, com fontes; o código usa 10–20 séries e 4 semanas). Sobra só riscar o TODO de `PRD.md` §10 e o comentário em `lib/analise/limiares.ts`. | A FAZER (BAIXO) | Baixa |
| ANT-06 | Medida do módulo Personal: "o grupo alertado recebeu estímulo na semana seguinte?" (`alerta_personal` já grava). | A FAZER quando houver personal real usando | Baixa |
| ANT-10 | Coluna "antes 16 × 9" por série (padrão Hevy/Strong), com portão visual. | A FAZER se o dono sentir falta no treino | Baixa |
| ANT-14 | Hydration mismatch no console ao trocar de tema (`data-tema` diverge servidor/cliente). Não aparece para o usuário. | A FAZER, baixa prioridade | Baixa |

### Cortados ou resolvidos na revisão de 2026-10-01

- **Resolvidos (conferidos no código e no banco):** ANT-02 (Personal já usa `t()`), ANT-11 (`totalExercicios` já conta só exercício com série valendo), ANT-12 (sem emoji no relatório), ANT-13 (timer já usa `t()`), ANT-16 (0 contas `qa-lastro*` no banco).
- **Cortados pelo dono:** AN-08.B3 (o A3 entrega quase o mesmo), AN-08.C2 resto (calendário, semanas seguidas e meta cumprida já cobrem), ANT-04 Fase 6 (a AUD-IND e o e2e cobrem), ANT-05 parecer × feito (só 2 pareceres salvos), ANT-07 esconder prescrição sob vínculo, ANT-08 frequência ao pé da letra (aceito como queda de volume), ANT-09 personal encerrar vínculo, ANT-15 os 404 da Gemini de agosto (o `erro_app` pega se voltarem).
- **Dado como feito:** AN-08.F0-MATRIZ (é a Entrega 2 do estudo).
- **Apagado:** `supabase_migrations.backup_20260905_antes_repair` (20 linhas, backup de antes do repair de 05/09).
## 6. Parados

| ID | O que é | Status |
|---|---|---|
| CT-01 | Preview 3D do catálogo (`ilustracao-anatomica-3d.tsx` órfão). Não é regressão, é feature nunca ligada. | PARADO |
| PIP | Timer flutuante (Picture-in-Picture). | PARADO |
| DOMINIO | Domínio próprio (`lastro-pi.vercel.app` continua). | PARADO |
| MIDIA | Os 116 exercícios novos ficam sem GIF (o dono não paga a licença da Gym Visual). | DECIDIDO |

## 7. Feito (uma linha cada; detalhe em `DECISIONS.md` e no `git log`)

- **Abertura ao público:** PU-02 (PRD emendado), PU-03/04 (cota e teto de IA em `config_ia`), PU-05 (recuperar senha), PU-06 (Termos, Política, `/aceite`), PU-07 (monitoramento `erro_app`, provado em produção 2026-09-29), PU-08 (onboarding), PU-09 (manual em `/ajustes/guia`), PU-10 (confirmação de e-mail).
- **Chave `SUPABASE_SERVICE_ROLE_KEY`** em Production (2026-09-29).
- **AN-08:** estudo (E1–E5); M1 (F0-TEMPO #348, roteador do Coach #349); M2 (perguntas 1–4 por lógica #352, perguntas 6 e 7 #353, relatório pelo Coach #354, achados do QA #355, evolução por metades #356); M3 (contador local × Gemini e perguntas de um grupo #359, semanas seguidas e meta #360, detector + "Lastro percebeu" #361, bloco do pós-treino #362, recorde de e1RM no catálogo #363). AN-07 e C3 cobertos pela M2.
- **UX:** UX-01 (via TR-12), UX-02 (histórico com calendário), UX-03 (cobertura planejada e 14 achados corrigidos), UX3-15 (#347), UX3-16 (#357).
- **Catálogo:** 218 exercícios; A1 (dicas traduzidas en/es); 12 nomes em português.
- **Cálculo:** TON-01 (tonelagem com unilateral, #346).
- **Treino:** TR-06…TR-15, OF-09, aviso de descanso por web push. TR-17 (#368: ordem da série = maior + 1; e a fila sobe a série registrada durante uma sincronização em andamento).
- **QA-M3 em produção (2026-10-01, conta de personal, dado semeado e apagado no fim):** Coach `VOLUME_GRUPO` resolvido local com `uso_ia` em 0; "Lastro percebeu" na Home (+50% sobre a mediana 1,8 t); página do exercício (recorde e1RM 120 kg, maior carga sem estrela, evolução +45%); bloco do pós-treino (2,7 t, +50%, últimas 6). Também: as 3 séries do treino registrado pela tela subiram com ordem 1, 2, 3 (TR-17 e fila em produção). LIMPEZA-PERSONAL feita (o `1e66619f` já não existia; conta de volta em TRABALHO).
- **QA-TR-TRISTE em produção (2026-10-01, conta de personal, treino apagado no fim):** roteiro do dono (ordens 1, 3, 4, 5 no banco, tela A, C, D, B depois de recarregar), dois toques no Excluir apagam uma série só, Repetir repete o último e, apagado o último exercício inteiro, repete o anterior com ordem nova. Sem rede não foi testado no navegador (coberto pelo e2e `j10`). **POS-ROTULO e POS-CONTRASTE (#371):** rótulo "Volume vs. seu padrão" e cores do tema escuro no bloco quando o tema é o claro; e2e `j37` verde. Conferência visual em produção do tema claro: não feita.
- **Faxina (2026-10-01):** FAXINA-1 acento de "Elevação lateral com halteres" (#373, migração `20261001162647`; a mídia casa por id). FAXINA-2: as 73 branches remotas apagadas, todas dentro da `main` ou com a PR mergeada no mesmo commit; no remoto sobrou só a `main`.
- **Auditoria independente (2026-10-01, outro agente, produção, conta de personal):** TON-01 e TR-16 PASSOU; UX-03 §4c medida sem defeito, mas segue ALEGADO (falta UX-03-RESTO); PU-01 e PE-06 não executáveis por agente. **ANT-17:** OF-06 e VS-07 reconciliados no `QA.md` como PASSOU (corrigidos em e97be60, #253). **FILA-01 (#375):** exclusão recusada pelo banco sai da fila em vez de travá-la; `falhas` guarda o `usuarioId`; e2e `j10` verde. Evidências em `qa/evidencias/<ID>/auditoria-independente-2026-10-01/`.
- **QA-01:** CT-02, VS-06/07, AJ-03/04, AN-02/05/06, PF-01 resolvidos ou graduados pelo e2e.
- **Docs:** DOC-01, DOC-02, PU-02; arquivo único de backlog (este, 2026-10-01).

## 8. Arquivos removidos na unificação (2026-10-01)

Apagados para não haver mais de uma lista de pendências. Recuperar com
`git checkout <commit> -- <caminho>`:

- `docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` (UX-02 e UX-03 feitas pelo Claude)
- `docs/RELATORIO-ESTADO-PROJETO.md` (retrato de 31/08)
- `docs/historico/BACKLOG-PROXIMA-FASE.md`, `BACKLOG-REDESENHO.md`, `BACKLOG-TESTE-APARELHO.md` (todos fechados)
- `docs/PROMPT-PROXIMO-CHAT.md` (local, fora do git; prompt de 14/09)

Segunda limpeza (2026-10-01), documentos já cumpridos ou superados (recuperar de `4184e6e`):

- `docs/historico/` inteira (auditoria Apex Pro, briefing visual de agosto, escopo, estudos do redesenho, auditoria impeccable)
- `docs/prd/auditoria-geral/` (auditoria de 17/08)
- `docs/superpowers/` (planos e specs já implementados)
- `docs/RELATORIO_AUDITORIA_GIFS_102.md`, `docs/qa-acesso.md`, `docs/catalogo-ampliacao-proposta.md`, `qa/relatorio-caminho-triste-2026-09-13.md`
