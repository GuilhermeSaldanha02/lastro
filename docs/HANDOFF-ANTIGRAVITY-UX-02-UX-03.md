# Handoff para o Antigravity (Gemini) — UX-02 e UX-03

> Escrito em 2026-09-26 pelo Claude, a pedido do dono. **Você vai executar isto sozinho, sem ter visto a conversa que gerou o projeto.** Tudo o que precisa saber está aqui ou nos arquivos apontados. Se algo faltar, **pergunte ao dono; não invente**.
>
> Recomendação registrada no backlog: estas duas tarefas rendem mais **depois que o lastro tiver gente real usando**, porque aí o dono decide com dado onde está o atrito. Fazer agora é permitido, só menos informado.

## 0. Antes de tocar em qualquer coisa

1. `git log --oneline -1` e `git status`. Trabalhe **sempre em branch nova**, nunca direto em `main`. Uma PR por tarefa.
2. Leia, nesta ordem: `AGENTS.md` (as §5, §7, §8 e §9 valem inteiras), `PROGRESS.md` (bloco ESTADO ATUAL), `DECISIONS.md` (últimas ~10 entradas), `DESIGN.md`, `docs/BACKLOG-CANONICO.md`.
3. **Produção:** `https://lastro-pi.vercel.app`. QA visual é feito **contra a Vercel**, nunca localhost e nunca preview. **Nunca use a conta pessoal do dono** nem credencial salva. Se precisar de conta, o dono cria por fora ou você usa os testes e2e (que criam e apagam contas descartáveis sozinhos).
4. **Nunca crie nem apague dado da conta do dono** sem autorização explícita, a cada vez.
5. Migração de banco: só pelo MCP do Supabase (`apply_migration`); depois confira `list_migrations` e **renomeie o arquivo local** para a versão que o MCP registrou. Estas duas tarefas provavelmente **não precisam de migração**.
6. Idioma do app: **português, inglês e espanhol**. Todo texto de tela novo entra no dicionário `src/lib/texto/i18n.ts` (en/es) e passa em `node scripts/verificar-textos-i18n.mjs`. Responda ao dono em **português (PT-BR)**.

## 1. Regras do projeto que já causaram retrabalho

- **Alegação não é prova.** "Ficou bom" não fecha tarefa. Abra no navegador, em **375×812**, e olhe. Print feito por quem implementou entra no `QA.md` como `ALEGADO`; só vira `PASSOU` depois de **outro agente** auditar em contexto limpo. Não se auto-aprove.
- **Nunca invente métrica ou dado de negócio.** Se a tela precisa de um número que o app não calcula, mostre "—" ou não mostre. Pergunte ao dono.
- **Nada de valor de design cravado em componente.** Cor, espaço e tipografia vêm dos tokens (`src/app/tokens.css`). Antes de escolher fonte, cor, sombra ou espaçamento em tela nova, leia `DESIGN.md` e a skill/portão visual do projeto: **a direção visual é escolha do dono**, com opções renderizadas, não sua.
- **Pedido estrutural não vira retoque.** UX-02 redesenha uma tela: desenhe a composição inteira antes de fatiar.
- **Menos código é melhor código.** Procure o que já existe antes de escrever.
- **Erro de tela se lê por `.aviso-erro`**, nunca por `getByRole("alert")` (o Next injeta um `role="alert"` em toda página).
- **Server Action em produção não devolve `error.message`**; informação que o cliente precisa ler volta como valor de retorno.
- **PWA:** rota pública nova entra em `ROTAS_ISENTAS_DE_FORCAR_INICIO` (`src/app/layout.tsx`); rota privada nova entra em `PREFIXOS_PRIVADOS` (`src/proxy.ts`). **Conta descartável de e2e nasce com onboarding e aceite dos Termos já feitos** (`e2e/helpers/usuario-descartavel.ts`).
- **Merge em `main` cancela o e2e disparado à mão** (`concurrency` do `ci.yml`). Espere terminar.

## 2. Como verificar (política de testes, `AGENTS.md` §9)

Antes de abrir a PR de código:

```bash
npx tsc --noEmit && npm test && npx eslint . && node scripts/verificar-textos-i18n.mjs && npm run build
```

O CI (`verificar`) repete isso; verde é condição de merge. O e2e completo é **manual**: `gh workflow run ci.yml --ref main` (~20 min, contas descartáveis no banco de produção, Gemini mockada). Dispare depois do merge, num marco de integração, e leia `gh run view <id> --log`. Não use `npm run e2e` na sua máquina contra produção sem o dono saber.

Se o Bash do agente quebrar por causa do hook do `rtk`, use PowerShell.

---

## 3. UX-02 — Histórico de `/treino` (esforço ALTO)

**Decisão do dono (`docs/BACKLOG-CANONICO.md`, P1):** "Histórico de `/treino`: separar treino de hoje e transformar cartões repetidos em linha cronológica mensal com data, grupos, volume e séries — sem inventar métricas. Implementar com estados vazio e filtro."

**Contexto técnico**
- Tela: `src/app/treino/page.tsx` (casca de servidor) e `src/components/lista-treinos.tsx` (cliente; hoje um cartão por treino com `dataFormatada`, `totalSeries`, `gruposMusculares`, `volumeKg`, e `ExcluirTreino`).
- Dados: `listarTreinos` em `src/lib/dados/treino.ts`. Métricas de sessão já existem em `src/lib/dados/metricas-treino.ts` (`calcularMetricasSessao`). **Reaproveite; não recalcule volume por conta própria.** Aquecimento não entra em volume nem em contagem de séries (regra da Análise).
- Desde 2026-09-24 um treino pode ser finalizado e **o mesmo dia pode ter mais de um treino** (`DECISIONS.md` 2026-09-24 (3)). "Treino de hoje" precisa tratar isso.
- O modo "trabalho" da conta de personal não vê `/treino` (guardas em `src/lib/dados/casca.ts`).
- Regra de exclusão: excluir treino é **online-only** e pede **confirmação inline**, nunca `window.confirm()`.
- O app é usado no celular, dentro da academia, com uma mão, **sinal ruim**: a lista não pode exigir rede para abrir se hoje já não exige.

**O que entregar**
1. "Treino de hoje" separado no topo (em andamento e/ou finalizados hoje), com a ação principal ao alcance do polegar (Modo Bancada, `DESIGN.md` §3.5).
2. Abaixo, o histórico como **linha do tempo agrupada por mês** (cabeçalho do mês), cada linha com data, grupos musculares, volume e séries. Sem cartão repetido enorme por treino.
3. **Estado vazio** (conta sem treino) que explica o que fazer, sem inventar nada.
4. **Filtro** (o dono pediu; escolha o mais simples que sirva, por exemplo grupo muscular ou período, e justifique a escolha para ele antes de construir).
5. Manter excluir treino com confirmação, e o comportamento offline atual.
6. Todos os textos em pt/en/es.

**Não fazer:** métrica nova que o app não calcula (calorias, "intensidade", comparação com outros usuários); mudar a Análise; mexer em `src/lib/analise/`.

**Aceite (verificável)**
- Em 375×812, sem rolagem horizontal, alvos de toque ≥ 44 px, nada escondido pela barra inferior.
- Conta com 0 treinos, 1 treino hoje, 2 treinos no mesmo dia e treinos de vários meses: as quatro situações renderizam certo.
- `tsc`, `eslint`, `vitest`, i18n e `build` verdes; **spec e2e novo** (`e2e/j*-historico.spec.ts`) cobrindo vazio, hoje e agrupamento por mês.
- Prints em 375, 768 e 1280 anexados no `QA.md` como `ALEGADO`, pedindo auditoria de outro agente.

**Portão visual:** antes de codar, mostre ao dono **2 ou 3 direções renderizadas** (HTML estático ou screenshot) da tela e espere a escolha dele. A opção segura/genérica não é padrão.

---

## 4. UX-03 — Auditoria visual completa (esforço ALTO)

**Decisão do dono (`docs/BACKLOG-CANONICO.md`, P1):** "Revisar todas as rotas quanto a rolagem, hierarquia, alvos de toque, conteúdo escondido pela navegação e fluidez. Registrar achados por rota e viewport."

É uma **auditoria**, não um redesenho: o entregável principal é um **registro de achados**, e só depois PRs pequenas de correção (uma por achado ou por rota), cada uma com o critério de aceite dela.

**Rotas** (fonte: saída do `npm run build`): `/`, `/login`, `/aceite`, `/onboarding`, `/boas-vindas`, `/redefinir-senha`, `/termos`, `/privacidade`, `/treino`, `/treino/[id]`, `/analise`, `/coach`, `/catalogo`, `/catalogo/[id]`, `/perfil`, `/ajustes`, `/ajustes/modelos`, `/ajustes/modelos/novo`, `/ajustes/anilhas`, `/ajustes/temas`, `/ajustes/personal`, `/ajustes/relatorios`, `/ajustes/guia`, `/ajustes/politicas`, `/personal`, `/personal/alunos`, `/personal/completar`, e a 404. Conte também os modais (`src/app/@modal/`).

**Viewports:** 375×812 (principal), 390×844, 768×1024 e 1280×800. **Temas:** cada tema de `/ajustes/temas` (contraste). **Idiomas:** pt, en e es (texto em inglês/espanhol costuma quebrar layout).

**Para cada rota × viewport, olhe:** rolagem (horizontal proibida, vertical sem cortar conteúdo), hierarquia (a ação principal é óbvia?), alvos de toque (≥ 44 px, espaçados), conteúdo escondido pela barra inferior ou pelo teclado, estados vazio/erro/carregando, texto cortado ou com reticências indevidas, fluidez de transição.

**Ferramentas que já existem**
- `e2e/j4-varredura.spec.ts` gera capturas em 3 larguras; o CI publica o artefato `varredura-telas` (baixe com `gh run download`).
- `e2e/j5-contraste.spec.ts` mede contraste.
- `scripts/qa-obsoletos.mjs` lista itens do `QA.md` que ficaram obsoletos.
- O painel do navegador do desktop app e o Playwright MCP **não capturam tela de verdade em algumas configurações**; se a captura sair em branco, o que funcionou nesta máquina foi navegar pela extensão e capturar por computer-use, com o Chrome não maximizado. Prefira ler texto/DOM (`get_page_text`, `read_page`) para conferir conteúdo.

**Entregáveis**
1. `docs/qualidade/ux-03-auditoria-<data>.md`: tabela `rota | viewport | achado | severidade (ALTA/MÉDIA/BAIXA) | evidência (print/DOM)`, tudo como `ALEGADO`.
2. Itens novos no `QA.md` no formato do registro existente (ID por área, ex.: `UX-03-TR-01`).
3. Correções em PRs pequenas, **só das severidades ALTA e MÉDIA**, depois de o dono ver a lista. BAIXA vira backlog.
4. **Não reescreva o `DESIGN.md` aqui:** reconciliá-lo é a DOC-03, que só começa depois desta auditoria.

**Não fazer:** trocar paleta, fonte ou identidade visual (é escolha do dono, com portão visual); "consertar" achado sem antes registrá-lo; tocar em dado de conta real.

---

## 5. Ao terminar cada tarefa

1. Atualize o bloco **ESTADO ATUAL** do `PROGRESS.md` (sobrescreva, não acumule) e o `docs/BACKLOG-CANONICO.md`.
2. Registre decisões de desenho novas em `DECISIONS.md` (formato das entradas existentes: o que mudou · por quê · alternativa descartada · impacto · como reverter).
3. Diga ao dono, em PT-BR e sem rodeio: o que foi feito, o que foi **provado** (com o comando ou print) e o que ficou **ALEGADO** esperando outro agente.

## 6. O que continua com o dono (não é seu)

Adicionar `SUPABASE_SERVICE_ROLE_KEY` em Production na Vercel; SMTP próprio no Supabase; conferir a URL de callback do Auth; criar a 2ª conta para testar o modo personal; as pendências pessoais dele (senha vazada, `push.json`, conta no Chrome do Playwright, teste no iPhone). Lembre-o, não tente fazer.
