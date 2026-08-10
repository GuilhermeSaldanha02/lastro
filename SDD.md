# SDD.md — `lastro` · Spec técnica da **Fase 1**

> **Spec de uma fase, não do produto.** Cobre as tarefas **1.1 a 1.5** do `PROGRESS.md` — a fatia vertical da peça-assinatura: registrar série → agregar → perguntar à Gemini → ler o parecer.
>
> **Autoridade:** `PRD.md` (o quê) e `ADR.md` (por quê) vencem este documento. Este documento decide o **como**. Divergência entre eles = erro deste arquivo.
>
> **Linguagem ubíqua:** todo nome de tabela, coluna, tipo e função usa os termos de `KNOWLEDGE.md` §1, sem sinônimo e sem tradução para inglês.

---

## 0. Escopo desta spec — e o que está FORA

**DENTRO (tarefas 1.1–1.5):** projeto Next.js, schema Postgres com RLS, tela mínima de registro de série, agregador determinístico com TDD estrito, route handler da Gemini, botão Análise com as 5 perguntas.

**FORA desta spec — declarado explicitamente, não esquecido:**

| Fora | Onde vive |
|---|---|
| Offline, IndexedDB/Dexie, fila outbox, service worker, PWA instalável | **Fase 2** |
| Auth com Google OAuth e e-mail (fluxo completo, telas de login) | **Fase 2** — ver §2.6 para o mínimo que a Fase 1 assume |
| Catálogo curado de ~100 exercícios com dicas de execução | **Fase 4** — ver §2.7 para o seed mínimo da Fase 1 |
| Coach 24h (chat) | **Fase 5** |
| Gráficos, Recharts, histórico visual, evolução no tempo | **Fase 3** |
| Polimento visual, gate de contraste AA, identidade | **Fase 3** / `DESIGN.md` |
| "Repetir última série" em um toque | **Fase 2** |

Se uma implementação da Fase 1 encostar em qualquer linha da coluna "Fora", ela saiu do escopo — pare e replaneje.

**Feio é permitido nesta fase. Incompleto não é.** (`PROGRESS.md`, Fase 1)

---

## 1. A regra que rege toda a Fase 1

> ### **REGRA DA PRESENÇA**
> **Tudo que existe no resumo compacto é citável pelo modelo como fato.**
> Portanto: valor não confiável ou desconhecido é **ausente do objeto** — nunca um número de aparência neutra.

Consequências diretas, cada uma verificada na seção correspondente:

1. e1RM acima do teto de reps → **campo omitido**, não "marcado como suspeito" (§3.1).
2. Cobertura de RIR insuficiente → métrica de série difícil **ausente**, não `0` (§3.3).
3. Delta é **campo pré-calculado**. O resumo nunca entrega dois números para o modelo subtrair — isso é o modelo fazendo aritmética, exatamente o que o ADR-003 proíbe (§3.2).
4. O que o resumo não carrega, o parecer não pode citar — e o validador numérico rejeita (§6.4).

Esta regra é citada por número (`Regra da Presença`) nas seções 3, 4 e 6.

---

## 2. Decisões desta spec

### D1 — Fórmula de e1RM: **Epley**, com identidade em 1 rep e teto de reps

**Fórmula:** `e1RM = peso × (1 + reps / 30)`, **exceto** `reps === 1 → e1RM = peso` (caso de identidade explícito).

**Por que Epley e não Brzycki.** As duas se cruzam exatamente em **10 reps** (Epley: `1 + 10/30 = 1,3333`; Brzycki: `36/(37−10) = 1,3333`). Abaixo de 10 elas diferem pouco. Acima, Brzycki tem **polo em 37 reps** — a função explode e passa a devolver número sem sentido físico, e uma série de 30 reps produziria estimativa absurda. Epley é monotônica, sem descontinuidade, e é a convenção mais difundida em apps de log. Escolha por robustez no comportamento degradado, não por acurácia superior (as duas são estimativas).

**A identidade em 1 rep não é detalhe.** Epley cru em `reps=1` devolve `peso × 1,0333` — infla uma single verdadeira em 3,3%. Uma série de 1×100 kg tem e1RM **100 kg**, por definição. Vira caso de teste nomeado (§4.5, T-E3).

**Teto de reps — `E1RM_REPS_MAX = 12`.** Acima de 12 repetições a série mede resistência muscular, não força máxima, e a estimativa deixa de ser confiável. **Reportar e1RM de uma série de 30 reps como se fosse força máxima é mentira numérica** — e o app se proibiu disso.

- Comportamento: série valendo com `reps > E1RM_REPS_MAX` **conta normalmente em volume, frequência e série difícil**, e é **excluída de todo cálculo de e1RM** (Regra da Presença).
- **Honestidade sobre o número (padrão de `KNOWLEDGE.md` §3.7):** 12 é **convenção prática**, não limiar validado por estudo controlado. Não existe fonte primária que defina o ponto exato onde a extrapolação quebra. A UI que exibir e1RM deve carregar essa ressalva, do mesmo modo que a faixa de volume e o critério de estagnação carregam as delas.
- **Onde o número mora:** `src/lib/analise/limiares.ts` (§4.2). Este documento é a origem da decisão; a **cópia canônica em código é única**. Ao fechar a tarefa 1.3, registrar `E1RM_REPS_MAX = 12` em `KNOWLEDGE.md` §1 como definição travada, e este parágrafo passa a apontar para lá (P7 — fonte única por dado).

**e1RM de uma sessão para um exercício** = **maior** e1RM entre as séries valendo elegíveis daquele exercício naquele treino. Não é média: força máxima é um máximo, não uma tendência central.

---

### D2 — O contrato do resumo compacto (a decisão mais importante da Fase 1)

É o **único** objeto que o LLM vê. Nomes de campo em PT-BR, nos termos do glossário — isso satisfaz a linguagem ubíqua **e** ancora a prosa do modelo no vocabulário certo.

**Arquivo:** `src/lib/analise/tipos.ts`

```ts
/**
 * ResumoCompacto — o ÚNICO objeto que chega ao LLM.
 * REGRA DA PRESENÇA (SDD §1): campo ausente = informação indisponível.
 * Nenhum campo é preenchido com 0, null "neutro" ou placeholder para
 * significar "não sei". Se não sabemos, o campo não existe.
 * Todo delta é PRÉ-CALCULADO — o modelo nunca subtrai (ADR-003).
 */
export type ResumoCompacto = {
  /** Versão do contrato. Agregador e prompt sobem juntos. */
  versao: 1;

  periodo: {
    /** ISO date da segunda-feira da semana analisada (semana ISO-8601). */
    semana_atual_inicio: string;
    /** Semanas completas com pelo menos 1 série valendo, dentro da janela. */
    semanas_com_dados: number;
    /** Janela de COMPARAÇÃO em semanas. Fase 1: 4 (PRD §3). */
    janela_semanas: number;
  };

  /**
   * Faixa de referência de séries valendo por grupo/semana (KNOWLEDGE §3.6).
   * É a MESMA para todos os grupos — fica no topo, não repetida item a item.
   * Rótulo de convenção prática é obrigatório na UI.
   */
  faixa_referencia_series: [number, number];

  /**
   * Volume total (todos os grupos somados) por semana, mais recente por
   * último, cobrindo `periodo.janela_semanas` semanas. É o que falta para
   * responder "estou progredindo?" (PRD §3, pergunta 1) e "volume vs.
   * semanas anteriores" (pergunta 4) — um delta contra UMA semana anterior
   * não é tendência de 4 semanas.
   * Semana sem nenhuma série valendo aparece com volume 0 EXPLÍCITO aqui —
   * isso NÃO viola a Regra da Presença (§1): zero é fato conhecido (o dono
   * não treinou), não "não sei". A Regra protege contra número que finge
   * ser dado quando é ausência; aqui o zero É o dado.
   */
  volume_semanal: Array<{
    semana_inicio: string;   // ISO date, segunda-feira
    volume_total: number;    // kg, soma de todos os grupos, 1 casa
  }>;

  volume_por_grupo_muscular: Array<{
    grupo_muscular: string;              // "peito", "costas", ...
    series_valendo: number;              // contagem, semana atual
    volume: number;                      // Σ(reps × peso), kg, 1 casa
    /** Variação % vs. semana anterior. Ausente se não há semana anterior com dados. */
    delta_series_pct?: number;
    delta_volume_pct?: number;
    /** "abaixo" | "dentro" | "acima" da faixa — pré-calculado, não deduzido. */
    posicao_na_faixa: 'abaixo' | 'dentro' | 'acima';
  }>;

  /**
   * Volume por EXERCÍCIO (não por grupo), semana atual — adicionado
   * 2026-08-08 para alimentar o bloco de evidência do parecer (DESIGN.md
   * §3.6.3, Linha 2: "80kg × 6"). `peso_referencia`/`reps_referencia` são
   * o TOP SET (maior peso) do treino mais recente da semana em que o
   * exercício apareceu — nunca média nem soma, para não inventar um par
   * peso×reps que nenhuma série real tem (E3).
   */
  volume_por_exercicio: Array<{
    exercicio: string;
    grupo_muscular: string;
    series_valendo: number;
    volume: number;                      // Σ(reps × peso), kg, 1 casa
    peso_referencia: number;             // top set, kg
    reps_referencia: number;             // reps do top set
    delta_volume_pct?: number;           // vs. semana anterior, ausente se não há
  }>;

  tendencia_e1rm: Array<{
    exercicio: string;                   // nome PT-BR do catálogo
    grupo_muscular: string;
    /** e1RM mais recente da janela, kg, 1 casa. */
    e1rm_atual: number;
    /** e1RM mais antigo da janela, para o mesmo exercício. */
    e1rm_inicial: number;
    /** Variação % pré-calculada entre inicial e atual. */
    delta_pct: number;
    /** Sessões com e1RM elegível na janela. <2 → o item NÃO entra na lista. */
    sessoes: number;
  }>;

  /**
   * Série difícil (RIR ≤ limiar, KNOWLEDGE §1). Escopo: SEMANA ATUAL,
   * mesmo escopo de volume_por_grupo_muscular — não a janela de comparação.
   * Campo AUSENTE quando a cobertura de RIR fica abaixo do piso (SDD §2/D3).
   * Quando presente, carrega SEMPRE os dois denominadores.
   */
  series_dificeis?: {
    total: number;                       // séries valendo com RIR ≤ limiar
    series_valendo_com_rir: number;      // denominador honesto
    series_valendo: number;              // denominador total
  };
  /** Presente EXCLUSIVAMENTE quando series_dificeis está ausente. */
  cobertura_rir_insuficiente?: {
    series_valendo_com_rir: number;
    series_valendo: number;
  };

  frequencia: {
    treinos_semana_atual: number;
    /** Média de treinos/semana nas semanas anteriores com dados. Ausente se não houver. */
    media_semanas_anteriores?: number;
    /** Grupos musculares sem nenhuma série valendo na janela inteira. */
    grupos_sem_estimulo: string[];
  };

  /** Exercícios sem melhora em e1RM nem em volume por N semanas (KNOWLEDGE §3.7). */
  estagnacoes: Array<{
    exercicio: string;
    semanas_sem_progresso: number;
    /** Contexto que torna o parecer citável: o número parado. */
    e1rm_estavel_em?: number;
    volume_estavel_em?: number;
  }>;

  /**
   * PR = recorde contra TODO o histórico do exercício, não contra a janela.
   * Um máximo de 4 semanas NÃO é recorde, e um campo chamado `prs` faz o
   * modelo escrever "você bateu um recorde" — frase enganosa gerada de um
   * campo verdadeiro, que o validador numérico não pega. Por isso o
   * agregador recebe o histórico completo (§4.3) e compara contra ele.
   */
  prs: Array<{
    exercicio: string;
    tipo: 'e1rm' | 'volume';
    valor: number;
    valor_anterior: number;   // melhor marca histórica anterior
  }>;
};
```

**Cinco propriedades travadas do contrato:**

| # | Propriedade | Como se garante |
|---|---|---|
| C1 | **Orçamento de tamanho.** `JSON.stringify(resumo).length ≤ MAX_BYTES_RESUMO` | Teste `T-R1` (§4.5) com fixture de carga máxima |
| C2 | **Toda lista tem teto.** `volume_por_grupo_muscular` ≤ 12 · `volume_por_exercicio` ≤ 8 (top por volume, `MAX_VOLUME_POR_EXERCICIO`) · `tendencia_e1rm` ≤ 8 (top por volume) · `estagnacoes` ≤ 5 · `prs` ≤ 5 · `grupos_sem_estimulo` ≤ 12 | Constantes em `limiares.ts`; teste `T-R2` |
| C3 | **`versao` no objeto.** Agregador e prompt versionam juntos | Route handler rejeita `versao !== 1` |
| C4 | **A data de referência é parâmetro injetado**, nunca `new Date()` dentro de `src/lib/analise/` | Teste é determinístico; FF3 (pureza) é integral, não parcial |
| C5 | **Um objeto serve as 5 perguntas.** A pergunta é escolhida no route handler, não no agregador | Sem projeções por pergunta na Fase 1 |

**O orçamento C1 foi somado contra os tetos de C2, não chutado — refeito nesta revisão para incluir `volume_semanal` (achado 5 do QA) e, em 2026-08-08, `volume_por_exercicio`.** Com a carga máxima que C2 permite: 12 grupos × ~170 B = 2.040 · 8 exercícios (`tendencia_e1rm`) × ~130 B = 1.040 · 8 exercícios (`volume_por_exercicio`, campos extra `peso_referencia`/`reps_referencia`) × ~150 B ≈ 1.200 · 5 estagnações × ~105 B = 525 · 5 PRs × ~82 B = 410 · `volume_semanal` com `JANELA_SEMANAS = 4` entradas × ~45 B = 180 · `periodo` + `frequencia` + `series_dificeis` + `faixa_referencia_series` ≈ 400. **Total ≈ 5,8 KB.** Daí `MAX_BYTES_RESUMO = 6144` — o teto ainda fica **acima** do que os tetos de lista produzem, confirmado por `T-R1` reexecutado com `volume_por_exercicio` no fixture de carga máxima (passa; a margem ficou mais apertada que antes — se outro campo entrar em `ResumoCompacto`, refazer esta conta antes de assumir que ainda cabe). Se um teto de C2 subir, C1 sobe junto e a soma é refeita.

**Por que um objeto só e não cinco:** as cinco perguntas do PRD §3 se alimentam de subconjuntos sobrepostos das mesmas métricas. Cinco projeções seriam cinco superfícies para testar e cinco chances de divergir. Com 4 KB de teto, o custo de mandar tudo é irrelevante — e a pergunta 5 ("o que mudar?") precisa de tudo mesmo.

---

### D3 — RIR ausente: contagem absoluta, denominador explícito, piso de cobertura

`KNOWLEDGE.md` §1 já trava a semântica: *"o agregador trata RIR ausente como ausência de informação, nunca como série fácil."* A decisão que sobra é a **forma de reportar**.

**Decisão:** contagem absoluta **com os dois denominadores sempre juntos** (`total`, `series_valendo_com_rir`, `series_valendo`), mais um **piso de cobertura** abaixo do qual o campo inteiro desaparece.

**Escopo temporal — corrigido nesta revisão.** `series_dificeis` é métrica de **semana atual**, não da janela de 4 semanas de comparação — o mesmo escopo de `volume_por_grupo_muscular`. Uma versão anterior desta seção dizia "da janela", o que contradizia o próprio caso de teste T-D1 (§4.5), que soma só as 3 séries valendo da semana atual do fixture, ignorando as 2 da semana anterior. Ficou o escopo que o teste sempre esperou: **semana atual**.

- `COBERTURA_RIR_MINIMA = 0,60` (60% das séries valendo **da semana atual** com `rir` preenchido). Valor em `limiares.ts`. **Convenção prática, sem base em literatura** — mesmo rótulo de honestidade da §3.7.
- Cobertura ≥ piso → `series_dificeis` presente com os três números.
- Cobertura < piso → `series_dificeis` **ausente** e `cobertura_rir_insuficiente` presente. O prompt (§6.3) instrui o modelo a dizer que não há dado suficiente sobre intensidade — e não a inferir nada.

**Por que não proporção pura.** "38% das suas séries foram difíceis" é a frase que o modelo escreveria — e ela é indefensável se apenas 3 de 40 séries têm RIR. A proporção **apaga o denominador**, que é precisamente a informação que separa medida de chute. Com os três números na mesa, o modelo tem como escrever "12 de 20 séries com RIR anotado" e o validador numérico (§6.4) tem como conferir cada um.

**Por que também um piso, e não só os denominadores.** Com cobertura muito baixa o número existe mas não significa nada, e a Regra da Presença manda tirá-lo de cena — um número presente será citado.

---

### D3.5 — Como `volume.ts` trata unilateral e peso corporal

Duas decisões do dono (`DECISIONS.md` 2026-08-04), incorporadas ao cálculo:

- **Unilateral** (atributo de `exercicio`, não de `serie` — §3.2): `volume_da_serie = reps × peso × (exercicio.unilateral ? 2 : 1)`. O dono anota "10 de cada lado"; o agregador sabe que isso são 20 execuções.
- **Peso corporal:** série com `peso_corporal_incluso = true` **não entra** em `volume` nem em `volume_por_grupo_muscular`, em nenhuma hipótese — nem só a carga adicional. Calcular volume parcial (só a carga externa) seria um número tecnicamente correto mas enganoso, porque comparado lado a lado com séries de volume completo ele pareceria "treino leve" quando pode ser o oposto. A série **continua contando** em `frequencia.treinos_semana_atual` e em `series_dificeis` (o esforço é real, mesmo que o volume não seja mensurável). A tela (§7.1) declara a limitação onde o número de volume aparece.

Casos de teste: T-V4 e T-V5 (§4.5).

---

### D4 — Schema Postgres (§ completa em 3.1–3.4 abaixo, com justificativa de cada tipo)

Ver **§3**.

---

### D5 — Estrutura do prompt e defesa contra número inventado

Ver **§6**.

---

## 3. Tarefa 1.1 — Projeto, schema e RLS

### 3.1 Arquivos

```
supabase/migrations/0001_schema_inicial.sql     ← todo o DDL, RLS inclusa
supabase/migrations/0002_grants_authenticated.sql ← GRANT ao role authenticated — ver §3.3
supabase/seed.sql                                ← seed mínimo de exercicio (§3.5)
src/lib/supabase/cliente-browser.ts              ← cliente de navegador
src/lib/supabase/cliente-servidor.ts             ← cliente de servidor (route handlers)
scripts/ff5-rls.sql                              ← o check executável da FF5
```

> **E12 — ponto a verificar na implementação.** Este documento **não fixa a assinatura** do SDK do Supabase (`@supabase/ssr` / `createServerClient` / manuseio de cookies no App Router). Essa API mudou mais de uma vez e assinatura desatualizada não dá erro de leitura, dá bug plausível. **Consultar a documentação vigente ao escrever `cliente-servidor.ts`.** Todo o resto desta seção é SQL puro, que não envelhece.

### 3.2 DDL

```sql
-- ============ grupo_muscular: lookup, dado público ============
create table public.grupo_muscular (
  id    text primary key,          -- 'peito', 'costas', 'quadriceps', ...
  nome  text not null              -- rótulo PT-BR para UI
);

-- ============ exercicio: CATÁLOGO CURADO, dado compartilhado ============
create table public.exercicio (
  id                       uuid primary key default gen_random_uuid(),
  nome                     text not null unique,
  grupo_muscular_primario  text not null references public.grupo_muscular(id),
  -- ATRIBUTO DO EXERCÍCIO, não da série (DECISIONS.md 2026-08-04 "Unilateral").
  -- Rosca alternada é sempre unilateral; não é o dono quem decide isso toda
  -- série. O agregador dobra o volume quando este flag é true (§4.5, T-V4).
  unilateral               boolean not null default false,
  dica_execucao            text,          -- CURADA, nunca gerada (FF7). Fase 4.
  criado_em                timestamptz not null default now()
);

-- ============ treino: uma ida à academia ============
create table public.treino (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  data        date not null,
  iniciado_em timestamptz not null default now(),
  criado_em   timestamptz not null default now()
);
create index treino_usuario_data_idx on public.treino (usuario_id, data desc);

-- ============ serie: a unidade atômica do produto ============
create table public.serie (
  id                    uuid    primary key default gen_random_uuid(),
  usuario_id            uuid    not null references auth.users(id) on delete cascade,
  treino_id             uuid    not null references public.treino(id) on delete cascade,
  exercicio_id          uuid    not null references public.exercicio(id),
  ordem                 smallint not null,
  tipo                  text    not null,
  reps                  smallint not null,
  peso                  numeric(6,2) not null,
  unidade               text    not null default 'kg',
  rir                   smallint,
  -- `unilateral` NÃO mora aqui — é atributo do exercício (ver tabela acima).
  -- Marcado assim porque cada série já poderia divergir do catálogo, e a
  -- decisão registrada é que ele não diverge: a série herda do exercício.
  peso_corporal_incluso boolean not null default false,
  criado_em             timestamptz not null default now(),

  constraint serie_tipo_valido  check (tipo in ('aquecimento', 'valendo')),
  constraint serie_reps_positiva check (reps > 0 and reps <= 200),
  constraint serie_peso_valido   check (peso >= 0 and peso <= 1000),
  constraint serie_unidade_valida check (unidade in ('kg', 'lb')),
  -- rir 0 É VÁLIDO: RIR 0 = falha (KNOWLEDGE §1). Escrever `rir > 0` aqui
  -- ressuscita exatamente o bug que o Inspetor achou na Fase 0.
  constraint serie_rir_valido    check (rir is null or (rir >= 0 and rir <= 10)),
  -- RIR é campo de série valendo (PRD §9).
  constraint serie_rir_so_valendo check (rir is null or tipo = 'valendo')
);
create index serie_usuario_criado_idx on public.serie (usuario_id, criado_em desc);
create index serie_treino_idx         on public.serie (treino_id, ordem);
```

**Justificativa de tipo e constraint — o que não é óbvio:**

| Escolha | Por quê |
|---|---|
| `peso numeric(6,2)`, **não** `float`/`real` | Ponto flutuante quebra igualdade exata em teste conferido à mão e acumula erro em `Σ(reps × peso)`. `numeric` é exato. `(6,2)` cobre até 9999,99 kg |
| `reps smallint` com teto 200 | Guarda-corpo contra dedo errado (`1000` reps). Não é regra de domínio, é sanidade de entrada |
| `rir` **nullable** | Ausência é informação (D3). Um default `NULL` é o único correto — qualquer default numérico mentiria |
| `rir` permite **0** | RIR 0 = falha, e falha é série difícil. `check (rir > 0)` inverteria o sinal da métrica nas semanas mais pesadas |
| `tipo text + CHECK`, não `enum` nativo | Enum do Postgres exige migração para acrescentar valor e não vale a rigidez para 2 valores |
| `unidade` já existe, default `'kg'` | `KNOWLEDGE.md` §1: kg fixo sem tela de configuração, **mas o campo nasce no banco para não exigir migração depois** |
| `usuario_id` **denormalizado em `serie`** | Cada policy fica autossuficiente (sem subquery em `treino`), a RLS fica trivialmente auditável e a FF5 vira contagem direta. Custo: 16 bytes por linha e um trigger de consistência (abaixo) |
| `ordem smallint` | A ordem das séries dentro do treino é dado do domínio ("a queda de reps na última série" — `KNOWLEDGE.md` §1), e `criado_em` não sobrevive a edição |
| `on delete cascade` em `treino_id` | Apagar treino apaga suas séries. `exercicio_id` **sem** cascade: catálogo não some por acidente |

**Trigger de consistência do `usuario_id` denormalizado** (a única desvantagem da denormalização, fechada):

```sql
-- SEM `security definer`, de propósito: rodando com os privilégios do
-- chamador, a RLS de `treino` esconde o treino de outro usuário, o SELECT
-- volta vazio e o INSERT falha explicitamente aqui — em vez de depender
-- do WITH CHECK lá na frente.
create or replace function public.serie_herda_usuario()
returns trigger language plpgsql set search_path = public as $$
begin
  select t.usuario_id into new.usuario_id from public.treino t where t.id = new.treino_id;
  if new.usuario_id is null then
    raise exception 'treino_id % inexistente', new.treino_id;
  end if;
  return new;
end $$;

create trigger serie_usuario_id_bi before insert or update of treino_id
  on public.serie for each row execute function public.serie_herda_usuario();
```

### 3.3 RLS — e a armadilha do catálogo

```sql
alter table public.treino          enable row level security;
alter table public.serie           enable row level security;
alter table public.exercicio       enable row level security;
alter table public.grupo_muscular  enable row level security;

-- Dado de usuário: isolamento total por auth.uid() (FF5).
create policy treino_proprio on public.treino
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy serie_propria on public.serie
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- ⚠️ ARMADILHA: exercicio e grupo_muscular são CATÁLOGO COMPARTILHADO,
-- não dado de usuário. Aplicar `auth.uid()` aqui QUEBRA o catálogo:
-- ninguém enxerga exercício nenhum, porque catálogo não tem dono.
-- Elas precisam de RLS LIGADA (senão o PostgREST expõe escrita), com
-- policy de leitura para autenticado e ESCRITA SÓ POR MIGRAÇÃO/SEED.
-- Não "corrigir" isto depois: está correto assim, e por escrito.
create policy exercicio_leitura on public.exercicio
  for select to authenticated using (true);
create policy grupo_muscular_leitura on public.grupo_muscular
  for select to authenticated using (true);
```

> `(select auth.uid())` em vez de `auth.uid()` puro é intencional: o planner avalia a subquery uma vez por statement em vez de por linha. Confirmar na doc vigente do Supabase ao aplicar (E12).

**⚠️ Correção pós-1.1 — GRANT faltava, achado na verificação end-to-end da 1.2 (`migrations/0002_grants_authenticated.sql`).** RLS filtra **linha**; sem `GRANT` de base ao role, o Postgres nega o **objeto inteiro** antes de a RLS ser avaliada — sintoma real: `permission denied for table treino` mesmo com policy e sessão corretas. A 0001 acima **não inclui os GRANTs**; eles vivem na migração seguinte, de propósito (não se edita migração já aplicada e registrada no histórico remoto):

```sql
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.treino to authenticated;
grant select, insert, update, delete on public.serie to authenticated;
grant select on public.exercicio to authenticated;
grant select on public.grupo_muscular to authenticated;
```

### 3.4 FORA desta tarefa

Fluxo de login, telas de auth, provider Google (Fase 2 · tarefa 2.1) · qualquer coluna de offline/sync (`sincronizado_em`, `id_local`) — a Fase 2 acrescenta via migração · `dica_execucao` preenchida (Fase 4) · tabelas de análise/cache de parecer (não existem).

### 3.5 Seed mínimo — **TODO, entrada do dono**

A tarefa 1.2 é impossível sem exercícios no banco, e o catálogo de ~100 é Fase 4.

> **TODO — perguntar ao dono:** a lista dos **exercícios que ele realmente faz** (estimo 10–15), com nome de academia brasileira e grupo muscular primário. **Não inventar essa lista.** Sem ela, 1.2 não roda e 1.3 não tem fixture realista.

### 3.6 Auth na Fase 1

A Fase 1 **não constrói** telas de login. Assume um usuário já autenticado no Supabase (criado à mão no painel). As policies acima já são as definitivas — a Fase 2 só acrescenta os fluxos de entrada.

### 3.7 Check executável

```bash
npm run build                       # sai limpo, exit 0
supabase db reset                   # migração + seed aplicam sem erro
psql "$DATABASE_URL" -f scripts/ff5-rls.sql   # as DUAS linhas precisam imprimir 0
```

`scripts/ff5-rls.sql` — a FF5 como consulta, não como prosa. **Corrigido nesta revisão (achado 7 do QA):** a versão anterior só testava "existe alguma policy", que uma policy `using (true)` satisfaz sem proteger nada — a query não checava a parte que dá nome à FF5, `auth.uid()`. Agora são duas consultas, cada uma com a asserção que lhe cabe:

```sql
-- PARTE 1 — tabelas de USUÁRIO (fora da allowlist de catálogo) precisam
-- ter RLS ligada E ao menos uma policy que referencia auth.uid() DE FATO
-- em USING ou WITH CHECK — não só "existe alguma policy", que uma
-- `using (true)` satisfaria sem proteger nada. Falha FECHADA: varre TODA
-- tabela de public e subtrai a allowlist, em vez de listar as protegidas
-- (listar as protegidas deixaria passar em silêncio uma tabela nova da
-- Fase 2). Saída esperada: 0.
select count(*) as tabelas_sem_protecao_por_dono
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  -- ALLOWLIST: catálogo compartilhado, sem dono. Acrescentar aqui exige
  -- justificar por escrito por que a tabela não tem dado de usuário.
  and c.relname not in ('exercicio', 'grupo_muscular')
  and ( c.relrowsecurity = false
        or not exists (
             select 1 from pg_policies p
             where p.schemaname = 'public' and p.tablename = c.relname
               and (p.qual ilike '%auth.uid()%' or p.with_check ilike '%auth.uid()%')
           ) );

-- PARTE 2 — tabelas de CATÁLOGO (a allowlist acima) precisam ter RLS
-- LIGADA mesmo sem auth.uid() — senão o PostgREST expõe escrita (§3.3).
-- A Parte 1 as isenta da checagem de dono; esta parte fecha a outra
-- metade da exigência de §3.3, que antes não tinha verificação nenhuma.
-- Saída esperada: 0.
select count(*) as catalogo_sem_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('exercicio', 'grupo_muscular')
  and c.relrowsecurity = false;
```

### 3.8 Verificação end-to-end da 1.1

1. `supabase db reset` aplica migração + seed sem erro.
2. `scripts/ff5-rls.sql` imprime `0` nas **duas** linhas (tabelas de usuário sem `auth.uid()`; catálogo sem RLS).
3. Com o JWT do usuário A, `insert` em `serie` **referenciando o `treino_id` do usuário B** falha. *(Testar mandando `usuario_id` de B direto **não prova nada**: o trigger sobrescreve o campo a partir do treino e o insert passa. O vetor real é o `treino_id` alheio.)*
4. `insert` de série com `rir = 0` e `tipo='valendo'` **passa**; com `rir = 0` e `tipo='aquecimento'` **falha**.
5. `insert` com `tipo='cardio'` **falha** no CHECK.
6. `npm run build` sai limpo.

---

## 4. Tarefa 1.3 — Agregador · **TDD ESTRITO** (o núcleo)

> Ordem inegociável (ADR-005): **teste primeiro, com o número conferido à mão, depois o código.** Um teste escrito depois do código testa o que o código faz, não o que ele deveria fazer.
>
> Esta seção vem **antes** da 1.2 na spec de propósito: o agregador define a forma do dado, e a tela existe para alimentá-lo.

### 4.1 Arquivos

```
src/lib/analise/tipos.ts        ← ResumoCompacto, SerieValendo, entradas (§D2)
src/lib/analise/limiares.ts     ← TODA constante numérica, com ponteiro para KNOWLEDGE
src/lib/analise/e1rm.ts         ← calcularE1rm
src/lib/analise/volume.ts       ← calcularVolume, volumePorGrupoMuscular
src/lib/analise/series-dificeis.ts
src/lib/analise/frequencia.ts
src/lib/analise/estagnacao.ts
src/lib/analise/prs.ts
src/lib/analise/agregar.ts      ← montarResumoCompacto — a única exportação pública
src/lib/analise/*.test.ts       ← Vitest, um por módulo
```

### 4.2 `limiares.ts` — fonte única de todo número

A Fase 0 falhou o check do `CLAUDE.md` exatamente por **limiar duplicado**, e o achado mais grave do Inspetor foi um limiar duplicado que se contradizia. Este arquivo é a resposta estrutural: **nenhum outro arquivo do projeto, e nenhum outro documento, repete estes valores.**

```ts
/** RIR ≤ este valor = série difícil. Fonte: KNOWLEDGE.md §1 (inclui RIR 0). */
export const RIR_SERIE_DIFICIL: number = 0; // TODO: copiar de KNOWLEDGE.md §1
/** Faixa de referência de séries valendo por grupo/semana. Fonte: KNOWLEDGE.md §3.6. */
export const FAIXA_SERIES_SEMANAIS: [number, number] = [0, 0]; // TODO: copiar de KNOWLEDGE.md §3.6
/**
 * Semanas sem progresso = estagnação. KNOWLEDGE.md §3.7 dá uma FAIXA (3–4),
 * não um ponto — "TODO: copiar" não serve aqui, porque não há valor único
 * para copiar; alguém implementando escolheria 3 ou 4 sozinho, exatamente
 * a decisão sem dono que o placeholder existia para impedir (achado 6, QA).
 * RESOLVIDO nesta spec: 4. Motivo — alinha com JANELA_SEMANAS (mesmo
 * horizonte mental em todo o produto, em vez de dois períodos arbitrários
 * distintos) e é o extremo mais conservador da faixa 3–4 (menos alerta de
 * "estagnado" em falso). Convenção, não achado científico — mesmo rótulo
 * de honestidade de §3.7. Registrado em DECISIONS.md e KNOWLEDGE.md §3.7.
 */
export const SEMANAS_ESTAGNACAO: number = 4;

/** Teto de reps para e1RM confiável. Convenção prática. Fonte: SDD §2/D1. */
export const E1RM_REPS_MAX = 12;
/** Piso de cobertura de RIR. Convenção prática. Fonte: SDD §2/D3. */
export const COBERTURA_RIR_MINIMA = 0.60;

/** Janela de COMPARAÇÃO — deltas e tendência de e1RM (PRD §3). */
export const JANELA_SEMANAS = 4;
/**
 * Janela de LEITURA para estagnação. Detectar "N semanas sem progresso"
 * exige N+1 semanas de dado: com lookback = janela de comparação,
 * `estagnacoes` fica permanentemente vazia e a pergunta 2 do PRD
 * ("Onde eu empaquei?") não tem do que se alimentar.
 */
export const LOOKBACK_ESTAGNACAO_SEMANAS = SEMANAS_ESTAGNACAO + 1;

export const MAX_TENDENCIA_E1RM = 8;
export const MAX_ESTAGNACOES = 5;
export const MAX_PRS = 5;
export const MAX_GRUPOS = 12;
/** Somado contra os tetos acima em §D2/C1 — não é número redondo arbitrário. */
export const MAX_BYTES_RESUMO = 6144;
```

> `RIR_SERIE_DIFICIL` e `FAIXA_SERIES_SEMANAIS` seguem como **placeholder com `TODO: copiar`**: `KNOWLEDGE.md` já dá um valor único e inequívoco para cada um (RIR ≤ 3; faixa 10–20), então "copiar" é a ação certa — quem implementar copia do `KNOWLEDGE.md`, não da memória, e os testes de §4.5 falham enquanto os placeholders estiverem em `0`, que é a rede de segurança. `SEMANAS_ESTAGNACAO` é diferente e por isso **não** ficou como placeholder: `KNOWLEDGE.md` §3.7 dá uma faixa, não um valor, então não havia nada para "copiar" — a decisão precisava ser tomada em algum lugar, e este SDD é esse lugar (acima, `= 4`, com justificativa).

**Três janelas distintas, e elas não são a mesma coisa:**

| Janela | Para quê | Tamanho |
|---|---|---|
| Comparação | deltas de volume, tendência de e1RM | `JANELA_SEMANAS` |
| Leitura de estagnação | detectar N semanas sem progresso | `LOOKBACK_ESTAGNACAO_SEMANAS` |
| Histórico completo | linha de base dos PRs | tudo |

### 4.3 Assinatura pública

```ts
export function montarResumoCompacto(entrada: {
  /**
   * HISTÓRICO COMPLETO do usuário, já lido do banco POR OUTRA CAMADA.
   * O recorte das três janelas (§4.2) acontece AQUI DENTRO, não na camada
   * de dados — senão a matemática vaza para fora de src/lib/analise/ e
   * o PR vira "máximo dos últimos 30 dias" sem ninguém decidir isso.
   * Volume de dado de um usuário é pequeno; ler tudo é barato.
   */
  treinos: TreinoBruto[];
  exercicios: ExercicioBruto[];  // catálogo — inclui exercicio.unilateral (D3.5)
  /** C4: data de referência INJETADA. Nunca new Date() aqui dentro. */
  agora: Date;
  janelaSemanas?: number;        // default JANELA_SEMANAS
}): ResumoCompacto;
```

Função pura: mesma entrada → mesma saída, sempre. Sem `Date.now()`, sem `Math.random()`, sem I/O.

### 4.4 O que está **FORA** do agregador

**FF3, literal:** `src/lib/analise/` **não importa** `fetch`, nenhum cliente HTTP, nenhum SDK do Supabase, nenhum SDK da Gemini, nenhum módulo de `src/app/`. Não lê banco, não escreve banco, não monta prompt, não formata texto para humano, não decide layout. Recebe arrays, devolve objeto.

Também fora: qualquer prescrição (ADR-008 — o app analisa, não prescreve) e a regra de liberação semanal do botão (tarefa 1.0d, §8).

### 4.5 Casos de teste — **valores conferidos à mão**

**Fixture base `F1`** — exercício *Supino reto com barra* (peito), semana atual iniciada em **2026-07-27** (segunda), `agora = 2026-08-03T10:00:00Z`:

| # | tipo | reps | peso | rir |
|---|---|---|---|---|
| s0 | aquecimento | 10 | 20 | — |
| s1 | valendo | 10 | 50 | 2 |
| s2 | valendo | 8 | 50 | 0 |
| s3 | valendo | 6 | 50 | — |

Semana anterior (início 2026-07-20), mesmo exercício: duas séries valendo de `10 × 50`.

| ID | Caso | Valor esperado — **conferido à mão** |
|---|---|---|
| **T-V1** | Volume da semana atual em `F1` | `10×50 + 8×50 + 6×50 = 500+400+300 =` **1200** |
| **T-V2** | **FF4** — remover `s0` do fixture | Volume, e1RM, frequência e contagem de séries **idênticos** a T-V1. O aquecimento `10×20 = 200` **não** aparece em lugar nenhum |
| **T-V3** | Delta de volume vs. semana anterior (`2×(10×50) = 1000`) | `(1200−1000)/1000 =` **+20,0 %**, campo `delta_volume_pct` pré-calculado |
| **T-V4** | **Unilateral (D3.5)** — exercício com `exercicio.unilateral = true`, série `10 × 14` (rosca alternada) | Volume da série = `10 × 14 × 2 =` **280**, não 140. O `2×` vem do catálogo, não de campo na série |
| **T-V5** | **Peso corporal (D3.5)** — série `tipo='valendo'`, `peso_corporal_incluso=true`, `8 × 10` (barra fixa com 10 kg extra) | **Não** entra em `volume` nem em `volume_por_grupo_muscular` — nem a parte de 80 kg da carga externa. A série **conta** em `frequencia.treinos_semana_atual` e, se tiver RIR, em `series_dificeis` |
| **T-E1** | e1RM de `s1` (10×50) | `50 × (1 + 10/30) = 50 × 1,3333 =` **66,7 kg** |
| **T-E2** | e1RM de `s2` (8×50) | `50 × (1 + 8/30) = 50 × 1,26667 =` **63,3 kg** |
| **T-E3** | **Identidade** — série `1 × 100` | **100,0 kg** exatos. Epley cru daria 103,3 — falha |
| **T-E4** | e1RM da sessão em `F1` | **máximo** das elegíveis = **66,7** (não a média 63,3) |
| **T-E5** | **Teto de reps** — série valendo `25 × 20` | Volume soma **500**. `tendencia_e1rm` **não** contém a série. Nenhum campo "e1rm suspeito" existe (Regra da Presença) |
| **T-E6** | Exercício com **1 só** sessão elegível na janela | **Ausente** de `tendencia_e1rm` — não há tendência com um ponto |
| **T-D1** | Séries difíceis em `F1` | `total = 2` (s1 rir 2 e **s2 rir 0**), `series_valendo_com_rir = 2`, `series_valendo = 3` |
| **T-D2** | **RIR 0 conta** — fixture só com `rir=0` | Série difícil, **não** ignorada. É falha, o estímulo máximo |
| **T-D3** | **RIR ausente não é fácil** — s3 (`rir` null) | Não conta como difícil **e** permanece no denominador `series_valendo = 3` |
| **T-D4** | **Piso de cobertura** — 1 RIR em 5 séries valendo (20 %) | `series_dificeis` **ausente**; `cobertura_rir_insuficiente = { 1, 5 }` presente. Nenhum `0` aparece |
| **T-D5** | Cobertura exatamente no piso (3 de 5 = 60 %) | `series_dificeis` **presente** (comparação `>=`, não `>`) |
| **T-F1** | Frequência: **4 treinos** na semana atual, sendo **3** com ao menos uma série valendo e **1** só com aquecimento (nenhuma valendo) | `treinos_semana_atual = 3` — o treino só-aquecimento não entra na contagem (FF4). Fixture corrigido nesta revisão (achado 9 do QA): a versão anterior não dizia se o treino "aquecimento avulso" estava dentro ou fora dos 3, e por isso não dava sim/não |
| **T-F2** | Grupo muscular sem série valendo na janela | Aparece em `grupos_sem_estimulo` |
| **T-S1** | Exercício estável em e1RM **e** volume por `SEMANAS_ESTAGNACAO` semanas, com histórico de `LOOKBACK_ESTAGNACAO_SEMANAS` semanas | Entra em `estagnacoes` com `semanas_sem_progresso` correto. **Fixture precisa exceder `JANELA_SEMANAS`** — é o teste que prova que as janelas são independentes |
| **T-S2** | e1RM parado mas **volume subindo** | **Não** é estagnação (glossário exige as duas sem melhora) |
| **T-P1** | e1RM da semana atual acima de todo o **histórico** | Entra em `prs` com `valor_anterior` = melhor marca histórica |
| **T-P2** | e1RM da semana atual é máximo **da janela** mas **menor** que uma marca de 6 meses atrás | **Não** entra em `prs`. Um máximo de 4 semanas não é recorde, e chamá-lo assim é a frase enganosa que o validador numérico não pega |
| **T-R1** | **C1** — fixture de carga máxima (12 grupos, 8 exercícios, 5 estagnações, 5 PRs) | `JSON.stringify(resumo).length <= MAX_BYTES_RESUMO` |
| **T-R2** | **C2** — 40 exercícios distintos na entrada | `tendencia_e1rm.length <= 8`, ordenado por volume desc |
| **T-R3** | **C4** — chamar duas vezes com o mesmo `agora` | Saídas idênticas por `deepEqual` |
| **T-R4** | Janela sem nenhuma série valendo | Retorna resumo válido com listas vazias e **sem** campos de delta. Não lança |
| **T-R5** | Semana anterior sem dados | `delta_*` **ausentes** (não `0`) — Regra da Presença |
| **T-R6** | **`volume_semanal` (achado 5 do QA)** — 4 semanas, sendo uma sem nenhuma série valendo | `volume_semanal.length = JANELA_SEMANAS`; a semana sem treino aparece com `volume_total = 0` **explícito** (fato conhecido, não ausência) — diferente de T-R5, que trata delta contra semana **inexistente** |

### 4.6 Check executável da 1.3

```bash
npx vitest run src/lib/analise --coverage
# FF3 — precisa imprimir 0 ocorrências:
grep -rnE "from ['\"](node-fetch|axios|@supabase|@google/genai)|fetch\(" src/lib/analise/ | wc -l
grep -rn "new Date()" src/lib/analise/ | wc -l     # C4 — precisa ser 0
```

### 4.7 Verificação end-to-end da 1.3

Rodar o agregador sobre as séries reais gravadas pela tarefa 1.2, imprimir o `ResumoCompacto` em JSON, e **conferir à mão** dois números contra o histórico do dono: o volume da semana e o e1RM de um exercício. Bater os dois → agregador aprovado para alimentar 1.4.

---

## 5. Tarefa 1.2 — Tela mínima de registro de série

### 5.1 Arquivos

```
src/app/treino/page.tsx           ← lista/inicia treino
src/app/treino/[id]/page.tsx      ← registrar séries do treino
src/components/formulario-serie.tsx
src/lib/dados/treino.ts           ← leitura/escrita via Supabase (fora de analise/)
```

Campos do formulário, um por um: exercício (select do seed), `tipo` (aquecimento | valendo — **default valendo**), `reps`, `peso`, `rir` (visível **só** quando `tipo = valendo`, e **opcional**), `peso_corporal_incluso` (checkbox).

**`unilateral` não é campo do formulário.** É atributo do exercício escolhido, lido do catálogo — a tela mostra um indicador ("rosca alternada — reps contam por lado"), não um checkbox. O dono não re-declara isso a cada série.

### 5.2 FORA

Offline, Dexie, outbox, service worker (Fase 2) · "repetir última série" (Fase 2) · busca/filtro no catálogo (Fase 4) · qualquer polimento, animação ou gate visual (Fase 3) · edição e exclusão de série (não é Fase 1).

### 5.3 Check executável

Registrar **5 séries reais** — incluindo pelo menos um aquecimento, um `rir = 0`, uma série sem `rir`, e uma série de exercício unilateral do catálogo — e ver as 5 no Postgres:

```sql
select s.tipo, s.reps, s.peso, s.rir, e.unilateral, s.peso_corporal_incluso
from serie s join exercicio e on e.id = s.exercicio_id
order by s.criado_em desc limit 5;
```

### 5.4 Verificação end-to-end da 1.2

As 5 linhas aparecem com `usuario_id` correto (preenchido pelo trigger, não pelo cliente), o `rir = 0` gravado como `0` e **não** como `null`, e a série sem RIR gravada como `null` e **não** como `0`. Esta distinção é a fronteira entre "fácil" e "não sei" — se a tela a apagar, D3 inteira desmorona antes de começar.

---

## 6. Tarefa 1.4 — Route handler da Gemini · **D5**

### 6.1 Arquivos

```
src/app/api/analise/route.ts        ← ÚNICO lugar do repo que importa @google/genai
src/app/api/analise/prompt.ts       ← montarPrompt (função pura)
src/app/api/analise/validador.ts    ← validarNumeros (função pura)
src/app/api/analise/perguntas.ts    ← as 5 perguntas do PRD §3
```

> **E12 — ponto a verificar na implementação.** A doc vigente do `@google/genai` (googleapis.github.io/js-genai) mostra `new GoogleGenAI({ apiKey })` e `ai.models.generateContent({ model, contents, config: { systemInstruction, temperature, responseSchema } })`. **Confirmar antes de escrever**, em especial o nome exato do campo de saída estruturada (`responseMimeType` / `responseSchema`) e a forma de ler o texto (`response.text`). Para blindar a spec, o handler chama uma interface própria:
> ```ts
> // src/app/api/analise/gemini.ts
> export interface ClienteParecer {
>   gerar(sistema: string, usuario: string): Promise<string>;
> }
> ```
> Se a assinatura do SDK mudar, muda **um** arquivo.

### 6.2 Contrato do endpoint

`POST /api/analise` · corpo: `{ pergunta: 1|2|3|4|5 }` — **e nada mais**.

**O cliente não envia o resumo, e não envia séries.** O handler autentica, lê as séries do usuário no Supabase, chama `montarResumoCompacto`, monta o prompt. Isso torna estruturalmente impossível o cliente injetar dado cru no prompt, em vez de depender de o cliente se comportar.

Rejeições: sem sessão → 401 · `pergunta` fora de 1–5 → 400 · `resumo.versao !== 1` → 500 com log.

### 6.3 Como o resumo vira prompt

Três blocos, nesta ordem:

1. **`systemInstruction`** — papel e as travas:
   - "Você interpreta métricas de treino já calculadas. Escreva em português do Brasil, direto, sem jargão de coach."
   - **"Você NÃO faz contas. Todo número que você citar deve aparecer literalmente no JSON abaixo."**
   - **"Campo ausente significa dado indisponível. Diga que não há dado. NUNCA estime, complete ou infira valor ausente."**
   - "Não prescreva programa nem periodização (o app analisa o que foi feito)." — ADR-008
   - "Não dê instrução de execução, forma ou técnica de movimento." — ADR-007 / FF7
   - "Faixas de referência são convenção prática derivada de média de estudos, não alvo individual." — `KNOWLEDGE.md` §3.6
2. **O resumo**, como JSON literal entre delimitadores, precedido de "Estes são os únicos dados que existem:".
3. **A pergunta**, texto fixo de `perguntas.ts`, mais o critério de qualidade do PRD §3 explícito: *"Cite ao menos um nome de exercício e um número específicos deste JSON. Um parecer que serviria para qualquer pessoa é uma resposta errada."*

`temperature` baixa (0.2–0.4) — é interpretação de dado, não texto criativo. Valor final calibrado na tarefa 1.5 por leitura humana.

### 6.4 Como se impede o modelo de inventar número — e o que fazer quando ele inventa

Instrução de prompt é a alavanca **fraca**. A alavanca forte é o **validador determinístico**, aplicado a toda resposta antes de ela chegar à tela.

```ts
// src/app/api/analise/validador.ts — função PURA, sem rede
export function validarNumeros(
  parecer: string,
  resumo: ResumoCompacto,
  contexto: number[],            // inteiros ESTRUTURAIS que o prompt injetou
                                  // (tamanho de janela, contagens de item —
                                  // NUNCA prova especificidade, só evita falso intruso)
): { ok: true; citados: number[] }
| { ok: false; motivo: 'intrusos'; intrusos: number[] }
| { ok: false; motivo: 'sem_numero_do_dono' };
```

**As duas metades, e por que a segunda não é opcional.** Ausência de intruso prova só que o modelo **não inventou** número — um parecer com **zero** números passa nesse teste e é exatamente o conselho genérico que o PRD §3 chama de falha. Por isso o validador também exige a metade positiva. **Correção sobre uma versão anterior desta spec:** a metade positiva não pode casar contra o mesmo conjunto branco da anti-intruso — "nas últimas 4 semanas" citaria `contexto` (o tamanho da janela) e passaria como se fosse específico do dono, quando é genérico o bastante para servir a qualquer pessoa. Por isso o conjunto branco é **dividido em dois**, com papéis diferentes:

- **Conjunto DADOS** — valores numéricos substantivos de `resumo`: volumes (inclui `volume_por_exercicio[].volume`/`.peso_referencia`/`.reps_referencia`, 2026-08-08), e1RMs, deltas percentuais, `series_dificeis.total`/`series_valendo`/`series_valendo_com_rir`, `frequencia.treinos_semana_atual`, `estagnacoes[].semanas_sem_progresso`, `prs[].valor`. **Isto é o que prova que o parecer é sobre este dono.**
- **Conjunto CONTEXTO** — `janela_semanas`, `semanas_com_dados`, comprimento de listas, limiares citados no prompt (`E1RM_REPS_MAX`, `COBERTURA_RIR_MINIMA` etc.) e — ver correção de data abaixo — os componentes numéricos das datas de `periodo`. **Isto só evita falso positivo de "intruso"; nunca conta como prova de especificidade.**

Algoritmo:
1. Extrair de `resumo` os valores numéricos substantivos (definição acima) → **conjunto DADOS**.
2. Montar **conjunto CONTEXTO**: os inteiros de `contexto`, **mais os componentes de data** (ver correção abaixo).
3. **Conjunto branco completo** = DADOS ∪ CONTEXTO, mais os arredondamentos de cada valor a 0 e 1 casas decimais.
4. Extrair do parecer todo token numérico (`/-?\d+(?:[.,]\d+)?/g`), normalizando vírgula decimal.
5. Um token passa (não é intruso) se existir `y` no conjunto branco **completo** com `|x − y| ≤ max(0,05; 0,01 × |y|)` — tolerância declarada, para não reprovar arredondamento legítimo ("66,7" contra 66,666…).
6. Tokens sobrando = **intrusos** → `motivo: 'intrusos'`.
7. Nenhum intruso, **mas** nenhum token casando especificamente com o conjunto **DADOS** (não CONTEXTO) → `motivo: 'sem_numero_do_dono'`. `citados` no retorno `ok: true` é a interseção com DADOS.

**Correção — a data quebrava todo parecer que cita a semana.** `periodo.semana_atual_inicio` é uma `string` ISO ("2026-07-27"); o algoritmo original só varria valores **numéricos** de `resumo`, então "2026", "07" e "27" nunca entravam em conjunto nenhum. E o `DESIGN.md` §3.6.2 **obriga** o cabeçalho do parecer a trazer o intervalo da semana e a data de emissão — todo parecer citaria esses números e seria rejeitado como "intruso". Fix: ao montar o conjunto CONTEXTO (passo 2), extrair os componentes numéricos (ano, mês, dia, e as formas de 2 dígitos) de `periodo.semana_atual_inicio`, do fim de semana calculado (`+6 dias`) e de `agora` (data de emissão). Datas são estrutura que o próprio app injeta no prompt, não uma alegação do modelo sobre o dono — por isso pertencem a CONTEXTO, nunca a DADOS.

> **O que este validador NÃO pega — e a spec diz isso em voz alta.** Ele detecta número **fabricado**, não número **mal atribuído**. "Seu supino subiu 20%" quando o resumo diz que **caiu** 20% passa em todos os portões automáticos: o número 20 existe em DADOS, o sinal e o sujeito não são verificáveis por casamento de token. **A única defesa contra isso é a leitura humana das tarefas 1.5 e 1.6.** Tratar o validador como cobertura completa é o modo de falha desta spec — ver §8.

**Política em caso de intruso** (a pergunta que a tarefa faz, respondida de frente):

| Tentativa | Ação |
|---|---|
| 1ª falha | **Uma** nova chamada, com o parecer rejeitado e os intrusos anexados: *"Os números X e Y não existem nos dados. Reescreva usando apenas números do JSON."* |
| 2ª falha | **Não exibir o parecer.** Renderizar um **fallback determinístico** montado só do resumo, por template em código, sem prosa do LLM — e dizer na tela que a análise interpretativa falhou desta vez |
| Sempre | Logar pergunta, intrusos e resposta bruta. Reincidência é sinal de que o prompt ou o contrato do resumo precisa mudar, não de que o usuário teve azar |

Nunca exibir um parecer que falhou na validação, nem "com aviso". **Um parecer confiante com número errado é pior que nenhum parecer** (ADR-003).

### 6.5 FORA

Coach 24h e qualquer endpoint de chat (Fase 5) · streaming da resposta · cache/persistência de pareceres · retry por quota (depende da 1.0c) · qualquer geração de dica de execução (FF7 — proibido para sempre).

### 6.6 Check executável — FF1 e FF2

```bash
# FF1 — @google/genai só sob src/app/api/. Precisa imprimir 0:
grep -rn "@google/genai" src/ --include=*.ts --include=*.tsx | grep -v "^src/app/api/" | wc -l

# FF2 — build COM a chave no ambiente (build sem chave passa vazio e não prova nada — A5).
# A guarda não é zelo: com $GEMINI_API_KEY vazio, o grep casa a string vazia,
# encontra TUDO e o check "reprova" por motivo errado — ou, com -q, passa por motivo errado.
[ -n "$GEMINI_API_KEY" ] || { echo "FF2: chave ausente do ambiente, check inválido"; exit 1; }
npm run build
# Corrigido na verificação real da 1.4 (2026-08-05): restringir a .next/static/
# (o que o navegador de fato baixa) e .next/server/ (código server compilado).
# NÃO variar para ".next/" inteiro — a partir do Next 16, o Turbopack persiste
# cache de compilação em disco (.next/cache/turbopack/), que pode conter o
# valor resolvido de env vars server-side como artefato interno do bundler.
# Isso não é vazamento ao cliente: .next/cache/ já está no .gitignore, nunca é
# servido via HTTP, e é comportamento documentado do Turbopack persistente —
# mas ele faz o grep ingênuo em ".next/" "reprovar" por motivo que não existe.
grep -r "$GEMINI_API_KEY" .next/static/ .next/server/ | wc -l   # precisa imprimir 0
```

Mais os testes unitários de `validarNumeros`:
- parecer citando um valor de DADOS (ex.: o volume real) → `ok: true`, e o valor aparece em `citados`;
- parecer citando "seu supino subiu 15%" quando o resumo diz 20% → `ok: false, intrusos: [15]`;
- "66,7" contra resumo `66,666…` → `ok: true` (tolerância);
- parecer citando **só** números de CONTEXTO ("nas últimas 4 semanas", sem nenhum valor de DADOS) → `ok: false, motivo: 'sem_numero_do_dono'` — é o teste que prova que a metade positiva não é enganada por número genérico;
- parecer citando a data da semana no formato do cabeçalho do `DESIGN.md` §3.6.2 ("27/07 a 02/08") **e** um valor de DADOS → `ok: true`, sem os componentes de data aparecerem como intrusos.

### 6.7 Verificação end-to-end da 1.4

`curl -X POST /api/analise -d '{"pergunta":2}'` com sessão válida devolve um parecer em PT-BR. Nos logs do servidor: o prompt enviado contém **zero** linhas de série crua — só o JSON do resumo. FF1 e FF2 imprimem 0.

---

## 7. Tarefa 1.5 — Botão Análise, as 5 perguntas, exibição do parecer

### 7.1 Arquivos

```
src/app/analise/page.tsx          ← botão, as 5 perguntas, o parecer
src/components/parecer.tsx        ← renderiza texto + ressalvas obrigatórias
```

**Ressalvas que a tela carrega, não esconde** (não são rodapé decorativo — são o que separa este app de conselho inventado):
- faixa de referência de volume = convenção prática, base majoritariamente de homens jovens treinados, sem teto validado (`KNOWLEDGE.md` §3.6);
- estagnação de N semanas = convenção de mercado, não critério clínico (§3.7);
- e1RM acima do teto de reps não é reportado, e por quê (§D1);
- **exercício de peso corporal não entra no volume mostrado** — a série conta, o volume dela não é somado (D3.5). Declarar isso onde o número de volume aparece, não em rodapé genérico.

### 7.2 FORA

Gráficos (Fase 3) · histórico de pareceres · compartilhar/exportar (escopo negativo do PRD §5) · gate visual e contraste AA medido (Fase 3) · **regra de liberação semanal do botão** (tarefa 1.0d — §8).

### 7.3 Check executável

Gerar **3 pareceres** sobre dados reais do dono. Para cada um, **critério A6**: contém ao menos um nome de exercício do catálogo dele **e** ao menos um número que existe no resumo.

| Metade | Como se verifica | Automatizável? |
|---|---|---|
| Nenhum número inventado | `validarNumeros` → sem `intrusos` | ✅ |
| Ao menos um número real citado | `validarNumeros` → `citados.length > 0` | ✅ |
| O nome do exercício é do catálogo dele | leitura humana | ❌ |
| O número está atribuído ao exercício e ao **sentido** certos | **leitura humana — insubstituível** (§6.4) | ❌ |

**O teste que realmente importa:** apagar mentalmente o nome do dono do parecer. Se o texto ainda faria sentido para outra pessoa qualquer, **falhou** — é conselho genérico, não o produto (PRD §3, §8).

### 7.4 Verificação end-to-end da Fase 1 inteira

Uma passagem contínua, sem atalho: registrar séries na tela (1.2) → elas aparecem no Postgres com RLS ativa (1.1) → o agregador produz um resumo cujos dois primeiros números conferem à mão (1.3) → o botão Análise chama o handler, que envia só o resumo (1.4) → o parecer cita exercício e número reais e passa o validador (1.5).

Isso entrega a tarefa **1.6** ao dono: ele lê os 3 pareceres e diz se convence.

---

## 8. TODOs e perguntas ao dono

**Unilateral e peso corporal — já decididos, não reabrir.** `DECISIONS.md` (2026-08-04) fechou os dois: unilateral dobra o volume via atributo do exercício (D3.5, §3.2, §4.5 T-V4); peso corporal fica fora do volume, contando só em frequência e série difícil (D3.5, §4.5 T-V5). Esta versão da spec já incorpora as duas.

**Pergunta que permanece aberta:**

1. **Semana de análise = ISO-8601 (segunda a domingo)?** Adotei isso como padrão técnico do agregador. **Diferente** da tarefa 1.0d, que decide quando o *botão* libera — mas as duas precisam concordar.

**TODOs bloqueantes já registrados no `PROGRESS.md`:**

| # | O quê | Bloqueia |
|---|---|---|
| 1.0c | Quota real da Gemini medida no console | Política de erro/retry da 1.4; premissa do ADR-001 |
| 1.0d | Regra de liberação semanal do botão Análise | Fechamento da 1.5 |
| §3.5 | Lista dos exercícios que o dono realmente faz | **1.2 e 1.3** — sem seed não há tela nem fixture realista |

**O ponto mais frágil desta spec, declarado e não escondido.** O `validarNumeros` (§6.4) é a defesa central contra o modo de falha que o ADR-003 existe para evitar — e ele cobre **metade** do problema. Pega número **fabricado**; não pega número **mal atribuído**. "Seu supino subiu 20%" quando o resumo diz que caiu 20%, ou quando os 20% eram do agachamento, passa em todos os portões automáticos desta fase. A cobertura restante é **exclusivamente humana**, nas tarefas 1.5 e 1.6, e por isso o portão do dono na 1.6 não é formalidade de fim de fase: é o único teste que existe para essa classe de erro. Se a Fase 1 fechar tratando o validador como cobertura completa, o produto volta a poder mentir com confiança — só que com números verdadeiros.

**TODOs técnicos desta spec (E12 — verificar doc vigente na implementação, não fixar de memória):**

- Assinatura do cliente Supabase no App Router (`@supabase/ssr`, manuseio de cookies) — §3.1.
- Assinatura de `@google/genai`: construção do cliente, `generateContent`, campo de saída estruturada, leitura do texto — §6.1. Mitigado pela interface `ClienteParecer`.
- Registrar `E1RM_REPS_MAX = 12` e `COBERTURA_RIR_MINIMA = 0,60` em `KNOWLEDGE.md` §1 ao fechar a 1.3, com o rótulo de convenção prática — para que este SDD deixe de ser a fonte deles (P7).
