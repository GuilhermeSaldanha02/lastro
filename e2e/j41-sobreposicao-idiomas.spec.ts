// lastro · UX-03-RESTO (auditoria independente, 2026-10-01).
//
// O que a auditoria deixou sem medir: (1) texto que se sobrepõe sem ser cortado
// em inglês e espanhol, onde nasceram os defeitos UX3-09 e UX3-10 (a `j26` mede
// vazamento, corte e alvo, mas não o cruzamento de textos); (2) a faixa de
// ações de `/treino/[id]` em cada estado, com a página visível, nos três
// idiomas (a `j40` fez isso só em português).
//
// Diferente da `j26`, esta REPROVA: sobreposição de texto é defeito. Larguras
// 375 (principal) e 320 (a menor que o app promete suportar).
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { hojeNoBrasil } from "./helpers/caminho-triste";
import { medirSobreposicao } from "./helpers/sobreposicao";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";

type Idioma = "pt-BR" | "en" | "es";
const IDIOMAS: Idioma[] = ["pt-BR", "en", "es"];
const LARGURAS = [375, 320];

const TEXTO: Record<Idioma, { finalizar: string; outra: string; fechar: string; reabrir: string; repetir: string }> = {
  "pt-BR": { finalizar: "Finalizar Treino", outra: "Outra série", fechar: "Fechar", reabrir: "Reabrir treino", repetir: "Repetir série" },
  en: { finalizar: "Finish Workout", outra: "Another set", fechar: "Close", reabrir: "Reopen workout", repetir: "Repeat set" },
  es: { finalizar: "Finalizar Entrenamiento", outra: "Otra serie", fechar: "Cerrar", reabrir: "Reabrir entrenamiento", repetir: "Repetir serie" },
};

let aluno: UsuarioDescartavel;
let treinador: UsuarioDescartavel;
let treinoPassadoId = "";
let exercicioId = "";
let treinoAbertoId = "";

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j41-aluno", "aluno");
  const cliente = await clienteAutenticado(aluno);
  await semearHistoricoParaAnalise(cliente, aluno.id);
  const { data: treino } = await cliente.from("treino").select("id").limit(1).single();
  treinoPassadoId = treino?.id ?? "";
  const { data: ex } = await cliente.from("exercicio").select("id").not("dica_execucao", "is", null).limit(1).single();
  exercicioId = ex?.id ?? "";

  // Treino de HOJE aberto, com 6 exercícios do mesmo grupo: lista longa, para a
  // faixa de ações e o fim da rolagem terem o que provar.
  treinador = await criarUsuarioDescartavel("j41-treino", "aluno");
  const c2 = await clienteAutenticado(treinador);
  const { data: exercicios, error } = await c2
    .from("exercicio")
    .select("id")
    .eq("grupo_muscular_primario", "peito")
    .order("nome")
    .limit(6);
  if (error || !exercicios || exercicios.length < 6) throw new Error(`Preparação: 6 exercícios de peito: ${error?.message}`);
  const { data: aberto, error: erroTreino } = await c2
    .from("treino")
    .insert({ usuario_id: treinador.id, data: hojeNoBrasil() })
    .select("id")
    .single();
  if (erroTreino || !aberto) throw new Error(`Preparação: treino: ${erroTreino?.message}`);
  treinoAbertoId = aberto.id;
  const { error: erroSeries } = await c2.from("serie").insert(
    exercicios.map((e, i) => ({ treino_id: treinoAbertoId, exercicio_id: e.id, ordem: i + 1, tipo: "valendo", reps: 10, peso: 40 + i })),
  );
  if (erroSeries) throw new Error(`Preparação: séries: ${erroSeries.message}`);
});

test.afterAll(async () => {
  for (const c of [aluno, treinador]) if (c) await apagarUsuarioDescartavel(c);
});

async function definirIdioma(conta: UsuarioDescartavel, idioma: Idioma) {
  const cliente = await clienteAutenticado(conta);
  await cliente.from("usuario").update({ idioma }).eq("id", conta.id);
}

async function achados(page: Page, onde: string): Promise<string[]> {
  const lista = await medirSobreposicao(page);
  return lista.map((s) => `${onde}: ${s.a} × ${s.b} (${s.largura}×${s.altura}px)`);
}

// ---------- 1. Telas principais, três idiomas, duas larguras ----------
for (const idioma of IDIOMAS) {
  for (const largura of LARGURAS) {
    test(`sem texto sobreposto: ${idioma} a ${largura}px`, async ({ page }) => {
      test.setTimeout(240_000);
      await definirIdioma(aluno, idioma);
      await page.setViewportSize({ width: largura, height: 812 });
      await entrarComoUsuario(page, aluno);
      const rotas = [
        "/", "/treino", "/analise", "/coach", "/catalogo", "/perfil",
        "/ajustes", "/ajustes/guia", "/ajustes/relatorios", "/ajustes/anilhas", "/ajustes/modelos", "/ajustes/personal", "/ajustes/politicas",
        `/treino/${treinoPassadoId}`, `/catalogo/${exercicioId}`,
      ];
      const todos: string[] = [];
      for (const rota of rotas) {
        await page.goto(rota);
        todos.push(...(await achados(page, `${idioma} ${largura}px ${rota}`)));
      }
      await definirIdioma(aluno, "pt-BR");
      expect(todos, "texto sobreposto a outro texto").toEqual([]);
    });
  }
}

// ---------- 2. Faixa de ações do treino, estado a estado ----------
async function medirFaixa(page: Page): Promise<{ faixa: number; reservado: number }> {
  return page.evaluate(() => {
    const faixa = document.querySelector(".acao-area") as HTMLElement | null;
    return {
      faixa: faixa ? Math.ceil(faixa.getBoundingClientRect().height) : -1,
      reservado: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--lastro-acao-area-altura")),
    };
  });
}

async function reservaAcompanha(page: Page, estado: string): Promise<void> {
  await expect
    .poll(async () => {
      const { faixa, reservado } = await medirFaixa(page);
      return Math.abs(faixa - reservado) <= 1 && faixa > 0;
    }, { message: `${estado}: a reserva de espaço não acompanhou a faixa`, timeout: 10_000 })
    .toBe(true);
}

for (const idioma of IDIOMAS) {
  for (const largura of LARGURAS) {
    test(`faixa de ações do treino sem sobreposição: ${idioma} a ${largura}px`, async ({ page }) => {
      test.setTimeout(240_000);
      const t = TEXTO[idioma];
      await definirIdioma(treinador, idioma);
      await page.setViewportSize({ width: largura, height: 812 });
      await entrarComoUsuario(page, treinador);
      await page.goto(`/treino/${treinoAbertoId}`);
      await expect(page.locator(".grade-exercicio")).toHaveCount(6);
      const todos: string[] = [];

      // Aberto, com séries.
      await reservaAcompanha(page, "aberto");
      todos.push(...(await achados(page, `${idioma} ${largura}px treino aberto`)));

      // Formulário aberto ("Outra série"): a faixa sai de cena.
      await page.getByRole("button", { name: t.outra }).click();
      await expect(page.locator("#reps")).toBeVisible();
      todos.push(...(await achados(page, `${idioma} ${largura}px formulário`)));
      await page.getByRole("button", { name: t.fechar, exact: true }).first().click();
      await expect(page.getByRole("button", { name: t.outra })).toBeVisible();
      await reservaAcompanha(page, "formulário fechado");

      // Confirmação de finalizar.
      await page.locator(".botao-finalizar-treino").first().click();
      await expect(page.locator(".confirma")).toBeVisible();
      todos.push(...(await achados(page, `${idioma} ${largura}px confirmação`)));
      await page.waitForTimeout(700); // TR-13: toque cedo demais é ignorado
      await page.locator(".confirma .botao-finalizar-treino").click();

      // Relatório (tela de compartilhar) e depois o treino finalizado.
      await expect(page.locator(".pos-treino-overlay")).toBeVisible({ timeout: 20_000 });
      todos.push(...(await achados(page, `${idioma} ${largura}px relatório`)));
      await page.getByRole("button", { name: t.fechar, exact: true }).click();
      await expect(page.getByRole("button", { name: t.reabrir })).toBeVisible();
      await reservaAcompanha(page, "finalizado");
      todos.push(...(await achados(page, `${idioma} ${largura}px finalizado`)));

      // Reabre sem recarregar.
      await page.getByRole("button", { name: t.reabrir }).click();
      await expect(page.getByRole("button", { name: t.repetir })).toBeVisible({ timeout: 20_000 });
      await reservaAcompanha(page, "reaberto");
      todos.push(...(await achados(page, `${idioma} ${largura}px reaberto`)));

      await definirIdioma(treinador, "pt-BR");
      expect(todos, "texto sobreposto a outro texto").toEqual([]);
    });
  }
}
