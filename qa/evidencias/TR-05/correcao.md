# TR-05 — Foco/divisão do sticker usa o grupo muscular real do catálogo — 2026-09-01

## O pedido

Achado do dono, ao vivo, usando o app de verdade na academia: treinou o
grupo muscular inferiores (pernas), finalizou o treino e gerou o sticker
pós-treino — o "foco" mostrado no sticker saiu **"SUPERIORES"**, errado.

## Causa raiz

`src/lib/dados/metricas-treino.ts`, função `inferirFoco` — o "foco/divisão"
mostrado no sticker (`PERNAS`/`PEITORAL`/`COSTAS`/`OMBROS`/`BRAÇOS`/`SUPERIORES`/`FULL BODY`)
nunca usava o dado curado do catálogo (`exercicio.grupo_muscular_primario`,
usado em todo o resto do produto — análise, catálogo, filtros). Em vez
disso, **adivinhava** o grupo aplicando uma lista de palavras-chave em
regex sobre o TEXTO do nome do exercício (`"agachamento|leg|extensora|
flexora|panturrilha|quadríceps|stiff|búlgaro|passada|abdut|adut|glúteo|
sumô|elevação pélvica"` para pernas, e listas parecidas pra peito/costas/
ombros/braços).

Isso é frágil por construção: qualquer exercício de pernas cujo nome não
bata com nenhuma palavra da lista simplesmente não conta como perna. Ex.:
**"Afundo com halteres"** (categoria real `quadriceps`) não bate com
nenhuma palavra do regex de pernas — nem "agachamento", nem "leg", nem
nenhuma das outras. Se o treino combinar esse exercício com outro que
acidentalmente bate numa palavra de peito/costas/ombros/braços, ou mesmo
sozinho dependendo da combinação de flags, o resultado sai errado, como
o dono viu ao vivo.

## Correção

Nova função `inferirFocoPorGrupo`, que classifica pelo `grupo_muscular_primario`
REAL de cada exercício (as 10 categorias curadas do catálogo: `quadriceps`,
`posterior_coxa`, `gluteo`, `panturrilha` → pernas; `peito`; `costas`;
`ombro`; `biceps`/`triceps` → braços; `abdomen`), com a mesma lógica de
prioridade que já existia (grupo único → nome específico; 2 grupos
"superiores" → "SUPERIORES"; mais de 2 → "FULL BODY").

`inferirFoco` (a versão por palavra-chave) **não foi apagada** — vira
fallback só para o caso raro de série sem o dado do catálogo disponível
(dado legado). Não foi "adicionada mais uma palavra-chave" à lista antiga
— o problema nunca foi a lista estar incompleta, é o MÉTODO estar errado
(P7: fonte única — o app já tem o dado certo em outro lugar, o sticker só
não estava usando).

**Arquivos tocados:**
- `src/lib/dados/metricas-treino.ts` — `inferirFocoPorGrupo` nova,
  `SerieParaMetricas.exercicioGrupoMuscular?` novo, loop de agregação
  coleta o grupo por exercício único, `focoOuDivisao` tenta o grupo real
  primeiro, cai pro nome só se ausente.
- `src/lib/dados/treino.ts` — `Serie.exercicioGrupoMuscular` novo; query
  de `buscarTreino` passa a selecionar `grupo_muscular_primario` no join
  com `exercicio`.
- `src/components/treino-detalhe.tsx` — série otimista local (`novaSerie`)
  preenche `exercicioGrupoMuscular` a partir do catálogo já carregado.
- `src/app/ajustes/relatorios/page.tsx` — `seriesParaMetricas` (histórico)
  repassa `exercicioGrupoMuscular`.

Como bônus (achado colateral, mesma raiz): `abdomen` nunca tinha categoria
nenhuma no método antigo — um treino só de abdômen caía no fallback
genérico "TREINO". A versão nova adiciona "ABDÔMEN" como categoria própria.

## Gates

```
npx tsc --noEmit   → só o LayoutProps pré-existente (não-regressão)
npm run lint       → 0 errors, 18 warnings pré-existentes
npx vitest run     → PASS (238) FAIL (0) — sem regressão nos testes
                      existentes de metricas-treino.test.ts, que não
                      passam exercicioGrupoMuscular e continuam batendo
                      no fallback por nome como antes
npm run build      → build de produção limpo
```

## Verificação ao vivo

Usuário QA descartável (`qa.sticker.fix.<timestamp>@lastro.test`),
autenticado (não `service_role` em tabela — achado já conhecido desta
sessão). Treino de hoje com 1 série valendo em **"Afundo com halteres"**
(exercício real do catálogo, `grupo_muscular_primario = quadriceps`) —
exatamente o tipo de exercício que o método antigo não reconhecia por
nome. Login real pela UI, `/ajustes/relatorios`, clique em "Gerar Imagem
/ Sticker Story" — o sticker renderizou **"PERNAS"**, correto.

Usuário QA apagado ao final (`admin.auth.admin.deleteUser`), confirmado
`0` órfãos. Servidor de dev parado.

## Resultado

Registrado inicialmente como **ALEGADO** em `QA.md` — verificado ao vivo
pelo implementador ("Afundo com halteres" → sticker mostrou "PERNAS").

## Auditoria independente (2026-09-01, agente separado, worktree próprio `C:\lastro-audit-sticker`)

**Veredito: PASSOU COM RESSALVA.**

Leu o código real (`inferirFocoPorGrupo`, `calcularMetricasSessao`,
`buscarTreino`, os dois call-sites) e confirmou que a lógica prioriza o
grupo muscular real do catálogo, caindo no chute por nome só quando o
dado está ausente. Usou um **segundo exercício, diferente do original**
— "Hack squat" (categoria real `quadriceps`) — escolhido justamente por
também não bater com nenhuma palavra da lista antiga de pernas,
provando a correção de forma independente, não só repetindo o mesmo
caso.

Criou usuário QA e dado reais no banco (autenticado como o próprio
usuário, nunca `service_role` em tabela). **Não conseguiu completar o
login pela UI do navegador** naquele worktree específico — o formulário
de `/login` não disparava o `onSubmit` do React de forma consistente
(navegação nativa do form em vez de client-side), mesmo depois de tentar
clique por ref, por coordenada, `.click()` via JS e reiniciar o servidor
com `.next` limpo. Recusou corretamente duas tentativas de contorno que
envolveriam manipular sessão/cookie diretamente (bloqueadas pelo
classificador de segurança do ambiente) — não tentou burlar.

**Achado à parte, registrado mas não bloqueante para este item:** esse
problema de login parece ser uma peculiaridade daquele worktree/porta,
não deste bug — o implementador original logou pela UI sem problema no
seu próprio worktree, na verificação inicial. Vale investigar como item
de QA separado se voltar a acontecer.

Sem conseguir fechar a cadeia pelo pixel final do sticker, fechou pela
função de produção real: escreveu um teste temporário que autentica como
o usuário QA, roda a MESMA query de `buscarTreino` contra o dado real
inserido, e alimenta o resultado real (`exercicioGrupoMuscular:
"quadriceps"` pro Hack squat) na função `calcularMetricasSessao`
importada direto do arquivo fonte (não reimplementada). Resultado:
`focoOuDivisao: "PERNAS"` — correto. Rodando a mesma função SEM o campo
(simulando dado legado), o resultado foi `"TREINO"` (não "PERNAS"),
confirmando que o Hack squat também escapava do método antigo — uma
falha diferente do "SUPERIORES" original, mas igualmente uma falha,
cumprindo o objetivo de provar o método antigo quebrado com um caso
independente.

Confirmou `npx vitest run src/lib/dados/metricas-treino.test.ts` → 4/4,
sem regressão no fallback. Usuário QA apagado, `0` órfãos (cascade
confirmado por SQL). Arquivo de teste temporário e scripts auxiliares
removidos ao final; `.env.local` apagado.

Com este veredito, `TR-05` passa de `ALEGADO` para `PASSOU COM RESSALVA`
em `QA.md`.
