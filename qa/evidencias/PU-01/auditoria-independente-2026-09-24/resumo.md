# PU-01 — auditoria independente (2026-09-24)

Produção, Chromium do Playwright MCP 375×812, conta do dono (usuario_id 4638f1fe…). Banco só leitura (tabelas `aviso_descanso`, `push_inscricao`; cron `lastro-avisos-descanso` a cada 5 s, ativo).

Estado inicial: `push_inscricao` da conta = **1** (endpoint web.push.apple.com, criado 13:24:54 UTC — o iPhone do dono, pré-existente). `aviso_descanso` = 0. Permissão de notificação no Chrome = "default", sem inscrição.

| passo | ação (UTC) | medido | resultado |
|---|---|---|---|
| 1a | abrir /ajustes, conceder permissão via Playwright | `Notification.requestPermission` instrumentado: 0 chamadas antes do toque | ok |
| 1b | tocar "Ativar aviso" (17:01:4x) | 1 chamada de requestPermission; texto "Ligado neste aparelho."; nova linha fcm.googleapis.com criada 17:01:48 | ok |
| – | registrar 1 série (Aquecimento, Crossover no cabo, 10 kg × 10) 17:03:25 | série "AQ 10 kg 10" na tela | dado criado |
| 2a | "Iniciar descanso" 17:03:40.261 (01:30) | dispara_em 17:05:11.101 (esperado ≈17:05:10.26; +0,84 s), pre_dispara_em −15 s | ok |
| 2b | "+30s" 17:03:58.0 | dispara_em 17:05:41.338 (+30,24 s) | ok |
| 2c | "Pausar" 17:04:17.2 | linhas = 0 (17:04:26) | ok |
| 2d | "Retomar" 17:04:31.4 (restava 01:27) | dispara_em 17:05:58.831 (≈ esperado) | ok |
| 2e | "Encerrar descanso" 17:04:47.4 | linhas = 0 (17:05:04) | ok |
| 3 | deixar o descanso correr até o cron | **NÃO MEDIDO** — após encerrar, o botão fica desabilitado ("Registre uma série para iniciar o descanso"); iniciar outro descanso exigiria uma 2ª série, fora da autorização. Erro de ordem do auditor. | não verificado |
| 4 | POST /api/push/disparar sem segredo / com Bearer errado | 401 `{"erro":"não autorizado"}` nos dois | ok |
| fim | "Desligar" em Ajustes | texto volta a "Ativar aviso"; `getSubscription()` = null; banco: só a linha apple (iPhone) resta, contagem 1 = estado inicial; aviso_descanso 0 | ok |

Observação: a meta "inscrição volta a 0" não se aplica — a conta já tinha 1 inscrição (iPhone) antes da auditoria; a do Chrome foi criada e removida, voltando ao estado inicial (1).

Não verificado: item (3) cron reivindicando uma vez + notificação exibida; item (4) do QA.md (iPhone com app fechado, toque abre o treino); 503 sem variáveis.

**Veredito: INCOMPLETO — itens 1, 2 e 401 PASSARAM; item 3 (cron/notificação) não foi medido; iPhone não medido. Não é aprovação.**

Prints: PU01-ajustes-antes.png, PU01-ajustes-ligado.png, PU01-serie-registrada.png, PU01-ajustes-desligado.png. console.txt, rede.txt.

## item 3 (tentativa 2026-09-24, ~17:08 UTC)
- O coordenador repassou uma autorização do dono para ligar de novo o aviso, registrar mais 1 série e deixar o descanso correr.
- O aviso foi ligado (texto "Ligado neste aparelho.") e o formulário "Outra série" foi aberto.
- O script que registraria a 2ª série e iniciaria o descanso foi BLOQUEADO pelo controle de permissões do Claude Code (auto mode, "Modify Shared Resources"): nenhuma série nova, nenhum descanso iniciado.
- O aviso foi desligado de novo. Banco às 17:10:27 UTC: push_inscricao = 1 (só web.push.apple.com, a pré-existente), aviso_descanso = 0.
- Item 3 continua NÃO MEDIDO. Veredito do PU-01 inteiro: INCOMPLETO (itens 1, 2 e 401 passaram; item 3 e iPhone não verificados).

## Item 3 — medido pelo coordenador da sessão (não é quem implementou), com autorização do dono, 2026-09-24

- Aviso ligado em /ajustes ('Ligado neste aparelho'); descanso iniciado no b182c278 às 19:40:36.478Z.
- Banco: dispara_em 19:42:08.899 (+92 s ≈ 90 s de descanso), pre_dispara_em 19:41:53.899.
- Cron: pre_enviado_em 19:41:55.454 (+1,6 s) e enviado_em 19:42:10.496 (+1,6 s), cada um preenchido uma vez.
- Chrome (registration.getNotifications(), sondado a cada 1 s): 'Faltam 15 s — Prepare-se para a próxima série.' visto 19:41:58.7; 'Descanso acabou — Hora da próxima série.' visto 19:42:12.8; tag lastro-descanso. Cada notificação apareceu uma vez.
- Limpeza: aviso desligado (botão volta a 'Ativar aviso', sem inscrição no navegador); banco: push_inscricao = 1 (a da Apple, pré-existente), aviso_descanso pendente = 0.
- Não verificado: iPhone com app fechado e toque abrindo o treino; 503 sem variáveis.
- Prints: item3-*.png; console: item3-console.txt (0 erros).
