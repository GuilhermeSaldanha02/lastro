# Histórico de Pareceres + PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o dono salvar um parecer da Análise Semanal (opt-in), ver a lista de salvos em `/ajustes/relatorios`, e baixar qualquer um deles como PDF.

**Architecture:** Tabela nova `parecer` (histórico opt-in, RLS+GRANT igual ao resto do schema). Módulo `src/lib/dados/parecer.ts` (Server Actions, mesmo padrão de `treino.ts`). PDF gerado sob demanda por um route handler usando `@react-pdf/renderer` (motor de layout em JS puro, sem navegador headless) a partir do `texto`/`evidencia` já salvos — nada de binário pré-gerado guardado.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + Auth), `@react-pdf/renderer` (novo), TypeScript, Vitest (só onde já há convenção de teste unitário no projeto).

**Spec de referência:** `SDD.md` §10. Decisão de biblioteca: `DECISIONS.md`, entrada 2026-08-31.

**Convenção de teste deste projeto, que este plano segue à risca (achado ao investigar antes de escrever este plano):** módulos de I/O em `src/lib/dados/*.ts` (ex.: `treino.ts`, `exportar.ts`, `conta.ts`) **não têm teste unitário** — são verificados ao vivo, com usuário QA descartável, seguindo o protocolo do `QA.md`. Só módulos de lógica PURA (`src/lib/analise/*`, alguns helpers de `src/lib/dados/*` como `grupos-conhecidos.ts`) têm `.test.ts`. Este plano não inventa teste unitário onde o projeto não tem esse costume — a Task 12 é a verificação real.

---

### Task 1: Worktree isolado

**Por quê:** o projeto tem um incidente registrado (`PROGRESS.md`, sessão 2026-08-30) de duas sessões colidindo no mesmo `C:\lastro` compartilhado — desde então, todo trabalho novo entra por um worktree próprio.

- [ ] **Passo 1: Criar o worktree e a branch**

Rodar a partir de `C:\lastro` (worktree principal, deve estar limpo e em `main`):

```bash
cd C:\lastro
git status --short
git checkout main
git pull origin main
git worktree add ../lastro-parecer-pdf -b feat/historico-parecer-pdf main
```

Esperado: `git status --short` sem saída (árvore limpa) antes de criar o worktree; ao final, `C:\lastro-parecer-pdf` existe, checked out em `feat/historico-parecer-pdf`.

- [ ] **Passo 2: Instalar dependências e copiar `.env.local`**

```bash
cd C:\lastro-parecer-pdf
npm install
```

Copiar `C:\lastro\.env.local` para `C:\lastro-parecer-pdf\.env.local` (mesmas credenciais do projeto hospedado — não há stack local, ver `KNOWLEDGE.md`). **Este arquivo nunca é commitado** (`.gitignore` já cobre `.env.*`) — apagar ao final do trabalho neste worktree, mesmo achado desta sessão (Fase 6 E2E).

- [ ] **Passo 3: Confirmar os 4 gates rodam limpos ANTES de qualquer mudança**

```bash
npm run lint
npx vitest run
npm run build
npx tsc --noEmit
```

Esperado: os 4 passam (o `tsc` pode acusar só o erro pré-existente e conhecido de `LayoutProps` em `src/app/layout.tsx` — não é regressão, é tipo gerado pelo Next só depois do build; ver `qa/evidencias/E2E-01/correcao.md` da sessão anterior). Se qualquer outro erro aparecer aqui, **pare** — não é problema deste plano, é estado quebrado do `main` que precisa ser investigado antes de continuar.

---

### Task 2: Migration `0016_tabela_parecer.sql`

**Files:**
- Create: `supabase/migrations/0016_tabela_parecer.sql`

- [ ] **Passo 1: Escrever a migration**

```sql
-- supabase/migrations/0016_tabela_parecer.sql

-- ============ parecer: histórico opt-in de pareceres salvos ============
-- A Análise Semanal em si é 100% descartável — gera, mostra, some. Esta
-- tabela existe só para o subconjunto que o dono decide guardar clicando
-- "Salvar este parecer" (nunca automático, SDD.md §10.0).
create table public.parecer (
  id                         uuid primary key default gen_random_uuid(),
  usuario_id                 uuid not null references auth.users(id) on delete cascade,
  pergunta                   smallint not null,
  pergunta_texto             text not null,
  texto                      text not null,
  aviso_falha_interpretativa boolean not null default false,
  evidencia                  jsonb not null,
  idioma                     text not null,
  criado_em                  timestamptz not null default now()
);
create index parecer_usuario_idx on public.parecer (usuario_id, criado_em desc);

alter table public.parecer enable row level security;

create policy parecer_proprio on public.parecer
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- GRANT explícito, não só RLS — sem isto o Postgres nega o OBJETO antes de
-- a RLS ser avaliada (achado real, qa/evidencias/E2E-01/correcao.md e
-- tarefa 1.2 do PROGRESS.md, mesma causa-raiz). Sem `update`: editar um
-- parecer salvo é fora de escopo (SDD.md §10.0).
grant select, insert, delete on public.parecer to authenticated;
```

- [ ] **Passo 2: Aplicar no projeto hospedado**

```bash
cd C:\lastro-parecer-pdf
npx supabase link --project-ref tbkzcqfvafznxallyfqk
npx supabase db push
```

Esperado: `db push` lista `0016_tabela_parecer.sql` como nova e aplica sem erro. **Se recusar por divergência de histórico de migração** (dívida conhecida, `DECISIONS.md` 2026-08-27 (2) — remoto tem timestamps que o repo não tem): aplicar via `npx supabase db query --linked -f supabase/migrations/0016_tabela_parecer.sql` e registrar à mão em `supabase_migrations.schema_migrations`, mesmo caminho já usado pela `0015`. Não rodar `migration repair` (risco de produção fora do escopo deste plano).

- [ ] **Passo 3: Verificar RLS + GRANT com dois usuários reais (não com `service_role`)**

**Achado crítico da sessão anterior (Fase 6 E2E, `qa/evidencias/E2E-01/correcao.md`): o `service_role` deste projeto não tem GRANT nenhum nas tabelas via PostgREST — só `auth.admin.*` funciona.** Verificar RLS/GRANT tem que ser com clientes AUTENTICADOS (chave publishable + login), nunca com `criarClienteAdmin()`.

Script de verificação, rodado uma vez, com dois usuários QA descartáveis:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
function get(k) { return env.match(new RegExp('^' + k + '=(.*)\$', 'm'))[1].trim(); }
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const anon = get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const adminKey = get('SUPABASE_SERVICE_ROLE_KEY');

(async () => {
  const admin = createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const senha = 'Qa!verifica1';

  const emailA = 'qa.parecer.a.' + Date.now() + '@lastro.test';
  const { data: userA } = await admin.auth.admin.createUser({ email: emailA, password: senha, email_confirm: true });
  const emailB = 'qa.parecer.b.' + Date.now() + '@lastro.test';
  const { data: userB } = await admin.auth.admin.createUser({ email: emailB, password: senha, email_confirm: true });

  const clienteA = createClient(url, anon);
  await clienteA.auth.signInWithPassword({ email: emailA, password: senha });
  const { data: inserido, error: erroInsert } = await clienteA
    .from('parecer')
    .insert({
      usuario_id: userA.user.id,
      pergunta: 5,
      pergunta_texto: 'O que mudar na próxima semana?',
      texto: 'Teste de verificação.',
      evidencia: { periodo: { semana_atual_inicio: '2026-08-24', semana_atual_fim: '2026-08-30', janela_semanas: 4 }, blocos: [] },
      idioma: 'pt-BR',
    })
    .select('id')
    .single();
  console.log('insert como A:', erroInsert || inserido);

  const clienteB = createClient(url, anon);
  await clienteB.auth.signInWithPassword({ email: emailB, password: senha });
  const { data: lidoPorB, error: erroLeituraB } = await clienteB.from('parecer').select('id');
  console.log('B lê parecer de A (esperado: [] , 0 linhas):', erroLeituraB || lidoPorB);

  await admin.auth.admin.deleteUser(userA.user.id);
  await admin.auth.admin.deleteUser(userB.user.id);
  const { data: sobrouA } = await admin.auth.admin.listUsers();
  console.log('usuários restantes com prefixo qa.parecer:', sobrouA.users.filter(u => u.email.startsWith('qa.parecer')).length, '(esperado: 0)');
})();
"
```

Esperado: `insert como A` devolve um `id` (sucesso); `B lê parecer de A` devolve array vazio `[]` (RLS isolando por dono); a contagem final de usuários QA remanescentes é `0`.

- [ ] **Passo 4: Commit**

```bash
git add supabase/migrations/0016_tabela_parecer.sql
git commit -m "feat(parecer): migration da tabela de histórico opt-in (SDD.md §10.1)"
```

---

### Task 3: Módulo de dados `src/lib/dados/parecer.ts`

**Files:**
- Create: `src/lib/dados/parecer.ts`

- [ ] **Passo 1: Escrever o módulo completo**

```typescript
// lastro · SDD.md §10.1/10.3 — histórico opt-in de pareceres salvos.
// Mesmo padrão de src/lib/dados/treino.ts: Server Actions, sem cache,
// `usuario_id` sempre resolvido do lado do servidor a partir da sessão.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { NumeroPergunta } from "@/app/api/analise/perguntas";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";
import type { Idioma } from "@/lib/dados/idioma";

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

export type NovoParecerInput = {
  pergunta: NumeroPergunta;
  perguntaTexto: string;
  texto: string;
  avisoFalhaInterpretativa: boolean;
  evidencia: EvidenciaParaTela;
  idioma: Idioma;
};

export type ParecerSalvo = {
  id: string;
  pergunta: NumeroPergunta;
  perguntaTexto: string;
  texto: string;
  avisoFalhaInterpretativa: boolean;
  evidencia: EvidenciaParaTela;
  idioma: Idioma;
  criadoEm: string;
};

type LinhaParecer = {
  id: string;
  pergunta: number;
  pergunta_texto: string;
  texto: string;
  aviso_falha_interpretativa: boolean;
  evidencia: EvidenciaParaTela;
  idioma: string;
  criado_em: string;
};

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
  };
}

/** Salva o parecer que a pessoa acabou de ler — nunca automático (SDD.md §10.0). */
export async function salvarParecer(dados: NovoParecerInput): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("parecer").insert({
    usuario_id: user.id,
    pergunta: dados.pergunta,
    pergunta_texto: dados.perguntaTexto,
    texto: dados.texto,
    aviso_falha_interpretativa: dados.avisoFalhaInterpretativa,
    evidencia: dados.evidencia,
    idioma: dados.idioma,
  });
  if (error) {
    throw new Error(`Falha ao salvar parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}

/** Todos os pareceres salvos do usuário logado (RLS filtra), mais recente primeiro. */
export async function listarPareceres(): Promise<ParecerSalvo[]> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data, error } = await supabase
    .from("parecer")
    .select(
      "id, pergunta, pergunta_texto, texto, aviso_falha_interpretativa, evidencia, idioma, criado_em",
    )
    .order("criado_em", { ascending: false });
  if (error) {
    throw new Error(`Falha ao listar pareceres: ${error.message}`);
  }

  return ((data ?? []) as unknown as LinhaParecer[]).map(paraParecerSalvo);
}

/** Um parecer salvo específico — RLS garante que só resolve se for do dono da sessão. */
export async function buscarParecer(id: string): Promise<ParecerSalvo | null> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data, error } = await supabase
    .from("parecer")
    .select(
      "id, pergunta, pergunta_texto, texto, aviso_falha_interpretativa, evidencia, idioma, criado_em",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar parecer: ${error.message}`);
  }
  if (!data) return null;

  return paraParecerSalvo(data as unknown as LinhaParecer);
}

/** Exclui um parecer salvo — ação da própria pessoa, sem cascade especial (não referenciado por nada). */
export async function excluirParecer(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("parecer").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao excluir parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}
```

- [ ] **Passo 2: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
```

Esperado: sem erro novo (o `LayoutProps` pré-existente pode continuar aparecendo, ignorar).

- [ ] **Passo 3: Commit**

```bash
git add src/lib/dados/parecer.ts
git commit -m "feat(parecer): módulo de dados (salvar/listar/buscar/excluir)"
```

---

### Task 4: Dependência `@react-pdf/renderer` + template do documento

**Files:**
- Modify: `package.json`
- Create: `src/lib/pdf/documento-parecer.tsx`

- [ ] **Passo 1: Instalar a dependência**

```bash
npm install @react-pdf/renderer@^4.9.0
```

Esperado: `package.json`/`package-lock.json` ganham `@react-pdf/renderer`. Justificativa da escolha (React 19 suportado desde a v4.1.0, sem navegador headless): `DECISIONS.md`, entrada 2026-08-31.

- [ ] **Passo 2: Escrever o template do PDF**

```typescript
// lastro · SDD.md §10.4 — layout do PDF exportado de um parecer salvo.
// @react-pdf/renderer usa um modelo de layout flexbox reduzido, próprio
// da biblioteca — não é o CSS de sistema.css/tokens.css. Não tenta clonar
// pixel a pixel a tela (`.doc`/`.evidencias`); é um documento de arquivo,
// não precisa ser idêntico à tela (SDD.md §10.4).
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { separarVeredito } from "@/lib/texto/separar-veredito";

const estilos = StyleSheet.create({
  pagina: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  selo: { fontSize: 9, color: "#8a8a8a", marginBottom: 4, textTransform: "uppercase" },
  pergunta: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: "#8a8a8a", marginBottom: 16 },
  veredito: { fontSize: 13, fontWeight: 700, marginBottom: 12 },
  corpo: { fontSize: 11, lineHeight: 1.5, marginBottom: 20 },
  tituloEvidencia: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  linhaEvidencia: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 6,
  },
  colunaExercicio: { flexGrow: 1, fontWeight: 700 },
  colunaNumero: { width: 90, textAlign: "right", color: "#444" },
});

function formatarData(iso: string): string {
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

export default function DocumentoParecer({ parecer }: { parecer: ParecerSalvo }) {
  const { veredito, corpo } = separarVeredito(parecer.texto);

  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.selo}>Análise Semanal — Lastro</Text>
        <Text style={estilos.pergunta}>{parecer.perguntaTexto}</Text>
        <Text style={estilos.meta}>
          Semana de {formatarData(parecer.evidencia.periodo.semana_atual_inicio)} a{" "}
          {formatarData(parecer.evidencia.periodo.semana_atual_fim)} · Salvo em{" "}
          {formatarData(parecer.criadoEm)}
        </Text>

        <Text style={estilos.veredito}>{veredito}</Text>
        {corpo && <Text style={estilos.corpo}>{corpo}</Text>}

        {parecer.evidencia.blocos.length > 0 && (
          <>
            <Text style={estilos.tituloEvidencia}>Evidência</Text>
            {parecer.evidencia.blocos.map((bloco) => (
              <View key={bloco.exercicio} style={estilos.linhaEvidencia}>
                <Text style={estilos.colunaExercicio}>{bloco.exercicio}</Text>
                <Text style={estilos.colunaNumero}>{bloco.volume} kg volume</Text>
                <Text style={estilos.colunaNumero}>{bloco.delta_pct}% e1RM</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
```

- [ ] **Passo 3: Rodar os gates**

```bash
npx tsc --noEmit
```

Esperado: sem erro novo. Se aparecer erro de tipo do `@react-pdf/renderer` sobre `fontWeight`/`textTransform` esperando valores literais específicos (comum nessa biblioteca), ajustar os valores do `StyleSheet.create` para os literais aceitos pela versão instalada (conferir a mensagem de erro do `tsc`, que aponta o tipo esperado) — não usar `as any`.

- [ ] **Passo 4: Commit**

```bash
git add package.json package-lock.json src/lib/pdf/documento-parecer.tsx
git commit -m "feat(parecer): adiciona @react-pdf/renderer e o template do PDF"
```

---

### Task 5: Route handler de download do PDF

**Files:**
- Create: `src/app/api/parecer/[id]/pdf/route.ts`

- [ ] **Passo 1: Escrever o route handler**

```typescript
// lastro · SDD.md §10.4 — download do PDF de um parecer salvo.
// Route handler, não Server Action: é o jeito certo do Next.js pra
// devolver um arquivo binário como download.
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buscarParecer } from "@/lib/dados/parecer";
import DocumentoParecer from "@/lib/pdf/documento-parecer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let parecer;
  try {
    parecer = await buscarParecer(id);
  } catch {
    return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
  }

  if (!parecer) {
    return NextResponse.json({ erro: "Parecer não encontrado." }, { status: 404 });
  }

  const buffer = await renderToBuffer(<DocumentoParecer parecer={parecer} />);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lastro-analise-${parecer.criadoEm.slice(0, 10)}.pdf"`,
    },
  });
}
```

**Nota:** este arquivo precisa da extensão `.tsx`, não `.ts` (usa JSX em `<DocumentoParecer parecer={parecer} />`) — nomear o arquivo `route.tsx`.

- [ ] **Passo 2: Corrigir o nome do arquivo se necessário**

```bash
mv src/app/api/parecer/\[id\]/pdf/route.ts src/app/api/parecer/\[id\]/pdf/route.tsx 2>/dev/null || true
```

(Escrever o arquivo direto como `route.tsx` no Passo 1 evita este passo — incluído só como rede de segurança.)

- [ ] **Passo 3: Rodar os gates**

```bash
npx tsc --noEmit
npm run build
```

Esperado: build limpo. Esta é a primeira vez que `@react-pdf/renderer` entra de fato num route handler compilado — se o build falhar aqui com erro relacionado a `Yoga`/`__dirname`/bundling do Turbopack, essa é a issue conhecida da biblioteca com bundlers ESM (`react-pdf.org/compatibility`) — não prosseguir sem resolver; a mitigação documentada é ajustar a config de bundling do pacote no `next.config.ts` (`serverExternalPackages: ["@react-pdf/renderer"]`), testando de novo até o build passar.

- [ ] **Passo 4: Commit**

```bash
git add src/app/api/parecer
git commit -m "feat(parecer): route handler de download do PDF"
```

---

### Task 6: `Parecer` ganha a prop `emitidoEm`

**Files:**
- Modify: `src/components/parecer.tsx:22-39`

- [ ] **Passo 1: Editar a assinatura e o cálculo de `emissao`**

Trocar:

```typescript
export default function Parecer({
  pergunta,
  texto,
  avisoFalhaInterpretativa,
  evidencia,
  idioma,
}: {
  pergunta: string | null;
  texto: string;
  avisoFalhaInterpretativa?: boolean;
  evidencia?: EvidenciaParaTela;
  idioma: Idioma;
}) {
  const emissao = new Date().toLocaleDateString(idioma, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
```

Por:

```typescript
export default function Parecer({
  pergunta,
  texto,
  avisoFalhaInterpretativa,
  evidencia,
  idioma,
  emitidoEm,
}: {
  pergunta: string | null;
  texto: string;
  avisoFalhaInterpretativa?: boolean;
  evidencia?: EvidenciaParaTela;
  idioma: Idioma;
  /** ISO (timestamptz) de quando o parecer foi realmente emitido/salvo —
   * ausente = parecer recém-gerado, usa a data de agora (comportamento
   * original, achado ao escrever SDD.md §10: sem isto, reabrir um parecer
   * salvo mostraria a data de HOJE, não a data real do save). */
  emitidoEm?: string;
}) {
  const emissao = new Date(emitidoEm ?? Date.now()).toLocaleDateString(idioma, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
```

- [ ] **Passo 2: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
```

Esperado: sem erro novo. Nenhuma tela existente passa `emitidoEm` ainda, então nenhuma delas muda de comportamento (`Date.now()` produz o mesmo resultado que `new Date()` produzia antes).

- [ ] **Passo 3: Commit**

```bash
git add src/components/parecer.tsx
git commit -m "feat(parecer): prop emitidoEm, pra reexibir parecer salvo com a data real"
```

---

### Task 7: Botão "Salvar este parecer" na tela de Análise

**Files:**
- Modify: `src/components/analise-interativa.tsx`
- Modify: `src/lib/texto/i18n.ts`

- [ ] **Passo 1: Adicionar as entradas de dicionário novas**

Em `src/lib/texto/i18n.ts`, adicionar ao `DICIONARIO` (antes da linha `};` que fecha o objeto, perto de outras entradas de `analise-interativa`/`parecer`):

```typescript
  // --- components/analise-interativa.tsx / pareceres-salvos.tsx ---
  "Salvar este parecer": { en: "Save this analysis", es: "Guardar este informe" },
  "Salvo": { en: "Saved", es: "Guardado" },
  "Salvando…": { en: "Saving…", es: "Guardando…" },
  "Não foi possível salvar. Tente de novo.": {
    en: "Couldn't save it. Try again.",
    es: "No se pudo guardar. Intenta de nuevo.",
  },
  "Pareceres salvos": { en: "Saved analyses", es: "Informes guardados" },
  "Baixar PDF": { en: "Download PDF", es: "Descargar PDF" },
  "Ver parecer": { en: "View analysis", es: "Ver informe" },
  "Voltar à lista": { en: "Back to list", es: "Volver a la lista" },
  "Excluir parecer salvo": { en: "Delete saved analysis", es: "Eliminar informe guardado" },
  "Excluir este parecer apaga o registro salvo — não afeta seus treinos nem séries. Não dá para desfazer.": {
    en: "Deleting this analysis removes the saved record — it doesn't affect your workouts or sets. Can't be undone.",
    es: "Eliminar este informe borra el registro guardado — no afecta tus entrenamientos ni series. No se puede deshacer.",
  },
  "Excluindo…": { en: "Deleting…", es: "Eliminando…" },
```

- [ ] **Passo 2: Adicionar o botão de salvar em `analise-interativa.tsx`**

Adicionar o import no topo do arquivo (junto dos outros imports):

```typescript
import { salvarParecer } from "@/lib/dados/parecer";
```

Adicionar estado novo, logo depois da declaração de `perguntaEmitida` (perto da linha 59):

```typescript
  const [statusSalvar, setStatusSalvar] = useState<
    "ocioso" | "salvando" | "salvo" | "erro"
  >("ocioso");

  async function salvar() {
    if (!resultado || perguntaEmitida === null || statusSalvar === "salvando") return;
    setStatusSalvar("salvando");
    try {
      await salvarParecer({
        pergunta: perguntaEmitida,
        perguntaTexto: PERGUNTAS[perguntaEmitida],
        texto: resultado.parecer,
        avisoFalhaInterpretativa: resultado.avisoFalhaInterpretativa ?? false,
        evidencia: resultado.evidencia,
        idioma,
      });
      setStatusSalvar("salvo");
    } catch {
      setStatusSalvar("erro");
    }
  }
```

No JSX, dentro do bloco `{resultado && ( <Parecer ... /> )}` (linhas ~212-220), adicionar o botão logo depois da tag `<Parecer .../>`, ainda dentro do mesmo bloco condicional:

```typescript
      {resultado && (
        <>
          <Parecer
            pergunta={perguntaEmitida ? PERGUNTAS[perguntaEmitida] : null}
            texto={resultado.parecer}
            avisoFalhaInterpretativa={resultado.avisoFalhaInterpretativa}
            evidencia={resultado.evidencia}
            idioma={idioma}
          />
          <button
            type="button"
            className="botao-secundario"
            onClick={salvar}
            disabled={statusSalvar === "salvando" || statusSalvar === "salvo"}
          >
            {statusSalvar === "salvando" && t("Salvando…", idioma)}
            {statusSalvar === "salvo" && `${t("Salvo", idioma)} ✓`}
            {(statusSalvar === "ocioso" || statusSalvar === "erro") &&
              t("Salvar este parecer", idioma)}
          </button>
          {statusSalvar === "erro" && (
            <p className="aviso-erro" role="alert">
              {t("Não foi possível salvar. Tente de novo.", idioma)}
            </p>
          )}
        </>
      )}
```

Isto substitui o bloco JSX existente que só tinha `<Parecer ... />` sozinho — conferir contra o arquivo atual antes de aplicar, porque o trecho exato pode ter se movido de linha desde a última leitura desta sessão.

Adicionar também, dentro de `perguntar()` (onde `setResultado(null)` já existe, perto do início da função), resetar o status de salvar a cada nova pergunta:

```typescript
    setStatusSalvar("ocioso");
```

- [ ] **Passo 3: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Passo 4: Commit**

```bash
git add src/components/analise-interativa.tsx src/lib/texto/i18n.ts
git commit -m "feat(parecer): botão \"Salvar este parecer\" na tela de Análise"
```

---

### Task 8: Componente `pareceres-salvos.tsx`

**Files:**
- Create: `src/components/pareceres-salvos.tsx`

- [ ] **Passo 1: Escrever o componente**

Reusa exatamente as classes CSS já existentes de `historico-relatorios-pos-treino.tsx` (`card-relatorio-item`, `botao-acao-relatorio`) e do padrão de confirmação inline do C5 (`confirma`, `confirma__texto`, `confirma__acoes`, `botao-secundario`, `botao-destrutivo`) — nenhuma classe CSS nova precisa ser criada.

```typescript
"use client";

// lastro · SDD.md §10.3 — lista de pareceres salvos (opt-in), dentro de
// /ajustes/relatorios. Abre um parecer inline (sem modal novo — reusa
// `Parecer`, o mesmo componente da tela de Análise) em vez de navegar
// pra outra rota.
import { useState, useTransition } from "react";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { excluirParecer } from "@/lib/dados/parecer";
import Parecer from "@/components/parecer";
import { formatarDataCurta } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function PareceresSalvos({
  pareceres,
  idioma,
}: {
  pareceres: ParecerSalvo[];
  idioma: Idioma;
}) {
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [listaLocal, setListaLocal] = useState(pareceres);

  const aberto = listaLocal.find((p) => p.id === abertoId) ?? null;

  function confirmarExclusao(id: string) {
    iniciar(async () => {
      await excluirParecer(id);
      setListaLocal((atual) => atual.filter((p) => p.id !== id));
      setExcluindoId(null);
      if (abertoId === id) setAbertoId(null);
    });
  }

  if (aberto) {
    return (
      <div className="pilha">
        <button type="button" className="botao-textual" onClick={() => setAbertoId(null)}>
          ← {t("Voltar à lista", idioma)}
        </button>

        <Parecer
          pergunta={aberto.perguntaTexto}
          texto={aberto.texto}
          avisoFalhaInterpretativa={aberto.avisoFalhaInterpretativa}
          evidencia={aberto.evidencia}
          idioma={aberto.idioma}
          emitidoEm={aberto.criadoEm}
        />

        <a
          href={`/api/parecer/${aberto.id}/pdf`}
          download
          className="botao-primario"
        >
          {t("Baixar PDF", idioma)}
        </a>

        {excluindoId === aberto.id ? (
          <div className="confirma" role="group" aria-label={t("Excluir parecer salvo", idioma)}>
            <p className="confirma__texto">
              {t(
                "Excluir este parecer apaga o registro salvo — não afeta seus treinos nem séries. Não dá para desfazer.",
                idioma,
              )}
            </p>
            <div className="confirma__acoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setExcluindoId(null)}
                disabled={pendente}
              >
                {t("Cancelar", idioma)}
              </button>
              <button
                type="button"
                className="botao-destrutivo"
                onClick={() => confirmarExclusao(aberto.id)}
                disabled={pendente}
              >
                {pendente ? t("Excluindo…", idioma) : t("Excluir parecer salvo", idioma)}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="botao-textual-com-icone botao-textual-com-icone--destrutivo"
            onClick={() => setExcluindoId(aberto.id)}
          >
            {t("Excluir parecer salvo", idioma)}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pilha">
      {listaLocal.map((parecer) => (
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
}
```

- [ ] **Passo 2: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Passo 3: Commit**

```bash
git add src/components/pareceres-salvos.tsx
git commit -m "feat(parecer): componente da lista de pareceres salvos"
```

---

### Task 9: Wire em `/ajustes/relatorios`

**Files:**
- Modify: `src/app/ajustes/relatorios/page.tsx`

- [ ] **Passo 1: Buscar os pareceres e renderizar a seção nova**

Adicionar o import:

```typescript
import { listarPareceres } from "@/lib/dados/parecer";
import PareceresSalvos from "@/components/pareceres-salvos";
```

No corpo de `PaginaRelatoriosAjustes`, buscar a lista junto com `treinos` (trocar a linha `const treinos = await listarTreinos();` por):

```typescript
  const [treinos, pareceres] = await Promise.all([listarTreinos(), listarPareceres()]);
```

Depois do bloco `{treinos.length > 0 ? (...) : (...)}` existente, ainda dentro de `<div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">`, adicionar:

```typescript
        {pareceres.length > 0 && (
          <div className="pilha" style={{ marginTop: "var(--lastro-e-4)" }}>
            <h2 className="doc__secao">{t("Pareceres salvos", idioma)}</h2>
            <PareceresSalvos pareceres={pareceres} idioma={idioma} />
          </div>
        )}
```

(Seção não aparece quando a lista está vazia — decisão do SDD.md §10.3: não duplicar estado vazio para uma feature opt-in que a pessoa ainda não usou.)

- [ ] **Passo 2: Rodar os gates**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [ ] **Passo 3: Commit**

```bash
git add src/app/ajustes/relatorios/page.tsx
git commit -m "feat(parecer): integra pareceres salvos em /ajustes/relatorios"
```

---

### Task 10: Corrigir `SDD.md` §10.6 (achado ao planejar)

**Files:**
- Modify: `SDD.md`

**Por quê:** ao escrever este plano, descobri que a spec (§10.6, ponto 3) prometia um teste `vitest` cobrindo `buscarParecer` negando acesso entre usuários — mas o projeto **não tem esse costume** para módulos de I/O (`treino.ts`, `exportar.ts`, `conta.ts` não têm `.test.ts`; a verificação de RLS entre usuários é sempre ao vivo, com dois usuários QA reais, igual ao ponto 2 da própria seção 9.5 do SDD). A spec estava inconsistente com a convenção real do próprio projeto.

- [ ] **Passo 1: Editar o ponto 3 da seção 10.6**

Trocar:

```
3. **`npx vitest run`** cobre `buscarParecer` negando acesso a parecer de outro usuário.
```

Por:

```
3. **RLS confirmado com dois usuários reais (não com `service_role`, ver nota do ponto 2), execução registrada em `qa/evidencias/`** — não há teste `vitest` aqui: módulos de I/O deste projeto (`treino.ts`, `exportar.ts`, `conta.ts`) nunca tiveram esse costume, a verificação de isolamento entre usuários sempre foi ao vivo.
```

- [ ] **Passo 2: Commit**

```bash
git add SDD.md
git commit -m "docs: Corrige SDD.md §10.6 — verificação de RLS é ao vivo, não vitest (achado ao planejar)"
```

---

### Task 11: Gates finais + evidência + registro em `QA.md`

**Files:**
- Modify: `QA.md`
- Create: `qa/evidencias/PDF-01/correcao.md`

- [ ] **Passo 1: Rodar os 4 gates, do zero**

```bash
cd C:\lastro-parecer-pdf
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

Esperado: todos limpos (tirando o `LayoutProps` pré-existente, já registrado como não-regressão).

- [ ] **Passo 2: Verificação ao vivo, ponta a ponta, com usuário QA descartável**

```bash
npm run dev
```

Com um usuário QA descartável (criar via o mesmo padrão do `Task 2, Passo 3` — `admin.auth.admin.createUser`, ou pelo formulário de cadastro real), e **dados reais de treino semeados** (4 treinos passados com série valendo, mesmo truque do `e2e/helpers/semear-historico.ts` da Fase 6, pra destravar `MINIMO_SEMANAS_PARECER`):

1. Logar, ir em `/analise`, gerar um parecer (qualquer uma das 5 perguntas).
2. Clicar "Salvar este parecer" → vira "Salvo ✓".
3. Ir em `/ajustes/relatorios` → seção "Pareceres salvos" aparece com 1 cartão.
4. Clicar "Ver parecer" → abre o parecer completo, com a pergunta certa e o texto certo.
5. Conferir a data mostrada (`doc__meta`) — deve ser a de HOJE (é o dia do save), não confunde com um teste de datas diferentes ainda; a prova real de que `emitidoEm` funciona vem melhor salvando dois pareceres em dias diferentes, mas para esta verificação basta confirmar que a tela não quebra e mostra uma data plausível.
6. Clicar "Baixar PDF" → arquivo `.pdf` baixa; abrir e conferir: pergunta, veredito, corpo do texto e a tabela de evidência (se o parecer tiver blocos) aparecem certos, texto é selecionável (não é imagem).
7. Voltar, clicar "Excluir parecer salvo" → confirmação inline aparece (nunca alerta nativo do navegador) → confirmar → cartão some da lista.
8. Conferir no banco (via o mesmo `node -e` do Task 2, Passo 3, adaptado): `select count(*) from parecer where usuario_id = '<id do QA>'` = `0`.
9. **Apagar o usuário QA** (`admin.auth.admin.deleteUser`) — cascade cuida do resto.

- [ ] **Passo 3: Registrar em `QA.md`**

Adicionar à "Mapa de Áreas" (se `analise` já cobre `src/app/api/analise/**`, adicionar também `src/lib/dados/parecer.ts`, `src/lib/pdf/**`, `src/app/api/parecer/**`, `src/components/pareceres-salvos.tsx`, `src/components/parecer.tsx` a essa área — ou criar uma linha nova; seguir o padrão já usado pra `i18n`/`e2e` nesta mesma tabela).

Adicionar a "Estado por Item":

```
| PDF-01 | analise | Salvar parecer (opt-in), listar em /ajustes/relatorios, baixar como PDF (texto selecionável), excluir com confirmação inline | ALEGADO | <SHA do commit> | 2026-08-31 | qa/evidencias/PDF-01/ |
```

- [ ] **Passo 4: Escrever `qa/evidencias/PDF-01/correcao.md`**

Documentar: o pedido (item 5 do backlog, motivado por uso real), o que foi feito (task por task, resumido), a decisão de biblioteca (`DECISIONS.md`), o achado sobre `emitidoEm` em `Parecer`, o achado sobre a correção do SDD.md §10.6, e os 9 pontos da verificação ao vivo do Passo 2 — mesmo formato de `qa/evidencias/E2E-01/correcao.md` e `qa/evidencias/AJ-02/correcao.md` desta mesma sessão.

- [ ] **Passo 5: Commit**

```bash
git add QA.md qa/evidencias/PDF-01/
git commit -m "docs: Registra PDF-01 (ALEGADO) — histórico de pareceres + PDF"
```

---

### Task 12: PR e auditoria independente

- [ ] **Passo 1: Apagar `.env.local` do worktree**

```bash
rm C:\lastro-parecer-pdf\.env.local
```

- [ ] **Passo 2: Push e abrir PR**

```bash
cd C:\lastro-parecer-pdf
git push -u origin feat/historico-parecer-pdf
gh pr create --title "feat(parecer): histórico opt-in de pareceres + exportação em PDF" --body "Implementa SDD.md §10 — item 5 do backlog. Ver qa/evidencias/PDF-01/correcao.md pra verificação ao vivo (ALEGADO, aguardando auditoria independente)."
```

- [ ] **Passo 3: Dispatch de auditoria independente**

Seguindo o protocolo `AGENTS.md` §5 ("quem implementa não se audita"): dispatch de um agente separado, em CONTEXTO LIMPO, que **cria seu próprio worktree isolado** (`git worktree add ../lastro-audit-pdf`) antes de tocar em qualquer coisa — lição da sessão de 2026-08-30 (colisão entre sessões no mesmo diretório). O agente reproduz os 9 pontos da verificação ao vivo (Task 11, Passo 2) do zero, com seu PRÓPRIO usuário QA descartável, e confirma ou reprova o `ALEGADO`.

- [ ] **Passo 4: Depois da auditoria confirmar, atualizar `QA.md` pra `PASSOU`, com o SHA real de merge, e pedir aprovação do dono pra mergear.**

---

## Self-review desta plano

**Cobertura da spec (SDD.md §10):** schema+RLS+GRANT (Task 2), módulo de dados (Task 3), geração de PDF (Tasks 4-5), prop `emitidoEm` (Task 6), botão salvar (Task 7), lista+abrir+excluir (Task 8), wire na tela (Task 9), verificação ao vivo (Task 11) — todos os pontos de §10.1 a §10.6 têm task correspondente. §10.0 (fora de escopo) não gerou task nenhuma, como esperado.

**Achado durante o planejamento, corrigido:** a spec original (§10.6, ponto 3) pedia um teste `vitest` que não bate com a convenção real do projeto para módulos de I/O — corrigido na Task 10, com a spec e o plano batendo entre si.

**Consistência de tipos:** `NumeroPergunta`, `EvidenciaParaTela`, `Idioma`, `ParecerSalvo`, `NovoParecerInput` são definidos uma vez (Task 3) e reusados com os mesmos nomes em todas as tasks seguintes (4, 5, 6, 7, 8) — conferido nome a nome ao escrever este plano.
