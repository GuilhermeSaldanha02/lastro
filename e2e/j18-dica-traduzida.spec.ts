// lastro · A1 — a dica de execução chega no idioma da pessoa.
//
// Em inglês e em espanhol a tela do exercício mostra a dica traduzida, não a
// em português (achado A1 da auditoria de linguagem). Em português segue a
// dica original.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;
let exercicioId: string;
let dicaPt: string;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j18-dica", "aluno");
  const cliente = await clienteAutenticado(conta);
  const { data, error } = await cliente
    .from("exercicio")
    .select("id, dica_execucao")
    .not("dica_execucao", "is", null)
    .limit(1)
    .single();
  if (error || !data) throw new Error(`sem exercício com dica: ${error?.message}`);
  exercicioId = data.id;
  dicaPt = data.dica_execucao as string;
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

for (const [idioma, rotulo] of [
  ["en", "inglês"],
  ["es", "espanhol"],
] as const) {
  test(`em ${rotulo}, a dica do exercício não vem em português`, async ({ page }) => {
    const cliente = await clienteAutenticado(conta);
    const { error } = await cliente.from("usuario").update({ idioma }).eq("id", conta.id);
    expect(error, "não trocou o idioma da conta").toBeNull();

    await entrarComoUsuario(page, conta);
    await page.goto(`/catalogo/${exercicioId}`);
    const dica = page.locator(".dica-texto-principal").first();
    await expect(dica).toBeVisible();
    const texto = (await dica.textContent()) ?? "";
    expect(texto.trim().length, "dica vazia").toBeGreaterThan(10);
    expect(texto.trim(), `ACHADO A1: a dica em ${rotulo} é a em português`).not.toBe(dicaPt.trim());
  });
}

test("em português, a dica é a original", async ({ page }) => {
  const cliente = await clienteAutenticado(conta);
  await cliente.from("usuario").update({ idioma: "pt-BR" }).eq("id", conta.id);
  await entrarComoUsuario(page, conta);
  await page.goto(`/catalogo/${exercicioId}`);
  await expect(page.locator(".dica-texto-principal").first()).toHaveText(dicaPt.trim());
});
