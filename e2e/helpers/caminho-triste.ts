// lastro · Ferramentas do caminho triste do app inteiro (j10 a j13).
//
// Extraídas porque quatro specs precisam das mesmas medidas, e medida
// copiada é onde uma cópia passa a medir outra coisa sem ninguém notar.
//
// Três regras que moram aqui, todas pagas antes nesta base:
// 1. Todo caso salva um print em `test-results/` (o CI sobe a pasta como
//    artefato). O dono pediu prova visual; o print é essa prova.
// 2. A fila offline se lê direto no IndexedDB, sem criar o banco: abrir
//    "lastro" sem versão num navegador que ainda não o tem criaria uma v1
//    vazia, e o Dexie depois abriria sem a tabela `outbox`.
// 3. Valor de teste que identifica uma linha é ÚNICO por execução
//    (`pesoUnico`). O CI tem `retries: 1`; um valor fixo contaria a linha
//    da tentativa anterior e daria verde ou vermelho falso.
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { apagarUsuarioDescartavel, type UsuarioDescartavel } from "./usuario-descartavel";

/** Achado na anotação do teste E no log do CI (mesmo padrão da j9). */
export function anotarAchado(descricao: string): void {
  test.info().annotations.push({ type: "achado", description: descricao });
  console.log(`[achado] ${test.info().title}: ${descricao}`);
}

/** Print de página inteira dentro da pasta do teste em `test-results/`. */
export async function print(page: Page, nome: string): Promise<void> {
  await page
    .screenshot({ path: test.info().outputPath(`${nome}.png`), fullPage: true })
    .catch(() => {
      /* print é prova, não asserção: a falha dele não pode esconder o achado */
    });
}

/** Data de hoje no calendário de Brasília — a mesma régua de `dataLocalBrasil`. */
export function hojeNoBrasil(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function dataHaDias(dias: number): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() - dias);
  return data.toISOString().slice(0, 10);
}

/**
 * Peso com duas casas, único por execução. Nunca termina em zero: a tela
 * mostra `Number(peso)`, e "17.50" apareceria como "17.5".
 */
export function pesoUnico(base: number): string {
  const centavos = 11 + Math.floor(Math.random() * 88);
  return `${base}.${centavos % 10 === 0 ? centavos + 1 : centavos}`;
}

export async function apagarSemErro(conta: UsuarioDescartavel | undefined): Promise<void> {
  if (!conta) return;
  try {
    await apagarUsuarioDescartavel(conta);
  } catch {
    /* conta já apagada pelo próprio teste (excluir conta) */
  }
}

export async function primeiroExercicio(
  cliente: SupabaseClient,
): Promise<{ id: string; nome: string; grupo: string }> {
  const { data, error } = await cliente
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario")
    .order("nome")
    .limit(1)
    .single();
  if (error || !data) throw new Error(`Preparação: catálogo ilegível: ${error?.message}`);
  return { id: data.id, nome: data.nome, grupo: data.grupo_muscular_primario };
}

/** Treino com uma série valendo, com o JWT do próprio dono (a RLS que a tela usa). */
export async function semearTreino(
  cliente: SupabaseClient,
  usuarioId: string,
  data: string,
  exercicioId: string,
  serie: { reps: number; peso: number },
): Promise<{ treinoId: string; serieId: string }> {
  const { data: treino, error: erroTreino } = await cliente
    .from("treino")
    .insert({ usuario_id: usuarioId, data })
    .select("id")
    .single();
  if (erroTreino || !treino) throw new Error(`Preparação: treino: ${erroTreino?.message}`);
  const { data: linha, error: erroSerie } = await cliente
    .from("serie")
    .insert({
      treino_id: treino.id,
      exercicio_id: exercicioId,
      ordem: 1,
      tipo: "valendo",
      reps: serie.reps,
      peso: serie.peso,
    })
    .select("id")
    .single();
  if (erroSerie || !linha) throw new Error(`Preparação: série: ${erroSerie?.message}`);
  return { treinoId: treino.id, serieId: linha.id };
}

export type LinhaSerie = { id: string; reps: number; peso: number; rir: number | null };

export async function seriesDoTreino(cliente: SupabaseClient, treinoId: string): Promise<LinhaSerie[]> {
  const { data, error } = await cliente.from("serie").select("id, reps, peso, rir").eq("treino_id", treinoId);
  if (error) throw new Error(`Falha ao ler séries: ${error.message}`);
  return (data ?? []).map((s) => ({ id: s.id, reps: s.reps, peso: Number(s.peso), rir: s.rir }));
}

export async function contarLinhas(
  cliente: SupabaseClient,
  tabela: string,
  filtros: Record<string, string>,
): Promise<number> {
  let consulta = cliente.from(tabela).select("id", { count: "exact", head: true });
  for (const [coluna, valor] of Object.entries(filtros)) consulta = consulta.eq(coluna, valor);
  const { count, error } = await consulta;
  if (error) throw new Error(`Falha ao contar ${tabela}: ${error.message}`);
  return count ?? -1;
}

export type EstadoFila = { pendentes: number; falhas: number };

/** Itens na fila offline (`outbox`) e descartados como permanentes (`falhas`). -1 = ilegível. */
export async function filaLocal(page: Page): Promise<EstadoFila> {
  try {
    return await page.evaluate(
      () =>
        new Promise<{ pendentes: number; falhas: number }>((resolve) => {
          const pedido = indexedDB.open("lastro");
          pedido.onupgradeneeded = () => pedido.transaction?.abort();
          pedido.onerror = () => resolve({ pendentes: 0, falhas: 0 });
          pedido.onsuccess = () => {
            const db = pedido.result;
            const lojas = ["outbox", "falhas"].filter((n) => db.objectStoreNames.contains(n));
            const estado = { pendentes: 0, falhas: 0 };
            if (lojas.length === 0) {
              db.close();
              resolve(estado);
              return;
            }
            const tx = db.transaction(lojas, "readonly");
            if (lojas.includes("outbox")) {
              const c = tx.objectStore("outbox").count();
              c.onsuccess = () => (estado.pendentes = c.result);
            }
            if (lojas.includes("falhas")) {
              const c = tx.objectStore("falhas").count();
              c.onsuccess = () => (estado.falhas = c.result);
            }
            tx.oncomplete = () => {
              db.close();
              resolve(estado);
            };
          };
        }),
    );
  } catch {
    return { pendentes: -1, falhas: -1 };
  }
}

/** Espera a fila sair do estado "pendente" — drenada ou descartada. Devolve o estado final. */
export async function esperarFilaAssentar(page: Page, limiteMs = 25_000): Promise<EstadoFila> {
  const fim = Date.now() + limiteMs;
  let estado = await filaLocal(page);
  while (estado.pendentes !== 0 && Date.now() < fim) {
    await page.waitForTimeout(500);
    estado = await filaLocal(page);
  }
  return estado;
}

/** Pixels além da largura da viewport (mesma medida da j4). */
export async function vazamentoHorizontal(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Tela de criar modelo até o botão "Salvar modelo", com um exercício marcado. */
export async function montarModelo(
  page: Page,
  nome: string,
  plano: { reps?: string; peso?: string } = {},
): Promise<void> {
  await page.goto("/ajustes/modelos/novo");
  await page.locator("#nome_modelo").fill(nome);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("label.chip").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator(".selecao-grupos__opcao").first().click();
  if (plano.reps !== undefined) await page.locator('input[id^="reps_"]').first().fill(plano.reps);
  if (plano.peso !== undefined) await page.locator('input[id^="peso_"]').first().fill(plano.peso);
  await expect(page.getByRole("button", { name: "Salvar modelo" })).toBeVisible();
}

/** Espera o desfecho de uma ação de tela: erro visível OU a URL indicada. */
export async function esperarDesfecho(page: Page, rotaDeSucesso: string, limiteMs = 15_000): Promise<void> {
  await expect
    .poll(
      async () =>
        new URL(page.url()).pathname === rotaDeSucesso ||
        new URL(page.url()).pathname === "/login" ||
        (await page.locator(".aviso-erro").isVisible()),
      { timeout: limiteMs },
    )
    .toBe(true);
}

/** Excluir a conta pela tela de Ajustes, com a confirmação inline. */
export async function excluirContaPelaTela(page: Page): Promise<void> {
  await page.goto("/ajustes");
  await page.getByRole("button", { name: "Excluir conta" }).click();
  const confirmacao = page.locator(".zona-risco .confirma");
  await expect(confirmacao).toBeVisible();
  await confirmacao.getByRole("button", { name: /Excluir conta/ }).click();
  await page.waitForURL((url) => url.pathname === "/login", { timeout: 20_000 });
}
