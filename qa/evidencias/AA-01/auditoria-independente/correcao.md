# AA-01 — Auditoria independente — 2026-09-02

## Quem sou e o que fiz

Auditor independente (agente separado, contexto limpo — não implementei
nada desta feature, primeira vez vendo o código). Protocolo `AGENTS.md`
§5 ("Quem implementa não se audita"). Worktree isolado próprio:
`C:\lastro-audit-analise-assincrona`, checkout de
`origin/feat/analise-assincrona` (não toquei em `C:\lastro` nem em
`C:\lastro-analise-assincrona`).

Não reproduzi o método do implementador (script Playwright programático
solto) — reproduzi o **comportamento** com ferramentas próprias: specs
Playwright temporárias (`e2e/tmp-auditoria-aa01*.spec.ts`, apagadas ao
final, nunca commitadas) rodando contra `npm run build && npm run start`
(o próprio `webServer` do `playwright.config.ts`, porta 3100) — não usei
`preview_start`/`launch.json`, exatamente para não cair na mesma
armadilha de diretório errado que o implementador documentou. Usuário QA
descartável próprio, criado com os helpers do próprio repo
(`e2e/helpers/usuario-descartavel.ts`, `semear-historico.ts`). Leituras e
mutações de banco que a `GRANT` da aplicação não permite (mover
`criado_em` pra trás) via SQL direto no Postgres hospedado
(`tbkzcqfvafznxallyfqk`, mesmo projeto do implementador) usando a MCP do
Supabase (`execute_sql`) — usei essa mesma via para reconferir o estado
final de forma independente do resultado "verde" dos meus próprios
testes.

## Gates + E2E, do zero

```
npx tsc --noEmit   → erro inicial (LayoutProps não encontrado) — falso
                      alarme: tsc rodou ANTES de `.next/types` existir
                      (nunca tinha rodado build neste worktree). Depois
                      de `npm run build`, reexecutado: "No errors found".
npm run lint       → 0 errors, 18 warnings — todos pré-existentes, fora
                      dos arquivos tocados por esta feature (mesmos 18
                      relatados pelo implementador: ilustracao-anatomica-3d.tsx,
                      scripts .mjs avulsos, player-execucao-exercicio.tsx).
npx vitest run     → PASS (238) FAIL (0) — bate exatamente com o relatado.
npm run build      → limpo, 24 rotas geradas, incluindo /api/analise.
npx playwright test e2e/ → PASS (4) FAIL (0) — as 4 jornadas (j1, j2 x2, j3).
```

O "erro" inicial do `tsc` não é um achado real — é ordem de execução
(rodei `tsc` antes do primeiro `build` deste worktree, então
`.next/types/routes.d.ts` ainda não existia e `LayoutProps` — tipo
gerado pelo Next — não resolvia). Registrado aqui só por transparência
metodológica; depois do `build`, `tsc` limpo.

## Leitura de código (antes de reproduzir ao vivo)

Li de ponta a ponta: `supabase/migrations/0018_parecer_geracao_assincrona.sql`,
`src/lib/dados/parecer.ts`, `src/app/api/analise/route.ts`,
`src/components/analise-interativa.tsx`, `src/components/pareceres-salvos.tsx`.

Tudo bate com `SDD.md` §11:

- Migration `0018` idêntica ao que a spec prescreve (colunas, checks,
  GRANT column-level de `update`).
- `route.ts`: `gerarESalvarParecer` é exatamente o corpo antigo do `POST`
  recortado para dentro de `after()`, terminando em `UPDATE` em vez de
  `NextResponse.json` — bate com §11.3. O `POST` roda limpeza preguiçosa
  → checa trava (`409` se `gerando` existente) → `INSERT` do rascunho →
  `after(...)` → `202 { ok, rascunhoId }`.
- `parecer.ts`: `limparRascunhosExpirados` usa exatamente os dois
  limiares da spec (5min/24h, ambos em `parecer-config.ts` — a spec
  sugeria colocá-los direto em `parecer.ts`; o implementador extraiu pra
  um arquivo próprio, desvio cosmético sem efeito funcional).
- `analise-interativa.tsx`: nunca mais mostra `<Parecer>` inline; recebe
  `rascunhoInicial` como prop e trava o estado local com ele — bate com
  "trava sobrevive a troca de tela".
- `pareceres-salvos.tsx`, linha ~191: confirmado por leitura direta que o
  botão "Descartar" do card de rascunho chama `confirmarExclusao(rascunho.id)`
  **diretamente no `onClick`**, sem gate de confirmação inline — a
  confirmação inline (`role="group"`, "Cancelar"/"Excluir parecer salvo")
  só existe no fluxo de excluir um parecer **já confirmado** (linhas
  114-140, aberto no detalhe). Ou seja: a ressalva do implementador sobre
  "Descartar" não ter confirmação inline é **fato do código**, não
  interpretação — confirmo lendo a mesma fonte, de forma independente.

**Achado de leitura, não bloqueante:** entre o `SELECT` que checa a trava
(`status = 'gerando'`) e o `INSERT` do rascunho novo em `POST`
(`route.ts` linhas ~416-442), não há transação nem `SELECT ... FOR
UPDATE` — dois cliques rápidos o bastante (ou um duplo-clique que
escape do `aria-disabled` do cliente) poderiam, em teoria, passar os
dois pela checagem antes que o primeiro `INSERT` exista. Não reproduzi
isso ao vivo (é uma race de milissegundos, difícil de forçar
deterministicamente sem instrumentar o código) e a spec (`SDD.md`
§11.0, tabela "Fora") já declara explicitamente que não há caso de uso
de concorrência para este produto de 1 usuário — registro aqui só para
o dono ter o dado, não como bloqueio.

## Os 10 pontos — reproduzidos com usuário QA próprio

1. **Cronometrar.** Contra o build de produção (não dev/Turbopack),
   medi duas chamadas reais independentes: **922ms** e **709ms** do
   clique até o `202`. Ambas bem dentro do "~2s" da spec — sem o ruído
   de compilação a frio que o implementador precisou descontar
   manualmente (rodar contra produção evita o problema na raiz, não só
   explica). Botão travou (`aria-disabled="true"`) e a mensagem "Confira
   em Ajustes > Relatórios em instantes." apareceu nas duas vezes.
2. **Segunda tentativa sem esperar → recusada.** `fetch` direto (mesma
   sessão): `409 { erro: "geracao_em_andamento" }` — confirmado.
3. **Recarregar → trava persiste.** `page.reload()`: `aria-disabled="true"`
   e a mensagem de confirmação continuaram — confirmado que a trava vem
   do servidor (`rascunhoInicial`), não só do clique.
4. **Esperar a geração real terminar → rascunho completo em Pareceres
   salvos.** Confirmado — **com uma ressalva real, diferente do que o
   implementador observou** (ver seção "Achado" abaixo): a chamada real
   à Gemini que rodou na minha verificação levou **271950ms (~4min32s)**
   para terminar, não os 15-53s que o implementador mediu. `status`
   virou `'pronto'`, `texto` com 817 caracteres de prosa real (não é o
   fallback determinístico — o texto cita números e nomes reais do
   histórico semeado). Reconferido por SQL direto (MCP), não só pela
   tela: a linha existia no Postgres com `status='pronto'`,
   `confirmado=false` antes mesmo de eu tocar na UI de novo.
5. **Voltar em `/analise` → destravado.** `aria-disabled="false"` —
   confirmado.
6. **Salvar → confirmado=true.** Clique real no botão; botão "Descartar"
   sumiu da página; `SELECT` (via cliente autenticado) confirmou
   `confirmado: true` no Postgres.
7. **Descartar (rascunho sintético, sem gastar cota da Gemini).** Para
   não gastar mais cota testando só o mecanismo de exclusão — que não
   depende de a Gemini ter gerado nada —, semeei um segundo rascunho
   `status='pronto', confirmado=false` direto no banco (mesmo padrão do
   próprio `e2e/j2-analise.spec.ts`, teste 2). Cliquei "Descartar":
   sumiu imediatamente da tela, `count(*) = 0` no Postgres depois.
   **Confere com o código lido no passo anterior**: não há passo de
   confirmação inline no card de rascunho — o clique já exclui.
8. **Expiração 24h.** Semeei via SQL um rascunho `pronto`/`confirmado=false`
   com `criado_em` 25h no passado. Recarreguei `/ajustes/relatorios`: o
   card não apareceu; `count(*) = 0` no Postgres — a limpeza preguiçosa
   rodou na leitura da página, sem ação nenhuma minha além de visitar a
   tela.
9. **Trava abandonada (5min) libera.** Semeei via SQL uma linha
   `status='gerando'` com `criado_em` 6min no passado. `/analise` já
   carregou destravada (a limpeza preguiçosa roda dentro de
   `buscarRascunhoEmAndamento`, chamada ao montar a tela). Cliquei
   "Solicitar Análise" de verdade: `202` (não `409`) — a trava velha não
   bloqueou. Confirmado que a linha de 6min não existe mais no Postgres
   depois.
10. **Apagar o usuário QA — cascade limpo.** `admin.auth.admin.deleteUser`.
    Reconferido **de forma independente do resultado do meu próprio
    teste**, via SQL direto contra o Postgres (não через o client
    autenticado, que já teria perdido a sessão): `auth.users`,
    `public.parecer`, `public.treino`, `public.serie` para este
    `usuario_id` → todos `count = 0`. Rodei também uma checagem geral de
    integridade (`select count(*) from parecer where usuario_id não
    existe em auth.users`) → `0` órfãos em toda a tabela, não só do meu
    usuário — não deixei nenhum resíduo de teste no banco compartilhado.

## Achado real: a margem dos 5 minutos é mais apertada do que a spec supõe

`SDD.md` §11.2 justifica `LIMITE_GERACAO_TRAVADA_MINUTOS = 5` dizendo
"5 minutos é folgado o bastante pra cobrir a chamada real (retry
incluso) com margem". O implementador mediu chamadas reais de 53s e
15s — dentro dessa folga com sobra. Na minha verificação, uma chamada
real levou **271950ms (~4min32s)** — a **28 segundos** de estourar o
limite de 5 minutos que existe justamente para essa chamada não ser
interrompida no meio. Não cheguei a ver a trava disparar prematuramente
(a chamada terminou antes dos 5min), mas a diferença de variância entre
as minhas medições e as do implementador (15-53s vs 272s, quase 20x) é
grande o bastante para eu não descartar como ruído.

**Não é um bug** — o sistema funcionou exatamente como projetado mesmo
neste caso mais lento (a trava não disparou, o rascunho completou,
apareceu certo em "Pareceres salvos"). É um risco de produto: se a
latência real da Gemini variar tanto (rede, carga do lado do Google,
tamanho do histórico do usuário no prompt), uma geração real ocasional
pode ultrapassar 5 minutos e ser tratada como abandonada — a pessoa
perderia silenciosamente aquela geração (a linha  'gerando' seria limpa
antes de a resposta da Gemini voltar para fazer o `UPDATE`, e o
`UPDATE` subsequente não encontraria mais a linha — sem erro visível
pra ninguém, só um parecer que nunca aparece). Registro como **ressalva
para o dono avaliar**, não como bloqueio: não reproduzi a falha em si
(só a variância que a aproxima do limite), e a spec já é explícita que
5min é "folga de segurança pro caso de falha, não uma expectativa de
duração normal" — o meu dado apenas sugere que a folga real observada é
menor do que a redação sugere.

## Cota da Gemini consumida por mim

**3 chamadas reais.** Sendo honesto sobre o motivo, mesmo padrão do
implementador: minha primeira tentativa do ponto 1 rodou com um limite
de espera de 120s (curto demais) e meu `afterAll` apagou o usuário QA
antes de a geração terminar — a linha foi cascade-deletada com a
resposta da Gemini ainda em voo, chamada perdida sem verificação
possível (achado de harness meu, não do código sob auditoria). Corrigi
(sem `afterAll` automático, espera de até 4:30min) e a segunda tentativa
do ponto 1/4 completou com sucesso e ficou registrada acima. A terceira
foi o clique real do ponto 9 (trava abandonada), inevitável dado que
provar que a trava libera exige um clique real que dispara `after()`
de verdade. Pontos 6, 7 e 8 não gastaram cota nenhuma (reuso do
rascunho real do ponto 4, ou rascunhos sintéticos semeados direto no
banco, mesmo padrão do `e2e/j2-analise.spec.ts` oficial).

## Resultado

Todos os 10 pontos bateram com o comportamento esperado da spec
(`SDD.md` §11) e com o que o implementador relatou, com uma divergência
factual honesta (tempo de geração real ~5x mais lento do que o
implementador mediu — ver "Achado real" acima) que não invalida nenhum
dos 10 pontos, mas é um dado novo que o `correcao.md` original não
tinha. A ressalva já registrada pelo implementador sobre "Descartar" sem
confirmação inline foi **reconfirmada por leitura de código
independente**, não só aceita de segunda mão.

**Recomendação:** `PASSOU COM RESSALVA` — as duas ressalvas (Descartar
sem confirmação inline, já conhecida; margem real dos 5 minutos mais
apertada do que a spec supõe, achado novo) não bloqueiam merge, mas
merecem registro para o dono decidir se quer folga maior no limiar ou
um log/alerta quando uma geração se aproxima dele.
