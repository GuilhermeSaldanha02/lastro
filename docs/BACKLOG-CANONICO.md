# Backlog canônico — auditoria em curso

> Fonte única para o trabalho posterior à auditoria de 2026-09-16. Itens só
> entram com fonte ou evidência nomeada; `REPROVOU` não significa que ainda
> ocorre na `main`, e sim que exige reteste antes de encerrar.

## Estado da auditoria

- Base: `main` em `bd10edd` (atualizado 2026-09-25).
- QA-01 (reexecução do QA.md) rodou treino, leitura pura, e2e no CI e
  offline: 68 → 56 obsoletos. Detalhe completo em `QA.md`.
- Regra de execução: E2E somente manual em marco de integração; testes
  rápidos continuam em toda PR.

## Decisões do dono — 2026-09-29

Rodada de decisões sobre o backlog inteiro. Detalhe e porquês em `DECISIONS.md` 2026-09-29 (1). **Ordem de execução escolhida pelo dono: M3 primeiro**, depois TR-17 e os bugs que a M3 trouxer, faxina, auditoria independente, check-in.

| Item | Decisão |
|---|---|
| Chave `SUPABASE_SERVICE_ROLE_KEY` | **Adicionada** em Production pelo dono (Sensitive) e redeploy feito. Falta provar o PU-07 e o "Excluir conta" sem apagar conta real. |
| SMTP (PU-05/PU-10) | **Brevo grátis** (remetente verificado por e-mail, sem domínio). Configurar antes de divulgar. |
| Gemini | **Continua no plano gratuito**; revisitar quando divulgar ou quando o F0-CUSTO mostrar aperto. |
| POL-01 | **Junta com a revisão da Política que o check-in (A1) já exige**, para todos reaceitarem uma vez só. |
| AN-08 M3 | **Aprovada**, uma PR por item, nesta ordem: (1) F0-CUSTO + intents de volume e frequência de UM grupo; (2) resto da C2 (meta semanal, semanas seguidas); (3) F0-INSIGHT + Fase B (B1, B2; portão visual; o dono decide o limiar de "fora do padrão"); (4) C1 (antes, o dono decide se recorde é e1RM ou peso). |
| AN-08.A1 (check-in) | **Aprovado**: registro diário (sono, energia, dor, estresse) **também em dia sem treino**, para o Coach e os relatórios mostrarem coincidências ("seu sono coincidiu com a queda"), nunca causa. **Visível ao aluno e ao personal com vínculo.** Entra com a revisão da Política (POL-01) e novo aceite. Depois da M3. |
| AN-08.D1, D2, F0-CACHE | **Congelados** (D1 e D2 conflitam com o PRD §5; cache sem gargalo). |
| CT-01, timer PiP, domínio | **Parados.** |
| 2ª conta | **Existe**: conta de personal, outro e-mail, sem vínculo com a do dono, logada no Chrome dele. **QA autorizado nela** (treino e trabalho). Destrava PE-*, OF-04/06, LG-05…08 e QA-02; criar vínculo com a conta do dono pede autorização na hora. |
| TR-03, AN-03/AN-04 | **Autorizados** uma vez, na conta de personal do Chrome (AN-03/04 gastam ~3 unidades da cota do dia). |
| TR-17 (novo, relato do dono) | Bug: registrar 3 exercícios, apagar o 2º, adicionar um 4º e readicionar o apagado quebra o treino. Reproduzir na conta de personal, corrigir e rodar o QA de caminho triste de adicionar/apagar em `/treino/[id]`. Autorizado. |
| "Outra série" sem exercício | **Abrir direto a lista de exercícios.** Entra na PR do TR-17. |
| Duração do relatório pós-treino | **Estudo antes de decidir** (pedido do dono): medir a diferença real entre a última série e `duracao_segundos` e trazer opções. |
| Faxina | **Autorizada**: acento de "Elevação lateral com halteres" (banco + `exercicios-midia.json`); apagar branches remotas já mergeadas (conferindo uma a uma); tirar a senha de `scripts/importar-102-gifs.mjs` (o dono troca a senha no Supabase); DOC-03 logo depois da auditoria independente. |
| Treinos de teste na conta do dono | `aa0cd9e6…` e `9db03743…`: **o dono apaga ele mesmo.** |
| Com o dono | Callback URL no Supabase Auth; teste do aviso de descanso no iPhone; trocar a senha da conta QA. |

## P0 — nota do dono (2026-09-28, uso real em produção)

**AN-07 — COBERTO PELA M2 DO AN-08 (decisão do dono, 2026-09-28):** vira a pergunta 7 da Análise ("Do primeiro treino até hoje"), por lógica e sem Gemini, também pedida pelo Coach e salva no histórico (itens `AN-08.M2-2` e `AN-08.M2-3` abaixo). O dono escolheu o conteúdo: base (treinos, semanas com treino, média semanal, volume), evolução por exercício, recordes e grupos. Histórico do item: O dono pediu ao Coach, em produção, um relatório "do primeiro treino até hoje" e o Coach recusou. É o comportamento correto pelo desenho atual — o Coach (`PRD.md` §4.4) responde dúvida geral e não lê os números do dono; quem lê é a Análise Semanal, e só a última semana ISO fechada (`PRD.md` §3). Não existe hoje nenhuma pergunta de **período livre/histórico completo**. O dono achou "as análises muito travadas" e pediu para anotar, para mudar mais para frente — **não é para implementar agora**, é decisão de escopo pendente (like PU-03/04, mexe com a regra inegociável de resumo determinístico + cota de IA). Perguntar ao dono, quando for a vez: o que um "relatório do início até hoje" mostraria que as 5 perguntas semanais já não mostram, e se cabe dentro do orçamento de cota (`config_ia`, PU-04).

**AN-08 — EM ANDAMENTO (2026-09-28):** estudo aprovado, **M1 e M2 feitas** (itens `F0-TEMPO`, `F0-ROTEADOR` e `M2-*` na tabela). Hoje só a pergunta 5 da Análise usa a Gemini. Cada milestone só começa com autorização do dono. Histórico do item: O dono colou uma missão completa (2026-09-28) para uma evolução grande: um **motor determinístico** entre o dado bruto e a Gemini — a maioria das perguntas de progressão/volume/frequência/consistência responde por código, sem gastar IA, e o Coach ganha um roteador de intenção que só cai na Gemini quando a pergunta é realmente aberta. Cobre também recuperação (check-in, índice de prontidão), insights automáticos na Home, resumo mensal, página funda por exercício, e (bem mais tarde, sem implementar) Health Connect/Apple Health. Texto completo, verbatim: `docs/MISSAO-MOTOR-DETERMINISTICO.md`. **Ordem explícita do dono: PARAR depois de 5 entregas de estudo (auditoria, matriz de capacidades com 30+ perguntas, arquitetura, roadmap por fase, economia estimada de IA) e esperar aprovação — nenhuma linha de código antes disso.** Resolve/absorve o AN-07 acima (uma pergunta de período livre é exatamente o tipo de coisa que o motor determinístico responderia sem Gemini). Esforço: ALTO só para as 5 entregas de estudo; a implementação em si é bem maior, faseada pelo roadmap que a Entrega 4 vai produzir.

Sub-itens do AN-08. **Linha sem status = não iniciada.** O prefixo `AN-08.` evita colisão com IDs que já existem neste backlog (o `A1` de tradução de dica, por exemplo). Esta tabela só dá o tamanho da missão: escopo, dependências, esforço e ordem de cada linha saem da Entrega 4, depois de confrontar cada proposta com o código real — alguma pode já estar parcialmente coberta (a C2, por exemplo, pelo calendário da UX-02). Seção = seção de `docs/MISSAO-MOTOR-DETERMINISTICO.md`.

| ID | Fase | O que é | Seção |
|---|---|---|---|
| AN-08.E1–E5 | Estudo | **ENTREGUE E APROVADO 2026-09-28** (o dono autorizou o Coach a ler os dados do próprio usuário e a M1): `docs/estudos/AN-08-motor-deterministico-estudo.md`. As 5 entregas: auditoria, matriz de capacidades (30+ perguntas), arquitetura, roadmap, economia estimada de IA. Depois delas, PARAR. | §27–§28 |
| AN-08.F0-MATRIZ | 0 | Matriz Gemini × determinístico em níveis 0–4 (progressão, volume, frequência, consistência). | §3–§6, §24 |
| AN-08.F0-TEMPO | 0 | **FEITO 2026-09-28 (M1, PR #348):** `src/lib/analise/periodo.ts`. Falta a M2: o `montarResumoCompacto` aceitar período (para o AN-07 e a C3). Era: Camada única de comparação temporal (semana, 4 semanas, mês, período livre × anterior). | §7 |
| AN-08.F0-ANOMALIA | 0 | Detector de sessão fora do padrão do próprio usuário, com piso de amostra. | §8 |
| AN-08.F0-INSIGHT | 0 | `Insight` como dado estruturado, antes de virar texto. | §9 |
| AN-08.F0-ROTEADOR | 0 | **FEITO 2026-09-28 (M1, PR #349):** `src/lib/coach/` (roteador, respostas, ponte com o banco). 8 perguntas de dados e 3 recusas sem Gemini nem cota; o resto segue para a Gemini. Prova: e2e `j34` (`uso_ia` segue em 0). Falta: intents de período (M2), volume e frequência de UM grupo, e o contador de resolução local (F0-CUSTO). Era: Roteador de perguntas do Coach sem LLM para classificar (intents, padrões, aliases). | §10–§11 |
| AN-08.M2-1 | M2 | **FEITO 2026-09-28 (PR #352).** Prova: e2e `j12` (com o teto de IA estourado, a pergunta 1 responde e não gasta cota). Era: Perguntas 1 a 4 da Análise respondidas **por lógica, sem Gemini**, cada uma com resposta própria e focada: 1 progresso (e1RM e recordes), 2 empaque (estagnações), 3 equilíbrio (séries por grupo × faixa, grupos sem estímulo), 4 demais ou de menos (frequência × média, volume semanal, séries difíceis). Corrige o achado do dono de que as perguntas "retornam a mesma coisa": o texto de quando a Gemini falha (`leituraDeterministica`) ignora qual pergunta foi feita. A pergunta 5 (o que mudar) segue com a Gemini, porque prescrição por regra é proibida (PRD §5). **O visual da Análise NÃO muda** (decisão do dono). Emenda o PRD §3 junto com o código (`DECISIONS.md` 2026-09-28 (2)). | — |
| AN-08.M2-2 | M2 | **FEITO 2026-09-28 (PR #353, migração `20260928150019`).** Prova: e2e `j35` com captura da página a 375 px. Era: Duas perguntas novas na Análise, por lógica: **6 "Como foi meu mês?"** (mês atual × anterior, fecha a C3) e **7 "Do primeiro treino até hoje"** (fecha o AN-07). Conteúdo escolhido pelo dono: base, evolução por exercício (só com 2+ sessões), recordes e grupos. Migração: `parecer.pergunta` passa a aceitar 1 a 7. Mesma lista e mesmo histórico de pareceres, sem mudança visual. | §7, §21 |
| AN-08.M2-3 | M2 | **FEITO 2026-09-28** (intents `RELATORIO_MES` e `RELATORIO_HISTORICO` no roteador, `lib/coach/relatorio-salvo.ts`; salva como parecer confirmado em Pareceres salvos). Prova: e2e `j34`. Era: O Coach reconhece "como foi meu mês?" e "relatório desde o primeiro treino", gera o mesmo relatório da M2-2 e **salva como parecer no histórico da Análise**, avisando "Salvo na Análise". Guarda só o relatório, nunca o texto digitado, então a Política continua valendo. Depende da M2-2. | §10 |
| AN-08.F0-CACHE | 0 | Avaliar cache/snapshot de agregados, com invalidação por série nova. | §12 |
| AN-08.F0-CUSTO | 0 | Observabilidade de custo (local × Gemini, fallback, erro de classificação), sem telemetria invasiva. | §25 |
| AN-08.A1 | A | Check-in de recuperação (sono, energia, dor, estresse). | §13 |
| AN-08.A2 | A | Índice de prontidão transparente, sem fórmula inventada. | §14 |
| AN-08.A3 | A | Recuperação × desempenho, só correlação. | §15 |
| AN-08.B1 | B | Sessão fora do padrão ao finalizar o treino. | §16 |
| AN-08.B2 | B | "Lastro percebeu" na Home, por template, sem Gemini. | §17 |
| AN-08.B3 | B | Explicar mudança de desempenho por evidências, sem causalidade. | §18 |
| AN-08.C1 | C | Página funda por exercício. | §19 |
| AN-08.C2 | C | Consistência/calendário (checar sobreposição com a UX-02). | §20 |
| AN-08.C3 | C | **Entra na M2-2** (pergunta 6 da Análise). Era: Resumo mensal por template. | §21 |
| AN-08.D1 | D | Peso corporal. | §22 |
| AN-08.D2 | D | Health Connect / Apple Health — só estudar, bem mais tarde. | §23 |

## P(-1) — abertura ao público (decisão do dono, 2026-09-25)

**O dono decidiu: o lastro vai abrir para o público.** Isso contradiz o
`PRD.md` §5 hoje ("Múltiplos usuários, planos pagos, onboarding para
estranhos, tela de billing, limite de uso" — fora de escopo) e a persona
única do §2. **PU-02 abaixo é pré-requisito de tudo o resto desta seção**:
sem a emenda no PRD, qualquer agente que ler o documento vai recusar como
invenção o que está listado aqui.

| ID | Esforço | Prioridade | O que é |
|---|---|---|---|
| PU-02 | BAIXO | **FEITO 2026-09-25** (PRD §2/§5 + `DECISIONS.md` 2026-09-25 (1)) — era: | Emendar `PRD.md` §5 e §2 (Scope Change) + entrada em `DECISIONS.md` registrando a decisão de abrir ao público. Sem isso, PU-03 a PU-07 não têm base documental. |
| PU-03 | MÉDIO | **FEITO 2026-09-25**: free tier 20/dia e 5/min (já medido, `KNOWLEDGE.md` §3.2); dono confirmou que a chave está no plano GRATUITO. Era: | Medir a cota real da Gemini no console do AI Studio (`KNOWLEDGE.md` §4, o free tier já foi medido: 20 req/dia e 5 req/min, §3.2; falta o tier pago e o uso público) — sem o número, não dá pra desenhar PU-04. |
| PU-04 | ALTO | **FEITO 2026-09-25**: teto global do dia e do minuto + teto por conta em `config_ia` (ajustável por SQL), função `reservar_uso_ia`. Padrão: 16 unidades/dia (parecer = 2, coach = 1), 4/minuto, por conta 2 análises e 3 perguntas por dia. Era: | Limite de uso/cota de IA por conta nova (hoje só existe teto por pergunta/dia pensado pra 1 usuário — o dono). Sem isso, cada conta nova é cheque em branco no cartão do dono. Depende de PU-03. |
| PU-05 | MÉDIO | **FEITO 2026-09-25** | Recuperação de senha: "Esqueci minha senha" no login → e-mail → `/redefinir-senha`. Falta o dono conferir o limite de e-mails do Supabase (SMTP padrão) antes de abrir. |
| PU-06 | MÉDIO | **APROVADO PELO DONO 2026-09-26, sem advogado (decisão dele)**: aceite no fim do texto (`/aceite`, portão em `casca.ts`), políticas em Ajustes (`/ajustes/politicas`). Nome do responsável e e-mail de contato preenchidos pelo dono em 2026-09-26. Era: | Termos de Uso e Política de Privacidade (LGPD — o app guarda dado de saúde/treino). Documento jurídico, não só tela — considerar revisão de um advogado antes de publicar. |
| PU-07 | MÉDIO | **FEITO 2026-09-25** | Monitoramento próprio, sem conta externa: tabela `erro_app` (RLS sem policy, retenção 30 dias), `instrumentation.ts` + `/api/erros`. Ler: `select * from erro_app order by criado_em desc limit 50`. Sentry fica opcional se o dono criar um DSN. |
| PU-08 | ALTO | **FEITO 2026-09-25** (`/onboarding`, coluna `usuario.onboarding_concluido_em`, texto em `src/lib/guia/conteudo.ts` — reaproveitar no PU-09) | **Onboarding pós-primeiro-login**: passo a passo guiado mostrando como usar o app, disparado só na primeira vez que uma conta nova entra — não é landing page, o login continua sendo a porta de entrada. |
| PU-09 | MÉDIO | **FEITO 2026-09-25** (`/ajustes/guia`, texto em `src/lib/guia/manual.ts`; ao mudar um recurso, mude o manual) | **Roteiro completo dentro de Ajustes**, tipo "manual"/ebook: uma tela ou seção listando tudo que o app tem e como usar, sempre acessível (não só na primeira vez). |
| PU-10 | BAIXO | **VERIFICADO 2026-09-25**: a confirmação de e-mail JÁ EXISTE (`mailer_autoconfirm: false` em produção; cadastro trata `confirmacaoPendente`). Corrigida a mensagem de quem tenta entrar sem confirmar. Não feito: reenviar e-mail de confirmação e SMTP próprio (ver PU-05). | Confirmar se a confirmação de e-mail no cadastro já existe (há menção em `DECISIONS.md`, não confirmado ainda) — só depois decidir se falta implementar. |
| — | — | **Explicitamente NÃO agora** | Domínio próprio (`lastro-pi.vercel.app` continua). O dono decidiu adiar. |

## Ranqueamento de esforço (2026-09-25)

`Esforço` estima gasto de token/tempo do agente, não dificuldade técnica.
`BAIXO` = uma sessão curta ou uma PR pequena. `MÉDIO` = uma sessão longa ou
subagente dedicado. `ALTO` = múltiplas sessões, dado novo em volume, ou
depende de infraestrutura que não existe ainda (2ª conta, cota de IA).

| ID | Esforço | Importância | Por quê |
|---|---|---|---|
| A1 (dica de exercício sem tradução) | — | — | **FEITO 2026-09-26**: `exercicio_traducao.dica_execucao` com 436 traduções (218 × en/es), lida em `/catalogo/[id]` por `dicaTraduzidaDoExercicio` com fallback ao português; hash do texto no banco conferido contra os arquivos. **Fio solto achado:** o exercício "Elevacao lateral com halteres" está sem acento no nome em português (`exercicio.nome`, id `ff8a4f89…`); não corrigido porque `exercicios-midia.json` e a migração 0021 casam por esse nome. Era: | ~436 traduções (218 exercícios × 2 idiomas) + migração nova + wiring; sem chamar IA em produção (tradução feita pelo próprio agente, uma vez). |
| CT-02, VS-06, VS-07 | — | — | **Resolvidos** no QA-01 de 24–25/set: já corrigidos antes desta sessão, ou graduados pelo e2e real (run 36078171673). |
| AJ-03, AJ-04 | — | — | **Resolvidos**: graduados pelo e2e real (`j11-formularios.spec.ts`), run 36078171673. |
| AN-02, AN-05, AN-06 | — | — | **Resolvidos**: graduados pelo e2e real (`j12-isolamento-e-apis.spec.ts`), run 36078171673. |
| AN-03, AN-04 | MÉDIO | Baixa | **Autorizado uma vez em 2026-09-29, na conta de personal do Chrome.** Era: Só reproduz gastando cota real de IA (Gemini) da conta do dono — aguarda autorização explícita por execução, não é "sim" permanente. |
| CT-01 (preview 3D do catálogo) | ALTO, se um dia entrar | Baixa | **Decidido 2026-09-25: não é regressão, é feature nunca implementada** — documentado no `QA.md`. `ilustracao-anatomica-3d.tsx` (25 KB) segue órfão, nunca conectado a nenhuma tela. Ligar esse componente algum dia continua ALTO esforço (código não testado, precisa de QA visual completo) — entra no backlog só se o dono pedir; até lá, sem ação. |
| PF-01 | — | — | **Resolvido**: não era bug, era descrição errada do item (idioma sempre foi em `/ajustes`, nunca em `/perfil`). |
| PE-01…PE-09 (personal) | MÉDIO | Média | **Destravado 2026-09-29: a 2ª conta (personal) existe e está logada no Chrome do dono.** Era: O dono vai criar uma 2ª conta por fora e testar; quando estiver pronta, o agente audita as telas de personal com ela — sem custo de token até lá. |
| OF-04, OF-06 | MÉDIO | Baixa | Exigem alternar 2 contas (login/logout) na mesma sessão de navegador — mesma trava do PE-*, resolve junto quando a 2ª conta existir. |
| LG-06, LG-07, LG-08, LG-05 (triste) | MÉDIO | Baixa | Mesma trava de 2ª conta (modo personal). |
| UX-01 | — | — | **Já resolvido** pelo TR-12 (PR #269, casca fixa em `/treino/[id]`) — este backlog não tinha sido atualizado. |
| UX-02 (histórico cronológico) | — | — | **FEITO 2026-09-28** (o Antigravity não chegou a começar; o Claude assumiu). Portão visual: duas direções num Artifact renderizado; o dono pediu uma terceira (calendário de mês, colapsado por padrão) e o botão de gerar relatório por linha. `ListaTreinos` reescrito: treino de hoje separado, histórico agrupado por mês (`lib/treino/agrupar-historico.ts`), calendário do mês (`lib/treino/calendario-mes.ts`, ambos puros e testados), filtro por dia soma ao filtro por grupo já existente, relatório reusa `lib/dados/relatorio-treino.ts` (extraído de `/ajustes/relatorios`, sem duplicar cálculo). Spec `e2e/j31-historico-calendario.spec.ts`. | Redesenho de tela existente (`/treino`), precisa de estados vazio/filtro e não pode inventar métrica — não iniciado. |
| UX-03 (auditoria visual completa) | ALTO | Média | **2026-09-28: o Claude assumiu (o Antigravity ficou sem cota). A cobertura planejada está completa (`j33`: `/treino/[id]` offline e em erro, catálogo com mídia). Achados novos: UX3-15 (BAIXA, peso com ponto em pt na grade de séries, **corrigido 2026-09-28, PR #347**) e UX3-16 (MÉDIA, linha própria abaixo). Falta a auditoria independente.** Histórico: **Delegado ao Antigravity/Gemini pelo dono (2026-09-26): `docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` §4.** **1ª passada PARCIAL feita (Claude retomou depois de o Antigravity esgotar a cota): `docs/qualidade/ux-03-auditoria-2026-09-26.md`, 8 achados ALEGADOS (4 MÉDIA corrigidos em 2026-09-26, PRs #317 a #320; 4 BAIXA corrigidos no mesmo dia, PRs #322 a #326). **Cobertura medida (2026-09-26, §4c do documento):** 60 telas; 1 ALTA (barra inferior em espanhol) e 3 MÉDIA novas, todas corrigidas (#329 a #331); as 2 BAIXA também (UX3-13 e UX3-14, #336). **Todos os 14 achados desta auditoria estão corrigidos**; falta só a cobertura listada na §4c como "sem medir" e a auditoria de outro agente, evidências em `qa/evidencias/UX-03/`. Falta: capturas de viewport rolado, rotas fora da `j4`, idiomas, temas, e o dono decidir o que corrigir.** | Todas as rotas × rolagem/hierarquia/toque — não iniciado, é o tipo de trabalho que mais consome token (muitas telas, muitos viewports). |
| UX3-16 (biomecânica do catálogo em pt nas telas en/es) | — | — | **FEITO 2026-09-28:** `exercicios-midia-traducao.json` (192 textos × en/es) + `traduzirBiomecanica`; teste de cobertura. Achado da `j33`, 2026-09-28. Era: Músculo alvo, sinergistas, mecânica articular e o "Foco" do player vêm de `exercicios-midia.json`, que só tem português. Corrigir exige traduzir ~102 × 4 campos × 2 idiomas, sem IA em produção (mesmo método do A1). |
| TON-01 (tonelagem com exercício unilateral) | — | — | **FEITO 2026-09-28, PR #346** (achado D1 do estudo do AN-08). O relatório pós-treino ignorava `unilateral` (52 dos 218 exercícios) e divergia da lista. Hoje as três contas usam `volumeDeSerie`. Falta a auditoria independente. |
| POL-01 (Política diz que todo Coach é IA) | BAIXO | Baixa | **Decidido 2026-09-29: entra com a revisão da Política do check-in (A1).** A Política (`lib/legal/documentos.ts`, linha 63) diz que as respostas do Coach são geradas por IA; desde a M1 parte delas é calculada pelo lastro. Ajustar na próxima revisão da Política, porque mudar `VERSAO_DOCUMENTOS` obriga todos a reaceitarem. |
| QA-02 (matriz aluno/personal) | MÉDIO | Baixa | Depende de UX-02 estar pronto e da 2ª conta para a parte personal. |
| DOC-01 (arquivar backlogs antigos) | — | — | **Resolvido**: os arquivos já estavam em `docs/historico/`; o backlog é que não tinha sido atualizado. Era: | Mover 6 arquivos de agosto (`BACKLOG-PROXIMA-FASE.md`, `BACKLOG-REDESENHO.md`, `BACKLOG-TESTE-APARELHO.md`, `ESTUDO-*.md`, `IMPECCABLE-AUDIT.md`, `AUDITORIA-APEX-PRO.md`) para uma pasta de histórico. |
| DOC-02 (política de testes) | — | — | **FEITO 2026-09-26**: `AGENTS.md` §9 e `DECISIONS.md` 2026-09-26 (2). Era: | É decisão a registrar, não código. |
| DOC-03 (reconciliar DESIGN.md) | MÉDIO | Baixa | Só depois da UX-03. |
| "descanso_real_segundos" (migration) | — | — | **Resolvido (2026-09-25, PROGRESS.md)**: 72 séries reais em produção já gravaram o valor desde a migração 20260915130000; funciona ponta a ponta. Era: | Fio solto do PROGRESS.md — não aparece em nenhum spec nem no QA.md; provavelmente obsoleto, precisa só de 10 min pra confirmar e fechar ou reabrir como item de verdade. |

## P1 — bugs a revalidar (restantes)

Tudo que estava aqui em 16/set já foi resolvido pelo QA-01 (ver `QA.md` e
`PROGRESS.md`), exceto os listados no ranqueamento acima (A1, CT-01,
AN-03/AN-04, os itens que exigem 2ª conta).

## P1 — melhorias aprovadas pelo dono

| ID | Categoria | Decisão | Próximo passo |
|---|---|---|---|
| UX-02 | Tela existente | Histórico de `/treino`: separar treino de hoje e transformar cartões repetidos em linha cronológica mensal com data, grupos, volume e séries — sem inventar métricas. | Implementar após UX-01 (já resolvido), com estados vazio e filtro. |
| QA-02 | Cobertura | Aluno testa treino livre e treino iniciado por modelo configurado em Ajustes; personal testa modo trabalho e alternância de modo. | Criar matriz Playwright normal/triste, parte personal depende da 2ª conta. |
| UX-03 | Auditoria visual | Revisar todas as rotas quanto a rolagem, hierarquia, alvos de toque, conteúdo escondido pela navegação e fluidez. | Registrar achados por rota e viewport. |

## P2 — documentação e processo

| ID | Categoria | Achado | Próximo passo |
|---|---|---|---|
| DOC-01 | Documentação | Backlogs e relatórios antigos (agosto, pré-redesenho "uma conta dois modos" de 12/set) divergem de `main` e do QA. | Arquivar fontes antigas e manter este arquivo como entrada única. |
| DOC-02 | Processo | `AGENTS.md` tem conflito entre bateria completa por commit e uso proporcional de testes. | Decidir e documentar política. |
| DOC-03 | Design | `DESIGN.md` traz decisões concluídas, pendências e medições antigas no mesmo fluxo. | Reconciliar somente depois da UX-03. |
