# Backlog do lastro — arquivo único

> **Único lugar de pendências do projeto** (decisão do dono, 2026-10-01). Nenhum
> outro arquivo guarda lista de tarefas: `PROGRESS.md` guarda só o estado da
> sessão e o histórico; `QA.md` guarda o registro de testes; `DECISIONS.md`
> guarda o porquê. Item novo entra aqui; item feito vira uma linha em "Feito".
>
> Base: `main` em `e2f74d4` (2026-10-01). Confira com `git log --oneline -1`.

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

## 2. Código e QA — o agente faz

| ID | O que é | Status | Importância |
|---|---|---|---|
| TR-17 | Registrar 3 exercícios, apagar o 2º, adicionar um 4º e readicionar o apagado quebra o treino. Causa: `registrarSerie` em `treino-detalhe.tsx` usa `ordem = series.length + 1`, e apagar repete a `ordem`. Correção: maior ordem + 1, desempate por `criado_em` no carregador (`lib/dados/treino.ts`). Teste unitário + e2e do roteiro do dono. Na mesma PR: "Outra série" abre direto a lista de exercícios. | A FAZER | Alta |
| QA-M3 | QA em produção da M3 na conta de personal do Chrome: Home com "Lastro percebeu", bloco do pós-treino, página do exercício, pergunta de grupo no Coach conferindo `coach_contador_diario` sem `uso_ia` subir. | A FAZER | Alta |
| QA-TR-TRISTE | QA de caminho triste de adicionar e apagar exercício em `/treino/[id]`. Depois do TR-17. | A FAZER | Média |
| LIMPEZA-PERSONAL | Conta de personal: apagar o treino de teste `1e66619f-4ce3-4883-9641-f263fbe74627` e voltar a conta de TREINO para TRABALHO em Ajustes. | A FAZER | Baixa |
| FAXINA-1 | Acento de "Elevação lateral com halteres" no banco e em `exercicios-midia.json` (os dois casam pelo nome). | A FAZER | Baixa |
| FAXINA-2 | Apagar branches remotas já mergeadas, conferindo uma a uma. | A FAZER | Baixa |
| FAXINA-3 | Tirar a senha de `scripts/importar-102-gifs.mjs` e ler de variável de ambiente (o dono troca a senha no Supabase). | A FAZER | Alta |
| AUD-IND | Auditoria independente (outro agente, contexto limpo) do que está `ALEGADO`: TON-01, UX-03 (cobertura "sem medir" da §4c de `docs/qualidade/ux-03-auditoria-2026-09-26.md`), TR-16, e os `ALEGADO` do `QA.md` (TR-11…TR-15, OF-09, PU-01, LG-12, PE-06). | A FAZER | Média |
| DOC-03 | Reconciliar o `DESIGN.md` (decisões, pendências e medições antigas misturadas). Depois da AUD-IND. | A FAZER | Baixa |
| QA-02 | Matriz Playwright aluno (treino livre e por modelo) e personal (modo trabalho e alternância), caminho normal e triste. A 2ª conta já existe. | A FAZER | Média |
| PE-01…09 | Auditar as telas de personal com a conta de personal. | A FAZER | Média |
| OF-04, OF-06 | QA que alterna duas contas na mesma sessão de navegador. | A FAZER | Baixa |
| LG-05…08 | Linguagem das telas de personal (`docs/qualidade/matriz-linguagem.md`, várias células PENDENTE também em LG-01…LG-10). | A FAZER | Baixa |
| TR-03 | Treino iniciado por modelo. Autorizado uma vez na conta de personal. | A FAZER | Baixa |
| AN-03, AN-04 | Reproduzir na conta de personal (gasta ~3 unidades da cota do dia). Autorizado uma vez. | A FAZER | Baixa |
| POS-ROTULO | O rótulo do bloco "volume vs. seu padrão" do pós-treino quebra em 2 linhas a 375 px. Encurtar. | A FAZER | Baixa |
| EST-DURACAO | Estudo: diferença entre a duração até a última série e `duracao_segundos` no relatório pós-treino. Esperar ~3 semanas de dado (hoje só 2 sessões têm o campo) e trazer opções. | A FAZER, sem prazo | Baixa |

## 3. AN-08 — motor determinístico (o que falta)

Texto original do dono: `docs/MISSAO-MOTOR-DETERMINISTICO.md` (a seção indicada).
Estudo aprovado: `docs/estudos/AN-08-motor-deterministico-estudo.md`. Cada
milestone só começa com autorização do dono.

| ID | O que é | Status | Importância |
|---|---|---|---|
| AN-08.A1 | **Check-in de recuperação.** Registro rápido de **sono, energia, dor muscular e estresse**, escala simples, **também em dia sem treino**. Dá contexto aos números; não vira diário médico, não diagnostica, não prescreve. Visível ao aluno e ao personal com vínculo. Feito na academia, então entra na fila offline (Dexie) como a série. Tabela nova `checkin`. Exige revisão da Política (junto com POL-01) e novo aceite de todos. (§13) | A FAZER, depois da faxina e da auditoria | Média |
| POL-01 | A Política (`lib/legal/documentos.ts`) diz que todo o Coach é IA; desde a M1 parte é calculada pelo lastro. Ajustar na mesma revisão do A1 (mudar `VERSAO_DOCUMENTOS` pede novo aceite). | A FAZER, com o A1 | Baixa |
| AN-08.A2 | **Prontidão.** Leitura rápida do check-in. Proposta do estudo: os sinais crus contra a média da própria pessoa, sem índice único 0–100 inventado. (§14) | DECIDIR, depende do A1 | Baixa |
| AN-08.A3 | **Recuperação × desempenho.** Coincidência, nunca causa ("a queda coincidiu com sono abaixo da sua média"). Só com ~8 semanas de check-in. (§15) | DECIDIR, depende do A1 | Baixa |
| AN-08.B3 | **Explicar mudança de desempenho** juntando e1RM, frequência, volume e recuperação como evidência, sem afirmar causa. (§18) | DECIDIR | Baixa |
| AN-08.F0-INSIGHT | `Insight` como dado estruturado antes de virar texto. Parcial: a Home e o pós-treino usam o detector, mas a fila do personal não foi generalizada. (§9) | DECIDIR | Baixa |
| AN-08.F0-MATRIZ | Matriz Gemini × determinístico em níveis 0–4. (§3–§6) | CONFERIR: provavelmente coberta pela Entrega 2 do estudo | Baixa |
| AN-08.C2 (resto) | Visualização de consistência: semanas abaixo da meta, tendência de consistência. Calendário (UX-02), semanas seguidas e meta cumprida já existem. (§20) | DECIDIR | Baixa |
| AN-08.F0-CACHE | Cache de agregados. | CONGELADO (sem gargalo) | — |
| AN-08.D1 | Peso corporal. | CONGELADO (conflita com o PRD §5) | — |
| AN-08.D2 | Health Connect / Apple Health. | CONGELADO | — |

## 4. Com o dono

| ID | O que falta | Importância |
|---|---|---|
| SMTP | Configurar o Brevo grátis no Supabase (o SMTP padrão limita e-mails por hora: cadastro e recuperação). Antes de divulgar. | Alta |
| CALLBACK | Conferir `https://lastro-pi.vercel.app/auth/callback` na lista de redirect do Supabase Auth e testar uma recuperação de senha. | Alta |
| SENHA-QA | Trocar a senha da conta QA (estava em `scripts/importar-102-gifs.mjs`). | Alta |
| IPHONE | Testar o aviso de fim do descanso (web push) no iPhone, com o app na tela de início. | Média |
| TESTE-DONO | Apagar os treinos de teste da conta do dono: `aa0cd9e6…` e `9db03743…`. | Baixa |
| GEMINI | Segue no plano gratuito (20/dia). Revisitar quando divulgar ou quando o contador da M3 mostrar aperto. | Média |
| DICAS | Revisar as dicas de execução (escritas pelo Claude) e marcar `dica_execucao_origem = 'humano'` nas aprovadas. Critério A9 do PRD. | Baixa |
| BACKUP-BANCO | Apagar `supabase_migrations.backup_20260905_antes_repair` quando quiser. | Baixa |
| P1 | Perguntar ao personal P1: o que é "mensagem padrão" (link pronto ou algo automático) e quantos alunos tem e quantos perdeu em 6 meses. | Baixa |

## 5. Itens antigos — conferir e decidir se continuam

Trazidos do `PROGRESS.md` (seções "Backlog", "Pendências do DONO", "Declarado
como NÃO coberto" e "Pendências consolidadas", removidas em 2026-10-01). Ainda
não conferidos contra o código.

| ID | O que é | Status | Importância |
|---|---|---|---|
| ANT-01 | Faixa de referência de séries semanais por grupo muscular e `N` semanas de estagnação: o PRD §10 ainda marca TODO. Exige fonte primária (assunto de saúde). | CONFERIR | Média |
| ANT-02 | Módulo Personal só em pt-BR: strings sem en/es no `i18n.ts`. | CONFERIR | Média |
| ANT-03 | Ciclo de sync offline em celular real: registrar em modo avião, reconectar, conferir no PC (tarefa 2.3, nunca feito em aparelho). | CONFERIR | Média |
| ANT-04 | Fase 6, integração final: revisão integral do Inspetor, todas as fitness functions de uma vez, gate visual em celular físico. Os e2e das 3 jornadas já existem. | DECIDIR | Média |
| ANT-05 | Comparativo "o parecer disse × o que foi feito". Precisa de mais pareceres salvos. | DECIDIR | Baixa |
| ANT-06 | Medida do módulo Personal: consulta "o grupo alertado recebeu estímulo na semana seguinte?" (`alerta_personal` já grava). Só com uso real. | DECIDIR | Baixa |
| ANT-07 | Esconder a prescrição sob vínculo (PRD §11.4.2). Estado vazio tem portão visual. | DECIDIR | Baixa |
| ANT-08 | "Queda de frequência" do Personal foi entregue como queda de volume; frequência ao pé da letra não foi feita (`DECISIONS.md` 2026-09-11 (4)). | DECIDIR | Baixa |
| ANT-09 | O personal não tem como encerrar vínculo (só o aluno revoga, como a §11.4.3 descreve). Ninguém pediu. | DECIDIR | Baixa |
| ANT-10 | Coluna "antes 16 × 9" por série (padrão Hevy/Strong). Exige consulta ao histórico do exercício. Nunca decidida. | DECIDIR | Baixa |
| ANT-11 | Relatório pós-treino: `metricas-treino.ts` conta exercício só de aquecimento em `totalExercicios`. | CONFERIR | Baixa |
| ANT-12 | Relatório pós-treino com emojis (🏆, 🔥) em `relatorio-pos-treino.tsx`. | CONFERIR | Baixa |
| ANT-13 | Strings do timer sem en/es no `i18n.ts`. | CONFERIR | Baixa |
| ANT-14 | Hydration mismatch no console ao trocar de tema (`data-tema` diverge servidor/cliente). | CONFERIR | Baixa |
| ANT-15 | Os 5× `404` da Gemini de 27–29/ago. Investigar só se reaparecerem. | DECIDIR | Baixa |
| ANT-16 | Usuário QA `qa-lastro-parecer@example.com` (seedado em agosto) pode ainda existir no banco. | CONFERIR | Baixa |
| ANT-17 | `QA.md` ainda marca REPROVOU em PE-07, OF-06, VS-07 e AN-05; o backlog antigo dava VS-07 e AN-05 como resolvidos. Reconciliar o `QA.md`. | CONFERIR | Baixa |
| ANT-18 | Barra superior fixa e PWA abrindo em Início: faltava conferência em aparelho com o PWA instalado. | CONFERIR | Baixa |

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
- **Treino:** TR-06…TR-15, OF-09, aviso de descanso por web push.
- **QA-01:** CT-02, VS-06/07, AJ-03/04, AN-02/05/06, PF-01 resolvidos ou graduados pelo e2e.
- **Docs:** DOC-01, DOC-02, PU-02; arquivo único de backlog (este, 2026-10-01).

## 8. Arquivos removidos na unificação (2026-10-01)

Apagados para não haver mais de uma lista de pendências. Recuperar com
`git checkout e2f74d4 -- <caminho>`:

- `docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` (UX-02 e UX-03 feitas pelo Claude)
- `docs/RELATORIO-ESTADO-PROJETO.md` (retrato de 31/08)
- `docs/historico/BACKLOG-PROXIMA-FASE.md`, `BACKLOG-REDESENHO.md`, `BACKLOG-TESTE-APARELHO.md` (todos fechados)
- `docs/PROMPT-PROXIMO-CHAT.md` (local, fora do git; prompt de 14/09)
