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
| PU-06 | MÉDIO | **RASCUNHO NO AR 2026-09-25 — falta advogado** | Termos de Uso e Política de Privacidade (LGPD — o app guarda dado de saúde/treino). Documento jurídico, não só tela — considerar revisão de um advogado antes de publicar. |
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
| AN-03, AN-04 | MÉDIO | Baixa | Só reproduz gastando cota real de IA (Gemini) da conta do dono — aguarda autorização explícita por execução, não é "sim" permanente. |
| CT-01 (preview 3D do catálogo) | ALTO, se um dia entrar | Baixa | **Decidido 2026-09-25: não é regressão, é feature nunca implementada** — documentado no `QA.md`. `ilustracao-anatomica-3d.tsx` (25 KB) segue órfão, nunca conectado a nenhuma tela. Ligar esse componente algum dia continua ALTO esforço (código não testado, precisa de QA visual completo) — entra no backlog só se o dono pedir; até lá, sem ação. |
| PF-01 | — | — | **Resolvido**: não era bug, era descrição errada do item (idioma sempre foi em `/ajustes`, nunca em `/perfil`). |
| PE-01…PE-09 (personal) | MÉDIO | Média | O dono vai criar uma 2ª conta por fora e testar; quando estiver pronta, o agente audita as telas de personal com ela — sem custo de token até lá. |
| OF-04, OF-06 | MÉDIO | Baixa | Exigem alternar 2 contas (login/logout) na mesma sessão de navegador — mesma trava do PE-*, resolve junto quando a 2ª conta existir. |
| LG-06, LG-07, LG-08, LG-05 (triste) | MÉDIO | Baixa | Mesma trava de 2ª conta (modo personal). |
| UX-01 | — | — | **Já resolvido** pelo TR-12 (PR #269, casca fixa em `/treino/[id]`) — este backlog não tinha sido atualizado. |
| UX-02 (histórico cronológico) | ALTO | Média | **Delegado ao Antigravity/Gemini pelo dono (2026-09-26): `docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` §3.** Recomendação do Claude: melhor depois de haver gente real usando. | Redesenho de tela existente (`/treino`), precisa de estados vazio/filtro e não pode inventar métrica — não iniciado. |
| UX-03 (auditoria visual completa) | ALTO | Média | **Delegado ao Antigravity/Gemini pelo dono (2026-09-26): `docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` §4.** | Todas as rotas × rolagem/hierarquia/toque — não iniciado, é o tipo de trabalho que mais consome token (muitas telas, muitos viewports). |
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
