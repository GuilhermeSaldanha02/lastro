# QA.md — Registro Incremental de Verificação

Registro durável de verificação. **Um item verificado num commit (`SHA`) continua válido enquanto nenhum arquivo da área dele mudar.** Antes de auditar, calcule o que ficou obsoleto e rode só isso:

```bash
node scripts/qa-obsoletos.mjs
```

Regras completas: skill `qa-registro`. Prova crua obrigatória em `qa/evidencias/<ID>/` — `print.png`, `console.txt`, `rede.txt`.

---

## 1. Mapa de Áreas

| Área | Caminhos (glob, separados por espaço) |
|---|---|
| auth | src/app/login/** src/app/auth/** src/lib/supabase/** |
| treino | src/app/treino/** src/lib/dados/** src/lib/rota-de-retorno.ts |
| analise | src/app/analise/** src/lib/analise/** src/app/api/** src/lib/dados/parecer.ts src/lib/pdf/** src/app/api/parecer/** src/components/pareceres-salvos.tsx src/components/parecer.tsx |
| catalogo | src/app/catalogo/** |
| coach | src/app/coach/** |
| perfil | src/app/perfil/** |
| ajustes | src/app/ajustes/** src/lib/anilhas.ts |
| offline | src/lib/offline/** public/sw.js |
| visual | src/app/tokens.css src/app/sistema.css src/app/globals.css src/app/layout.tsx |
| i18n | src/lib/texto/** |
| e2e | e2e/** playwright.config.ts src/components/treino-detalhe.tsx src/components/formulario-serie.tsx src/components/analise-interativa.tsx src/components/coach-interativo.tsx src/app/catalogo/** |

> **`visual` e `i18n` são transversais de propósito.** Mudança de token invalida todo item cuja prova é visual, em qualquer tela; mudança em `src/lib/texto/i18n.ts` invalida a cobertura de tradução de qualquer tela, não só da área da rota — se um item depende de aparência ou de idioma, registre-o na área correspondente, não só na área da rota. `src/lib/texto/` saiu de `analise` (2026-08-31) — era mapeamento herdado de quando o dicionário nasceu ali, mas cobre o app inteiro.

---

## 2. Estado por Item

| ID | Área | O que prova | Resultado | SHA | Data | Evidência |
|---|---|---|---|---|---|---|
| TR-01 | treino | Cronômetro de treino congela no finalizar, cancela descanso e persiste | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/TR-01/ |
| VS-01 | visual | Renderização e contraste do tema Obsidian Ouro (Padrão) | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/VS-01/ |
| VS-02 | visual | Renderização e contraste do tema Marfim & Ouro Imperial (Claro) | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/VS-02/ |
| AN-01 | analise | Painel de Análise Semanal com métricas e gráficos carregados | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/AN-01/ |
| CT-01 | catalogo | Catálogo de exercícios com busca, filtros de grupo e preview 3D | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/CT-01/ |
| CH-01 | coach | Interface de Coach IA operacional e responsiva | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/CH-01/ |
| PF-01 | perfil | Perfil do atleta com seletor de idioma e dados do usuário | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/PF-01/ |
| AJ-01 | ajustes | Tela de ajustes com seletor interativo dos 7 temas e anilhas | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/AJ-01/ |
| AU-01 | auth | Tela de login, formulário e controle de sessão | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/AU-01/ |
| OF-01 | offline | Registro do Service Worker e persistência de dados offline | ALEGADO | 14edc71 | 2026-08-26 | qa/evidencias/OF-01/ |
| OF-02 | offline | Fila de sincronização (outbox) não trava para sempre quando um item é permanentemente inválido, não só sem rede | PASSOU | c334034 | 2026-08-28 | qa/evidencias/OF-02/ |
| VS-03 | visual | Cabeçalho fixo do treino não sobrepõe conteúdo interativo em viewport curto (teclado aberto) | PASSOU (auditoria independente #2 confirmou: `--lastro-timer-topo-altura` bate com a altura real nos dois estados, 65px parado e 125px/124.7px com descanso ativo; clique em "Peito" e "Continuar" funcionou em 390×500) | 7830329 | 2026-08-28 | qa/evidencias/VS-03/auditoria-independente-2/ |
| TR-02 | treino | Recarregar a tela do treino reflete o estado real do banco logo após uma série sincronizar | PASSOU | c334034 | 2026-08-28 | qa/evidencias/TR-02/ |
| TR-03 | treino | Fluxo completo: criar modelo com 2+ exercícios → iniciar treino a partir dele → registrar série de cada exercício, todos com atalho de plano visível até o fim | PASSOU | c334034 | 2026-08-28 | qa/evidencias/TR-03/ |
| VS-04 | visual | Avatar do cabeçalho mostra a foto/inicial real do usuário em toda página, nunca o placeholder cravado | PASSOU | c334034 | 2026-08-28 | qa/evidencias/VS-04/ |
| TR-04 | treino | Recarregar um treino já finalizado não gera erro de hidratação do React | PASSOU | fdf7b97 | 2026-08-28 | qa/evidencias/TR-04/auditoria-independente/ |
| OF-03 | offline | Fila offline drena em qualquer tela do app quando a rede volta, não só dentro de `/treino/[id]`; sem corrida entre o sincronizador global e o local quando os dois coexistem na mesma tela | PASSOU (auditoria independente, 2 rodadas: 1ª reprovou por corrida real entre os dois listeners causando descarte indevido pra `db.falhas`; corrigido com mutex de módulo; 2ª rodada confirmou, mesmo cenário, sem concorrência) | d810293 | 2026-08-30 | qa/evidencias/OF-03/auditoria-independente/ |
| VS-05 | visual | Barra de envio do Coach (`.barra-conversa`) muda de cor com o tema; sem CSS duplicado; alvo de toque de 48px preservado no input/botão/`.botao-texto` | PASSOU COM RESSALVA (auditoria independente confirmou fundo/cor mudando entre tema Padrão e Claro, `min-height`/`min-width` 48px nos dois; achou legibilidade marginal do input contra o container no tema Claro — mesmo padrão já existente em `.nav`, não é regressão desta PR, mas vale conferência visual do dono) | ceac26e | 2026-08-31 | qa/evidencias/VS-05/auditoria-independente/ |
| IX-01 | i18n | Toda chamada `t(..., idioma)` do app tem entrada no `DICIONARIO`, em EN/ES real de app de treino (não tradução textbook) | PASSOU (auditoria independente achou 3 chamadas multi-linha que o script de cobertura tinha perdido — corrigidas; verificado ao vivo, EN, em `/ajustes/relatorios` e `/catalogo/[id]`, as 3 strings corrigidas e nenhuma outra em português cru) | (branch `fix/i18n-vocabulario-real`, ainda não mergeada) | 2026-08-31 | qa/evidencias/IX-01/auditoria-independente/ |
| AJ-02 | ajustes | Excluir a própria conta (C5): confirmação inline (nunca `window.confirm`), exclusão real, sessão encerrada, cascade limpo | PASSOU (verificado ao vivo: usuário QA clicou em "Delete account" duas vezes — abrir confirmação, confirmar —, app redirecionou pra `/login`, banco confirmou `sobrou: 0`) | 8b65601 | 2026-08-31 | qa/evidencias/AJ-02/ |
| E2E-01 | e2e | J1-Treino (PRD §6): registrar série, ficar offline, registrar outra, voltar online e confirmar sincronização + persistência real no servidor | PASSOU (`npm run e2e`, 2 rodadas seguidas verdes contra o Supabase hospedado, usuário QA descartável criado e apagado por spec) | 4ad513c | 2026-08-31 | qa/evidencias/E2E-01/ |
| E2E-02 | e2e | J2-Análise (PRD §6): botão "Solicitar Análise" chama `/api/analise` com a pergunta certa e renderiza o parecer que a rota devolve | PASSOU (`/api/analise` interceptado no navegador — Gemini real nunca chamada; histórico de 4 semanas fechadas semeado via usuário autenticado, não admin — ver achado de infraestrutura na evidência) | 4ad513c | 2026-08-31 | qa/evidencias/E2E-01/ |
| E2E-03 | e2e | J3-Dúvida (PRD §6): consulta ao catálogo (dado real) + fallback pro coach 24h quando a dúvida não é sobre um exercício específico | PASSOU (`/api/coach` interceptado no navegador — mesma razão do E2E-02) | 4ad513c | 2026-08-31 | qa/evidencias/E2E-01/ |
| PDF-01 | analise | Salvar parecer (opt-in), listar em /ajustes/relatorios, baixar como PDF (texto selecionável), excluir com confirmação inline | PASSOU (auditoria independente confirmou o fluxo; a ressalva original — `aviso_falha_interpretativa` sumindo no PDF — foi corrigida em seguida: o PDF agora mostra o mesmo aviso da tela, verificado ao vivo com usuário QA descartável e `pdftotext`) | 095b15d | 2026-09-01 | qa/evidencias/PDF-01/ |
| TR-05 | treino | Foco/divisão do sticker pós-treino usa o `grupo_muscular_primario` real do catálogo, não mais um chute por palavra-chave no nome do exercício | PASSOU COM RESSALVA (auditoria independente, worktree e usuário QA próprios, usou um SEGUNDO exercício de pernas — "Hack squat" — que também escapava do método antigo; confirmou a causa raiz lendo o código e reproduziu `focoOuDivisao: "PERNAS"` chamando a função de produção real com dado real do banco. Ressalva: não conseguiu logar pela UI do navegador naquele worktree específico — achado à parte, não relacionado a este bug, registrado para investigação futura — então fechou a cadeia de prova pela função direta em vez do pixel final do sticker) | (branch `fix/foco-sticker-grupo-real`, ainda não mergeada) | 2026-09-01 | qa/evidencias/TR-05/ |

---

## 3. Automatizados

| ID | Spec |
|---|---|
| TR-01 | scripts/executar-qa-suite.mjs |
| VS-01 | scripts/executar-qa-suite.mjs |
| VS-02 | scripts/executar-qa-suite.mjs |
| AN-01 | scripts/executar-qa-suite.mjs |
| CT-01 | scripts/executar-qa-suite.mjs |
| CH-01 | scripts/executar-qa-suite.mjs |
| PF-01 | scripts/executar-qa-suite.mjs |
| AJ-01 | scripts/executar-qa-suite.mjs |
| AU-01 | scripts/executar-qa-suite.mjs |
| OF-01 | scripts/executar-qa-suite.mjs |


