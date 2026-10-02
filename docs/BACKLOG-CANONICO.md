# Backlog do lastro — arquivo único

> **Único lugar de pendências do projeto** (decisão do dono, 2026-10-01). Nenhum
> outro arquivo guarda lista de tarefas: `PROGRESS.md` guarda só o estado da
> sessão e o histórico; `QA.md` guarda o registro de testes; `DECISIONS.md`
> guarda o porquê. Item novo entra aqui; item feito vira uma linha em "Feito".
>
> Base: a `main` de hoje. Não grave hash aqui (a PR que o escreve vira o commit seguinte): rode `git log --oneline -1`.
>
> **Regra permanente (PROCESSO-DOIS-PROJETOS):** toda migração nova vai para o Supabase de produção (`tbkzcqfvafznxallyfqk`) **e** para o de teste `lastro-teste` (`zefhypctyizvgipwyjds`); depois, conferir `list_migrations` contra o disco (`docs/E2E-PROJETO-TESTE.md`).

**Status:** `A FAZER` (aprovado, o agente pode fazer) · `DONO` (só o dono
resolve) · `CONFERIR` (item antigo trazido de outro documento, ainda não
conferido contra o código: pode já estar resolvido) · `DECIDIR` (o dono decide
se continua) · `ESPERA CONDIÇÃO` (depende de dado, de evento ou do QA final) · `CONGELADO` / `PARADO` (decisão do dono, não mexer) · `CORTADO` (decidido que não se faz; fica registrado na seção 5).

**Importância:** Alta · Média · Baixa.

## 1. Ordem de execução (dono, atualizada em 2026-10-02)

Já feitos: TR-17 e a QA da M3, a faxina (FAXINA-1 e 2), a auditoria independente e o DOC-03, o check-in (A1) com a revisão da Política (POL-01) e o e2e isolado (E2E-PROD).

Vale agora:

1. Fechar a casa: backlog e `AGENTS.md` conferidos contra a `main`, branches já mescladas apagadas (FAXINA-BRANCHES-2), decisões que só o dono toma.
2. **QA e auditoria ficam para o FINAL**, para não haver retrabalho: QA-02, PE-01…09, OF-04/06, LG-05…08, TR-03, AN-03/04 e a VERIFICACAO-FINAL.
3. Tutorial (GUIA-01/02) e Comunidade (COM-01/02): registrados, **sem implementação autorizada**; antes, o desenho e a emenda do PRD.
4. **Por último (decisão do dono, 2026-10-01): SEGREDOS e depois FAXINA-3** — chave e senha expostas no repositório público. O risco fica aceito até lá.

## 2. Código e QA — o agente faz

| ID | O que é | Status | Importância |
|---|---|---|---|
| FAXINA-3 | Apagar os 9 scripts antigos de `scripts/` que guardam a senha da conta QA e, em dois deles, a chave `service_role` (nenhum é usado por `package.json`, CI ou e2e). Só depois de o dono rotacionar (ver SEGREDOS). | ESPERA CONDIÇÃO: no final, depois de SEGREDOS | Alta |
| BRANCHES-LOCAIS | Resta uma branch só local, sem PR e fora da `main`: `feat/propostas-evolucao-visual` (2 commits de 29/09, "três direções visuais", 4 arquivos de docs; está num worktree do Codex). O dono decide se vira PR ou se apaga. (`feat/sticker-logo-direita-compacto` e a cópia local de `feat/stickers-personalizados` foram apagadas em 2026-10-02 a pedido do dono; o commit `7fc0bdf` da primeira, só de PROGRESS, se recupera pelo reflog.) | DECIDIR | Baixa |
| CAT-GRUPOS | **Conferência feita em 2026-10-01; falta o dono decidir** (nenhum grupo foi alterado). Resultado: o grupo do banco e o de `exercicios-midia.json` **concordam nos 102** exercícios com GIF; cruzando o músculo alvo com o grupo, e lendo a dica dos 116 restantes, **não há troca costas × ombro em escala**. Sobram casos de fronteira: (1) **Encolhimento** (barra, halteres, máquina, smith; alvo "Trapézio Superior") está em ombro e o app não tem grupo trapézio; (2) **Remada alta** (barra, halteres, cabo) está em ombro mas o nome começa com "remada" e parece de costas; (3) **Levantamento terra** (convencional, trap bar, sumô) em costas, com o sumô podendo ser glúteo/quadríceps; (4) **Pull-over com halter** (peitoral + dorsal) em costas; (5) Rosca inversa e martelo em bíceps com alvo braquial/braquiorradial. Só 5 desses exercícios têm histórico (Encolhimento com halteres 3 séries, Encolhimento máquina 10, Pull-over com halter 28, Remada alta no cabo 4, Rosca martelo 14), todos de uma conta, então trocar quase não mexe em número calculado. Aguarda o dono dizer onde viu a troca e escolher entre manter, mover ou criar grupo trapézio. | DONO decide | Média |
| E2E-PROD | O e2e roda contra o banco de produção com a `service_role` (`ci.yml`). Com usuários reais, um spec com defeito pode apagar dado real. Avaliar isolamento (branch do Supabase ou projeto de teste) antes de divulgar. Achado do agente técnico. | **FEITO** (2026-10-02, PR #396): o e2e roda no projeto `lastro-teste` (US$ 0/mês), pelos secrets `TESTE_*`; `playwright.config.ts` recusa a URL de produção. Suíte inteira verde lá (235 de 235). Toda migração nova vai para os DOIS projetos (ver `docs/E2E-PROJETO-TESTE.md`) | Média |
| BANCO-RECRIAVEL | As migrações do repositório não recriam o banco: grupos base semeados à mão, UUIDs de exercício de produção dentro da 0012, 0014 depende de função de projeto antigo (achado do E2E-PROD). Decidir se vale uma migração de base (`0000`) autossuficiente ou só manter o roteiro em `docs/E2E-PROJETO-TESTE.md`. Importa se um dia for preciso recriar o banco. | DECIDIR | Média |
| DESIGN-HTML | `design/padrao-visual.html` é a página de referência da paleta **Areia** (histórica, 40 KB) e o `DESIGN.md` agora diz isso. Decidir se apaga ou se fica como arquivo morto. | DECIDIR | Baixa |
| QA-02 | Matriz Playwright aluno (treino livre e por modelo) e personal (modo trabalho e alternância), caminho normal e triste. A 2ª conta já existe. | ESPERA CONDIÇÃO: QA final | Média |
| PE-01…09 | Auditar as telas de personal com a conta de personal. O `QA.md` já tem PE-01…05, 07 e 09 como PASSOU por e2e; PE-06 (prescrição sob vínculo) segue ALEGADO e só se prova com uma conta de aluno vinculada (isso é do dono); PE-08 construída, não medida. | ESPERA CONDIÇÃO: QA final | Média |
| OF-04, OF-06 | QA que alterna duas contas na mesma sessão de navegador. **OF-06 já consta PASSOU** (ANT-17, `QA.md`); OF-04 tem e2e (`j10`) mas o `QA.md` ainda o mostra intermitente: reconciliar. | ESPERA CONDIÇÃO: QA final | Baixa |
| LG-05…08 | Linguagem das telas de personal (`docs/qualidade/matriz-linguagem.md`, várias células PENDENTE também em LG-01…LG-10). | ESPERA CONDIÇÃO: QA final | Baixa |
| TR-03 | Treino iniciado por modelo. Autorizado uma vez na conta de personal. | ESPERA CONDIÇÃO: QA final | Baixa |
| AN-03, AN-04 | Reproduzir na conta de personal (gasta ~3 unidades da cota do dia). Autorizado uma vez. | ESPERA CONDIÇÃO: QA final | Baixa |
| EST-DURACAO | Estudo: diferença entre a duração até a última série e `duracao_segundos` no relatório pós-treino. Esperar ~3 semanas de dado (em 2026-10-02 eram 3 sessões com o campo) e trazer opções. | ESPERA CONDIÇÃO: ~3 semanas de dado | Baixa |

### 2.1. Tutorial interativo e Comunidade — registrados em 2026-10-02

**Pedido do dono: registrar neste backlog existente, sem implementar agora e sem criar backlog paralelo.** A ordem da seção 1 continua válida; prioridade e início destes trabalhos ainda serão definidos. Este registro não autoriza implementação. As ideias gerais sugeridas antes desta conversa não viram novas tarefas automaticamente.

| ID | O que é | Status | Importância |
|---|---|---|---|
| GUIA-01 | **Primeiro acesso guiado dentro do app.** Reformular o onboarding existente para ensinar o uso pelas próprias telas e ações, acompanhando o ciclo de iniciar treino, escolher exercício, registrar e repetir série, usar descanso, finalizar e consultar relatório; apresentar também histórico, evolução, Análise e demais recursos no contexto adequado. O dono pediu um passo a passo interativo do uso do aplicativo. | REGISTRADO — sem implementação autorizada | A definir |
| GUIA-02 | **Guia interativo em Ajustes.** Reformular a tela existente de como usar (`/ajustes/guia`), considerada insatisfatória pelo dono. Organizar a ajuda por tarefas e permitir refazer os percursos dentro do app, reutilizando o mecanismo do primeiro acesso em vez de manter dois tutoriais independentes. | REGISTRADO — sem implementação autorizada | A definir |
| COM-01 | **Grupos de amigos com competição.** Criar uma área Comunidade com grupos, convites, mural de treinos compartilhados e desafios com classificação entre os participantes. Definir nome/imagem do grupo, integrantes e administração. O foco escolhido pelo dono é competir dentro de grupos de amigos. | REGISTRADO — desenhar o módulo antes de implementar | A definir |
| COM-02 | **Feed global de treinos.** Dentro da Comunidade, permitir alternar entre os grupos e o feed global e publicar que houve um treino. Aproveitar o relatório do treino finalizado para compor a publicação, com prévia e escolha do destino. Publicação pública deve ser voluntária e não liberar automaticamente acesso ao histórico completo. | REGISTRADO — sem implementação autorizada | A definir |
| COM-03 | **Comentários, seguidores e mensagens.** Explicitamente deixados pelo dono para bem depois; não entram na primeira versão da Comunidade. | ADIADO — bem depois, sem previsão | A definir |

**Propostas discutidas, ainda a detalhar com o dono:**

- **Tutorial:** destacar controles reais e avançar conforme as ações; oferecer voltar, pular e continuar depois; organizar a ajuda por tarefas (registrar treino, usar modelos, entender evolução, usar offline e conectar personal). Definir demonstração versus primeiro treino real para não contaminar histórico e métricas com dados fictícios. O alcance completo e a divisão entre primeiro acesso e orientações contextuais ainda precisam de desenho.
- **Desafios:** começar por dias com treino registrado no período, no máximo um ponto por dia, com empates na mesma posição. Participar do grupo não deve obrigar a entrar no desafio; pontuação não deve depender de publicar no mural. São propostas, não regras fechadas: definir elegibilidade, treino vazio, exclusão/edição, sincronização offline, prazo de fechamento e registros retroativos antes de implementar.
- **Feed:** legenda opcional, escolha dos dados visíveis, ordem cronológica e possíveis curtidas. Esses detalhes ainda não estão aprovados individualmente. Prever privacidade, saída dos grupos, remoção de integrantes, exclusão de publicações, bloqueio, denúncia e operação de moderação antes de abrir o feed público. Sem mensagens privadas nesta etapa.
- **Escopo:** ranking por academia, cidade, estado e Brasil foi uma alternativa explorada, substituída nesta conversa pelo foco em grupos de amigos e feed global; não entra como tarefa aprovada. Feed global não significa ranking nacional.
- **Integração:** o PRD §5 hoje exclui feed e ranking. O novo pedido reabre esse escopo, mas o contrato do produto precisa ser reconciliado antes da implementação; não interpretar a discussão como liberação irrestrita de recursos sociais. Desenhar a experiência completa, incluindo sua relação com o tutorial, antes de fatiar. A sugestão foi grupos/desafios/mural primeiro e feed global depois; ordem final a confirmar. Por ser módulo em várias fatias, seguir a branch de integração própria exigida pelo `AGENTS.md` §4, sem entregar fatias incompletas na `main`.

### 2.2. Itens novos da reconciliação de 2026-10-02

Achados pela reconciliação do backlog contra o código, o banco e as PRs. Nenhum autoriza implementação por si só.

| ID | O que é | Status | Importância |
|---|---|---|---|
| CHECKIN-PERSONAL | Não existe tela onde o personal veja o check-in do aluno (nada em `src/app/personal` lê `checkin`). A Política (`lib/legal/documentos.ts` linhas ~153 e ~193) promete a leitura "enquanto você mantiver ligado" e a RLS `checkin_visivel_ao_personal` já existe nos dois projetos, mas o interruptor "compartilhar com meu personal" (`vinculo-aluno.tsx`) não muda nada visível; todos os usuários estão com ele ligado por padrão. **O dono já adiou a tela do personal** (`DECISIONS.md`, check-in de 2026-10-01); este item só pergunta se ela entra antes do QA final. Se entrar: só leitura, sem IA (estender `src/lib/checkin/nao-vai-para-ia.test.ts`), "aluno não compartilha" como estado, portão visual. | DECIDIR (dono já adiou) | Média |
| BIOMEC-REVISAO | Os 30 exercícios do CAT-BIOMEC (músculo alvo, sinergistas, mecânica) foram escritos por IA, sem revisão humana e sem marcador de origem; o aviso da página do exercício e o DICAS cobrem só a dica de execução. **Aviso na tela feito (2026-10-02):** os 30 levam `anatomia_origem: "claude"` em `exercicios-midia.json` e a página do exercício mostra "Conteúdo gerado por IA"; um teste trava a contagem. Dono: revisão por amostra; ao revisar um exercício, tirar o marcador dele e ajustar a contagem do teste. | DONO (amostra) | Baixa |
| FAXINA-BRANCHES-2 | Branches remotas já mescladas, apagar **só depois do merge da PR que refaz o backlog** e conferindo antes o estado de cada PR (squash: `git branch --merged` não serve): `docs/atualiza-backlog-progress`, `docs/e2e-prod-feito`, `feat/a1-aceite`, `feat/a2-prontidao`, `feat/checkin-dispensa-apagar`, `feat/checkin-docs`, `feat/checkin-historico`, `feat/checkin-tela`, `feat/e2e-projeto-teste`, `feat/home-checkin-metricas`, `fix/abas-metricas-320`, `fix/checkin-320`, `fix/checkin-por-conta`. **Ficam de fora:** `chore/backlog-tutorial-comunidade` (PR #397 aberta até ser substituída) e `feat/stickers-personalizados` (outro agente; tem 1 commit, de PROGRESS, que não está na `main`). | A FAZER | Baixa |
| BASE-BACKLOG | O cabeçalho "Base: main em …" e a seção 1 estavam velhos; corrigidos junto com `AGENTS.md` (§4 cita `feat/modulo-personal`, que não existe; §9 diz que o Playwright roda contra produção). Item fechado quando esta PR for mesclada. | A FAZER | Média |
| VERIFICACAO-FINAL | Para o fim, junto com o QA e a auditoria: (1) mapa muscular a 320 e 390 px com conta que tenha treino (hoje só visto numa bancada Vite com dado sintético, `qa/evidencias/HOME-METRICAS-01.md`); (2) revisão do código dos 29 arquivos da #390 (Home nova do Codex, já mesclada); (3) a seleção de métricas da Home é `useState` puro, não persiste em lugar nenhum: o dono decide se persiste (por conta ou por aparelho) ou se o item cai; (4) teste real na conta de uso do dono. | ESPERA CONDIÇÃO: fim | Alta |
| PROCESSO-DOIS-PROJETOS | Regra permanente, registrada no cabeçalho e no `AGENTS.md`: toda migração nova vai para produção e para `lastro-teste`, e `list_migrations` é conferido contra o disco. Os 6 preparos que só existem no teste estão em `docs/E2E-PROJETO-TESTE.md`. | A FAZER (docs) | Média |

### 2.3. Travas de interação — auditoria solicitada em 2026-10-02

**Escopo:** diagnóstico, sem correções de produto. Base `9dee403`; handlers extraídos do código e exercitados com falhas de transporte e promessas controladas, sem banco ou dados reais. Evidência em `qa/evidencias/UX-INTERACAO-20261002/`. Oito cenários reproduzidos em lógica isolada; não equivalem a validação visual/mobile ou E2E. A revisão de código também cobriu entrada, treino, modelos, catálogo, Coach, Análise, check-in, Ajustes e folhas. Nenhum item existente foi promovido para PASSOU. Prioridade abaixo é recomendação da auditoria, não mudança silenciosa da ordem do dono.

| ID | Cenário, causa e direção de refinamento | Status | Importância |
|---|---|---|---|
| INT-01 | **Ações ficam presas após falha de transporte.** `onboarding.tsx:27`, `aceite-termos.tsx:16`, `idioma-form.tsx:26` e `editar-perfil.tsx:29`: rejeitar a chamada mantém o estado ocupado e não apresenta erro; os controles ficam desabilitados até remontar a tela. Os retornos de erro do servidor não cobrem queda da chamada. Reproduzido nos quatro handlers. Tratar rejeição, restaurar controles e oferecer nova tentativa, seguindo os componentes que já usam catch/finally. | CONFERIR — reproduzido isoladamente; falta navegador | Alta |
| INT-02 | **Abrir exercício de modelo espera rede.** Em `treino-detalhe.tsx:482`, quando peso ou reps estão ausentes, o botão + espera `historicoDoExercicio` antes de abrir o formulário. Rede lenta deixa o toque sem resposta imediata; catch só ajuda quando a chamada termina. Reproduzido com promessa pendente. Abrir imediatamente e carregar o histórico depois, sem sobrescrever o que a pessoa já digitou. | CONFERIR — reproduzido isoladamente; falta navegador | Alta |
| INT-03 | **Salvar edição de série espera sincronização.** `treino-detalhe.tsx:512` já atualizou a série e a enfileirou, mas só fecha a edição depois de `await drenar()`. `editar-serie.tsx:59` mantém Salvar e Cancelar desabilitados nesse intervalo. Reproduzido com sincronização pendente. Encerrar após persistência local e sincronizar em segundo plano; preservar tratamento de falha local. | CONFERIR — reproduzido isoladamente; falta navegador | Alta |
| INT-04 | **Análise não conduz ao resultado nem acompanha conclusão.** `analise-interativa.tsx:133,147,256`: todo sucesso deixa `emAndamento` preenchido, desativa perguntas e mostra emissão até sair da tela; a orientação para Ajustes > Relatórios é texto sem link. A rota já entrega os pareceres determinísticos prontos com 202 (`api/analise/route.ts:302`), mas a tela usa o mesmo estado de espera. `pareceres-salvos.tsx` também não atualiza sozinho um rascunho recebido como gerando. Reproduzido o estado do handler após 202; ausência de acompanhamento constatada no código. Definir acesso direto ao parecer e atualização de estado, inclusive falha/expiração. O destino atual é decisão antiga do produto: redesenhar o percurso com o dono. | DECIDIR — trava de fluxo constatada; desenho a aprovar | Alta |
| INT-05 | **Fechar check-in editado deixa resumo com valor não salvo.** `cartao-checkin.tsx:140,144`: formulário e resumo usam o mesmo `notas`. Editar uma nota e fechar por X/fora/Escape mantém a alteração no resumo de um check-in respondido, sem salvar na fila. Reproduzido pelos handlers. Separar rascunho da resposta salva ou restaurar os valores ao cancelar. Não confundir com a dispensa diária já corrigida. | CONFERIR — reproduzido isoladamente; falta navegador | Alta |
| INT-06 | **Folhas não contêm o foco e podem descartar preenchimento.** `folha.tsx:46,84` declara dialog modal, mas não implementa contenção/restauração de foco; fecha por fora/Escape/arraste sem consultar se há alterações. `modelo-treino-form.tsx` só guarda a montagem em estado local. Risco de Tab chegar ao fundo e de perder modelo em preparação. Inspeção estática, não reprodução visual. Conferir teclado e fechamento; proteger rascunho ou confirmar descarte quando necessário, sem exigir confirmação para toda folha. | CONFERIR — inspeção estática | Média |
| INT-07 | **Coach sem recuperação direta da pergunta.** `coach-interativo.tsx:45`: limpa o campo antes da resposta; após falha, a pergunta fica no balão, mas não há Reenviar nem restauração no campo. Fetch sem prazo/cancelamento explícitos mantém entrada bloqueada enquanto estiver pendente. Inspeção estática. Permitir repetir a mesma pergunta e recuperar controle em demora excessiva. | CONFERIR — inspeção estática | Média |
| INT-08 | **Modelos: Editar só oferece exclusão.** `lista-modelos.tsx:50,74`: nomes são texto estático, e Editar revela lixeiras; não abre nome/exercícios para revisão. O plano pode ser atualizado pelo treino, mas isso não resolve editar a composição do modelo. Avaliar edição real ou rótulo que comunique gerenciar/excluir. Nova capacidade precisa de decisão, não é regressão comprovada. | DECIDIR — refinamento de produto | Média |
| INT-09 | **Busca do catálogo exige acentos.** `catalogo-interativo.tsx:81`: comparação usa minúsculas, mas não remove diacríticos; `elevacao` não encontra `Elevação`. Inspeção estática. Normalizar consulta e nomes mantendo o texto original exibido; conferir também a necessidade de busca no seletor de exercício do treino. | CONFERIR — inspeção estática | Média |

**Limite conhecido, não bug novo:** iniciar um treino exige conexão (`form-iniciar-treino.tsx:49`); a fila offline cobre séries e check-in, não criação de treino. Decidir separadamente se o offline deve incluir o início. GUIA-01/02 já cobrem o tutorial e o manual: não duplicar. Check-in A1/A2, COACH-PRESC, FAIXA-REABRIR e UX-03-RESTO já entregues não foram reabertos sem evidência nova.

## 3. AN-08 — motor determinístico (o que falta)

Texto original do dono: `docs/MISSAO-MOTOR-DETERMINISTICO.md` (a seção indicada).
Estudo aprovado: `docs/estudos/AN-08-motor-deterministico-estudo.md`. Cada
milestone só começa com autorização do dono. Revisado pelo dono em 2026-10-01.

| ID | O que é | Status | Importância |
|---|---|---|---|
| AN-08.A1 | **Check-in de recuperação.** Registro rápido de **sono, energia, dor muscular e estresse**, escala simples, **também em dia sem treino**. Dá contexto aos números; não vira diário médico, não diagnostica, não prescreve. Visível ao aluno e ao personal com vínculo. Feito na academia, então entra na fila offline (Dexie) como a série. Tabela nova `checkin`. Exige revisão da Política (junto com POL-01) e novo aceite de todos. (§13) | **FEITO** (2026-10-02, PRs #383, #384, #387, #389, #392): banco, fila, RLS, cartão e folha que sobe sozinha, um "Agora não" encerra o dia, histórico de 7 dias, apagar meus check-ins, compartilhar com o personal (ligado por padrão), exportação e Política 2026-10-01. Sem tela do personal ainda (ver CHECKIN-PERSONAL) | Média |
| A1-ACEITE | Antes do A1: subir `VERSAO_DOCUMENTOS` manda para `/aceite` qualquer tela com a casca (`exigirTipoEscolhido`, `lib/dados/casca.ts`), provavelmente também o treino em andamento. Garantir que o reaceite não interrompe um treino. Também: o dono aprova o texto novo da Política. | **FEITO** (Home abre com treino em aberto; texto da Política aprovado) | Média |
| POL-01 | A Política (`lib/legal/documentos.ts`, linhas ~63 e ~150) diz que o Coach **e a Análise** são IA; hoje parte do Coach e as perguntas 1–4, 6 e 7 da Análise são calculadas pelo lastro (só a pergunta 5 usa IA). Ajustar na mesma revisão do A1, para um aceite só. | **FEITO** (Política 2026-10-01) | Baixa |
| AN-08.A2 | **Prontidão.** Os sinais crus do check-in contra a média da própria pessoa, **sem índice único 0–100**. (§14) | **FEITO, versão mínima** (PR #394, 2026-10-02): "acima, na ou abaixo da sua média" sob cada sinal do cartão, com 4+ dias de histórico. Só aparece depois de uns 4 dias de uso | Baixa |
| AN-08.A3 | **Recuperação × desempenho.** Coincidência, nunca causa ("a queda coincidiu com sono abaixo da sua média"). (§15) | ESPERA CONDIÇÃO: ~8 semanas de check-in (não antes de ~27/11/2026) | Baixa |
| AN-08.F0-INSIGHT | `Insight` como dado estruturado. Hoje só Home e pós-treino usam o detector. | ESPERA CONDIÇÃO: generalizar só quando um 3º lugar precisar (hoje o detector está em `lib/analise/fora-do-padrao.ts`, usado na Home) | Baixa |
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
| IPHONE (= PU-01) | Testar o aviso de fim do descanso (web push) no iPhone, com o app na tela de início. | Média |
| PWA-INICIO | Com o app instalado, abrir pelo ícone e conferir que abre em Início e que a barra superior não cobre conteúdo. Um minuto. | Baixa |
| DICAS | Revisar por amostra ~20 dicas dos exercícios que o dono usa (hoje 0 de 218 marcadas `humano`) e marcar `dica_execucao_origem = 'humano'` nas aprovadas. | Baixa |
| GEMINI | Segue no plano gratuito (20/dia). Revisitar quando divulgar ou quando o contador da M3 mostrar aperto. | Média |
| P1 | Perguntar ao personal P1 o que é "mensagem padrão" e quantos alunos tem e perdeu em 6 meses. Só se o módulo Personal virar produto. | Baixa |

## 5. Itens antigos que continuam

Vindos do `PROGRESS.md`, revisados pelo dono em 2026-10-01.

| ID | O que é | Status | Importância |
|---|---|---|---|
| ANT-06 | Medida do módulo Personal: "o grupo alertado recebeu estímulo na semana seguinte?" (`alerta_personal` já grava). | ESPERA CONDIÇÃO: personal real usando | Baixa |
| ANT-10 | Coluna "antes 16 × 9" por série (padrão Hevy/Strong), com portão visual. | ESPERA CONDIÇÃO: se o dono sentir falta no treino | Baixa |
| ANT-14 | Hydration mismatch no console ao trocar de tema (`data-tema` diverge servidor/cliente). Não aparece para o usuário. Só se vê no console: reproduzir antes de mexer. | A FAZER, baixa prioridade | Baixa |

### Cortados ou resolvidos na revisão de 2026-10-01

- **Resolvidos (conferidos no código e no banco):** ANT-02 (Personal já usa `t()`), ANT-11 (`totalExercicios` já conta só exercício com série valendo), ANT-12 (sem emoji no relatório), ANT-13 (timer já usa `t()`), ANT-16 (0 contas `qa-lastro*` no banco).
- **Cortados pelo dono:** AN-08.B3 (o A3 entrega quase o mesmo), AN-08.C2 resto (calendário, semanas seguidas e meta cumprida já cobrem), ANT-04 Fase 6 (a AUD-IND e o e2e cobrem), ANT-05 parecer × feito (só 2 pareceres salvos), ANT-07 esconder prescrição sob vínculo, ANT-08 frequência ao pé da letra (aceito como queda de volume), ANT-09 personal encerrar vínculo, ANT-15 os 404 da Gemini de agosto (o `erro_app` pega se voltarem).
- **Dado como feito:** AN-08.F0-MATRIZ (é a Entrega 2 do estudo).
- **Apagado:** `supabase_migrations.backup_20260905_antes_repair` (20 linhas, backup de antes do repair de 05/09).
## 6. Parados

| ID | O que é | Status |
|---|---|---|
| CT-01 | Preview 3D do catálogo (`ilustracao-anatomica-3d.tsx` órfão). Não é regressão, é feature nunca ligada. | PARADO |
| PIP | Timer flutuante (Picture-in-Picture). **Já entregue em 24/09** (`b019234`, `lib/treino/timer-flutuante.ts`, botão em `timer-topo.tsx`, ativo sempre que o navegador suporta). "Parado" (2026-09-29) quer dizer: não evoluir. | FEITO (entregue, sem evolução) |
| DOMINIO | Domínio próprio (`lastro-pi.vercel.app` continua). | PARADO |
| MIDIA | Os 116 exercícios novos ficam sem GIF (o dono não paga a licença da Gym Visual). | CONGELADO (decidido) |

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
- **Faxina (2026-10-01):** FAXINA-1 acento de "Elevação lateral com halteres" (#373, migração `20261001162647`; a mídia casa por id). FAXINA-2: as 73 branches remotas apagadas, todas dentro da `main` ou com a PR mergeada no mesmo commit; no remoto sobrou só a `main` (histórico: a partir de 2026-10-02 voltaram 15 branches; ver FAXINA-BRANCHES-2).
- **CAT-BIOMEC:** os 30 exercícios com GIF que mostravam texto genérico ("Musculatura Alvo Principal" etc.) receberam músculo alvo, sinergistas e mecânica articular reais, com 42 traduções novas en/es; teste novo reprova qualquer exercício com texto genérico ou campo vazio. Conteúdo de anatomia escrito pelo Claude, sem revisão humana (como as dicas de execução).
- **COACH-PRESC:** o roteador do Coach reconhece o pedido de prescrição também na forma conjugada ("o que eu mudo essa semana?", "what do I change", "qué cambio esta semana"), então sob vínculo o encaminhamento ao personal sai sem Gemini e sem gastar cota; "o que mudou" (passado) segue o caminho normal. Teste novo liga o classificador à resposta com vínculo nos 3 idiomas. O PE-06 segue ALEGADO: a resposta real da Gemini sob vínculo só se vê com uma conta de aluno vinculada.
- **FAIXA-REABRIR: não era defeito.** O descompasso que o auditor mediu (faixa 129 px, reserva 69 px) aparece também sem finalizar nem reabrir, numa aba em segundo plano (`visibilityState = "hidden"`), onde o navegador não dispara o `ResizeObserver`. O e2e novo `j40` (6 exercícios, página visível, 375 px) prova que a reserva acompanha a faixa aberta, finalizada e reaberta sem recarregar, e que o último cartão não fica atrás da faixa; passou no CI e fica como proteção. Lição para o QA: medição de layout dinâmico só vale com a aba visível.
- **UX-03-RESTO (j41):** o ponto cego da medida (texto que se sobrepõe sem ser cortado) ganhou detector (`e2e/helpers/sobreposicao.ts`, que recorta o texto pelo que o elemento mostra) e um teste que reprova, com 15 telas em pt/en/es a 375 e 320 px e a faixa de ações do treino em 6 estados por idioma. Achou e corrigiu um defeito real: o cabeçalho da grade de séries ("Repeticiones", "Descanso real") se sobrepunha em espanhol a 375 px e em pt/es a 320 px; agora as colunas são rebalanceadas, o cabeçalho quebra por palavra e o selo "VÁL" não quebra. 12 testes passaram de primeira em ~4 min. A 320 px a letra do cabeçalho é 2 px menor. UX-03 passa a PASSOU na medição de texto sobreposto.
- **DOC-03 (`DESIGN.md` reconciliado, 2026-10-01):** o cabeçalho agora diz o que vale e o que é histórico; §3.0, §3.1, a tabela de razões de §3.2 e §4.2 foram reescritas sem os números da paleta Areia (que não existe mais desde o Apex Pro) e apontam para o `e2e/j5-contraste.spec.ts` como fonte dos números; D5 corrigida (o padrão é o tema escuro "ouro", com 7 temas); `--lastro-alvo-acao` é 64 px (o texto dizia 72); a razão `txt-2`/`txt-3` é 1,3:1 (o texto dizia 1,2); §5 e §6 ganharam o estado atual; referências a documentos apagados e à "nota C" removida foram corrigidas, inclusive em comentários de `sistema.css`, `tokens.css` e `bloco-evidencia.tsx` (só comentário). Passou de 674 para ~586 linhas; o texto antigo está no git.
- **Auditoria independente (2026-10-01, outro agente, produção, conta de personal):** TON-01 e TR-16 PASSOU; UX-03 §4c medida sem defeito, mas segue ALEGADO (falta UX-03-RESTO); PU-01 e PE-06 não executáveis por agente. **ANT-17:** OF-06 e VS-07 reconciliados no `QA.md` como PASSOU (corrigidos em e97be60, #253). **FILA-01 (#375):** exclusão recusada pelo banco sai da fila em vez de travá-la; `falhas` guarda o `usuarioId`; e2e `j10` verde. Evidências em `qa/evidencias/<ID>/auditoria-independente-2026-10-01/`.
- **QA-01:** CT-02, VS-06/07, AJ-03/04, AN-02/05/06, PF-01 resolvidos ou graduados pelo e2e.
- **Check-in diário e Home (2026-10-02):** AN-08.A1 completo, A1-ACEITE (#391: o reaceite espera o treino em aberto), A2 mínimo (#394), Home nova do Codex (#390: Check-in, Volume, Séries e Grupos num quadro, mapa muscular), e dois achados corrigidos no uso real: o check-in de uma conta aparecia na outra no mesmo navegador (#392, agora por conta) e abas sobrepostas a 320 px em espanhol (#393). Teste visual a 390 e 320 px do check-in (#388). Detalhe em `DECISIONS.md` 2026-10-01 a 2026-10-02.
- **E2E-PROD (2026-10-02):** projeto Supabase de teste criado e replicado (schema, grants, catálogo; conferido por hash), e2e isolado da produção com trava. O teste achou um defeito antigo: o crédito da mídia sobrepunha o selo "Animação Ativa" na página de exercício com GIF (corrigido, j41 cobre). Achado de risco registrado como BANCO-RECRIAVEL.
- **TESTE-DONO (2026-10-02):** os treinos de teste `aa0cd9e6…` e `9db03743…` já não existem em produção (0 linhas em `treino`); fechado pelo dono.
- **ANT-01 (2026-10-02):** o TODO de `PRD.md` §10 foi riscado (aponta para `KNOWLEDGE.md` §3.6 e §3.7) e os comentários de `lib/analise/limiares.ts` não dizem mais "ainda TODO". Só texto.
- **DESIGN-6 (2026-10-02):** itens "pendente" de `DESIGN.md` §6.5 a §6.7 reconferidos contra o código: "adicionar série" (ainda pendente), sub-tela desliza+esmaece (ainda pendente), nome do `/perfil` (diferente: já tem classe, sem papel tipográfico), `/ajustes/modelos/novo` (rota e folha existem; passo dos exercícios sem peça) e o TODO de estagnação/faixas (resolvido, ANT-01). Só texto.
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
