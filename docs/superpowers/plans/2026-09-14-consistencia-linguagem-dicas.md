# Consistência de linguagem e dicas contextuais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer todas as superfícies de aluno/treino e personal/trabalho obedecerem ao idioma selecionado, usarem linguagem simples e aplicarem `DicaInfo` corretamente nos caminhos normal e triste.

**Architecture:** A migração será incremental por jornada. `obterPerfil().idioma` permanece como fonte no servidor; páginas passam `Idioma` explicitamente, componentes usam `t()` e geradores determinísticos de texto recebem o idioma sem introduzir rede ou IA. Um portão estático baseado no parser TypeScript impede novos literais visíveis nas superfícies migradas.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Vitest, Playwright, Supabase, `src/lib/texto/i18n.ts`, `DicaInfo`/`Folha`.

---

## Ordem, portões e regra de execução

- Executar as tarefas na ordem. Cada tarefa termina em commit próprio.
- Não executar `npm run e2e` localmente: os specs Playwright rodam contra produção somente no CI.
- Em toda tarefa, o teste vermelho novo é primeiro triado como achado do app ou defeito do teste.
- Depois de `npm run dev` ou `npm run build`, restaurar `next-env.d.ts` se ele mudar.
- L0–L4 geram evidência do próprio implementador como `ALEGADO`. Só L5, por outro agente, pode promover a `PASSOU`.
- Nenhuma tarefa altera schema, RLS, métricas, limites, cota ou comportamento da Gemini.

## Mapa de arquivos

### Contrato e proteção

- Criar `scripts/verificar-textos-i18n.mjs`: encontra texto visível fora de `t()` nas superfícies já migradas.
- Criar `scripts/textos-i18n-permitidos.mjs`: lista curta e explícita de marcas, siglas e literais não linguísticos aceitos.
- Criar `src/lib/texto/i18n.test.ts`: prova traduções, fallback e chaves obrigatórias.
- Modificar `package.json`: inclui o portão no comando de verificação sem adicionar dependência.
- Modificar `src/lib/texto/i18n.ts`: expõe consulta de cobertura sem mudar o fallback de produção.
- Criar `docs/qualidade/matriz-linguagem.md`: inventário rastreável por rota, modo, idioma e caminho.

### Personal / Trabalho

- Modificar `src/app/personal/page.tsx`.
- Modificar `src/app/personal/alunos/page.tsx`.
- Modificar `src/app/personal/completar/page.tsx`.
- Modificar `src/app/ajustes/personal/page.tsx`.
- Modificar `src/components/fila-personal.tsx`.
- Modificar `src/components/convites-personal.tsx`.
- Modificar `src/components/completar-cadastro-personal.tsx`.
- Modificar `src/components/vinculo-aluno.tsx`.
- Modificar `src/components/seletor-modo.tsx`.
- Modificar `src/components/escolha-tipo-conta.tsx`.
- Modificar `src/components/voltar-flutuante.tsx`.
- Modificar `src/lib/dados/personal.ts`.
- Modificar `src/lib/texto/alerta-personal.ts` e seu teste.
- Modificar `src/lib/texto/i18n.ts`.

### Treino / Aluno

- Modificar `src/app/page.tsx`, `src/app/treino/page.tsx` e `src/app/treino/[id]/page.tsx`.
- Modificar `src/components/iniciar-treino.tsx`, `src/components/form-iniciar-treino.tsx`, `src/components/lista-treinos.tsx`, `src/components/treino-detalhe.tsx`, `src/components/formulario-serie.tsx`, `src/components/timer-topo.tsx`, `src/components/excluir-treino.tsx` e `src/components/relatorio-pos-treino.tsx`.
- Modificar mensagens do caminho triste em `src/lib/dados/treino.ts`, `src/lib/offline/fila-series.ts` e `src/lib/texto/i18n.ts` somente quando forem apresentadas ao usuário.

### Catálogo, modelos e anilhas

- Modificar `src/app/catalogo/page.tsx`, `src/app/catalogo/[id]/page.tsx`, páginas sob `src/app/ajustes/modelos/` e `src/app/ajustes/anilhas/` e os interceptadores equivalentes sob `src/app/@modal/`.
- Modificar `src/components/catalogo-interativo.tsx`, `src/components/lista-modelos.tsx`, `src/components/modelo-treino-form.tsx`, `src/components/excluir-modelo.tsx`, `src/components/anilhas-form.tsx`, `src/components/player-execucao-exercicio.tsx` e `src/lib/texto/i18n.ts`.

### Casca global e peça-assinatura

- Modificar `src/app/login/page.tsx`, `src/app/boas-vindas/page.tsx`, `src/app/not-found.tsx`, `src/app/ajustes/page.tsx`, `src/app/ajustes/relatorios/page.tsx`, `src/app/ajustes/relatorios/parecer/[id]/page.tsx`, `src/app/analise/page.tsx`, `src/app/coach/page.tsx` e `src/app/perfil/page.tsx`.
- Modificar os interceptadores equivalentes sob `src/app/@modal/`.
- Modificar `src/components/aba-inferior.tsx`, `src/components/cabecalho-pro.tsx`, `src/components/coach-interativo.tsx`, `src/components/analise-interativa.tsx`, `src/components/parecer.tsx`, `src/components/pareceres-salvos.tsx`, `src/components/historico-relatorios-pos-treino.tsx`, `src/components/editar-perfil.tsx`, `src/components/idioma-form.tsx`, `src/components/meta-semanal-form.tsx`, `src/components/seletor-temas.tsx` e `src/lib/texto/i18n.ts`.
- Modificar `e2e/j4-varredura.spec.ts`, `e2e/j5-contraste.spec.ts`, `e2e/j8-casca-do-personal.spec.ts`, `e2e/j10-serie-e-fila.spec.ts`, `e2e/j11-formularios.spec.ts`, `e2e/j12-isolamento-e-apis.spec.ts` e `e2e/j13-sessao-e-navegacao.spec.ts`.

---

### Task 1: L0 — Portão de cobertura do i18n

**Files:**
- Create: `scripts/textos-i18n-permitidos.mjs`
- Create: `scripts/verificar-textos-i18n.mjs`
- Create: `src/lib/texto/i18n.test.ts`
- Modify: `src/lib/texto/i18n.ts`
- Modify: `package.json`

- [ ] **Step 1: Escrever o teste vermelho do contrato do dicionário**

Adicionar em `src/lib/texto/i18n.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { possuiTraducao, t } from "./i18n";

describe("i18n", () => {
  it.each(["pt-BR", "en", "es"] as const)("mantém fallback seguro em %s", (idioma) => {
    expect(t("CHAVE_INEXISTENTE", idioma)).toBe("CHAVE_INEXISTENTE");
  });

  it.each([
    "Fila",
    "Alunos",
    "Modo do app",
    "Nada pede atenção nesta semana.",
    "Sessão expirada. Entre novamente.",
    "Página não encontrada",
  ])("possui inglês e espanhol para %s", (chave) => {
    expect(possuiTraducao(chave)).toBe(true);
    expect(t(chave, "en")).not.toBe(chave);
    expect(t(chave, "es")).not.toBe(chave);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha correta**

Run: `npx vitest run src/lib/texto/i18n.test.ts`

Expected: FAIL porque `possuiTraducao` ainda não é exportada e as chaves novas não existem.

- [ ] **Step 3: Expor a consulta de cobertura sem mudar o fallback**

Adicionar ao final de `src/lib/texto/i18n.ts`, antes de `t()`:

```ts
export function possuiTraducao(chavePtBr: string): boolean {
  return Object.hasOwn(DICIONARIO, chavePtBr);
}
```

Adicionar ao dicionário as seis chaves do teste com traduções literais completas:

```ts
"Fila": { en: "Queue", es: "Pendientes" },
"Alunos": { en: "Clients", es: "Alumnos" },
"Modo do app": { en: "App mode", es: "Modo de la aplicación" },
"Nada pede atenção nesta semana.": { en: "Nothing needs attention this week.", es: "Nada necesita atención esta semana." },
"Sessão expirada. Entre novamente.": { en: "Your session expired. Sign in again.", es: "Tu sesión venció. Inicia sesión de nuevo." },
"Página não encontrada": { en: "Page not found", es: "Página no encontrada" },
```

- [ ] **Step 4: Criar o allowlist somente com literais não linguísticos**

Criar `scripts/textos-i18n-permitidos.mjs`:

```js
export const TEXTOS_PERMITIDOS = new Set([
  "LASTRO", "WhatsApp", "CREF", "RIR", "e1RM", "kg",
  "pt-BR", "en", "es", "TREINO", "TRABALHO",
]);

export const PROPRIEDADES_NAO_VISIVEIS = new Set([
  "className", "href", "id", "name", "type", "role", "viewBox",
  "d", "fill", "stroke", "target", "rel", "method", "action",
]);
```

- [ ] **Step 5: Criar o verificador estático com o parser já instalado**

Criar `scripts/verificar-textos-i18n.mjs` usando `typescript` para percorrer `src/app/**/*.tsx` e `src/components/**/*.tsx`. O verificador deve:

```js
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { PROPRIEDADES_NAO_VISIVEIS, TEXTOS_PERMITIDOS } from "./textos-i18n-permitidos.mjs";

const RAIZES = ["src/app", "src/components"];
const MIGRADOS = [];

function arquivosTsx(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const alvo = path.join(dir, item.name);
    return item.isDirectory() ? arquivosTsx(alvo) : alvo.endsWith(".tsx") ? [alvo] : [];
  });
}

function ehTraduzido(no) {
  let atual = no.parent;
  while (atual) {
    if (ts.isCallExpression(atual) && atual.expression.getText() === "t") return true;
    atual = atual.parent;
  }
  return false;
}

function textoRelevante(texto) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return /[A-Za-zÀ-ÿ]/.test(limpo) && !TEXTOS_PERMITIDOS.has(limpo) ? limpo : null;
}

const falhas = [];
for (const arquivo of RAIZES.flatMap(arquivosTsx).filter((a) => MIGRADOS.some((r) => r.test(a)))) {
  const fonte = ts.createSourceFile(arquivo, fs.readFileSync(arquivo, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visitar(no) {
    if (ts.isJsxText(no) && !ehTraduzido(no)) {
      const texto = textoRelevante(no.text);
      if (texto) falhas.push(`${arquivo}:${fonte.getLineAndCharacterOfPosition(no.pos).line + 1}: ${texto}`);
    }
    if (ts.isJsxAttribute(no) && no.initializer && ts.isStringLiteral(no.initializer)) {
      const nome = no.name.getText();
      const texto = textoRelevante(no.initializer.text);
      if (texto && !PROPRIEDADES_NAO_VISIVEIS.has(nome)) falhas.push(`${arquivo}:${fonte.getLineAndCharacterOfPosition(no.pos).line + 1}: ${nome}=${texto}`);
    }
    if ((ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) && ts.isJsxExpression(no.parent) && !ehTraduzido(no)) {
      const texto = textoRelevante(no.text);
      if (texto) falhas.push(`${arquivo}:${fonte.getLineAndCharacterOfPosition(no.pos).line + 1}: ${texto}`);
    }
    if (ts.isTemplateExpression(no) && ts.isJsxExpression(no.parent) && !ehTraduzido(no)) {
      const partes = [no.head.text, ...no.templateSpans.map((span) => span.literal.text)].join(" ");
      const texto = textoRelevante(partes);
      if (texto) falhas.push(`${arquivo}:${fonte.getLineAndCharacterOfPosition(no.pos).line + 1}: ${texto}`);
    }
    ts.forEachChild(no, visitar);
  }
  visitar(fonte);
}

if (falhas.length) {
  process.stderr.write(`Textos visíveis fora de t():\n${falhas.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("Textos i18n: OK\n");
```

- [ ] **Step 6: Ligar o portão ao projeto**

Adicionar ao `package.json`:

```json
"check:i18n": "node scripts/verificar-textos-i18n.mjs"
```

- [ ] **Step 7: Rodar os checks**

Run: `npx vitest run src/lib/texto/i18n.test.ts && npm run check:i18n`

Expected: PASS. A lista começa vazia para o commit do portão permanecer verde; cada jornada entra em `MIGRADOS` no primeiro passo da própria tarefa, produz o vermelho de caracterização e só volta a verde depois da migração.

- [ ] **Step 8: Commitar o portão vermelho de caracterização**

```bash
git add package.json scripts/textos-i18n-permitidos.mjs scripts/verificar-textos-i18n.mjs src/lib/texto/i18n.ts src/lib/texto/i18n.test.ts
git commit -m "test: Cria portão de cobertura do idioma" -m "Agente: codex"
```

### Task 2: L0 — Matriz de superfícies e caminho triste

**Files:**
- Create: `docs/qualidade/matriz-linguagem.md`
- Modify: `QA.md`

- [ ] **Step 1: Criar a matriz com status verificável**

Criar `docs/qualidade/matriz-linguagem.md` com uma linha por superfície e as colunas:

```markdown
| ID | Modo | Superfície | Normal pt | Normal es | Normal en | Triste pt | Triste es | Triste en | DicaInfo | Check |
|---|---|---|---|---|---|---|---|---|---|---|
| LG-01 | aluno | `/` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j4` |
| LG-02 | aluno | `/treino` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j4`, `j10` |
| LG-03 | aluno | `/treino/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j4`, `j10` |
| LG-04 | ambos | `/catalogo` e `/catalogo/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j4`, `j11`, `j12` |
| LG-05 | personal | `/personal` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j7`, `j8` |
| LG-06 | personal | `/personal/alunos` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j8` |
| LG-07 | personal | `/personal/completar` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j8`, `j11` |
| LG-08 | ambos | `/ajustes/personal` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j8`, `j11` |
| LG-09 | aluno | `/analise` e `/coach` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j6`, `j12` |
| LG-10 | ambos | ajustes, perfil, relatórios e temas | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j4`, `j11` |
| LG-11 | público | login, boas-vindas e 404 | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | `j9`, `j13` |
```

- [ ] **Step 2: Registrar a nova área no QA sem declarar PASSOU**

Adicionar ao mapa de áreas do `QA.md` a área `linguagem` apontando para `src/app/**/*.tsx src/components/**/*.tsx src/lib/texto/i18n.ts src/lib/texto/alerta-personal.ts` e um item `LG-01` com resultado `ALEGADO` somente depois da primeira execução. Nesta tarefa, deixar o resultado como `NÃO EXECUTADO`.

- [ ] **Step 3: Validar o formato do registro**

Run: `node scripts/qa-obsoletos.mjs`

Expected: o script reconhece a área e o item. Se repetir o falso “não é repositório”, registrar o defeito do script no resultado da tarefa e não fabricar validade.

- [ ] **Step 4: Commitar a matriz**

```bash
git add docs/qualidade/matriz-linguagem.md QA.md
git commit -m "docs: Mapeia idiomas nos caminhos normal e triste" -m "Agente: codex"
```

### Task 3: L1 — Propagar idioma pela casca Personal

**Files:**
- Modify: `src/app/personal/page.tsx`
- Modify: `src/app/personal/alunos/page.tsx`
- Modify: `src/app/personal/completar/page.tsx`
- Modify: `src/app/ajustes/personal/page.tsx`
- Modify: `src/components/fila-personal.tsx`
- Modify: `src/components/convites-personal.tsx`
- Modify: `src/components/completar-cadastro-personal.tsx`
- Modify: `src/components/vinculo-aluno.tsx`
- Modify: `src/components/seletor-modo.tsx`
- Modify: `src/components/escolha-tipo-conta.tsx`
- Modify: `src/components/voltar-flutuante.tsx`
- Modify: `src/lib/texto/i18n.ts`
- Test: `src/lib/texto/i18n.test.ts`

- [ ] **Step 1: Colocar o Personal sob o portão e ampliar o teste vermelho**

Adicionar a `MIGRADOS`:

```js
/src[\\/]app[\\/]personal[\\/]/,
/src[\\/]app[\\/]ajustes[\\/]personal[\\/]/,
/src[\\/]components[\\/](fila-personal|convites-personal|completar-cadastro-personal|vinculo-aluno|seletor-modo|escolha-tipo-conta|voltar-flutuante)\.tsx$/,
```

Adicionar ao caso parametrizado de `i18n.test.ts` as chaves: `"Convidar aluno"`, `"Gerar convite"`, `"Copiar link"`, `"Encerrar acesso"`, `"Abrir novamente"`, `"Enviar pelo WhatsApp"`, `"Sem telefone cadastrado"`, `"Modo treino"`, `"Modo trabalho"`, `"Conta de personal"`, `"Formato esperado"` e `"Salvar e abrir a fila"`.

Run: `npx vitest run src/lib/texto/i18n.test.ts && npm run check:i18n`

Expected: FAIL nas chaves ausentes e nos literais visíveis atuais do Personal.

- [ ] **Step 2: Adicionar traduções completas ao dicionário**

Adicionar as entradas:

```ts
"Convidar aluno": { en: "Invite client", es: "Invitar alumno" },
"Gerar convite": { en: "Generate invite", es: "Generar invitación" },
"Copiar link": { en: "Copy link", es: "Copiar enlace" },
"Encerrar acesso": { en: "End access", es: "Finalizar acceso" },
"Abrir novamente": { en: "Open again", es: "Abrir de nuevo" },
"Enviar pelo WhatsApp": { en: "Send via WhatsApp", es: "Enviar por WhatsApp" },
"Sem telefone cadastrado": { en: "No phone number saved", es: "Sin teléfono registrado" },
"Modo treino": { en: "Workout mode", es: "Modo entrenamiento" },
"Modo trabalho": { en: "Work mode", es: "Modo trabajo" },
"Conta de personal": { en: "Trainer account", es: "Cuenta de entrenador" },
"Formato esperado": { en: "Expected format", es: "Formato esperado" },
"Salvar e abrir a fila": { en: "Save and open the queue", es: "Guardar y abrir pendientes" },
```

Usar `Assistente de IA`, `acesso do personal` e `encerrar acesso` em pt-BR; não usar `vínculo`, `revogar`, `acionado`, `AI Coach`, `Stories` ou `Stickers` como texto visível novo.

- [ ] **Step 3: Propagar `idioma` a partir de cada página servidora**

Em cada página, derivar:

```ts
const idioma = perfil?.idioma ?? "pt-BR";
```

e passar `idioma={idioma}` a cada `CabecalhoPro`, `AbaInferior` e `DicaInfo`; em `/personal`, também a `FilaPersonal`; em `/personal/completar`, a `CompletarCadastroPersonal`; e em `/ajustes/personal`, a `ConvitesPersonal`, `VinculoAluno` e `VoltarFlutuante`. `SeletorModo` recebe o idioma no call site de `src/app/ajustes/page.tsx`.

- [ ] **Step 4: Tornar as propriedades obrigatórias nos componentes migrados**

Usar exatamente:

```ts
import type { Idioma } from "@/lib/dados/idioma";

export default function FilaPersonal({ itens, idioma }: { itens: ItemDaFila[]; idioma: Idioma }) {
```

Repetir a propriedade obrigatória nos demais componentes; não deixar default `pt-BR` na casca Personal, pois ele esconderia call site esquecido.

- [ ] **Step 5: Localizar todo literal e toda acessibilidade**

Aplicar `t()` a texto JSX, `aria-label`, `placeholder`, confirmação, estado vazio, singular/plural e rótulo de navegação. Passar `idioma` a cada `DicaInfo`. Manter CREF, WhatsApp e códigos sem tradução.

- [ ] **Step 6: Fechar o caminho triste estático**

Traduzir explicitamente: nenhum aluno, fila vazia, telefone ausente, CREF incompleto, convite inválido, falha de cópia, falha de server action, sessão ausente e modo indisponível. Informações de consentimento e formato continuam abertas; explicações de conceito ficam no “i”.

- [ ] **Step 7: Rodar os checks da fatia**

Run: `npx vitest run src/lib/texto/i18n.test.ts && npm run check:i18n && npx tsc --noEmit`

Expected: PASS; o portão não lista nenhuma superfície Personal migrada.

- [ ] **Step 8: Commitar a casca**

```bash
git add src/app/personal src/app/ajustes/personal src/components/fila-personal.tsx src/components/convites-personal.tsx src/components/completar-cadastro-personal.tsx src/components/vinculo-aluno.tsx src/components/seletor-modo.tsx src/components/escolha-tipo-conta.tsx src/components/voltar-flutuante.tsx src/lib/texto/i18n.ts src/lib/texto/i18n.test.ts
git commit -m "feat: Localiza a casca do personal" -m "Agente: codex"
```

### Task 4: L1 — Localizar alertas determinísticos e WhatsApp

**Files:**
- Modify: `src/lib/texto/alerta-personal.ts`
- Modify: `src/lib/texto/alerta-personal.test.ts`
- Modify: `src/lib/dados/personal.ts`
- Modify: `src/app/personal/page.tsx`

- [ ] **Step 1: Escrever testes vermelhos nas três línguas**

Alterar as chamadas para `conteudoDoAlerta(alerta, nome, idioma)` e `rascunhoWhatsApp(alerta, nome, idioma)`. Adicionar:

```ts
it.each([
  ["pt-BR", "30 dias", "Oi, João!"],
  ["es", "30 días", "Hola, João"],
  ["en", "30 days", "Hi, João"],
] as const)("localiza alerta e mensagem em %s", (idioma, evidencia, saudacao) => {
  expect(conteudoDoAlerta(SEM_ESTIMULO, "João", idioma).haQuantoTempo).toContain(evidencia);
  expect(rascunhoWhatsApp(SEM_ESTIMULO, "João", idioma)).toContain(saudacao);
});
```

Expected: FAIL pela assinatura atual de dois argumentos e pelos textos fixos.

- [ ] **Step 2: Alterar as assinaturas e formatação**

```ts
export function conteudoDoAlerta(alerta: AlertaPersonal, nomeAluno: string, idioma: Idioma): ConteudoAlerta
export function rascunhoWhatsApp(alerta: AlertaPersonal, nomeAluno: string, idioma: Idioma): string
```

Usar `t()` para fragmentos e `formatarPeso(valor, idioma)` para números. Manter perguntas sem prescrição, sem pronome de gênero, emoji ou emoticon.

- [ ] **Step 3: Passar o idioma para a montagem da fila**

Alterar:

```ts
export async function carregarFilaDoPersonal(
  idioma: Idioma,
  agora: Date = new Date(),
): Promise<{ semanaInicio: string; itens: ItemDaFila[]; alunos: AlunoVinculado[] }>
```

e usar o mesmo idioma em `conteudoDoAlerta` e `rascunhoWhatsApp`. Em `/personal`, chamar `carregarFilaDoPersonal(idioma)` depois de ler o perfil.

- [ ] **Step 4: Rodar todos os testes do contrato do alerta**

Run: `npx vitest run src/lib/texto/alerta-personal.test.ts src/lib/texto/i18n.test.ts`

Expected: PASS incluindo números, presença, gênero, URL curta e três idiomas.

- [ ] **Step 5: Commitar a localização determinística**

```bash
git add src/lib/texto/alerta-personal.ts src/lib/texto/alerta-personal.test.ts src/lib/dados/personal.ts src/app/personal/page.tsx
git commit -m "feat: Localiza alertas do personal" -m "Agente: codex"
```

### Task 5: L2 — Fechar linguagem e dicas na jornada de treino

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/treino/page.tsx`
- Modify: `src/app/treino/[id]/page.tsx`
- Modify: `src/components/iniciar-treino.tsx`
- Modify: `src/components/form-iniciar-treino.tsx`
- Modify: `src/components/lista-treinos.tsx`
- Modify: `src/components/treino-detalhe.tsx`
- Modify: `src/components/formulario-serie.tsx`
- Modify: `src/components/timer-topo.tsx`
- Modify: `src/components/excluir-treino.tsx`
- Modify: `src/components/relatorio-pos-treino.tsx`
- Modify: `src/lib/texto/i18n.ts`
- Modify: `scripts/verificar-textos-i18n.mjs`
- Test: `src/lib/texto/i18n.test.ts`

- [ ] **Step 1: Incluir as superfícies de treino no portão e observar o vermelho**

Adicionar padrões de Home, `/treino` e componentes listados a `MIGRADOS`.

Run: `npm run check:i18n`

Expected: FAIL somente com literais visíveis reais ainda não envolvidos por `t()`.

- [ ] **Step 2: Adicionar ao teste as chaves do caminho triste**

Cobrir no mínimo: `"Sem conexão"`, `"Salvo no aparelho"`, `"Falha ao sincronizar"`, `"Treino não encontrado"`, `"Valor fora do limite"`, `"Sessão expirada"`, `"Finalizar treino"`, `"Reabrir treino"` e `"Descartar série"`.

- [ ] **Step 3: Localizar literais restantes e padronizar o tom**

Usar `idioma` já carregado pelas páginas e propagá-lo obrigatoriamente. Conservar `RIR`, `e1RM` e `kg`. Substituir `deload` visível por `semana mais leve` em pt-BR, com equivalentes naturais em espanhol e inglês.

- [ ] **Step 4: Aplicar a regra do “i”**

Mover somente definições e explicações opcionais para `DicaInfo`, incluindo explicações longas de métricas ou funcionamento. Manter visíveis validação de campos, estado offline, sincronização, confirmação de finalizar/excluir e consequência de descartar.

- [ ] **Step 5: Exercitar os testes unitários do caminho triste já existente**

Run: `npx vitest run src/lib/treino src/lib/dados/metricas-treino.test.ts src/lib/offline src/lib/texto/i18n.test.ts`

Expected: PASS sem alterar limites ou semântica offline.

- [ ] **Step 6: Fechar o portão e tipos**

Run: `npm run check:i18n && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commitar a jornada de treino**

```bash
git add src/app/page.tsx src/app/treino src/components/iniciar-treino.tsx src/components/form-iniciar-treino.tsx src/components/lista-treinos.tsx src/components/treino-detalhe.tsx src/components/formulario-serie.tsx src/components/timer-topo.tsx src/components/excluir-treino.tsx src/components/relatorio-pos-treino.tsx src/lib/texto/i18n.ts src/lib/texto/i18n.test.ts scripts/verificar-textos-i18n.mjs
git commit -m "feat: Unifica a linguagem da jornada de treino" -m "Agente: codex"
```

### Task 6: L3 — Simplificar Catálogo, modelos e anilhas

**Files:**
- Modify: `src/app/catalogo/page.tsx`
- Modify: `src/app/catalogo/[id]/page.tsx`
- Modify: `src/app/ajustes/modelos/page.tsx`
- Modify: `src/app/ajustes/modelos/novo/page.tsx`
- Modify: `src/app/ajustes/anilhas/page.tsx`
- Modify: `src/app/@modal/(.)ajustes/modelos/novo/page.tsx`
- Modify: `src/app/@modal/(.)ajustes/anilhas/page.tsx`
- Modify: `src/components/catalogo-interativo.tsx`
- Modify: `src/components/lista-modelos.tsx`
- Modify: `src/components/modelo-treino-form.tsx`
- Modify: `src/components/excluir-modelo.tsx`
- Modify: `src/components/anilhas-form.tsx`
- Modify: `src/components/player-execucao-exercicio.tsx`
- Modify: `src/lib/texto/i18n.ts`
- Modify: `scripts/verificar-textos-i18n.mjs`
- Test: `src/lib/texto/i18n.test.ts`

- [ ] **Step 1: Incluir a jornada no portão e registrar o vermelho**

Adicionar os caminhos acima a `MIGRADOS` e executar `npm run check:i18n`.

Expected: FAIL com os literais ainda não localizados.

- [ ] **Step 2: Fixar o vocabulário simples em teste**

Adicionar ao teste chaves pt-BR `"Revisão"`, `"Músculos que ajudam"`, `"Movimento das articulações"`, `"Dica de execução"`, `"Conteúdo gerado por IA"`, `"Aviso de saúde"`, `"Exercício não encontrado"` e os erros de modelo/anilha já exibidos.

- [ ] **Step 3: Substituir jargão sem alterar dados internos**

Trocar apenas rótulos visíveis: `Curadoria` → `Revisão`, `Sinergistas` → `Músculos que ajudam`, `Mecânica articular` → `Movimento das articulações`. Chaves de banco, tipos e nomes de propriedades permanecem iguais.

- [ ] **Step 4: Triar informação opcional e obrigatória**

Levar definições técnicas para `DicaInfo`. Manter permanentemente visíveis o aviso de saúde, a ausência de dica, a origem IA, os limites de formulário e qualquer falha de salvamento.

- [ ] **Step 5: Verificar catálogo traduzido e formulários tristes**

Run: `npx vitest run src/lib/texto/grupo-muscular.test.ts src/lib/dados/limites-modelo.test.ts src/lib/anilhas.test.ts src/lib/texto/i18n.test.ts`

Expected: PASS. Se algum caminho de teste não existir, usar o nome real retornado por `rg --files` e registrar a correção factual no plano antes do commit.

- [ ] **Step 6: Fechar portão e tipos**

Run: `npm run check:i18n && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commitar Catálogo e ferramentas**

```bash
git add src/app/catalogo src/app/ajustes/modelos src/app/ajustes/anilhas "src/app/@modal/(.)ajustes/modelos/novo/page.tsx" "src/app/@modal/(.)ajustes/anilhas/page.tsx" src/components/catalogo-interativo.tsx src/components/lista-modelos.tsx src/components/modelo-treino-form.tsx src/components/excluir-modelo.tsx src/components/anilhas-form.tsx src/components/player-execucao-exercicio.tsx src/lib/texto/i18n.ts src/lib/texto/i18n.test.ts scripts/verificar-textos-i18n.mjs
git commit -m "feat: Simplifica a linguagem do catálogo" -m "Agente: codex"
```

### Task 7: L4 — Fechar casca global, conta e idiomas

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/boas-vindas/page.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/ajustes/page.tsx`
- Modify: `src/app/perfil/page.tsx`
- Modify: `src/app/@modal/(.)perfil/page.tsx`
- Modify: `src/components/aba-inferior.tsx`
- Modify: `src/components/cabecalho-pro.tsx`
- Modify: `src/components/editar-perfil.tsx`
- Modify: `src/components/idioma-form.tsx`
- Modify: `src/components/meta-semanal-form.tsx`
- Modify: `src/components/seletor-temas.tsx`
- Modify: `src/lib/texto/i18n.ts`
- Modify: `scripts/verificar-textos-i18n.mjs`

- [ ] **Step 1: Colocar casca e rotas públicas sob o portão**

Expandir `MIGRADOS` e executar `npm run check:i18n`.

Expected: FAIL em login, boas-vindas, cabeçalhos, navegação e conta ainda não localizados.

- [ ] **Step 2: Traduzir caminho normal e triste**

Cobrir login, cadastro, senha fraca, sessão expirada, retorno inseguro, escolha de conta, CREF inválido, perfil vazio, salvamento falho, troca de tema/idioma e página não encontrada. Nenhuma 404 padrão do Next pode aparecer como resultado esperado.

- [ ] **Step 3: Remover inglês indevido de pt-BR**

Usar `Assistente de IA`, `redes sociais` e `adesivos`. Preservar nomes próprios de tema somente como nomes de edição e localizar seus subtítulos/descrições.

- [ ] **Step 4: Verificar os contratos reutilizados**

Run: `npx vitest run src/lib/texto/senha.test.ts src/lib/rota-de-retorno.test.ts src/lib/texto/cref.test.ts src/lib/texto/i18n.test.ts`

Expected: PASS sem afrouxar senha, CREF ou sanitização de retorno.

- [ ] **Step 5: Fechar portão e tipos**

Run: `npm run check:i18n && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commitar a casca global**

```bash
git add src/app/login src/app/boas-vindas src/app/not-found.tsx src/app/ajustes/page.tsx src/app/perfil src/app/@modal src/components/aba-inferior.tsx src/components/cabecalho-pro.tsx src/components/editar-perfil.tsx src/components/idioma-form.tsx src/components/meta-semanal-form.tsx src/components/seletor-temas.tsx src/lib/texto/i18n.ts scripts/verificar-textos-i18n.mjs
git commit -m "feat: Localiza a casca global do app" -m "Agente: codex"
```

### Task 8: L4 — Revisar Análise, Assistente e relatórios sem redesenhar

**Files:**
- Modify: `src/app/analise/page.tsx`
- Modify: `src/app/coach/page.tsx`
- Modify: `src/app/ajustes/relatorios/page.tsx`
- Modify: `src/app/ajustes/relatorios/parecer/[id]/page.tsx`
- Modify: `src/app/api/parecer/[id]/pdf/route.tsx`
- Modify: `src/components/analise-interativa.tsx`
- Modify: `src/components/coach-interativo.tsx`
- Modify: `src/components/parecer.tsx`
- Modify: `src/components/pareceres-salvos.tsx`
- Modify: `src/components/historico-relatorios-pos-treino.tsx`
- Modify: `src/lib/texto/i18n.ts`
- Modify: `scripts/verificar-textos-i18n.mjs`

- [ ] **Step 1: Colocar as superfícies sob o portão**

Expandir `MIGRADOS` e executar `npm run check:i18n`.

Expected: FAIL apenas nos literais ainda não localizados.

- [ ] **Step 2: Cobrir estados tristes no teste do dicionário**

Incluir dados insuficientes, geração em andamento, falha, fallback, cota diária, concorrência, pergunta inválida, parecer inexistente, PDF ainda indisponível e erro de sessão.

- [ ] **Step 3: Localizar sem mudar a peça-assinatura**

Aplicar `t()` e formatação por idioma mantendo a composição, perguntas, evidências, cálculo, estados e prompt atuais. Qualquer necessidade de mover seção, mudar hierarquia ou reescrever interpretação suspende esta tarefa e volta ao dono como mudança de escopo.

- [ ] **Step 4: Verificar análise e mensagens de falha**

Run: `npx vitest run src/lib/analise src/lib/texto/aviso-falha.test.ts src/lib/texto/i18n.test.ts`

Expected: PASS com a mesma contagem de testes de análise existente.

- [ ] **Step 5: Fechar portão, tipos e build**

Run: `npm run check:i18n && npx tsc --noEmit && npm run build`

Expected: PASS. Restaurar `next-env.d.ts` caso o Next o reescreva.

- [ ] **Step 6: Commitar a revisão linguística da peça-assinatura**

```bash
git add src/app/analise src/app/coach src/app/ajustes/relatorios src/app/api/parecer src/components/analise-interativa.tsx src/components/coach-interativo.tsx src/components/parecer.tsx src/components/pareceres-salvos.tsx src/components/historico-relatorios-pos-treino.tsx src/lib/texto/i18n.ts scripts/verificar-textos-i18n.mjs
git commit -m "feat: Fecha os idiomas da análise e relatórios" -m "Agente: codex"
```

### Task 9: L5 — Automatizar a matriz de caminho normal e triste no CI

**Files:**
- Modify: `e2e/j4-varredura.spec.ts`
- Modify: `e2e/j5-contraste.spec.ts`
- Modify: `e2e/j8-casca-do-personal.spec.ts`
- Modify: `e2e/j10-serie-e-fila.spec.ts`
- Modify: `e2e/j11-formularios.spec.ts`
- Modify: `e2e/j12-isolamento-e-apis.spec.ts`
- Modify: `e2e/j13-sessao-e-navegacao.spec.ts`
- Modify: `docs/qualidade/matriz-linguagem.md`

- [ ] **Step 1: Criar helper de troca e asserção de idioma dentro dos specs existentes**

Usar a UI de `/ajustes` para escolher o idioma e esperar um rótulo que não existia antes da troca. Não atualizar idioma diretamente no banco, pois isso não prova a jornada.

- [ ] **Step 2: Parametrizar as jornadas determinísticas**

Executar pt-BR, espanhol e inglês para aluno e personal nas rotas aplicáveis. Em cada uma, verificar ao menos um título, uma ação, um estado vazio e um erro. Não afirmar idioma por regex global da página; usar textos exatos e elementos específicos.

- [ ] **Step 3: Cobrir caminho triste sem alterar a condição medida**

Reutilizar os casos de `j10`–`j13`: offline, duplo clique, valor inválido, ID inválido, sessão expirada, limite e URL desconhecida. Para links externos, abortar a rota e fechar a nova aba; nunca remover `target`.

- [ ] **Step 4: Validar que o spec compila sem executar contra produção**

Run: `npx playwright test --list`

Expected: lista os cenários novos sem criar conta nem acessar o banco.

- [ ] **Step 5: Atualizar a matriz como ALEGADO**

Marcar somente células cobertas por teste como `ALEGADO`; manter `PENDENTE` nas células que exigem olho humano ou execução real do CI.

- [ ] **Step 6: Commitar a automação**

```bash
git add e2e docs/qualidade/matriz-linguagem.md
git commit -m "test: Cobre idiomas nos caminhos tristes" -m "Agente: codex"
```

### Task 10: L5 — Verificação integral e registro de QA

**Files:**
- Modify: `QA.md`
- Modify: `docs/qualidade/matriz-linguagem.md`
- Modify: `PROGRESS.md`

- [ ] **Step 1: Rodar a verificação local completa**

Run: `npm run check:i18n && npx tsc --noEmit && npm test && npx eslint . && npm run build`

Expected: `check:i18n` limpo; tipos limpos; pelo menos 48 arquivos/518 testes mais os novos; 0 erros de lint; build limpo. Avisos antigos podem permanecer, mas qualquer aviso novo é corrigido.

- [ ] **Step 2: Conferir o diff antes do push**

Run: `git status --short && git diff --stat && git diff --check`

Expected: somente arquivos desta frente; zero segredo; zero whitespace error; `next-env.d.ts` ausente do diff.

- [ ] **Step 3: Fazer push da própria branch e abrir PR**

Run: `git push -u origin feat/consistencia-linguagem-ajuda`

Depois abrir PR para `main`, pois esta frente entrega valor completo por si e não é fatia intermediária do módulo Personal.

- [ ] **Step 4: Ler o CI em vez de confiar no watch**

Run: `gh pr view --json number,statusCheckRollup`

Expected: todos os checks concluídos com sucesso. Se houver falha, obter o run mais recente com `$run = gh run list --branch feat/consistencia-linguagem-ajuda --limit 1 --json databaseId --jq '.[0].databaseId'` e executar `gh run view $run --log-failed`; run cancelado após push novo não conta como falha.

- [ ] **Step 5: Registrar evidência do implementador**

Salvar por ID aplicável `print.png`, `console.txt` e `rede.txt` em `qa/evidencias/LG-*/`. Atualizar `QA.md` e a matriz para `ALEGADO`, nunca `PASSOU`.

- [ ] **Step 6: Solicitar auditoria independente**

Outro agente, sem permissão de editar código, percorre as seis células da matriz em viewport 375 px e ampla, incluindo caminho normal, caminho triste, teclado, foco e fechamento das folhas do “i”. Só ele promove itens comprovados para `PASSOU`.

- [ ] **Step 7: Fechar documentação e commit**

Atualizar o bloco `ESTADO ATUAL` do `PROGRESS.md` com run do CI, células ainda pendentes e instrução concreta para o próximo agente.

```bash
git add QA.md docs/qualidade/matriz-linguagem.md PROGRESS.md qa/evidencias
git commit -m "docs: Registra QA dos três idiomas" -m "Agente: codex"
```

---

## Critério de encerramento da frente

A frente não termina em “build verde”. Termina quando:

- o portão não encontra literal visível novo nas superfícies migradas;
- as onze linhas da matriz têm caminho normal e triste em pt-BR, espanhol e inglês;
- aluno e personal foram exercitados nas rotas aplicáveis;
- nenhum erro ou página padrão do Next aparece no idioma errado;
- `DicaInfo` contém somente explicação opcional e mantém acessibilidade/foco;
- consentimento, erro, consequência, saúde e origem IA continuam visíveis;
- o CI passa com as contas descartáveis;
- o implementador registra `ALEGADO` e um agente independente registra `PASSOU`.
