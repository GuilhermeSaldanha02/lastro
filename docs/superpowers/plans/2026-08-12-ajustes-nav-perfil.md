# Ajustes na pílula (nav, perfil, upload de foto, Sair) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o item "Coach" da pílula de navegação por "Ajustes" (engrenagem); mover Coach, edição de perfil (com upload manual de foto) e "Sair" para dentro da nova tela `/ajustes`, sem repeti-los em outro lugar do app.

**Architecture:** Duas rotas novas (`/ajustes` menu, `/perfil` edição) seguindo o esqueleto de tela já usado em toda página (`barra-topo` + `corpo corpo--com-nav` + `AbaInferior`). Upload de foto é uma Server Action isolada por `"use server"` inline (não o arquivo inteiro) dentro de `src/lib/dados/perfil.ts`, para não vazar código server-only (`next/headers`) pro bundle do cliente. A validação de arquivo (tipo/tamanho) vive num módulo puro separado, sem import de Next/Supabase, para ser testável e importável com segurança tanto pelo cliente quanto pelo servidor.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Supabase (`@supabase/ssr`), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-12-ajustes-nav-perfil-design.md`

---

## Achados da investigação que mudam o desenho da spec

1. **`vitest.config.ts` não resolve o alias `@/`** — nenhum teste hoje importa nada de `src/lib/dados/*.ts`. Confirmado experimentalmente (import falha com "Cannot find package '@/lib/supabase/cliente-servidor'"). Por isso `validarArquivoAvatar` vai morar num arquivo **novo e separado**, `src/lib/dados/validar-avatar.ts`, sem nenhum import de Next/Supabase — mesmo padrão de `src/lib/texto/formatar-delta.ts` (lógica pura, testada por import relativo). `perfil.ts` importa dessa função, não o contrário.
2. **`atualizarAvatarManual` não pode ter teste unitário de verdade** (toca Supabase real) — mesma convenção já usada em `treino.ts`: nenhuma das funções `*Remoto` tem teste. Verificação é manual, no navegador, com usuário QA (Task 9).
3. **Sem middleware de sessão** (`middleware.ts` não existe no projeto, apesar de um comentário desatualizado em `treino/page.tsx` dizer o contrário). As páginas atuais toleram `perfil === null` sem crashar (`{perfil && <Avatar/>}`); `/ajustes` e `/perfil` seguem a mesma convenção — sem redirect novo, sem padrão novo.
4. **`.item__data` usa fonte monoespaçada numérica** (`--lastro-fonte-num`, `tabular-nums`) — certo para datas, errado para o rótulo "Coach". Uso `.atalho__titulo`/`.atalho__meta` dentro do item da lista em vez de `.item__data`/`.item__meta` — essas duas classes não são aninhadas sob `.atalho`, funcionam em qualquer lugar.

---

## File Structure

**Criar:**
- `src/lib/dados/validar-avatar.ts` — validação pura (tipo, tamanho)
- `src/lib/dados/validar-avatar.test.ts` — 4 casos
- `src/app/ajustes/page.tsx` — menu (perfil, Coach, Sair)
- `src/app/perfil/page.tsx` — casca server, busca perfil
- `src/components/editar-perfil.tsx` — client, upload de foto

**Modificar:**
- `src/lib/dados/perfil.ts` — nova Server Action `atualizarAvatarManual`
- `src/components/aba-inferior.tsx` — item `coach` vira `ajustes`
- `src/app/coach/page.tsx` — `AbaInferior ativa="ajustes"`
- `src/app/page.tsx` — remove o botão Sair (só existia aqui)
- `src/app/sistema.css` — 1 regra utilitária (input de arquivo oculto)

---

### Task 1: `validarArquivoAvatar` — TDD

**Files:**
- Create: `src/lib/dados/validar-avatar.ts`
- Test: `src/lib/dados/validar-avatar.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { validarArquivoAvatar } from "./validar-avatar";

function arquivo(tipo: string, tamanhoBytes: number): File {
  return new File([new Uint8Array(tamanhoBytes)], "foto", { type: tipo });
}

describe("validarArquivoAvatar", () => {
  it("rejeita tipo que não é JPEG nem PNG", () => {
    expect(validarArquivoAvatar(arquivo("image/gif", 1000))).toEqual({
      ok: false,
      erro: "Envie uma foto em JPEG ou PNG.",
    });
  });

  it("rejeita arquivo maior que 5 MB", () => {
    expect(
      validarArquivoAvatar(arquivo("image/jpeg", 5 * 1024 * 1024 + 1)),
    ).toEqual({
      ok: false,
      erro: "A foto precisa ter até 5 MB.",
    });
  });

  it("aceita JPEG dentro do limite de tamanho", () => {
    expect(validarArquivoAvatar(arquivo("image/jpeg", 1024))).toEqual({
      ok: true,
    });
  });

  it("aceita PNG dentro do limite de tamanho", () => {
    expect(validarArquivoAvatar(arquivo("image/png", 1024))).toEqual({
      ok: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/dados/validar-avatar.test.ts`
Expected: FAIL — `Cannot find module './validar-avatar'` (o arquivo ainda não existe)

- [ ] **Step 3: Write minimal implementation**

```typescript
// lastro · validação pura do arquivo de foto de perfil — sem dependência
// de Next.js/Supabase, pra poder ser testada isoladamente (`vitest.config.ts`
// não resolve o alias `@/`, então qualquer import de `next/headers` no
// mesmo arquivo quebraria o teste) e importada tanto pelo componente
// cliente (feedback imediato) quanto pela ação de servidor (defesa contra
// cliente adulterado).
const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png"]);
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

export type ValidacaoAvatar = { ok: true } | { ok: false; erro: string };

export function validarArquivoAvatar(arquivo: File): ValidacaoAvatar {
  if (!TIPOS_ACEITOS.has(arquivo.type)) {
    return { ok: false, erro: "Envie uma foto em JPEG ou PNG." };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: "A foto precisa ter até 5 MB." };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/dados/validar-avatar.test.ts`
Expected: PASS — 4/4 testes

- [ ] **Step 5: Commit**

```bash
git add src/lib/dados/validar-avatar.ts src/lib/dados/validar-avatar.test.ts
git commit -m "feat: Validar tipo e tamanho da foto de perfil"
```

---

### Task 2: `atualizarAvatarManual` — Server Action em `perfil.ts`

**Files:**
- Modify: `src/lib/dados/perfil.ts`

**Sem teste unitário** (achado 2, acima) — toca Supabase real; verificação é manual no navegador (Task 9).

- [ ] **Step 1: Adicionar o import da validação pura**

No topo de `src/lib/dados/perfil.ts`, junto dos imports existentes:

```typescript
import { validarArquivoAvatar } from "./validar-avatar";
```

- [ ] **Step 2: Adicionar a Server Action no fim do arquivo**

```typescript
export { validarArquivoAvatar } from "./validar-avatar";

export type ResultadoAtualizarAvatar =
  | { ok: true; avatarUrl: string }
  | { ok: false; erro: string };

/**
 * Upload manual de foto — quem cadastrou por e-mail não tem `avatar_url`
 * do Google pra baixar (`sincronizarAvatarGoogle` acima não se aplica).
 * Chamada direto do componente cliente de `/perfil`. `"use server"`
 * inline (não no topo do arquivo) deixa só esta função virar Server
 * Action, sem tentar transformar `sincronizarAvatarGoogle` (que recebe
 * `SupabaseClient`/`User`, não serializável) em uma.
 */
export async function atualizarAvatarManual(
  arquivo: File,
): Promise<ResultadoAtualizarAvatar> {
  "use server";

  const validacao = validarArquivoAvatar(arquivo);
  if (!validacao.ok) return validacao;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  const extensao = arquivo.type.includes("png") ? "png" : "jpg";
  const caminho = `${user.id}/avatar.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(CAMINHO_BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: true });
  if (erroUpload) {
    return { ok: false, erro: "Não foi possível enviar a foto. Tente de novo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CAMINHO_BUCKET).getPublicUrl(caminho);

  const { error: erroAtualizar } = await supabase
    .from("usuario")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);
  if (erroAtualizar) {
    return {
      ok: false,
      erro: "Foto enviada, mas não deu para salvar o perfil. Tente de novo.",
    };
  }

  return { ok: true, avatarUrl: publicUrl };
}
```

`CAMINHO_BUCKET` já existe no arquivo (usado por `sincronizarAvatarGoogle`) — não redeclarar.

- [ ] **Step 3: Verificar tipos e build**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add src/lib/dados/perfil.ts
git commit -m "feat: Adicionar upload manual de foto de perfil"
```

---

### Task 3: Pílula — "Coach" vira "Ajustes"

**Files:**
- Modify: `src/components/aba-inferior.tsx`

- [ ] **Step 1: Trocar o tipo `Secao`**

Old:
```typescript
type Secao = "inicio" | "bancada" | "analise" | "catalogo" | "coach";
```

New:
```typescript
type Secao = "inicio" | "bancada" | "analise" | "catalogo" | "ajustes";
```

- [ ] **Step 2: Trocar a entrada `coach` do array `SECOES` por `ajustes`**

Old:
```typescript
  {
    id: "coach",
    href: "/coach",
    rotulo: "Coach",
    caminho: "M20 12a8 8 0 01-11.6 7.1L4 20l1-4.2A8 8 0 1120 12z",
  },
```

New:
```typescript
  {
    id: "ajustes",
    href: "/ajustes",
    rotulo: "Ajustes",
    caminho:
      "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1zM12 9a3 3 0 100 6 3 3 0 000-6z",
  },
```

(Ícone de engrenagem — um único `<path>` com dois subtraçados, a coroa dentada e o círculo central, igual ao padrão dos outros ícones: `stroke`, nunca `fill`.)

- [ ] **Step 3: Verificar que o TypeScript pega qualquer uso desatualizado**

Run: `npx tsc --noEmit`
Expected: **FALHA aqui é esperada e correta** — `src/app/coach/page.tsx:27` vai reclamar que `"coach"` não é mais um `Secao` válido. Isso confirma que o compilador vai pegar qualquer outro lugar esquecido. Segue pra Task 4 pra corrigir.

- [ ] **Step 4: Commit**

```bash
git add src/components/aba-inferior.tsx
git commit -m "feat: Trocar Coach por Ajustes na pilula de navegacao"
```

---

### Task 4: Atualizar `/coach` para o novo nome de seção

**Files:**
- Modify: `src/app/coach/page.tsx`

- [ ] **Step 1: Trocar `ativa="coach"` por `ativa="ajustes"`**

Old:
```tsx
      <AbaInferior ativa="coach" />
```

New:
```tsx
      <AbaInferior ativa="ajustes" />
```

Isso mantém "Ajustes" em destaque na pílula enquanto o usuário está dentro do Coach — ele é sub-tela de Ajustes agora, não mais uma seção própria.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros (a falha da Task 3 Step 3 desaparece)

- [ ] **Step 3: Commit**

```bash
git add src/app/coach/page.tsx
git commit -m "fix: Manter Ajustes em destaque na pilula dentro do Coach"
```

---

### Task 5: Remover "Sair" da Início

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Remover o import não usado**

Old:
```typescript
import { obterPerfil } from "@/lib/dados/perfil";
import { sair } from "@/lib/dados/auth";
import { dataLocalBrasil, formatarDataCurta } from "@/lib/tempo";
```

New:
```typescript
import { obterPerfil } from "@/lib/dados/perfil";
import { dataLocalBrasil, formatarDataCurta } from "@/lib/tempo";
```

- [ ] **Step 2: Remover o botão Sair, guardando o avatar por `perfil` (evita `<div>` vazio quando `perfil` é `null`)**

Old:
```tsx
          <div className="barra-topo__usuario">
            {perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
            <form action={sair}>
              <button type="submit" className="botao-barra">
                Sair
              </button>
            </form>
          </div>
```

New:
```tsx
          {perfil && (
            <div className="barra-topo__usuario">
              <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />
            </div>
          )}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: Remover Sair da Inicio (mudou para Ajustes)"
```

---

### Task 6: Nova rota `/ajustes`

**Files:**
- Create: `src/app/ajustes/page.tsx`

- [ ] **Step 1: Criar a página**

```tsx
// lastro · Ajustes consolida o que antes ficava espalhado: perfil, Coach
// e Sair. Pedido do dono (2026-08-12) — Coach deixa de ser link direto
// da pílula, vira sub-tela daqui. Ver
// docs/superpowers/specs/2026-08-12-ajustes-nav-perfil-design.md.
import Link from "next/link";
import { obterPerfil } from "@/lib/dados/perfil";
import { sair } from "@/lib/dados/auth";
import AbaInferior from "@/components/aba-inferior";

export default async function PaginaAjustes() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">lastro</p>
            <h1 className="barra-topo__titulo">Ajustes</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {perfil ? (
          <div className="pilha">
            <Link href="/perfil" className="atalho">
              <span className="atalho__titulo">{perfil.nome}</span>
              <span className="atalho__meta">Editar perfil</span>
            </Link>

            <ul className="lista">
              <li>
                <div className="item">
                  <Link href="/coach" className="item__link">
                    <span className="atalho__titulo">Coach</span>
                    <span className="atalho__meta">Tirar uma dúvida</span>
                  </Link>
                </div>
              </li>
            </ul>

            <form action={sair}>
              <button type="submit" className="botao-secundario">
                Sair
              </button>
            </form>
          </div>
        ) : (
          <p className="vazio">Entre para ver seus ajustes.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
```

Zero CSS novo — `.atalho`, `.lista`/`.item`/`.item__link`, `.pilha` (espaçamento entre o card de perfil, a lista e o botão Sair) e `.botao-secundario` já existem e já têm contraste medido.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/app/ajustes/page.tsx
git commit -m "feat: Criar tela de Ajustes (perfil, Coach, Sair)"
```

---

### Task 7: CSS utilitário para o input de arquivo oculto

**Files:**
- Modify: `src/app/sistema.css`

- [ ] **Step 1: Adicionar a regra, logo depois do bloco `.aviso-erro`**

Adicionar após a regra `.aviso-erro { ... }` (linha ~721 hoje):

```css
/* O input nativo de arquivo some da tela; o botão estilizado abaixo
   dispara o clique nele. Sem isto o navegador desenha seu próprio
   controle de upload, fora do sistema visual. */
.campo-arquivo-oculto {
  display: none;
}
```

Não é decisão de cor/tipografia/espaçamento (`DESIGN.md` não muda) — é só a técnica padrão de "botão customizado dispara input nativo".

- [ ] **Step 2: Commit**

```bash
git add src/app/sistema.css
git commit -m "feat: Adicionar utilitario para ocultar input de arquivo nativo"
```

---

### Task 8: Componente cliente de upload — `EditarPerfil`

**Files:**
- Create: `src/components/editar-perfil.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
"use client";

// lastro · item 9 do backlog (2026-08-12) — quem cadastrou por e-mail não
// tem avatar_url do Google pra baixar; este é o único lugar que grava uma
// foto manual. `validarArquivoAvatar` dá feedback antes de gastar uma
// chamada de rede; `atualizarAvatarManual` valida de novo no servidor
// (defesa contra cliente adulterado — ver perfil.ts).
import { useRef, useState, type ChangeEvent } from "react";
import { atualizarAvatarManual } from "@/lib/dados/perfil";
import { validarArquivoAvatar } from "@/lib/dados/validar-avatar";
import Avatar from "./avatar";

export default function EditarPerfil({
  nome,
  avatarUrlInicial,
}: {
  nome: string;
  avatarUrlInicial: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o valor pra permitir escolher o MESMO arquivo de novo depois
    // de um erro — sem isto o evento `change` não dispara na segunda vez.
    evento.target.value = "";
    if (!arquivo) return;

    setErro(null);

    const validacao = validarArquivoAvatar(arquivo);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }

    setEnviando(true);
    const resultado = await atualizarAvatarManual(arquivo);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setAvatarUrl(resultado.avatarUrl);
  }

  return (
    <div className="pilha">
      <Avatar nome={nome} avatarUrl={avatarUrl} />
      <p>{nome}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="campo-arquivo-oculto"
        onChange={aoEscolherArquivo}
        aria-label="Escolher foto de perfil"
      />
      <button
        type="button"
        className="botao-secundario"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
      >
        {enviando ? "Enviando…" : "Trocar foto"}
      </button>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/components/editar-perfil.tsx
git commit -m "feat: Criar componente de upload de foto de perfil"
```

---

### Task 9: Nova rota `/perfil`

**Files:**
- Create: `src/app/perfil/page.tsx`

- [ ] **Step 1: Criar a página**

```tsx
// lastro · sub-tela de Ajustes — editar foto de perfil. Nome é somente
// leitura por ora (fora de escopo — pedido foi upload de foto, não
// edição de nome).
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import EditarPerfil from "@/components/editar-perfil";

export default async function PaginaPerfil() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Ajustes</p>
            <h1 className="barra-topo__titulo">Perfil</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {perfil ? (
          <EditarPerfil nome={perfil.nome} avatarUrlInicial={perfil.avatarUrl} />
        ) : (
          <p className="vazio">Entre para editar seu perfil.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/app/perfil/page.tsx
git commit -m "feat: Criar tela de edicao de perfil com upload de foto"
```

---

### Task 10: Verificação completa + gate visual + docs

**Files:**
- Nenhum arquivo de código — só verificação e documentação.

- [ ] **Step 1: Rodar a checagem completa**

Run: `npx tsc --noEmit && npm run test && npm run lint && npm run build`
Expected: tudo limpo — `tsc` sem erro, suíte inteira passando (os 4 testes novos incluídos), 0 erros de lint, build de produção sem falha.

- [ ] **Step 2: Gate visual no navegador real (extensão Chrome — regra do projeto para mudança de nav)**

Com usuário QA efêmero (ou o próprio dono), em 375×812 e 390×844:
1. Pílula mostra "Ajustes" (engrenagem) no lugar onde "Coach" estava; rótulo não quebra linha nem estoura a faixa do item.
2. Tocar em "Ajustes" abre `/ajustes`: card com nome do usuário, linha "Coach", botão "Sair" — pílula continua com "Ajustes" em destaque.
3. Tocar no card do nome abre `/perfil`: avatar atual, nome, botão "Trocar foto".
4. Escolher uma foto JPEG real: botão vira "Enviando…", depois o avatar atualiza na tela sem reload. Confirmar no Postgres que `usuario.avatar_url` mudou.
5. O novo avatar aparece em `/`, `/treino`, `/analise`, `/catalogo`, `/ajustes` (toda tela que usa `<Avatar>`).
6. Tentar subir um arquivo inválido (ex.: `.gif` ou > 5 MB): mensagem de erro aparece, nada é enviado.
7. Tocar em "Coach" dentro de Ajustes abre `/coach` normalmente (chat intacto).
8. Tocar em "Sair" em `/ajustes` encerra a sessão e redireciona pra `/login`.
9. Conferir que a Início não mostra mais nenhum botão "Sair".
10. Contraste do ícone/rótulo "Ajustes" (ativo e inativo) — deve bater com os valores já medidos dos outros itens (4,78:1 / 5,16:1, `DECISIONS.md` 2026-08-11), porque nenhum token novo foi criado. Medir mesmo assim, não assumir.

- [ ] **Step 3: Atualizar `PROGRESS.md` e `DECISIONS.md`**

Registrar em `PROGRESS.md`: item novo cobrindo a mudança de nav (Coach→Ajustes), a tela de Ajustes, a tela de Perfil e o upload manual de foto — fechando o item 9 do backlog. Registrar em `DECISIONS.md` a decisão do dono (Coach deixa de ser link direto da pílula) e o achado técnico do `"use server"` inline (por que não virou diretiva de arquivo inteiro).

- [ ] **Step 4: Commit da documentação**

```bash
git add PROGRESS.md DECISIONS.md
git commit -m "docs: Registrar tela de Ajustes, perfil e upload de foto"
```

- [ ] **Step 5: Abrir PR**

```bash
git push -u origin feat/ajustes-nav-perfil
gh pr create --title "Ajustes na pilula: perfil, Coach e Sair consolidados" --body "$(cat <<'EOF'
## Resumo
- Pilula: item "Coach" vira "Ajustes" (engrenagem)
- Nova tela /ajustes: perfil, Coach, Sair
- Nova tela /perfil: nome + upload de foto (item 9 do backlog)
- Sair sai da Inicio, existe so em Ajustes

## Test plan
- [x] tsc/test/lint/build limpos
- [x] Gate visual no navegador real (pilula, /ajustes, /perfil, upload, Sair)
EOF
)"
```

**Não fazer merge sozinho** — esta mudança toca a peça de navegação (peça sensível, já passou por várias rodadas de correção); o dono confirma no aparelho real antes do merge, como já é praxe no projeto.

---

## Self-Review

**Cobertura da spec:** nav (Task 3/4) · `/ajustes` (Task 6) · `/perfil` (Task 9) · upload com validação (Tasks 1/2/8) · Sair sai da Início (Task 5) · testes unitários da validação (Task 1) · gate visual (Task 10) · fora de escopo respeitado (nome permanece somente leitura, Task 9 não adiciona edição de nome). Todas as seções da spec têm task correspondente.

**Placeholder scan:** nenhum "TBD"/"implementar depois" — todo passo tem código completo ou comando+saída esperada.

**Consistência de tipos:** `Secao` (Task 3) usado identicamente em `coach/page.tsx` (Task 4), `ajustes/page.tsx` (Task 6) e `perfil/page.tsx` (Task 9) — sempre `"ajustes"`. `ResultadoAtualizarAvatar`/`ValidacaoAvatar` com o mesmo formato `{ok:true,...}|{ok:false,erro:string}` usado em `atualizarAvatarManual` (Task 2) e consumido em `editar-perfil.tsx` (Task 8) sem divergência de nome de campo.

**Achado corrigido durante a escrita do plano (não estava na spec):** a spec original presumia que dava pra testar `validarArquivoAvatar` diretamente dentro de `perfil.ts`; a investigação mostrou que o alias `@/` não resolve em teste, então a função pura foi extraída pra `validar-avatar.ts`. Isso também resolveu, de graça, o risco de o componente cliente (`editar-perfil.tsx`) importar transitivamente `next/headers` — ele importa a validação do módulo puro, e só a Server Action (não o resto do arquivo) de `perfil.ts`.
