# Grade de séries e descanso real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a lista de séries de `/treino/[id]` em uma grade contínua por exercício e registrar, sem depender de rede, o descanso realmente cronometrado depois de cada série.

**Architecture:** Uma máquina de estados pura mede o descanso e um adaptador pequeno persiste apenas o descanso ativo no `localStorage`. `TreinoDetalhe` coordena a série dona do descanso, atualiza a UI de forma otimista e põe uma mutação específica na fila Dexie; `TimerTopo` fica responsável somente pelos controles e pelo mostrador. A duração concluída é armazenada em uma coluna anulável de `serie`, cuja migration só pode ser aplicada após confirmação explícita do dono.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Dexie/IndexedDB, Supabase/Postgres, CSS com tokens Lastro, Playwright executado somente no CI.

---

## Mapa de arquivos

### Criar

- `src/lib/treino/descanso-real.ts` — tipos e transições puras do relógio.
- `src/lib/treino/descanso-real.test.ts` — contrato do relógio, pausa, retomada, meta e conclusão.
- `src/lib/treino/descanso-real-local.ts` — serialização validada e assinatura do estado local.
- `src/lib/treino/descanso-real-local.test.ts` — recuperação, corrupção e isolamento por treino.
- `src/lib/treino/apresentacao-series.ts` — resumo valendo, siglas localizadas e formatação de duração.
- `src/lib/treino/apresentacao-series.test.ts` — singular, faixa, três idiomas e durações longas.
- `src/components/use-descanso-real.ts` — integração React entre relógio, storage e callback de conclusão.
- `supabase/migrations/20260915130000_descanso_real_serie.sql` — coluna anulável e restrição não negativa.

### Modificar

- `src/lib/dados/treino.ts` — ler `descanso_real_segundos` e atualizar somente esse campo.
- `src/lib/offline/db.ts` — acrescentar o tipo `atualizar_descanso_serie` sem mudar o schema do Dexie.
- `src/lib/offline/sincronizar-pendentes.ts` — executar a nova mutação.
- `src/lib/offline/sincronizar-pendentes.test.ts` — provar contrato, conta e falha permanente.
- `src/components/timer-topo.tsx` — trocar estado interno pelo controlador e remover o caractere `✕` em favor de SVG.
- `src/components/treino-detalhe.tsx` — coordenar conclusão/cancelamento, UI otimista e grade.
- `src/lib/texto/i18n.ts` — rótulos, estados, mensagens e siglas nos três idiomas.
- `src/lib/texto/i18n.test.ts` — portão das novas chaves.
- `src/app/tokens.css` — somente tokens semânticos ausentes para aquecimento e grade.
- `src/app/sistema.css` — composição contínua, colunas, estados, foco e responsividade.
- `e2e/j1-treino.spec.ts` — caminho completo do descanso no CI.
- `e2e/j4-varredura.spec.ts` — captura da tela redesenhada nos três idiomas quando a matriz existente permitir.
- `e2e/j5-contraste.spec.ts` — pares novos de marcador, cabeçalho e foco.
- `QA.md` — registrar evidência como `ALEGADO`, nunca `PASSOU` pelo implementador.
- `PROGRESS.md` — handoff de cada checkpoint e bloqueio da migration.

## Ordem e portões

1. Tasks 1–2 não dependem do banco e podem avançar em TDD.
2. Task 3 escreve a migration e o contrato de aplicação, mas não a aplica.
3. **Checkpoint obrigatório:** pedir autorização explícita do dono antes de aplicar `20260915130000_descanso_real_serie.sql` ao banco único.
4. Tasks 4–6 podem ser implementadas na branch; abrir a tela contra o Supabase hospedado só depois de a migration ser autorizada e aplicada.
5. E2E local permanece proibido. Os specs da Task 7 são executados no CI do PR.

### Task 1: Máquina de estados e recuperação local do descanso

**Files:**
- Create: `src/lib/treino/descanso-real.ts`
- Create: `src/lib/treino/descanso-real.test.ts`
- Create: `src/lib/treino/descanso-real-local.ts`
- Create: `src/lib/treino/descanso-real-local.test.ts`

- [ ] **Step 1: Escrever o teste falho das transições do relógio**

Criar `src/lib/treino/descanso-real.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  adicionarTempoAoDescanso,
  concluirDescanso,
  iniciarDescanso,
  marcarAvisoEmitido,
  painelDoDescanso,
  pausarDescanso,
  retomarDescanso,
} from "./descanso-real";

describe("descanso real", () => {
  it("mede só o tempo ativo e mantém a meta separada", () => {
    const iniciado = iniciarDescanso("treino-1", "serie-1", 90, 10_000);
    const pausado = pausarDescanso(iniciado, 40_000);
    const retomado = retomarDescanso(pausado, 70_000);
    const ampliado = adicionarTempoAoDescanso(retomado, 30);

    expect(painelDoDescanso(ampliado, 100_000)).toEqual({
      segundosReais: 60,
      segundosRestantes: 60,
      metaAtingida: false,
      pausado: false,
    });
    expect(concluirDescanso(ampliado, 100_000)).toEqual({
      treinoId: "treino-1",
      serieId: "serie-1",
      descansoRealSegundos: 60,
    });
  });

  it("continua medindo depois de a contagem regressiva chegar a zero", () => {
    const estado = iniciarDescanso("treino-1", "serie-1", 90, 0);
    expect(painelDoDescanso(estado, 103_000)).toMatchObject({
      segundosReais: 103,
      segundosRestantes: 0,
      metaAtingida: true,
    });
  });

  it("marca o aviso sem mudar o tempo nem emitir duas vezes", () => {
    const estado = iniciarDescanso("treino-1", "serie-1", 1, 0);
    const avisado = marcarAvisoEmitido(estado);
    expect(avisado.avisoMetaEmitido).toBe(true);
    expect(marcarAvisoEmitido(avisado)).toEqual(avisado);
  });

  it("não produz duração negativa com relógio invertido", () => {
    const estado = iniciarDescanso("treino-1", "serie-1", 90, 20_000);
    expect(concluirDescanso(estado, 10_000).descansoRealSegundos).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha esperada**

Run: `npx vitest run src/lib/treino/descanso-real.test.ts`

Expected: FAIL porque `./descanso-real` ainda não existe.

- [ ] **Step 3: Implementar as transições puras mínimas**

Criar `src/lib/treino/descanso-real.ts` com estas exportações e fórmulas:

```ts
export type EstadoDescanso = {
  treinoId: string;
  serieId: string;
  metaSegundos: number;
  acumuladoAtivoMs: number;
  iniciadoEmMs: number | null;
  avisoMetaEmitido: boolean;
};

export type DescansoConcluido = {
  treinoId: string;
  serieId: string;
  descansoRealSegundos: number;
};

const inteiroNaoNegativo = (valor: number) => Math.max(0, Math.floor(valor));

export function iniciarDescanso(
  treinoId: string,
  serieId: string,
  metaSegundos: number,
  agoraMs: number,
): EstadoDescanso {
  return {
    treinoId,
    serieId,
    metaSegundos: inteiroNaoNegativo(metaSegundos),
    acumuladoAtivoMs: 0,
    iniciadoEmMs: agoraMs,
    avisoMetaEmitido: false,
  };
}

function ativoDesdeUltimoMarco(estado: EstadoDescanso, agoraMs: number): number {
  if (estado.iniciadoEmMs === null) return 0;
  return Math.max(0, agoraMs - estado.iniciadoEmMs);
}

export function segundosReais(estado: EstadoDescanso, agoraMs: number): number {
  return Math.floor((estado.acumuladoAtivoMs + ativoDesdeUltimoMarco(estado, agoraMs)) / 1000);
}

export function painelDoDescanso(estado: EstadoDescanso, agoraMs: number) {
  const reais = segundosReais(estado, agoraMs);
  return {
    segundosReais: reais,
    segundosRestantes: Math.max(0, estado.metaSegundos - reais),
    metaAtingida: reais >= estado.metaSegundos,
    pausado: estado.iniciadoEmMs === null,
  };
}

export function pausarDescanso(estado: EstadoDescanso, agoraMs: number): EstadoDescanso {
  if (estado.iniciadoEmMs === null) return estado;
  return {
    ...estado,
    acumuladoAtivoMs: estado.acumuladoAtivoMs + ativoDesdeUltimoMarco(estado, agoraMs),
    iniciadoEmMs: null,
  };
}

export function retomarDescanso(estado: EstadoDescanso, agoraMs: number): EstadoDescanso {
  return estado.iniciadoEmMs === null ? { ...estado, iniciadoEmMs: agoraMs } : estado;
}

export function adicionarTempoAoDescanso(
  estado: EstadoDescanso,
  segundosExtras: number,
): EstadoDescanso {
  return { ...estado, metaSegundos: estado.metaSegundos + inteiroNaoNegativo(segundosExtras) };
}

export function marcarAvisoEmitido(estado: EstadoDescanso): EstadoDescanso {
  return estado.avisoMetaEmitido ? estado : { ...estado, avisoMetaEmitido: true };
}

export function concluirDescanso(
  estado: EstadoDescanso,
  agoraMs: number,
): DescansoConcluido {
  return {
    treinoId: estado.treinoId,
    serieId: estado.serieId,
    descansoRealSegundos: segundosReais(estado, agoraMs),
  };
}
```

- [ ] **Step 4: Rodar o teste unitário e confirmar sucesso**

Run: `npx vitest run src/lib/treino/descanso-real.test.ts`

Expected: PASS em 4 testes.

- [ ] **Step 5: Escrever o teste falho de armazenamento**

Criar `src/lib/treino/descanso-real-local.test.ts` com um `Storage` falso, seguindo o padrão de `src/lib/treino/marcos-treino.test.ts`, e cobrir:

```ts
import { describe, expect, it } from "vitest";
import { iniciarDescanso } from "./descanso-real";
import {
  apagarDescansoLocal,
  chaveDescansoReal,
  lerDescansoLocal,
  salvarDescansoLocal,
} from "./descanso-real-local";

function armazenamentoFalso(): Storage {
  const mapa = new Map<string, string>();
  return {
    get length() { return mapa.size; },
    clear: () => mapa.clear(),
    getItem: (chave) => mapa.get(chave) ?? null,
    key: (indice) => [...mapa.keys()][indice] ?? null,
    removeItem: (chave) => void mapa.delete(chave),
    setItem: (chave, valor) => void mapa.set(chave, valor),
  } as Storage;
}

describe("descanso real local", () => {
  it("salva e recupera um descanso por treino", () => {
    const storage = armazenamentoFalso();
    const estado = iniciarDescanso("t1", "s1", 90, 1_000);
    salvarDescansoLocal(storage, estado);
    expect(lerDescansoLocal(storage, "t1")).toEqual(estado);
  });

  it("ignora JSON corrompido e registro de outro treino", () => {
    const storage = armazenamentoFalso();
    storage.setItem(chaveDescansoReal("t1"), "{");
    expect(lerDescansoLocal(storage, "t1")).toBeNull();
    expect(lerDescansoLocal(storage, "t2")).toBeNull();
  });

  it("remove somente o descanso do treino informado", () => {
    const storage = armazenamentoFalso();
    salvarDescansoLocal(storage, iniciarDescanso("t1", "s1", 90, 0));
    salvarDescansoLocal(storage, iniciarDescanso("t2", "s2", 90, 0));
    apagarDescansoLocal(storage, "t1");
    expect(lerDescansoLocal(storage, "t1")).toBeNull();
    expect(lerDescansoLocal(storage, "t2")?.serieId).toBe("s2");
  });
});
```

- [ ] **Step 6: Rodar o teste e confirmar a falha esperada**

Run: `npx vitest run src/lib/treino/descanso-real-local.test.ts`

Expected: FAIL porque o adaptador ainda não existe.

- [ ] **Step 7: Implementar serialização validada e notificação local**

Criar `src/lib/treino/descanso-real-local.ts`. Usar a chave `lastro_descanso_real_<treinoId>`, validar todos os campos antes do cast e exportar também `assinarDescansoLocal(aoMudar)`. `salvarDescansoLocal` e `apagarDescansoLocal` devem disparar um evento `lastro:descanso-real` quando `window` existir; a assinatura deve ouvir esse evento e o evento nativo `storage`.

```ts
import type { EstadoDescanso } from "./descanso-real";

const EVENTO = "lastro:descanso-real";
export const chaveDescansoReal = (treinoId: string) => `lastro_descanso_real_${treinoId}`;

function estadoValido(valor: unknown): valor is EstadoDescanso {
  if (!valor || typeof valor !== "object") return false;
  const item = valor as Record<string, unknown>;
  return typeof item.treinoId === "string"
    && typeof item.serieId === "string"
    && typeof item.metaSegundos === "number"
    && item.metaSegundos >= 0
    && typeof item.acumuladoAtivoMs === "number"
    && item.acumuladoAtivoMs >= 0
    && (typeof item.iniciadoEmMs === "number" || item.iniciadoEmMs === null)
    && typeof item.avisoMetaEmitido === "boolean";
}

export function lerDescansoLocal(storage: Storage, treinoId: string): EstadoDescanso | null {
  const bruto = storage.getItem(chaveDescansoReal(treinoId));
  if (!bruto) return null;
  try {
    const valor: unknown = JSON.parse(bruto);
    return estadoValido(valor) && valor.treinoId === treinoId ? valor : null;
  } catch {
    return null;
  }
}

export function salvarDescansoLocal(storage: Storage, estado: EstadoDescanso): void {
  storage.setItem(chaveDescansoReal(estado.treinoId), JSON.stringify(estado));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function apagarDescansoLocal(storage: Storage, treinoId: string): void {
  storage.removeItem(chaveDescansoReal(treinoId));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function assinarDescansoLocal(aoMudar: () => void): () => void {
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}
```

- [ ] **Step 8: Rodar os testes da Task 1**

Run: `npx vitest run src/lib/treino/descanso-real.test.ts src/lib/treino/descanso-real-local.test.ts`

Expected: PASS em 7 testes.

- [ ] **Step 9: Commitar a unidade de domínio**

```bash
git add src/lib/treino/descanso-real.ts src/lib/treino/descanso-real.test.ts src/lib/treino/descanso-real-local.ts src/lib/treino/descanso-real-local.test.ts
git commit -m "feat: Mede descanso real no aparelho" -m "Agente: codex"
```

### Task 2: Apresentação das séries e cobertura dos idiomas

**Files:**
- Create: `src/lib/treino/apresentacao-series.ts`
- Create: `src/lib/treino/apresentacao-series.test.ts`
- Modify: `src/lib/texto/i18n.ts`
- Modify: `src/lib/texto/i18n.test.ts`

- [ ] **Step 1: Escrever o teste falho do resumo, siglas e duração**

Criar `src/lib/treino/apresentacao-series.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  formatarDescansoReal,
  marcadoresDaSerie,
  resumirSeriesValendo,
} from "./apresentacao-series";

const serie = (tipo: "aquecimento" | "valendo", reps: number) => ({ tipo, reps });

describe("apresentação da grade de séries", () => {
  it("exclui aquecimento do resumo e forma a faixa de repetições", () => {
    const series = [serie("aquecimento", 15), serie("valendo", 10), serie("valendo", 8)];
    expect(resumirSeriesValendo(series, "pt-BR")).toBe("2 séries valendo · 8–10 repetições");
    expect(resumirSeriesValendo(series, "en")).toBe("2 working sets · 8–10 reps");
    expect(resumirSeriesValendo(series, "es")).toBe("2 series válidas · 8–10 repeticiones");
  });

  it("não inventa faixa sem série valendo", () => {
    expect(resumirSeriesValendo([serie("aquecimento", 15)], "pt-BR")).toBe("0 séries valendo");
  });

  it("mantém tipo e acrescenta recorde no idioma ativo", () => {
    expect(marcadoresDaSerie("valendo", true, "pt-BR").map((m) => m.curto)).toEqual(["VAL", "RP"]);
    expect(marcadoresDaSerie("valendo", true, "es").map((m) => m.curto)).toEqual(["VÁL", "RP"]);
    expect(marcadoresDaSerie("valendo", true, "en").map((m) => m.curto)).toEqual(["WORK", "PR"]);
    expect(marcadoresDaSerie("aquecimento", false, "en").map((m) => m.curto)).toEqual(["WU"]);
  });

  it("distingue ausência, minutos e horas", () => {
    expect(formatarDescansoReal(null)).toBe("—");
    expect(formatarDescansoReal(64)).toBe("01:04");
    expect(formatarDescansoReal(3_723)).toBe("1:02:03");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha esperada**

Run: `npx vitest run src/lib/treino/apresentacao-series.test.ts`

Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Implementar o módulo de apresentação**

Criar `src/lib/treino/apresentacao-series.ts`. `resumirSeriesValendo` deve filtrar `tipo === "valendo"`, ordenar somente os números de repetições e montar singular/faixa com `t()`. `marcadoresDaSerie` deve devolver `{ curto, completo, tipo: "aquecimento" | "valendo" | "recorde" }[]`, sempre com aquecimento ou valendo primeiro e recorde depois. `formatarDescansoReal` deve retornar `—` para `null`, `mm:ss` abaixo de uma hora e `h:mm:ss` a partir de uma hora.

Usar este mapa explícito, sem derivar siglas por corte de palavras:

```ts
const SIGLAS = {
  "pt-BR": { aquecimento: "AQ", valendo: "VAL", recorde: "RP" },
  es: { aquecimento: "CAL", valendo: "VÁL", recorde: "RP" },
  en: { aquecimento: "WU", valendo: "WORK", recorde: "PR" },
} as const;
```

- [ ] **Step 4: Adicionar as traduções fixas e seu portão**

Acrescentar a `src/lib/texto/i18n.ts`:

```ts
"Série": { en: "Set", es: "Serie" },
"Carga": { en: "Load", es: "Carga" },
"Repetições": { en: "Reps", es: "Repeticiones" },
"repetição": { en: "rep", es: "repetición" },
"repetições": { en: "reps", es: "repeticiones" },
"Descanso real": { en: "Actual rest", es: "Descanso real" },
"Em andamento": { en: "In progress", es: "En curso" },
"Encerrar descanso": { en: "End rest", es: "Finalizar descanso" },
"Registre uma série para iniciar o descanso": {
  en: "Log a set to start the rest timer",
  es: "Registra una serie para iniciar el descanso",
},
"Descanso registrado: {tempo}": {
  en: "Rest logged: {tempo}",
  es: "Descanso registrado: {tempo}",
},
```

Adicionar essas dez chaves ao `it.each` de `src/lib/texto/i18n.test.ts`.

- [ ] **Step 5: Rodar os testes de apresentação e idioma**

Run: `npx vitest run src/lib/treino/apresentacao-series.test.ts src/lib/texto/i18n.test.ts`

Expected: PASS, incluindo os três idiomas e a faixa que ignora aquecimento.

- [ ] **Step 6: Commitar apresentação e idioma**

```bash
git add src/lib/treino/apresentacao-series.ts src/lib/treino/apresentacao-series.test.ts src/lib/texto/i18n.ts src/lib/texto/i18n.test.ts
git commit -m "feat: Localiza a grade de séries" -m "Agente: codex"
```

### Task 3: Coluna anulável e mutação offline específica

**Files:**
- Create: `supabase/migrations/20260915130000_descanso_real_serie.sql`
- Modify: `src/lib/dados/treino.ts`
- Modify: `src/lib/offline/db.ts`
- Modify: `src/lib/offline/sincronizar-pendentes.ts`
- Modify: `src/lib/offline/sincronizar-pendentes.test.ts`

- [ ] **Step 1: Escrever o teste falho do executor da fila**

Em `src/lib/offline/sincronizar-pendentes.test.ts`, acrescentar o mock, reset e caso:

```ts
vi.mock("@/lib/dados/treino", () => ({
  criarSerieRemoto: vi.fn(),
  atualizarSerieRemoto: vi.fn(),
  atualizarDescansoSerieRemoto: vi.fn(),
  excluirSerieRemoto: vi.fn(),
  excluirTreinoRemoto: vi.fn(),
}));

import {
  atualizarDescansoSerieRemoto,
  atualizarSerieRemoto,
  criarSerieRemoto,
} from "@/lib/dados/treino";

it("sincroniza somente o descanso da série e preserva a ordem FIFO", async () => {
  vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
  vi.mocked(atualizarDescansoSerieRemoto).mockResolvedValue({ ok: true });
  await enfileirar("criar_serie", { id: "s1", reps: 10 }, "b");
  await enfileirar("atualizar_descanso_serie", { id: "s1", descansoRealSegundos: 94 }, "b");
  await enfileirar("criar_serie", { id: "s2", reps: 8 }, "b");

  expect(await sincronizarPendentes()).toEqual({
    sincronizados: 3,
    falhou: false,
    descartados: 0,
  });
  expect(vi.mocked(atualizarDescansoSerieRemoto)).toHaveBeenCalledWith({
    id: "s1",
    descansoRealSegundos: 94,
  });
});

it("não envia descanso de outra conta e não bloqueia a conta atual", async () => {
  vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
  vi.mocked(atualizarDescansoSerieRemoto).mockResolvedValue({ ok: true });
  await enfileirar("atualizar_descanso_serie", { id: "de-a", descansoRealSegundos: 80 }, "a");
  await enfileirar("criar_serie", { id: "de-b", reps: 8 }, "b");
  expect(await sincronizarPendentes()).toEqual({ sincronizados: 1, falhou: false, descartados: 0 });
  expect(atualizarDescansoSerieRemoto).not.toHaveBeenCalled();
  expect((await db.outbox.toArray())[0].payload).toEqual({ id: "de-a", descansoRealSegundos: 80 });
});

it("retira descanso inválido e continua a fila", async () => {
  vi.mocked(atualizarDescansoSerieRemoto).mockResolvedValue(recusa("serie_descanso_real_nao_negativo"));
  vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
  await enfileirar("atualizar_descanso_serie", { id: "s1", descansoRealSegundos: -1 }, "b");
  await enfileirar("criar_serie", { id: "s2", reps: 8 }, "b");
  expect(await sincronizarPendentes()).toEqual({ sincronizados: 1, falhou: false, descartados: 1 });
});
```

No `beforeEach`, executar `vi.mocked(atualizarDescansoSerieRemoto).mockReset()`.

- [ ] **Step 2: Rodar o teste e confirmar a falha esperada**

Run: `npx vitest run src/lib/offline/sincronizar-pendentes.test.ts`

Expected: FAIL porque `atualizar_descanso_serie` e a função remota não existem.

- [ ] **Step 3: Escrever a migration sem aplicá-la**

Criar `supabase/migrations/20260915130000_descanso_real_serie.sql`:

```sql
alter table public.serie
  add column descanso_real_segundos integer;

alter table public.serie
  add constraint serie_descanso_real_nao_negativo
  check (descanso_real_segundos is null or descanso_real_segundos >= 0);

comment on column public.serie.descanso_real_segundos is
  'Tempo ativo realmente medido, em segundos, depois desta série; null significa não medido.';
```

Não executar `supabase db push`, SQL Editor, MCP ou qualquer comando remoto nesta etapa.

- [ ] **Step 4: Ampliar leitura e tipos de série**

Em `src/lib/dados/treino.ts`:

```ts
export type Serie = {
  // campos existentes
  descansoRealSegundos: number | null;
};

export type AtualizacaoDescansoSerieInput = {
  id: string;
  descansoRealSegundos: number;
};
```

Adicionar `descanso_real_segundos` ao `select` de `buscarTreino`, ao tipo `LinhaSerie` e ao mapeamento:

```ts
descansoRealSegundos:
  s.descanso_real_segundos === null ? null : Number(s.descanso_real_segundos),
```

Toda `SerieUI` criada otimisticamente em `TreinoDetalhe` começa com `descansoRealSegundos: null`.

- [ ] **Step 5: Criar a atualização remota restrita ao descanso**

Em `src/lib/dados/treino.ts`, perto de `atualizarSerieRemoto`:

```ts
export async function atualizarDescansoSerieRemoto(
  input: AtualizacaoDescansoSerieInput,
): Promise<ResultadoGravacaoSerie> {
  const { supabase } = await usuarioAutenticadoOuErro();
  const { error } = await supabase
    .from("serie")
    .update({ descanso_real_segundos: input.descansoRealSegundos })
    .eq("id", input.id);
  if (error) {
    const mensagem = `Falha ao atualizar descanso: ${error.message}`;
    if (ehErroPermanenteDoPostgres(error.code)) {
      return { ok: false, permanente: true, mensagem };
    }
    throw new Error(mensagem);
  }
  revalidatePath("/treino/[id]", "page");
  return { ok: true };
}
```

- [ ] **Step 6: Ligar a mutação à fila existente**

Em `src/lib/offline/db.ts`, incluir `"atualizar_descanso_serie"` em `TipoMutacao`. Não criar nova versão do Dexie: `tipo` já é string indexada e o formato da store não muda.

Em `src/lib/offline/sincronizar-pendentes.ts`, importar `atualizarDescansoSerieRemoto` e `AtualizacaoDescansoSerieInput`, então acrescentar ao objeto de executores:

```ts
atualizar_descanso_serie: async (payload) => {
  exigirGravado(
    await atualizarDescansoSerieRemoto(
      payload as unknown as AtualizacaoDescansoSerieInput,
    ),
  );
},
```

- [ ] **Step 7: Rodar os testes da fila**

Run: `npx vitest run src/lib/offline/outbox.test.ts src/lib/offline/sincronizar-pendentes.test.ts`

Expected: PASS; o teste novo processa três itens e chama o atualizador de descanso uma vez.

- [ ] **Step 8: Verificar migration e diff sem acessar produção**

Run: `rg -n "descanso_real_segundos|serie_descanso_real_nao_negativo" supabase/migrations/20260915130000_descanso_real_serie.sql src/lib/dados/treino.ts`

Expected: uma coluna anulável, uma restrição não negativa, leitura e update restrito; nenhuma alteração em métricas.

- [ ] **Step 9: Commitar contrato de dados ainda não aplicado**

```bash
git add supabase/migrations/20260915130000_descanso_real_serie.sql src/lib/dados/treino.ts src/lib/offline/db.ts src/lib/offline/sincronizar-pendentes.ts src/lib/offline/sincronizar-pendentes.test.ts
git commit -m "feat: Persiste descanso real pela fila" -m "Agente: codex"
```

- [ ] **Step 10: Parar no portão do banco**

Apresentar ao dono:

```text
A migration adiciona somente serie.descanso_real_segundos, anulável e não negativa.
A main atual ignora colunas extras e continua compatível.
Você autoriza aplicar esta migration no banco único agora?
```

Expected: não executar aplicação sem resposta afirmativa explícita.

### Task 4: Hook controlado e cronômetro do topo

**Files:**
- Create: `src/components/use-descanso-real.ts`
- Modify: `src/components/timer-topo.tsx`
- Test: `src/lib/treino/descanso-real.test.ts`
- Test: `src/lib/treino/descanso-real-local.test.ts`

- [ ] **Step 1: Escrever o teste falho do bloqueio de início**

Em `src/lib/treino/descanso-real.test.ts`, importar `podeIniciarDescanso` e acrescentar:

```ts
it("só inicia quando existe uma série livre de descanso", () => {
  const ativo = iniciarDescanso("t1", "s1", 90, 0);
  expect(podeIniciarDescanso(null, undefined, false)).toBe(false);
  expect(podeIniciarDescanso(null, "s1", false)).toBe(true);
  expect(podeIniciarDescanso(ativo, "s1", false)).toBe(false);
  expect(podeIniciarDescanso(null, "s1", true)).toBe(false);
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha esperada**

Run: `npx vitest run src/lib/treino/descanso-real.test.ts`

Expected: FAIL porque `podeIniciarDescanso` ainda não existe.

- [ ] **Step 3: Implementar o predicado e provar idempotência existente**

Em `src/lib/treino/descanso-real.ts`:

```ts
export function podeIniciarDescanso(
  estado: EstadoDescanso | null,
  ultimaSerieId: string | undefined,
  ultimaSerieJaTemDescanso: boolean,
): boolean {
  return estado === null && Boolean(ultimaSerieId) && !ultimaSerieJaTemDescanso;
}
```

Acrescentar também o caso `iniciar 0 → pausar 10_000 → pausar 20_000 → retomar 30_000 → retomar 40_000 → concluir 50_000`, esperando 30 segundos ativos, para impedir contagem duplicada.

- [ ] **Step 4: Criar o hook que adapta domínio e storage ao React**

Criar `src/components/use-descanso-real.ts` com esta interface pública:

```ts
"use client";

export type ControleDescansoReal = {
  ativo: boolean;
  pausado: boolean;
  metaAtingida: boolean;
  segundosRestantes: number;
  segundosReais: number;
  serieId: string | null;
  podeIniciar: boolean;
  iniciar: () => void;
  pausar: () => void;
  retomar: () => void;
  adicionarTempo: (segundos: number) => void;
  concluir: () => Promise<void>;
  cancelarSePertence: (serieId: string) => void;
};

export function useDescansoReal({
  treinoId,
  ultimaSerieId,
  ultimaSerieJaTemDescanso,
  aoConcluir,
}: {
  treinoId: string;
  ultimaSerieId?: string;
  ultimaSerieJaTemDescanso: boolean;
  aoConcluir: (resultado: DescansoConcluido) => Promise<void>;
}): ControleDescansoReal;
```

Implementação obrigatória:

- ler o JSON serializado com `useSyncExternalStore(assinarDescansoLocal, ...)`, usando `""` como snapshot do servidor;
- usar uma assinatura de segundo estável para recalcular `painelDoDescanso` sem `setState` dentro de efeito;
- todas as ações escreverem por `salvarDescansoLocal` ou `apagarDescansoLocal`;
- `iniciar` não fazer nada sem `ultimaSerieId`, com descanso ativo ou quando `ultimaSerieJaTemDescanso` for verdadeiro;
- `concluir` reler o estado mais recente, apagá-lo antes do callback e aguardar somente `aoConcluir`, que grava localmente na fila;
- `cancelarSePertence` apagar somente quando o `serieId` corresponde;
- um efeito observar `metaAtingida && !avisoMetaEmitido`, tocar/vibrar uma vez e persistir `marcarAvisoEmitido(estado)`.

- [ ] **Step 5: Tornar `TimerTopo` um componente controlado**

Em `src/components/timer-topo.tsx`, adicionar a prop:

```ts
type TimerTopoProps = {
  // props existentes
  descanso: ControleDescansoReal;
};
```

Remover `ativo`, `pausado`, `segundosRestantes`, `duracaoTotal`, `finalizado` e `fimTimestampRef`. Manter a lógica do cronômetro total e da altura medida. Renderizar:

```tsx
<button
  type="button"
  className="timer-topo-botao-disparar"
  onClick={descanso.iniciar}
  disabled={!descanso.podeIniciar}
  title={t(
    descanso.podeIniciar
      ? "Iniciar descanso entre séries"
      : "Registre uma série para iniciar o descanso",
    idioma,
  )}
>
  <span className="timer-topo-disparar-rotulo">
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
    <span>{t("Descanso", idioma)}</span>
  </span>
  <span className="timer-topo-duracao-tag">
    {formatarMinutosSegundos(duracaoPadraoSegundos)}
  </span>
</button>
```

No estado ativo, mostrar `formatarMinutosSegundos(descanso.segundosRestantes)`, chamar ações do controlador e manter o card aberto em `00:00`. Trocar `✕` por SVG de duas linhas com `aria-hidden="true"` e usar:

```tsx
<button
  type="button"
  className="timer-topo-btn-fechar"
  onClick={() => void descanso.concluir()}
  aria-label={t("Encerrar descanso", idioma)}
>
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
</button>
```

Eliminar o antigo estado `Pronto!`: meta concluída não encerra o descanso real.

- [ ] **Step 6: Rodar tipos e testes focados**

Run: `npx vitest run src/lib/treino/descanso-real.test.ts src/lib/treino/descanso-real-local.test.ts`

Expected: PASS, incluindo bloqueio de início e idempotência.

Não criar commit no fim da Task 4. `TimerTopo` fica ligado ao consumidor na Task 5, e as duas tasks formam um único checkpoint compilável.

### Task 5: Coordenar descanso com criação, exclusão e fim do treino

**Files:**
- Modify: `src/components/treino-detalhe.tsx`
- Modify: `src/components/timer-topo.tsx`
- Modify: `src/components/use-descanso-real.ts`

- [ ] **Step 1: Criar o callback otimista de conclusão**

Em `TreinoDetalhe`, depois de `drenar`, criar:

```ts
const registrarDescansoConcluido = useCallback(
  async ({ serieId, descansoRealSegundos }: DescansoConcluido) => {
    setSeries((atuais) =>
      atuais.map((serie) =>
        serie.id === serieId ? { ...serie, descansoRealSegundos } : serie,
      ),
    );
    await enfileirar(
      "atualizar_descanso_serie",
      { id: serieId, descansoRealSegundos },
      usuarioId,
    );
  },
  [usuarioId],
);
```

Instanciar o hook sempre, sem condição:

```ts
const descanso = useDescansoReal({
  treinoId,
  ultimaSerieId: ultima?.id,
  ultimaSerieJaTemDescanso: ultima?.descansoRealSegundos !== null && ultima !== undefined,
  aoConcluir: registrarDescansoConcluido,
});
```

- [ ] **Step 2: Fechar o descanso antes de enfileirar a série seguinte**

No começo de `registrarSerie`, antes de construir `novaSerie`:

```ts
await descanso.concluir();
```

Na série otimista, acrescentar:

```ts
descansoRealSegundos: null,
```

Depois de `enfileirar("criar_serie", ...)`, iniciar o dreno sem aguardar rede:

```ts
void drenar().then((resultado) => {
  if (resultado.falhou) void pedirSincronizacaoEmSegundoPlano();
});
```

Remover o `await drenar()` desse caminho. O formulário pode fechar após os awaits locais do Dexie, nunca após Supabase.

- [ ] **Step 3: Ligar encerramento manual e confirmação localizada**

Passar `descanso` a `TimerTopo`. Adicionar o estado `confirmacaoDescanso` em `TreinoDetalhe`. Em `registrarDescansoConcluido`, depois de enfileirar, preencher esse estado com:

```ts
t("Descanso registrado: {tempo}", idioma).replace(
  "{tempo}",
  formatarDescansoReal(descansoRealSegundos),
)
```

Renderizar a mensagem acima do estado `.sync`, com `aria-live="polite"`. Um `useEffect` dependente de `confirmacaoDescanso` agenda `setConfirmacaoDescanso(null)` depois de 4.000 ms e limpa o timeout no retorno. Não criar toast global novo para uma única tela.

- [ ] **Step 4: Cancelar ao excluir a série dona**

No início de `excluirSerie(id)`:

```ts
descanso.cancelarSePertence(id);
```

Depois, manter exclusão otimista e mutação atual. Não enfileirar atualização de descanso para uma série que será excluída.

- [ ] **Step 5: Concluir antes de finalizar o treino**

Transformar o clique confirmado de finalização em handler assíncrono:

```ts
async function finalizarTreino(): Promise<void> {
  await descanso.concluir();
  marcarFim(treinoId);
  setConfirmandoFim(false);
  setMostrarRelatorio(true);
  void drenar().then((resultado) => {
    if (resultado.falhou) void pedirSincronizacaoEmSegundoPlano();
  });
}
```

Usar `onClick={() => void finalizarTreino()}`. O único `await` antes da marca de fim é IndexedDB local.

- [ ] **Step 6: Confirmar que edição preserva descanso**

Manter o merge `{ ...serie, ...dados }` e garantir que `DadosEdicaoSerie` não contém `descansoRealSegundos`. A função remota geral continua atualizando somente tipo, reps, peso, RIR e peso por lado.

- [ ] **Step 7: Rodar verificação compilável do checkpoint**

Run: `npx tsc --noEmit`

Expected: PASS.

Run: `npx vitest run src/lib/treino/descanso-real.test.ts src/lib/treino/descanso-real-local.test.ts src/lib/offline/sincronizar-pendentes.test.ts`

Expected: PASS.

- [ ] **Step 8: Commitar cronômetro e coordenação juntos**

```bash
git add src/components/use-descanso-real.ts src/components/timer-topo.tsx src/components/treino-detalhe.tsx src/lib/treino/descanso-real.ts src/lib/treino/descanso-real.test.ts src/lib/treino/descanso-real-local.ts src/lib/treino/descanso-real-local.test.ts
git commit -m "feat: Liga descanso real às séries" -m "Agente: codex"
```

### Task 6: Grade contínua por exercício

**Files:**
- Modify: `src/components/treino-detalhe.tsx`
- Modify: `src/app/tokens.css`
- Modify: `src/app/sistema.css`
- Test: `src/lib/treino/apresentacao-series.test.ts`

- [ ] **Step 1: Preparar os dados da grade sem lógica no JSX**

Para cada grupo, calcular uma vez:

```ts
const resumo = resumirSeriesValendo(grupo.series, idioma);
```

Para cada linha:

```ts
const marcadores = marcadoresDaSerie(
  serie.tipo,
  Boolean(serie.ehRecordePessoal),
  idioma,
);
const descansoDaLinha =
  descanso.ativo && descanso.serieId === serie.id
    ? t("Em andamento", idioma)
    : formatarDescansoReal(serie.descansoRealSegundos);
```

- [ ] **Step 2: Substituir os cartões de linha pela grade ARIA**

Manter uma moldura por exercício e trocar o conteúdo de `tabela-series-pro` por:

```tsx
<div className="grade-series" role="table" aria-label={grupo.nome}>
  <div className="grade-series__cabecalho" role="row">
    <span role="columnheader">{t("Série", idioma)}</span>
    <span role="columnheader">{t("Carga", idioma)}</span>
    <span role="columnheader">{t("Repetições", idioma)}</span>
    <span role="columnheader">{t("Descanso real", idioma)}</span>
  </div>
  {grupo.series.map((serie, indice) => (
    <div
      className="grade-series__linha"
      role="row"
      tabIndex={0}
      key={serie.id}
      onClick={() => setEditandoId(serie.id)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          setEditandoId(serie.id);
        }
      }}
    >
      <span className="grade-series__serie" role="cell">
        <b>{indice + 1}</b>
        <span className="grade-series__marcadores">
          {marcadores.map((marcador) => (
            <span
              className={`marcador-serie marcador-serie--${marcador.tipo}`}
              title={marcador.completo}
              aria-label={marcador.completo}
              key={marcador.tipo}
            >
              {marcador.curto}
            </span>
          ))}
        </span>
      </span>
      <span className="grade-series__numero" role="cell">{serie.peso} <small>kg</small></span>
      <span className="grade-series__numero" role="cell">{serie.reps}</span>
      <span className="grade-series__descanso" role="cell">
        {modoEdicao ? (
          <button
            type="button"
            className="botao-icone"
            aria-label={`${t("Excluir série", idioma)} ${indice + 1} ${t("de", idioma)} ${grupo.nome}`}
            onClick={(evento) => {
              evento.stopPropagation();
              setExcluindoId(serie.id);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        ) : descansoDaLinha}
      </span>
    </div>
  ))}
</div>
```

Preservar os ramos existentes de `EditarSerie` e confirmação de exclusão; eles substituem a linha correspondente dentro do bloco.

- [ ] **Step 3: Trocar o resumo do exercício**

Substituir a contagem atual por `<span className="grade-exercicio__resumo">{resumo}</span>`. Remover a tag redundante `EXERCÍCIO`: o nome e a estrutura já deixam a natureza do bloco clara.

- [ ] **Step 4: Adicionar somente tokens semânticos ausentes**

Em `:root` de `src/app/tokens.css`, mover para tokens os dois valores âmbar que hoje estão cravados em `.chip-serie--aquecimento` e definir os estados estruturais como aliases dos tokens existentes:

```css
--lastro-aquecimento-fundo: rgba(245, 158, 11, 0.12);
--lastro-aquecimento-borda: rgba(245, 158, 11, 0.3);
--lastro-grade-cabecalho: var(--lastro-sup-2);
--lastro-grade-linha-ativa: var(--lastro-ouro-glow);
```

Os temas herdam esses fundos translúcidos e continuam usando suas tintas semânticas próprias, inclusive o `--lastro-aquecimento` mais escuro de `branco-ouro`. Remover os dois `rgba(...)` correspondentes de `.chip-serie--aquecimento` e fazê-lo usar os novos tokens. Não criar overrides de tema sem uma medição que os exija.

- [ ] **Step 5: Implementar a composição em CSS sem valores visuais cravados no componente**

Em `src/app/sistema.css`, substituir as regras de `.tabela-series-pro` e `.linha-serie-pro` pelas classes novas. Requisitos concretos:

```css
.grade-series {
  overflow: hidden;
  border: 1px solid var(--lastro-linha);
  border-radius: var(--lastro-raio-2);
  background: var(--lastro-sup-1);
}

.grade-series__cabecalho,
.grade-series__linha {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr) minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: center;
}

.grade-series__cabecalho {
  min-height: var(--lastro-e-8);
  background: var(--lastro-grade-cabecalho);
  color: var(--lastro-txt-2);
  font-size: var(--lastro-papel-detalhe);
}

.grade-series__linha {
  min-height: var(--lastro-alvo-min);
  border-top: 1px solid var(--lastro-linha);
  color: var(--lastro-txt);
  cursor: pointer;
}

.grade-series__linha:focus-visible {
  outline: var(--lastro-foco-espessura) solid var(--lastro-foco);
  outline-offset: calc(-1 * var(--lastro-foco-espessura));
}

.grade-series__numero,
.grade-series__descanso {
  font-family: var(--lastro-fonte-num);
  font-variant-numeric: tabular-nums;
  text-align: center;
}
```

Usar tokens de espaço em padding/gap, permitir quebra em `Em andamento` e reduzir somente a distribuição das colunas em `@media (max-width: 340px)`. Não reduzir corpo abaixo do piso tipográfico do projeto e não criar rolagem horizontal.

- [ ] **Step 6: Rodar testes e verificações estáticas da grade**

Run: `npx vitest run src/lib/treino/apresentacao-series.test.ts src/lib/texto/i18n.test.ts`

Expected: PASS.

Run: `npm run check:i18n && npx tsc --noEmit && npx eslint .`

Expected: todos saem com código 0; warnings antigos de lint podem permanecer, erros novos não.

- [ ] **Step 7: Commitar a tela de prova**

```bash
git add src/components/treino-detalhe.tsx src/app/tokens.css src/app/sistema.css
git commit -m "feat: Exibe séries em grade contínua" -m "Agente: codex"
```

### Task 7: Caminhos tristes, CI e portão visual

**Files:**
- Modify: `e2e/j1-treino.spec.ts`
- Modify: `e2e/j4-varredura.spec.ts`
- Modify: `e2e/j5-contraste.spec.ts`
- Modify: `QA.md`
- Create: `qa/evidencias/TR-12/print.png`
- Create: `qa/evidencias/TR-12/console.txt`
- Create: `qa/evidencias/TR-12/rede.txt`
- Create: `qa/evidencias/VS-09/print.png`
- Create: `qa/evidencias/VS-09/console.txt`
- Create: `qa/evidencias/VS-09/rede.txt`
- Create: `qa/evidencias/OF-09/print.png`
- Create: `qa/evidencias/OF-09/console.txt`
- Create: `qa/evidencias/OF-09/rede.txt`

- [ ] **Step 1: Consultar somente a fila de QA obsoleta**

Run: `node scripts/qa-obsoletos.mjs`

Expected: lista das áreas invalidadas por `treino-detalhe`, `timer`, `offline`, `visual` e `i18n`. Se o script repetir “Nao e um repositorio git”, registrar a limitação e não alegar fila limpa.

- [ ] **Step 2: Acrescentar o E2E do caminho completo sem executá-lo localmente**

Em `e2e/j1-treino.spec.ts`, acrescentar um teste que:

```ts
test("mede o descanso real, fecha na próxima série e persiste após recarga", async ({ page }) => {
  await entrarComoUsuario(page, usuario);
  await page.goto("/treino");
  await page.getByRole("button", { name: "Iniciar treino de hoje" }).click();
  await page.waitForURL(/\/treino\/[^/]+$/);

  await expect(page.getByRole("button", { name: "Iniciar descanso entre séries" })).toBeDisabled();
  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  await page.locator("label.chip").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await registrarSerie(page, { reps: "10", peso: "40" });

  await page.getByRole("button", { name: "Iniciar descanso entre séries" }).click();
  await page.waitForTimeout(2_100);
  await page.getByRole("button", { name: "Repetir série" }).click();

  await expect(page.getByRole("cell", { name: /00:0[12]/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("cell", { name: /00:0[12]/ }).first()).toBeVisible();
});
```

Evitar asserção exata de um único segundo por causa do agendamento do CI. O teste cria/apaga somente o usuário descartável já usado pelo arquivo.

- [ ] **Step 3: Cobrir o caminho offline no E2E existente**

No cenário offline de `j1`, iniciar descanso depois da série online, colocar o contexto offline, aguardar dois segundos e registrar a seguinte. Confirmar `Em andamento` antes do registro, duração após o registro e `salvo no aparelho`; ao reconectar, aguardar `sincronizado`, recarregar e confirmar a duração.

- [ ] **Step 4: Atualizar varredura e contraste**

Em `j4`, garantir captura de `/treino/[id]` com ao menos duas séries para a grade não ficar vazia. Em `j5`, acrescentar seletores dos pares:

```ts
[
  [".marcador-serie--aquecimento", "color", "backgroundColor", 4.5],
  [".marcador-serie--valendo", "color", "backgroundColor", 4.5],
  [".marcador-serie--recorde", "color", "backgroundColor", 4.5],
  [".grade-series__cabecalho", "color", "backgroundColor", 4.5],
]
```

Reutilizar o helper de contraste já existente em `j5`; não criar cálculo paralelo.

- [ ] **Step 5: Rodar a suíte local permitida**

Run: `npm run check:i18n`

Expected: saída limpa e código 0.

Run: `npx tsc --noEmit`

Expected: código 0.

Run: `npm test`

Expected: todos os arquivos e testes passam; conferir que a contagem aumentou pelos novos arquivos.

Run: `npx eslint .`

Expected: código 0, sem erro novo.

Run: `npm run build`

Expected: build de produção concluído. Depois, executar `git status --short`; se `next-env.d.ts` mudou somente pelo build, restaurar com `git checkout -- next-env.d.ts` conforme `AGENTS.md`.

- [ ] **Step 6: Fazer a verificação visual alegada em navegador real**

Somente depois da migration autorizada/aplicada, iniciar `npm run dev` e abrir `/treino/[id]` em 320 px e 375 px. Verificar os itens binários da spec §12 nos três idiomas, além de:

- topo não cobre grade;
- navegação não cobre última linha;
- `AQ/VAL/RP` ou equivalentes não quebram a coluna;
- `Em andamento` cabe sem rolagem horizontal;
- foco volta para a linha após salvar/cancelar edição;
- desligar rede mantém série e descanso visíveis.

Capturar `print.png`, `console.txt` e `rede.txt`. Registrar como `ALEGADO` porque foi produzido pelo implementador.

- [ ] **Step 7: Commitar testes e QA**

```bash
git add e2e/j1-treino.spec.ts e2e/j4-varredura.spec.ts e2e/j5-contraste.spec.ts QA.md qa/evidencias
git commit -m "test: Cobre grade e descanso real" -m "Agente: codex"
```

- [ ] **Step 8: Abrir PR separado e observar o CI**

Antes do push:

```bash
git status --short
git diff --stat HEAD~1
git diff --check HEAD~1
```

Fazer push somente de `codex/redesenho-tabela-treino`. Abrir PR separado da consistência linguística. Não usar `npm run e2e` localmente. Conferir o CI com:

```bash
gh pr view --json statusCheckRollup
gh pr checks
```

Expected: checks obrigatórios verdes; run cancelado por push posterior não conta como falha.

### Task 8: Revisão final e handoff

**Files:**
- Modify: `PROGRESS.md`
- Modify: `QA.md` somente se houver prova nova válida

- [ ] **Step 1: Comparar implementação com toda a especificação**

Ler `docs/superpowers/specs/2026-09-15-grade-series-descanso-real-design.md` e verificar explicitamente:

```text
direção C; tipo + recorde; resumo só VAL; descanso real; pausa excluída;
tempo excedido; encerramento manual; próxima série; finalização; exclusão;
recarga; storage apagado; offline; troca de conta; três idiomas;
teclado; contraste; 320/375 px; migration autorizada; E2E só no CI.
```

Expected: cada item aponta para código, teste ou evidência. Item sem prova permanece aberto; não marcar como concluído por inferência.

- [ ] **Step 2: Solicitar revisão independente**

Usar `superpowers:requesting-code-review` para revisão da spec e qualidade. Achados bloqueantes são corrigidos com TDD e novo commit lógico. A pessoa/agente que implementou não promove sua própria evidência visual a `PASSOU`.

- [ ] **Step 3: Atualizar o handoff**

Reescrever o bloco `ESTADO ATUAL` de `PROGRESS.md` com branch, commits, comandos realmente executados, estado da migration, PR/CI, nível da evidência e ação concreta que o dono deve fazer no aparelho.

- [ ] **Step 4: Commitar o fechamento documental**

```bash
git add PROGRESS.md QA.md
git commit -m "docs: Registra verificação da grade de séries" -m "Agente: codex"
```

- [ ] **Step 5: Entregar o resultado sem alegação além da prova**

Informar:

- branch e PR;
- estado exato de tipos, testes, lint, build e CI;
- se a migration foi ou não aplicada;
- quais cenários estão `ALEGADO` e quais receberam auditoria independente;
- URL/tela e ações que o dono deve executar para o gate final.
