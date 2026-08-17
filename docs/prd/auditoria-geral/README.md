# Auditoria QA geral — `lastro`

Auditoria de verificação sobre o app inteiro (não é feature nova — pedido direto do dono, 2026-08-17). Protocolo de 5 fases, ver `DECISIONS.md` 2026-08-17 e `qa-verification-protocol` (memória do controller).

## Regra de ouro

Nenhum item deste plano fecha com check marcado por quem implementou o código. Cada item só fecha com **print da tela** + **saída crua do console** + **saída crua da rede** anexados pelo subagente de QA que o executou ao vivo. Mock não conta como prova. Item reprovado descreve o passo exato de reprodução.

## Ferramenta

`mcp__Claude_Browser__*` (painel Browser interno), **não** o MCP do Playwright — instalado nesta mesma sessão mas indisponível por ter sido registrado depois do início da conversa (`ToolSearch` não retornou `mcp__playwright__*`; ver `DECISIONS.md` 2026-08-17). Mesmo princípio de prova, ferramenta diferente. Sessões futuras devem preferir Playwright se disponível.

## Ambiente

- `npm run dev` rodando, app em `http://localhost:3000`.
- Viewport padrão: **390×844** (alvo principal, ESCOPO §3). Stress: **360×640** (piso realista). Desktop/1280×800 **fora de escopo** — CSS responsivo foi cancelado por decisão do dono (`DECISIONS.md` 2026-08-07); não reportar como bug layout largo.
- Tema: só existe tema escuro (D5) — não há alternância a testar.

## Fixture — usuário de teste isolado

Nunca dado do dono. Criado no Supabase real via `scripts/qa-treino-helper.sh` (mesmo mecanismo do agente `qa-treino`).

- E-mail: `qa-audit-geral2@teste.lastro.invalid`
- Senha: `SenhaTeste123!`
- UUID: `fe8983b8-dccc-4160-b010-287d3b0008a5`
- Dado seedado via SQL direto (autorizado em `DECISIONS.md` 2026-08-06 — a UI não permite treino com data retroativa): **15 treinos, 5 semanas, 128 séries**. Supino reto com barra estagnado em 50kg (testa regra de platô); Agachamento livre progredindo 70→85kg (testa gráfico subindo); Rosca direta unilateral só nas últimas 4 sessões (testa exercício "novo").
- **Limpeza obrigatória ao final da auditoria inteira** (não por arquivo/área): `./scripts/qa-treino-helper.sh limpar-usuario qa-audit-geral2@teste.lastro.invalid`, confirmar `sobrou: 0`. Enquanto a auditoria não estiver 100% fechada, o usuário continua vivo — não limpar no meio.

## Escopo por arquivo (uma sessão de subagente por arquivo)

| Arquivo | Área | Itens |
|---|---|---|
| `01-entrada-auth.md` | `/login`, `/`, `/auth/callback`, guard do proxy | ~14 |
| `02-home-lista-treinos.md` | `/` (home), `/treino` (lista) | ~11 |
| `03-registro-serie.md` | `/treino/[id]` — formulário de registrar série, "repetir última", offline | ~20 |
| `04-treino-detalhe-crud.md` | `/treino/[id]` — editar/excluir série inline, modo de edição, excluir treino | ~18 |
| `05-catalogo.md` | `/catalogo`, `/catalogo/[id]` | ~10 |
| `06-analise-progressao.md` | `/analise`, gráfico de progressão, `/api/analise`, `/api/progressao` | ~16 |
| `07-ajustes-anilhas-modelos.md` | `/ajustes`, `/ajustes/anilhas`, `/ajustes/modelos`, `/ajustes/modelos/novo`, folhas `@modal` | ~20 |
| `08-perfil-coach.md` | `/perfil`, `/coach` | ~14 |
| `09-transversais.md` | voltar do navegador, reload, duplo clique, foco/teclado, 360px, sem sessão | ~13 |

Total ~136 itens.

## O que fica explicitamente fora (não é item aberto, é decisão registrada)

- **Rede offline de verdade** (D6, fila outbox): `mcp__Claude_Browser__*` não tem controle de condição de rede/offline. Todo item que dependeria disso é marcado `[NÃO COBERTO]` no arquivo correspondente, não deixado como checkbox pendente — é limitação de ferramenta, registrada, não trabalho esquecido.
- **Qualidade do parecer da IA** (convence/não convence) — é o papel do agente `qa-treino` (dogfooding de persona), não desta auditoria mecânica. Aqui testamos estado de loading/erro/sucesso da chamada, não o conteúdo do texto gerado.
- **CSS responsivo desktop** — cancelado por decisão, não é regressão.
- **Botão físico de voltar do Android** — gap já conhecido desde H1 (só back do navegador desktop/mobile via Browser pane é testável aqui).

## Fase 5 — antes de qualquer coisa pública

Se a auditoria não achar nada: não há PR, o entregável é este plano preenchido + atualização de `PROGRESS.md`. Se achar bugs: **um branch + PR por correção**, branch criado antes da primeira edição — nunca uma PR mega misturando N correções. Screenshots como assets de release do GitHub **só depois de confirmar com o dono** (é mais visível que PR, não coberto pela autorização padrão de "mergeia direto") e só do usuário de teste isolado, nunca dado real.
