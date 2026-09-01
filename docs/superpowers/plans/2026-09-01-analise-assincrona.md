# Geração Assíncrona da Análise Semanal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O botão "Solicitar Análise" devolve o controle da tela em ~1s em vez de travar 30-50s+ esperando a Gemini; o parecer nasce como rascunho no banco, gerado em segundo plano, e pousa em "Pareceres salvos" (`/ajustes/relatorios`) pra a pessoa confirmar ("Salvar") ou descartar.

**Architecture:** A tabela `parecer` (§10) ganha `status`/`confirmado` e vira também o lugar onde o rascunho em geração mora — nasce `status='gerando'` no `POST /api/analise`, que devolve `202` quase na hora e agenda o trabalho pesado (Gemini + retry + fallback, lógica que já existe) via `after()` do Next.js. Uma trava persistida no banco (não em estado local) impede duas gerações simultâneas, e sobrevive a trocar de tela. Rascunho pronto não confirmado expira sozinho em 24h; geração abandonada (crash no meio do `after()`) libera a trava em 5min — os dois por limpeza preguiçosa, sem cron.

**Tech Stack:** Next.js 16 App Router (`after()` de `next/server`), Supabase (Postgres + Auth), TypeScript.

**Spec de referência:** `SDD.md` §11. Decisão de mecanismo: `DECISIONS.md`, entrada 2026-09-01.

**Convenção de teste deste projeto, que este plano segue à risca:** módulos de I/O em `src/lib/dados/*.ts` não têm teste unitário — são verificados ao vivo, com usuário QA descartável (`QA.md`). Só módulos de lógica pura (`src/lib/analise/*`) têm `.test.ts`, e nenhum deles muda de comportamento nesta feature (§11.6) — nenhuma task deste plano adiciona `.test.ts` novo por essa razão.

---

### Task 1: Worktree isolado

**Por quê:** precedente já estabelecido neste projeto (colisão de sessões registrada em `PROGRESS.md`, 2026-08-30) — todo trabalho novo entra por worktree próprio, nunca direto em `C:\lastro`.

- [ ] **Passo 1: Criar o worktree e a branch**

```bash
cd C:\lastro
git status --short
git checkout main
git pull origin main
git worktree add ../lastro-analise-assincrona -b feat/analise-assincrona main
```

Esperado: `git status --short` sem saída antes de criar o worktree; ao final, `C:\lastro-analise-assincrona` existe, checked out em `feat/analise-assincrona`.

- [ ] **Passo 2: Instalar dependências e copiar `.env.local`**

```bash
cd C:\lastro-analise-assincrona
npm install
```

Copiar `C:\lastro\.env.local` para `C:\lastro-analise-assincrona\.env.local` (mesmas credenciais do projeto hospedado, não há stack local). **Nunca commitado** — apagar ao final do trabalho neste worktree (Task 12).

- [ ] **Passo 3: Confirmar os 4 gates rodam limpos ANTES de qualquer mudança**

```bash
npm run lint
npx vitest run
npm run build
npx tsc --noEmit
```

Esperado: os 4 passam. Se algo falhar aqui, **pare** — não é problema deste plano, é estado quebrado do `main` que precisa ser investigado antes de continuar.

---

### Task 2: Migration `0018_parecer_geracao_assincrona.sql`

**Files:**
- Create: `supabase/migrations/0018_parecer_geracao_assincrona.sql`

- [ ] **Passo 1: Escrever a migration**

```sql
-- supabase/migrations/0018_parecer_geracao_assincrona.sql

-- Geração assíncrona da Análise Semanal (SDD.md §11, achado do dono
-- 2026-09-01): a tabela `parecer` (0016) guardava só pareceres já
-- confirmados. Agora também guarda o rascunho enquanto gera e enquanto
-- aguarda "Salvar"/"Descartar" — daí `status` e `confirmado` novos, e
-- `texto`/`evidencia` viram nullable (não existem ainda quando
-- status = 'gerando').
alter table public.parecer
  add column status text not null default 'pronto',
  add column confirmado boolean not null default true,
  alter column texto drop not null,
  alter column evidencia drop not null;

alter table public.parecer
  add constraint parecer_status_valido check (status in ('gerando', 'pronto'));

-- Invariante de conteúdo: 'gerando' é sempre rascunho vazio e não
-- confirmado; 'pronto' sempre tem o texto e a evidência que a Gemini (ou
-- o fallback determinístico) produziu.
alter table public.parecer
  add constraint parecer_conteudo_consistente check (
    (status = 'gerando' and texto is null and evidencia is null and confirmado = false)
    or (status = 'pronto' and texto is not null and evidencia is not null)
  );

-- GRANT de update, ausente desde 0016 ("editar um parecer salvo" continua
-- fora de escopo). Column-level: só as colunas que o ciclo de vida do
-- rascunho precisa tocar (route handler completando a geração; "Salvar"
-- confirmando). `pergunta`, `pergunta_texto`, `idioma`, `usuario_id`,
-- `criado_em` continuam imutáveis pela aplicação — mesmo padrão de
-- `modelo_treino_exercicio` (reps/peso, ADR-010).
grant update (status, texto, evidencia, aviso_falha_interpretativa, confirmado)
  on public.parecer to authenticated;
```

- [ ] **Passo 2: Aplicar no projeto hospedado**

```bash
cd C:\lastro-analise-assincrona
npx supabase link --project-ref tbkzcqfvafznxallyfqk
npx supabase db push
```

Esperado: `db push` lista `0018_parecer_geracao_assincrona.sql` como nova e aplica sem erro. **Se recusar por divergência de histórico de migração** (dívida conhecida, `DECISIONS.md` 2026-08-27 (2)): aplicar via `npx supabase db query --linked -f supabase/migrations/0018_parecer_geracao_assincrona.sql` e registrar à mão em `supabase_migrations.schema_migrations`, mesmo caminho já usado pela `0015`/`0016`. Não rodar `migration repair`.

- [ ] **Passo 3: Verificar os CHECK constraints com uma linha de teste**

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
function get(k) { return env.match(new RegExp('^' + k + '=(.*)\$', 'm'))[1].trim(); }
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const adminKey = get('SUPABASE_SERVICE_ROLE_KEY');
const admin = createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  const senha = 'Qa!verifica1';
  const email = 'qa.parecer.check.' + Date.now() + '@lastro.test';
  const { data: user } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });

  const { error: erroGerandoComTexto } = await admin.from('parecer').insert({
    usuario_id: user.user.id, pergunta: 5, pergunta_texto: 'x', idioma: 'pt-BR',
    status: 'gerando', confirmado: false, texto: 'não devia ser permitido',
  });
  console.log('gerando com texto (esperado: erro de CHECK):', erroGerandoComTexto?.message ?? 'PASSOU SEM ERRO — BUG');

  const { error: erroGerandoOk } = await admin.from('parecer').insert({
    usuario_id: user.user.id, pergunta: 5, pergunta_texto: 'x', idioma: 'pt-BR',
    status: 'gerando', confirmado: false,
  });
  console.log('gerando sem texto (esperado: sucesso):', erroGerandoOk?.message ?? 'ok');

  await admin.auth.admin.deleteUser(user.user.id);
})();
"
```

Esperado: a primeira inserção falha com erro de `parecer_conteudo_consistente`; a segunda passa.

- [ ] **Passo 4: Commit**

```bash
git add supabase/migrations/0018_parecer_geracao_assincrona.sql
git commit -m "feat(parecer): migration da geração assíncrona (SDD.md §11.1)"
```

---

### Task 3: `src/lib/dados/parecer.ts` — rascunho, trava, confirmação

**Files:**
- Modify: `src/lib/dados/parecer.ts`

- [ ] **Passo 1: Reescrever o módulo inteiro**

```typescript
// lastro · SDD.md §10.1/10.3, §11.1-§11.2 — histórico opt-in de pareceres
// salvos + rascunho em geração assíncrona. Mesmo padrão de
// src/lib/dados/treino.ts: Server Actions, sem cache, `usuario_id`
// sempre resolvido do lado do servidor a partir da sessão.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { NumeroPergunta } from "@/app/api/analise/perguntas";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";
import type { Idioma } from "@/lib/dados/idioma";

/** Acima disso, uma linha 'gerando' é tratada como abandonada — não trava mais gerações novas (SDD.md §11.2). */
export const LIMITE_GERACAO_TRAVADA_MINUTOS = 5;
/** Rascunho pronto (status='pronto', confirmado=false) sem decisão do dono expira sozinho (SDD.md §11.2). */
export const EXPIRA_RASCUNHO_HORAS = 24;

async function usuarioAutenticadoOuErro() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }
  return { supabase, user };
}

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * Limpeza preguiçosa (SDD.md §11.2), sem cron: roda antes de qualquer
 * leitura/decisão sobre o rascunho do usuário. Apaga geração abandonada
 * (presa em 'gerando' além do limite) e rascunho pronto expirado (não
 * confirmado em 24h).
 */
async function limparRascunhosExpirados(
  supabase: ClienteSupabaseServidor,
  usuarioId: string,
): Promise<void> {
  const geracaoTravadaDesde = new Date(
    Date.now() - LIMITE_GERACAO_TRAVADA_MINUTOS * 60_000,
  ).toISOString();
  const rascunhoExpiradoDesde = new Date(
    Date.now() - EXPIRA_RASCUNHO_HORAS * 3_600_000,
  ).toISOString();

  await supabase
    .from("parecer")
    .delete()
    .eq("usuario_id", usuarioId)
    .or(
      `and(status.eq.gerando,criado_em.lt.${geracaoTravadaDesde}),and(status.eq.pronto,confirmado.eq.false,criado_em.lt.${rascunhoExpiradoDesde})`,
    );
}

export type StatusParecer = "gerando" | "pronto";

export type ParecerSalvo = {
  id: string;
  pergunta: NumeroPergunta;
  perguntaTexto: string;
  texto: string | null;
  avisoFalhaInterpretativa: boolean;
  evidencia: EvidenciaParaTela | null;
  idioma: Idioma;
  criadoEm: string;
  status: StatusParecer;
  confirmado: boolean;
};

type LinhaParecer = {
  id: string;
  pergunta: number;
  pergunta_texto: string;
  texto: string | null;
  aviso_falha_interpretativa: boolean;
  evidencia: EvidenciaParaTela | null;
  idioma: string;
  criado_em: string;
  status: StatusParecer;
  confirmado: boolean;
};

const COLUNAS_PARECER =
  "id, pergunta, pergunta_texto, texto, aviso_falha_interpretativa, evidencia, idioma, criado_em, status, confirmado";

function paraParecerSalvo(linha: LinhaParecer): ParecerSalvo {
  return {
    id: linha.id,
    pergunta: linha.pergunta as NumeroPergunta,
    perguntaTexto: linha.pergunta_texto,
    texto: linha.texto,
    avisoFalhaInterpretativa: linha.aviso_falha_interpretativa,
    evidencia: linha.evidencia,
    idioma: linha.idioma as Idioma,
    criadoEm: linha.criado_em,
    status: linha.status,
    confirmado: linha.confirmado,
  };
}

/** Todos os pareceres do usuário logado (RLS filtra) — inclui rascunho em voo/aguardando decisão, se houver, sempre no topo (mais recente primeiro). */
export async function listarPareceres(): Promise<ParecerSalvo[]> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  await limparRascunhosExpirados(supabase, user.id);

  const { data, error } = await supabase
    .from("parecer")
    .select(COLUNAS_PARECER)
    .order("criado_em", { ascending: false });
  if (error) {
    throw new Error(`Falha ao listar pareceres: ${error.message}`);
  }

  return ((data ?? []) as unknown as LinhaParecer[]).map(paraParecerSalvo);
}

/** Rascunho em geração do usuário logado, se houver — usado pra travar o botão de pergunta ao carregar a tela (SDD.md §11.4). */
export async function buscarRascunhoEmAndamento(): Promise<{
  id: string;
  perguntaTexto: string;
} | null> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  await limparRascunhosExpirados(supabase, user.id);

  const { data, error } = await supabase
    .from("parecer")
    .select("id, pergunta_texto")
    .eq("status", "gerando")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar rascunho em andamento: ${error.message}`);
  }
  if (!data) return null;

  return { id: data.id, perguntaTexto: data.pergunta_texto };
}

/** Um parecer específico — RLS garante que só resolve se for do dono da sessão. */
export async function buscarParecer(id: string): Promise<ParecerSalvo | null> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data, error } = await supabase
    .from("parecer")
    .select(COLUNAS_PARECER)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar parecer: ${error.message}`);
  }
  if (!data) return null;

  return paraParecerSalvo(data as unknown as LinhaParecer);
}

/** Confirma um rascunho pronto — vira parecer permanente (SDD.md §11.4). */
export async function confirmarParecer(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase
    .from("parecer")
    .update({ confirmado: true })
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao confirmar parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}

/** Exclui um parecer — serve tanto "Excluir" (já confirmado) quanto "Descartar" (rascunho pronto não confirmado). */
export async function excluirParecer(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("parecer").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao excluir parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}
```

**Nota:** `salvarParecer` e `NovoParecerInput` são **removidos** — não existe mais o caminho de inserir um parecer novo já pronto a partir do cliente; toda linha nasce `status='gerando'` dentro do route handler (Task 4).

- [ ] **Passo 2: Rodar os gates**

```bash
npx tsc --noEmit
```

Esperado: erros novos **esperados** neste ponto — `analise-interativa.tsx` e `pareceres-salvos.tsx` ainda importam `salvarParecer` (removida) e usam o shape antigo de `ParecerSalvo`. Isso é normal até as Tasks 5-6; **não** corrigir esses arquivos aqui.

- [ ] **Passo 3: Commit**

```bash
git add src/lib/dados/parecer.ts
git commit -m "feat(parecer): rascunho, trava e confirmação (SDD.md §11.1-§11.2)"
```

---

### Task 4: Route handler `/api/analise` — `202` + `after()`

**Files:**
- Modify: `src/app/api/analise/route.ts`

- [ ] **Passo 1: Ajustar os imports do topo**

Trocar:

```typescript
import { NextResponse } from "next/server";
```

Por:

```typescript
import { NextResponse, after } from "next/server";
```

Trocar:

```typescript
import { perguntaValida } from "./perguntas";
```

Por:

```typescript
import { perguntaValida, perguntasDoIdioma, type NumeroPergunta } from "./perguntas";
```

Adicionar, junto dos outros imports de tipo:

```typescript
import type { EvidenciaParaTela } from "./evidencia";
```

Adicionar:

```typescript
import {
  LIMITE_GERACAO_TRAVADA_MINUTOS,
  EXPIRA_RASCUNHO_HORAS,
} from "@/lib/dados/parecer";
```

- [ ] **Passo 2: Extrair a geração pra uma função nomeada, chamada dentro do `after()`**

Todo o corpo atual do `try` do `POST`, a partir de `const [treinos, exercicios] = await Promise.all(...)` (linha ~302 do arquivo original) até o fechamento do `catch (erroGeral)` (linha ~394), sai do `POST` e vira esta função nova, adicionada logo acima de `export async function POST`:

```typescript
async function gerarESalvarParecer({
  supabase,
  rascunhoId,
  pergunta,
  idioma,
}: {
  supabase: ClienteSupabaseServidor;
  rascunhoId: string;
  pergunta: NumeroPergunta;
  idioma: Idioma;
}): Promise<void> {
  async function salvar(campos: {
    texto: string;
    avisoFalhaInterpretativa: boolean;
    evidencia: EvidenciaParaTela;
  }) {
    const { error } = await supabase
      .from("parecer")
      .update({
        status: "pronto",
        texto: campos.texto,
        evidencia: campos.evidencia,
        aviso_falha_interpretativa: campos.avisoFalhaInterpretativa,
      })
      .eq("id", rascunhoId);
    if (error) {
      console.error("[analise] falha ao salvar parecer gerado:", error.message);
    }
  }

  try {
    const [treinos, exercicios] = await Promise.all([
      carregarTreinosDoUsuario(supabase),
      carregarExercicios(supabase, idioma),
    ]);

    const agora = paraDataUTC(dataLocalBrasil());
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });

    if (resumo.versao !== 1) {
      throw new Error(`resumo em versão inesperada: ${resumo.versao}`);
    }

    const { sistema, usuario, contexto } = montarPrompt(resumo, pergunta, agora, idioma);
    const cliente = new ClienteParecerGemini();
    const evidencia = montarEvidenciaParaTela(resumo);

    let respostaUm: string | null = null;
    try {
      respostaUm = await cliente.gerar(sistema, usuario);
    } catch (erroGiac) {
      console.error("[analise] falha na chamada inicial da Gemini:", erroGiac);
    }

    if (respostaUm) {
      let resultado = validarNumeros(respostaUm, resumo, contexto, idioma);
      console.log("[analise] tentativa 1", { pergunta, resultado, respostaBruta: respostaUm });

      if (resultado.ok) {
        await salvar({ texto: respostaUm, avisoFalhaInterpretativa: false, evidencia });
        return;
      }

      const instrucaoRetry =
        resultado.motivo === "intrusos"
          ? INSTRUCAO_RETRY_INTRUSOS_POR_IDIOMA[idioma](resultado.intrusos)
          : INSTRUCAO_RETRY_SEM_NUMERO_POR_IDIOMA[idioma];
      const usuarioRetry = [
        usuario,
        "",
        REJEITADA_POR_IDIOMA[idioma](respostaUm),
        instrucaoRetry,
      ].join("\n\n");

      try {
        const respostaDois = await cliente.gerar(sistema, usuarioRetry);
        resultado = validarNumeros(respostaDois, resumo, contexto, idioma);
        console.log("[analise] tentativa 2", { pergunta, resultado, respostaBruta: respostaDois });

        if (resultado.ok) {
          await salvar({ texto: respostaDois, avisoFalhaInterpretativa: false, evidencia });
          return;
        }
      } catch (erroRetry) {
        console.error("[analise] falha no retry da Gemini:", erroRetry);
      }
    }

    // 2ª falha ou indisponibilidade da API: Fallback determinístico + aviso
    // (SDD.md §6.4) — a evidência estruturada continua íntegra.
    await salvar({
      texto: fallbackDeterministico(resumo, idioma),
      avisoFalhaInterpretativa: true,
      evidencia,
    });
  } catch (erroGeral) {
    // Sem HTTP response pra devolver aqui (o cliente já recebeu o 202).
    // A linha fica em 'gerando' — a trava de LIMITE_GERACAO_TRAVADA_MINUTOS
    // (SDD.md §11.2) libera sozinha, sem intervenção.
    console.error("[analise] erro inesperado ao gerar parecer:", erroGeral);
  }
}
```

- [ ] **Passo 3: Reescrever o `POST` — curto, autentica, trava, inicia**

Substituir o `export async function POST` inteiro (do original) por:

```typescript
export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();
  if (erroAuth || !user) {
    return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const pergunta = (corpo as { pergunta?: unknown } | null)?.pergunta;
  if (!perguntaValida(pergunta)) {
    return NextResponse.json(
      { erro: "pergunta precisa ser 1, 2, 3, 4 ou 5." },
      { status: 400 },
    );
  }

  const idioma = await obterIdioma();

  // Limpeza preguiçosa (SDD.md §11.2) antes de checar a trava.
  const geracaoTravadaDesde = new Date(
    Date.now() - LIMITE_GERACAO_TRAVADA_MINUTOS * 60_000,
  ).toISOString();
  const rascunhoExpiradoDesde = new Date(
    Date.now() - EXPIRA_RASCUNHO_HORAS * 3_600_000,
  ).toISOString();
  await supabase
    .from("parecer")
    .delete()
    .eq("usuario_id", user.id)
    .or(
      `and(status.eq.gerando,criado_em.lt.${geracaoTravadaDesde}),and(status.eq.pronto,confirmado.eq.false,criado_em.lt.${rascunhoExpiradoDesde})`,
    );

  const { data: emAndamento } = await supabase
    .from("parecer")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("status", "gerando")
    .limit(1)
    .maybeSingle();
  if (emAndamento) {
    return NextResponse.json({ erro: "geracao_em_andamento" }, { status: 409 });
  }

  const PERGUNTAS = perguntasDoIdioma(idioma);
  const { data: rascunho, error: erroInsert } = await supabase
    .from("parecer")
    .insert({
      usuario_id: user.id,
      pergunta,
      pergunta_texto: PERGUNTAS[pergunta as NumeroPergunta],
      idioma,
      status: "gerando",
      confirmado: false,
    })
    .select("id")
    .single();
  if (erroInsert || !rascunho) {
    console.error("[analise] falha ao criar rascunho:", erroInsert?.message);
    return NextResponse.json({ erro: "Falha ao iniciar a análise." }, { status: 500 });
  }

  after(() =>
    gerarESalvarParecer({
      supabase,
      rascunhoId: rascunho.id,
      pergunta: pergunta as NumeroPergunta,
      idioma,
    }),
  );

  return NextResponse.json({ ok: true, rascunhoId: rascunho.id }, { status: 202 });
}
```

**Todo o resto do arquivo fica igual** (`carregarTreinosDoUsuario`, `carregarExercicios`, `POSICAO_FAIXA_POR_IDIOMA`, `fallbackDeterministico`, `REJEITADA_POR_IDIOMA`, `INSTRUCAO_RETRY_*`) — só migram de "usados dentro do `POST`" pra "usados dentro de `gerarESalvarParecer`", nenhuma linha de lógica muda (SDD.md §11.6).

- [ ] **Passo 4: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: sem erro. Se `after()` reclamar de contexto fora de request (não deve, está dentro do `POST` de um Route Handler — uso suportado), conferir a versão do Next instalada (`package.json`) contra a doc do `after()` via context7 antes de tentar contornar.

- [ ] **Passo 5: Commit**

```bash
git add src/app/api/analise/route.ts
git commit -m "feat(analise): geração roda em after(), rota devolve 202 na hora (SDD.md §11.3)"
```

---

### Task 5: `analise-interativa.tsx` — simplifica o fluxo

**Files:**
- Modify: `src/components/analise-interativa.tsx`
- Modify: `src/app/analise/page.tsx`
- Modify: `src/lib/texto/i18n.ts`

- [ ] **Passo 1: Novas entradas de dicionário**

Em `src/lib/texto/i18n.ts`, dentro do bloco `// --- components/analise-interativa.tsx ---` (perto da linha 519-521), adicionar:

```typescript
  "Confira em Ajustes > Relatórios em instantes.": {
    en: "Check Settings > Reports in a few moments.",
    es: "Consulta Ajustes > Informes en unos instantes.",
  },
  "Já existe uma análise em andamento. Aguarde ela terminar.": {
    en: "There's already an analysis in progress. Wait for it to finish.",
    es: "Ya hay un análisis en curso. Espera a que termine.",
  },
```

- [ ] **Passo 2: Reescrever `analise-interativa.tsx`**

```typescript
"use client";

// lastro · SDD.md §7.1, §11.4 — tela da Análise Semanal: lista as 5
// perguntas padrão como botões, dispara POST /api/analise ao escolher
// uma. A rota devolve controle em ~1s (202, geração roda em segundo
// plano via after()) — esta tela NUNCA mostra o parecer pronto; ele
// pousa como rascunho em "Pareceres salvos" (/ajustes/relatorios,
// pareceres-salvos.tsx), pra a pessoa confirmar ou descartar.
//
// Extraído de `app/analise/page.tsx` (PROGRESS.md pendência 4): a barra de
// topo agora precisa buscar o perfil no servidor (`cookies()`), e um Client
// Component não pode importar Server Component diretamente — só recebê-lo
// como children/prop do pai. `page.tsx` virou Server Component; esta parte
// interativa (estado de pergunta) continua client.
import { useState } from "react";
import {
  perguntasDoIdioma,
  PERGUNTA_PRIMARIA,
  type NumeroPergunta,
} from "@/app/api/analise/perguntas";
import { MINIMO_SEMANAS_PARECER } from "@/lib/analise/limiares";
import type { Idioma } from "@/lib/dados/idioma";
import type { GrupoComRecencia } from "@/lib/analise/recencia";
import type { SinalDeload } from "@/lib/analise/alerta-deload";
import GraficoProgressao from "@/components/grafico-progressao";
import GruposSemEstimulo from "@/components/grupos-sem-estimulo";
import AlertaDeload from "@/components/alerta-deload";
import { t } from "@/lib/texto/i18n";

export default function AnaliseInterativa({
  semanasFechadasComTreino,
  gruposSemEstimulo,
  sinalDeload,
  idioma,
  rascunhoInicial,
}: {
  semanasFechadasComTreino: number;
  gruposSemEstimulo: GrupoComRecencia[];
  sinalDeload: SinalDeload | null;
  idioma: Idioma;
  /** Rascunho já em geração ao carregar a tela — trava o botão mesmo sem
   * clique nesta sessão (SDD.md §11.4: sobrevive a trocar de tela). */
  rascunhoInicial: { id: string; perguntaTexto: string } | null;
}) {
  const PERGUNTAS = perguntasDoIdioma(idioma);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [emAndamento, setEmAndamento] = useState<{ perguntaTexto: string } | null>(
    rascunhoInicial ? { perguntaTexto: rascunhoInicial.perguntaTexto } : null,
  );

  async function perguntar(numero: NumeroPergunta) {
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: numero }),
      });

      if (resposta.status === 401) {
        setErro(t("Sessão expirada. Faça login novamente.", idioma));
        return;
      }
      if (resposta.status === 409) {
        setErro(t("Já existe uma análise em andamento. Aguarde ela terminar.", idioma));
        return;
      }
      if (!resposta.ok) {
        setErro(`${t("Falha ao gerar o parecer (erro", idioma)} ${resposta.status}).`);
        return;
      }

      setEmAndamento({ perguntaTexto: PERGUNTAS[numero] });
    } catch {
      setErro(t("Falha de rede ao gerar o parecer. Tente novamente.", idioma));
    } finally {
      setEnviando(false);
    }
  }

  // null = ainda não sabemos (busca do gráfico em voo). Só usado pra decidir
  // se o aviso de "sem dado" da Análise Semanal se combina com o do
  // gráfico ou fica sozinho — nunca bloqueia nada além do texto do aviso.
  const [graficoTemPainel, setGraficoTemPainel] = useState<boolean | null>(null);

  const dadosSuficientes = semanasFechadasComTreino >= MINIMO_SEMANAS_PARECER;
  const inativo = !dadosSuficientes || enviando || emAndamento !== null;
  const secundarias = (Object.keys(PERGUNTAS) as unknown as NumeroPergunta[])
    .map(Number)
    .filter((numero) => numero !== PERGUNTA_PRIMARIA) as NumeroPergunta[];

  function perguntarSeAtivo(numero: NumeroPergunta) {
    if (inativo) return;
    perguntar(numero);
  }

  return (
    <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
      <AlertaDeload sinal={sinalDeload} idioma={idioma} />

      <GruposSemEstimulo grupos={gruposSemEstimulo} idioma={idioma} />

      <GraficoProgressao
        onStatus={(temPainel) => setGraficoTemPainel(temPainel)}
        ocultarQuandoVazio={!dadosSuficientes}
        idioma={idioma}
      />

      <h2 className="doc__secao">{t("Análise semanal", idioma)}</h2>

      {!dadosSuficientes && (
        <p className="vazio" aria-live="polite">
          {graficoTemPainel === false && (
            <>
              {t("Ainda não há pelo menos 2 semanas do mesmo exercício pra desenhar progressão.", idioma)}{" "}
            </>
          )}
          {t("Você tem", idioma)} {semanasFechadasComTreino}{" "}
          {t(semanasFechadasComTreino === 1 ? "semana fechada" : "semanas fechadas", idioma)}.{" "}
          {t("São necessárias", idioma)} {MINIMO_SEMANAS_PARECER} {t("para calcular a análise semanal.", idioma)}
        </p>
      )}

      <button
        type="button"
        className="botao-primario botao-solicitar-analise"
        aria-disabled={inativo}
        onClick={() => perguntarSeAtivo(PERGUNTA_PRIMARIA)}
      >
        {t("Solicitar Análise", idioma)}
      </button>

      <ul className="perguntas">
        <li>
          <button
            type="button"
            className="pergunta pergunta--primaria"
            aria-disabled={inativo}
            onClick={() => perguntarSeAtivo(PERGUNTA_PRIMARIA)}
          >
            <span>{PERGUNTAS[PERGUNTA_PRIMARIA]}</span>
            <span style={{ color: "var(--lastro-ouro)", fontWeight: "bold" }}>•</span>
          </button>
        </li>
        {secundarias.map((numero) => (
          <li key={numero}>
            <button
              type="button"
              className="pergunta pergunta--secundaria"
              aria-disabled={inativo}
              onClick={() => perguntarSeAtivo(numero)}
            >
              <span>{PERGUNTAS[numero]}</span>
              <span style={{ color: "var(--lastro-txt-3)" }}>›</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Estado "gerando" (DESIGN.md §3.6.5): mesmo esqueleto de antes, mas
          agora fica até a pessoa sair da tela — não vira <Parecer> aqui
          (SDD.md §11.4). */}
      {emAndamento && (
        <section className="doc" aria-live="polite">
          <header className="doc__emissao">
            <p className="doc__selo">{t("Parecer em emissão", idioma)}</p>
            <h2 className="doc__pergunta">{emAndamento.perguntaTexto}</h2>
          </header>
          <p className="doc__secao">{t("escrevendo a leitura", idioma)}</p>
          <div className="esqueleto" />
          <div className="esqueleto" />
          <div className="esqueleto esqueleto--curto" />
          <p className="vazio">{t("Confira em Ajustes > Relatórios em instantes.", idioma)}</p>
        </section>
      )}

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Passo 3: Repassar `rascunhoInicial` em `src/app/analise/page.tsx`**

Adicionar o import:

```typescript
import { buscarRascunhoEmAndamento } from "@/lib/dados/parecer";
```

Trocar o `Promise.all` existente:

```typescript
  const [perfil, resumo, gruposSemEstimulo, sinalDeload] = await Promise.all([
    obterPerfil(),
    carregarResumoHome(hoje),
    carregarDiasSemEstimuloPorGrupo(hoje),
    carregarSinalDeload(paraDataUTC(hoje)),
  ]);
```

Por:

```typescript
  const [perfil, resumo, gruposSemEstimulo, sinalDeload, rascunhoInicial] = await Promise.all([
    obterPerfil(),
    carregarResumoHome(hoje),
    carregarDiasSemEstimuloPorGrupo(hoje),
    carregarSinalDeload(paraDataUTC(hoje)),
    buscarRascunhoEmAndamento(),
  ]);
```

E adicionar a prop na chamada de `<AnaliseInterativa>`:

```typescript
      <AnaliseInterativa
        semanasFechadasComTreino={resumo.semanasFechadasComTreino}
        gruposSemEstimulo={gruposSemEstimulo}
        sinalDeload={sinalDeload}
        idioma={idioma}
        rascunhoInicial={rascunhoInicial}
      />
```

- [ ] **Passo 4: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
```

Esperado: sem erro novo em `analise-interativa.tsx`/`page.tsx`. `pareceres-salvos.tsx` ainda vai acusar erro de tipo (`ParecerSalvo.texto`/`evidencia` agora `| null`) — resolvido na Task 6, não mexer aqui.

- [ ] **Passo 5: Commit**

```bash
git add src/components/analise-interativa.tsx src/app/analise/page.tsx src/lib/texto/i18n.ts
git commit -m "feat(analise): tela devolve controle na hora, sem mostrar o parecer inline (SDD.md §11.4)"
```

---

### Task 6: `pareceres-salvos.tsx` — card de rascunho no topo

**Files:**
- Modify: `src/components/pareceres-salvos.tsx`
- Modify: `src/lib/texto/i18n.ts`

- [ ] **Passo 1: Novas entradas de dicionário**

Em `src/lib/texto/i18n.ts`, no bloco `// --- components/analise-interativa.tsx / pareceres-salvos.tsx ---` (perto da linha 668), adicionar:

```typescript
  "Descartar": { en: "Discard", es: "Descartar" },
  "Gerando…": { en: "Generating…", es: "Generando…" },
```

(`"Salvar"` e `"Cancelar"` já existem no dicionário — reusados como estão.)

- [ ] **Passo 2: Separar o rascunho do resto da lista e renderizar o card especial**

No topo do componente, logo depois de `const aberto = ...`, adicionar:

```typescript
  const rascunho = listaLocal.find((p) => !p.confirmado) ?? null;
  const confirmados = listaLocal.filter((p) => p.confirmado);
```

Adicionar as duas ações novas, junto de `confirmarExclusao`:

```typescript
  const [confirmando, setConfirmando] = useState(false);

  function confirmar(id: string) {
    setErro(null);
    setConfirmando(true);
    iniciar(async () => {
      try {
        await confirmarParecer(id);
        setListaLocal((atual) =>
          atual.map((p) => (p.id === id ? { ...p, confirmado: true } : p)),
        );
      } catch {
        setErro(t("Não foi possível salvar. Tente de novo.", idioma));
      } finally {
        setConfirmando(false);
      }
    });
  }
```

Adicionar o import de `confirmarParecer` junto do de `excluirParecer`:

```typescript
import { confirmarParecer, excluirParecer } from "@/lib/dados/parecer";
```

No JSX, **antes** do `if (aberto) { ... }` existente (o rascunho tem visual próprio, nunca abre no mesmo fluxo de "Ver parecer"), adicionar um retorno cedo pro caso de estar vendo o rascunho — mas como o rascunho não usa `abertoId`, o jeito mais simples é injetar o card no topo da lista principal (a view de "lista", não a de "aberto"). Trocar o `return` final (a view de lista, `<div className="pilha"> ... </div>`) por:

```typescript
  return (
    <div className="pilha">
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {rascunho && rascunho.status === "gerando" && (
        <div className="card-relatorio-item">
          <p className="card-relatorio-item__id-curto">{rascunho.perguntaTexto}</p>
          <p className="vazio">{t("Gerando…", idioma)}</p>
        </div>
      )}

      {rascunho && rascunho.status === "pronto" && rascunho.texto && rascunho.evidencia && (
        <div className="pilha">
          <Parecer
            pergunta={rascunho.perguntaTexto}
            texto={rascunho.texto}
            avisoFalhaInterpretativa={rascunho.avisoFalhaInterpretativa}
            evidencia={rascunho.evidencia}
            idioma={rascunho.idioma}
            emitidoEm={rascunho.criadoEm}
          />
          <div className="confirma__acoes">
            <button
              type="button"
              className="botao-primario"
              onClick={() => confirmar(rascunho.id)}
              disabled={confirmando || pendente}
            >
              {t("Salvar", idioma)}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => confirmarExclusao(rascunho.id)}
              disabled={confirmando || pendente}
            >
              {t("Descartar", idioma)}
            </button>
          </div>
        </div>
      )}

      {confirmados.map((parecer) => (
        <div key={parecer.id} className="card-relatorio-item">
          <div className="card-relatorio-item__cabecalho">
            <div className="card-relatorio-item__data-bloco">
              <span className="card-relatorio-item__data-rotulo">
                {formatarDataCurta(parecer.criadoEm.slice(0, 10)).toUpperCase()}
              </span>
            </div>
          </div>
          <p className="card-relatorio-item__id-curto">{parecer.perguntaTexto}</p>
          <button
            type="button"
            className="botao-acao-relatorio"
            onClick={() => setAbertoId(parecer.id)}
          >
            {t("Ver parecer", idioma)}
          </button>
        </div>
      ))}
    </div>
  );
```

O bloco `if (aberto) { ... }` (abrir um parecer **confirmado**, com PDF/Excluir) continua exatamente igual — `aberto` só encontra dentro de `listaLocal` por `id`, e o `onClick={() => setAbertoId(parecer.id)}` só existe nos cards de `confirmados`, então nunca aponta pro rascunho.

- [ ] **Passo 3: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: sem erro. O `build` é o primeiro sinal real de que os tipos de `ParecerSalvo` (agora com `texto`/`evidencia` nullable) foram tratados em todo lugar que os consome (`pareceres-salvos.tsx`, `documento-parecer.tsx` via `buscarParecer`).

**Nota sobre `src/lib/pdf/documento-parecer.tsx`:** esse componente recebe `ParecerSalvo` e acessa `parecer.texto`/`parecer.evidencia` sem checar null (§10.4, PDF só é gerado a partir de `buscarParecer(id)` chamado pela rota de download, que só é oferecida na UI pra parecer confirmado). Se o `tsc` acusar erro de tipo aqui por causa do `| null` novo, é esperado — resolver com um guard simples no topo do componente:

```typescript
if (!parecer.texto || !parecer.evidencia) {
  throw new Error("PDF pedido para um parecer sem conteúdo (rascunho não confirmado).");
}
```

(A rota `src/app/api/parecer/[id]/pdf/route.ts` nunca chega a chamar isso hoje pra um rascunho — não há link de "Baixar PDF" fora do card de confirmados — mas o guard documenta a invariante em vez de deixar o `tsc` silenciar com `!`.)

- [ ] **Passo 4: Commit**

```bash
git add src/components/pareceres-salvos.tsx src/lib/pdf/documento-parecer.tsx src/lib/texto/i18n.ts
git commit -m "feat(parecer): card de rascunho (Salvar/Descartar) em Pareceres salvos (SDD.md §11.4)"
```

---

### Task 7: Atualizar `e2e/j2-analise.spec.ts`

**Files:**
- Modify: `e2e/j2-analise.spec.ts`

- [ ] **Passo 1: Trocar o mock e a asserção do teste existente**

Trocar:

```typescript
const PARECER_MOCADO =
  "Seu volume total na última semana foi de 320 kg, dentro da faixa de referência.";

test("pede a Análise Semanal e mostra o parecer da rota (A6, sem gastar cota real da Gemini)", async ({
  page,
}) => {
  let corpoRecebido: unknown = null;

  await page.route("**/api/analise", async (route) => {
    corpoRecebido = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        parecer: PARECER_MOCADO,
        evidencia: {
          periodo: {
            semana_atual_inicio: "2026-08-24",
            semana_atual_fim: "2026-08-30",
            janela_semanas: 4,
          },
          blocos: [],
        },
      }),
    });
  });

  await entrarComoUsuario(page, usuario);
  await page.goto("/analise");

  // As 4 semanas semeadas (28/21/14/7 dias atrás) precisam ter destravado
  // o botão — se o aviso "faltam N semanas" ainda aparecer, o seed falhou
  // silenciosamente e é melhor este teste quebrar aqui, não mais adiante.
  await expect(page.getByText(/semanas fechadas/)).toHaveCount(0);

  await page.getByRole("button", { name: "Solicitar Análise" }).click();

  await expect(page.getByText(PARECER_MOCADO)).toBeVisible({ timeout: 15_000 });
  // PERGUNTA_PRIMARIA (src/app/api/analise/perguntas.ts) é 5, não 1 — o
  // botão "Solicitar Análise" dispara essa pergunta por ser a primária.
  expect(corpoRecebido).toEqual({ pergunta: 5 });
});
```

Por:

```typescript
test("pede a Análise Semanal — botão dispara a pergunta certa e a tela devolve controle na hora (A6, SDD.md §11, sem gastar cota real da Gemini)", async ({
  page,
}) => {
  let corpoRecebido: unknown = null;

  // A geração real roda em after(), fora do ciclo HTTP (SDD.md §11.3) —
  // o parecer NUNCA mais chega pro navegador que perguntou, então este
  // teste não pode mais verificar o texto do parecer. O que ele prova:
  // a rota certa é chamada com a pergunta certa, e a tela reage ao 202
  // travando o botão e mostrando a mensagem de confirmação.
  await page.route("**/api/analise", async (route) => {
    corpoRecebido = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, rascunhoId: "00000000-0000-0000-0000-000000000000" }),
    });
  });

  await entrarComoUsuario(page, usuario);
  await page.goto("/analise");

  await expect(page.getByText(/semanas fechadas/)).toHaveCount(0);

  await page.getByRole("button", { name: "Solicitar Análise" }).click();

  await expect(page.getByText("Confira em Ajustes > Relatórios em instantes.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar Análise" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  // PERGUNTA_PRIMARIA (src/app/api/analise/perguntas.ts) é 5, não 1 — o
  // botão "Solicitar Análise" dispara essa pergunta por ser a primária.
  expect(corpoRecebido).toEqual({ pergunta: 5 });
});

test("rascunho pronto aparece em Pareceres salvos com Salvar/Descartar (SDD.md §11.4)", async ({
  page,
}) => {
  const cliente = await clienteAutenticado(usuario);
  const { data: rascunho, error } = await cliente
    .from("parecer")
    .insert({
      usuario_id: usuario.id,
      pergunta: 5,
      pergunta_texto: "O que mudar na próxima semana?",
      idioma: "pt-BR",
      status: "pronto",
      confirmado: false,
      texto: "Rascunho de teste — E2E semeou este parecer direto no banco.",
      evidencia: {
        periodo: { semana_atual_inicio: "2026-08-24", semana_atual_fim: "2026-08-30", janela_semanas: 4 },
        blocos: [],
      },
    })
    .select("id")
    .single();
  if (error || !rascunho) throw new Error(`Falha ao semear rascunho: ${error?.message}`);

  await entrarComoUsuario(page, usuario);
  await page.goto("/ajustes/relatorios");

  await expect(page.getByText("Rascunho de teste — E2E semeou este parecer direto no banco.")).toBeVisible();

  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("button", { name: "Descartar" })).toHaveCount(0);

  const { data: linhaAtualizada } = await cliente
    .from("parecer")
    .select("confirmado")
    .eq("id", rascunho.id)
    .single();
  expect(linhaAtualizada?.confirmado).toBe(true);
});
```

- [ ] **Passo 2: Rodar o arquivo isolado**

```bash
npx playwright test e2e/j2-analise.spec.ts
```

Esperado: os 2 testes passam. Se `clienteAutenticado(usuario)` não expuser um client com permissão de `insert`/`select` direto na tabela (checar `e2e/helpers/usuario-descartavel.ts`) — deve, já é usado assim em outros specs (`semearHistoricoParaAnalise`) — nenhum ajuste extra necessário; se precisar, seguir o mesmo padrão de `semear-historico.ts`.

- [ ] **Passo 3: Commit**

```bash
git add e2e/j2-analise.spec.ts
git commit -m "test(e2e): atualiza J2-Análise pro fluxo assíncrono (SDD.md §11.5)"
```

---

### Task 8: Corrigir `E2E-02` no `QA.md` (achado ao planejar)

**Files:**
- Modify: `QA.md`

**Por quê:** `QA.md` linha 58 (`E2E-02`) descreve o comportamento antigo — "renderiza o parecer que a rota devolve" — que deixa de ser verdade nesta feature. `node scripts/qa-obsoletos.mjs` já vai sinalizar isso pela mudança em `src/components/analise-interativa.tsx`/`e2e/**`, mas o registro merece ficar coerente com o novo teste, não só "obsoleto".

- [ ] **Passo 1: Atualizar a linha `E2E-02`**

Trocar:

```
| E2E-02 | e2e | J2-Análise (PRD §6): botão "Solicitar Análise" chama `/api/analise` com a pergunta certa e renderiza o parecer que a rota devolve | PASSOU (`/api/analise` interceptado no navegador — Gemini real nunca chamada; histórico de 4 semanas fechadas semeado via usuário autenticado, não admin — ver achado de infraestrutura na evidência) | 4ad513c | 2026-08-31 | qa/evidencias/E2E-01/ |
```

Por (deixar como `ALEGADO`, aguardando a verificação da Task 11):

```
| E2E-02 | e2e | J2-Análise (PRD §6, SDD.md §11): botão "Solicitar Análise" chama `/api/analise` com a pergunta certa, tela trava e mostra a confirmação (não mais o parecer inline); rascunho pronto semeado direto no banco aparece em Pareceres salvos com Salvar/Descartar | ALEGADO | <SHA> | 2026-09-01 | qa/evidencias/E2E-02/ |
```

- [ ] **Passo 2: Commit**

```bash
git add QA.md
git commit -m "docs: Atualiza QA.md E2E-02 pro fluxo assíncrono (achado ao planejar)"
```

---

### Task 9: Gates finais + verificação ao vivo + registro em `QA.md`

**Files:**
- Modify: `QA.md`
- Create: `qa/evidencias/AA-01/correcao.md`
- Create: `qa/evidencias/E2E-02/correcao.md`

- [ ] **Passo 1: Rodar os 4 gates, do zero**

```bash
cd C:\lastro-analise-assincrona
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

Esperado: todos limpos.

- [ ] **Passo 2: `npx playwright test e2e/`**

```bash
npx playwright test e2e/
```

Esperado: suíte inteira verde (não só `j2-analise.spec.ts` — confirmar que a mudança na tabela `parecer` não quebrou `j3-duvida.spec.ts` nem `j1-treino.spec.ts`, que não deveriam ser afetados, mas rodam contra o mesmo schema).

- [ ] **Passo 3: Verificação ao vivo, ponta a ponta, com usuário QA descartável**

```bash
npm run dev
```

Com um usuário QA descartável e **dados reais de treino semeados** (4 treinos passados com série valendo, mesmo padrão de `e2e/helpers/semear-historico.ts`, pra destravar `MINIMO_SEMANAS_PARECER`):

1. Logar, ir em `/analise`, clicar "Solicitar Análise". **Cronometrar**: o botão precisa desativar e a mensagem "Confira em Ajustes > Relatórios em instantes." precisa aparecer em menos de ~2s — essa é a prova real do achado do dono (30-50s virou ~1s).
2. **Sem esperar**, tentar clicar de novo (ou recarregar `/analise` e clicar) → recusado, mensagem de "já em andamento".
3. Recarregar `/analise` de novo, imediatamente → botão continua travado (prova que a trava é do servidor, não só do clique — `rascunhoInicial`).
4. Esperar alguns segundos (a geração real, com a Gemini, deve terminar rápido) → ir em `/ajustes/relatorios` → o rascunho aparece no topo de "Pareceres salvos", com o parecer completo e os botões "Salvar"/"Descartar".
5. Voltar em `/analise` → botão **destravou** (a trava só existe enquanto `status='gerando'`; virou `'pronto'`).
6. Voltar em `/ajustes/relatorios`, clicar "Salvar" → botões somem, o card vira um item normal da lista (`confirmado=true` no Postgres — conferir com o `node -e` do padrão já usado nas Tasks anteriores).
7. Solicitar outra Análise (pergunta diferente) → esperar terminar → desta vez clicar "Descartar" → confirmação inline aparece (mesmo padrão do C5) → confirmar → some da lista, `select count(*) from parecer where id = ...` = `0`.
8. **Expiração do rascunho pronto (24h):** gerar mais um, sem confirmar nem descartar; via `node -e`, `update parecer set criado_em = now() - interval '25 hours' where id = '<id>'`; recarregar `/ajustes/relatorios` → sumiu sozinho, sem ação da pessoa.
9. **Trava abandonada (5min):** inserir manualmente uma linha `status='gerando'` com `criado_em = now() - interval '6 minutes'` (via `node -e`, mesmo padrão); ir em `/analise` e clicar "Solicitar Análise" → **não** é recusado (a trava velha foi limpa antes de checar).
10. Apagar o usuário QA (`admin.auth.admin.deleteUser`) — cascade cuida do resto.

- [ ] **Passo 4: Registrar em `QA.md`**

Adicionar a "Estado por Item" (a área `analise` já cobre os caminhos tocados, ver `QA.md` §1):

```
| AA-01 | analise | Geração assíncrona (SDD.md §11): botão devolve controle em segundos, trava persistida sobrevive a reload, rascunho pousa em Pareceres salvos, Salvar/Descartar, expiração de 24h e liberação de trava abandonada em 5min, ambas lazy | ALEGADO | <SHA do commit> | 2026-09-01 | qa/evidencias/AA-01/ |
```

- [ ] **Passo 5: Escrever `qa/evidencias/AA-01/correcao.md` e `qa/evidencias/E2E-02/correcao.md`**

`AA-01/correcao.md`: documentar o pedido (achado do dono, `PROGRESS.md`), o que foi feito (task por task, resumido), a decisão de mecanismo (`DECISIONS.md` 2026-09-01), e os 10 pontos da verificação ao vivo do Passo 3 — mesmo formato de `qa/evidencias/PDF-01/correcao.md`.

`E2E-02/correcao.md`: os 2 testes de `e2e/j2-analise.spec.ts` (Task 7), saída do `npx playwright test e2e/j2-analise.spec.ts` colada.

- [ ] **Passo 6: Commit**

```bash
git add QA.md qa/evidencias/AA-01/ qa/evidencias/E2E-02/
git commit -m "docs: Registra AA-01 (ALEGADO) — geração assíncrona da Análise Semanal"
```

---

### Task 10: PR e auditoria independente

- [ ] **Passo 1: Apagar `.env.local` do worktree**

```bash
rm C:\lastro-analise-assincrona\.env.local
```

- [ ] **Passo 2: Push e abrir PR**

```bash
cd C:\lastro-analise-assincrona
git push -u origin feat/analise-assincrona
gh pr create --title "feat(analise): geração assíncrona da Análise Semanal" --body "Implementa SDD.md §11 — achado do dono ao vivo (botão síncrono, 30-50s+ sem feedback). Ver qa/evidencias/AA-01/correcao.md pra verificação ao vivo (ALEGADO, aguardando auditoria independente)."
```

- [ ] **Passo 3: Dispatch de auditoria independente**

Seguindo `AGENTS.md` §5 ("quem implementa não se audita"): agente separado, contexto limpo, **cria seu próprio worktree isolado** (`git worktree add ../lastro-audit-analise-assincrona`) antes de tocar em qualquer coisa. Reproduz os 10 pontos da Task 9/Passo 3 do zero, com seu PRÓPRIO usuário QA descartável, e confirma ou reprova o `ALEGADO` — com atenção especial aos pontos 1-3 (o achado do dono era sobre TEMPO PERCEBIDO; a auditoria deve cronometrar de verdade, não só confirmar que "funciona") e 8-9 (as duas expirações lazy, fáceis de esquecer de testar porque não acontecem sozinhas em uso normal).

- [ ] **Passo 4: Depois da auditoria confirmar, atualizar `QA.md` (`AA-01` e `E2E-02`) pra `PASSOU`, com o SHA real de merge, e pedir aprovação do dono — ele testa com o próprio treino real, mesmo padrão de §10/§11.7 (dono aprova executando, não lendo spec).**

---

## Self-review deste plano

**Cobertura da spec (`SDD.md` §11):** schema+GRANT (Task 2), trava + limpeza preguiçosa (Task 3), route handler em `after()` + `202` (Task 4), UI da tela de Análise simplificada + prop `rascunhoInicial` (Task 5), card de rascunho em Pareceres salvos (Task 6), E2E atualizado (Task 7), correção de `QA.md` (Task 8), verificação ao vivo cobrindo os 2 timers lazy (Task 9) — todos os pontos de §11.1 a §11.5 têm task correspondente. §11.0 (fora de escopo) não gerou task nenhuma, como esperado. §11.6 ("o que não muda") é verificado implicitamente: nenhuma task toca `agregar.ts`/`prompt.ts`/`validador.ts`/`gemini.ts`.

**Achado durante o planejamento, corrigido:** `QA.md` `E2E-02` descrevia o comportamento síncrono antigo — corrigido na Task 8, antes de a suíte nova (Task 7) tornar essa linha inconsistente com o que o teste realmente prova.

**Consistência de tipos:** `ParecerSalvo` (Task 3, com `status`/`confirmado`/`texto | null`/`evidencia | null`) é o mesmo tipo consumido em `pareceres-salvos.tsx` (Task 6) e `documento-parecer.tsx` (guard novo na Task 6) — nomes de campo (`perguntaTexto`, `criadoEm`, `avisoFalhaInterpretativa`) conferidos contra o arquivo já existente, não reinventados. `NumeroPergunta`/`Idioma`/`EvidenciaParaTela` continuam vindo dos mesmos módulos de sempre (`@/app/api/analise/perguntas`, `@/lib/dados/idioma`, `@/app/api/analise/evidencia`).

**Risco não coberto por task própria, sinalizado aqui:** o `after()` do Next.js reusa a instância de `supabase` capturada no fechamento léxico do `POST` (criada com `criarClienteServidor()`, que lê `cookies()` da request) — a Task 4 assume que essa instância continua utilizável depois da resposta HTTP ter sido enviada (comportamento documentado do `after()`: `cookies()`/`headers()` continuam disponíveis dentro do callback). Se o gate de build/lint ou a verificação ao vivo (Task 9) revelar que não é o caso nesta versão do Next instalada, a mitigação é reautenticar dentro de `gerarESalvarParecer` chamando `criarClienteServidor()` de novo — mas só vale a pena escrever esse código se o comportamento padrão realmente falhar, então não foi pré-escrito no plano (YAGNI).
