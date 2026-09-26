// lastro · UX3-10 — na Home em inglês e espanhol o botão principal cabe em uma
// linha e o título do cartão da Análise não é cortado (achado da cobertura de
// 2026-09-26: "INICIAR ENTRENAMIENTO DE HOY" quebrava em duas linhas com o
// ícone solto; "Análisis Semanal (A…" aparecia cortado).
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j28-home", "aluno");
});

test.afterAll(async () => {
  const cliente = await clienteAutenticado(conta);
  await cliente.from("usuario").update({ idioma: "pt-BR" }).eq("id", conta.id);
  await apagarUsuarioDescartavel(conta);
});

for (const idioma of ["pt-BR", "en", "es"] as const) {
  test(`${idioma}: botão principal em uma linha e título da Análise inteiro`, async ({ page }) => {
    const cliente = await clienteAutenticado(conta);
    await cliente.from("usuario").update({ idioma }).eq("id", conta.id);
    await page.setViewportSize({ width: 375, height: 812 });
    await entrarComoUsuario(page, conta);
    await page.goto("/");

    const botao = page.locator(".botao-primario--heroi").first();
    await expect(botao).toBeVisible();
    const alturaBotao = (await botao.boundingBox())!.height;
    const alvoAcao = await botao.evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
    expect(alturaBotao, `ACHADO UX3-10: o botão principal quebrou em mais de uma linha (${alturaBotao}px)`).toBeLessThanOrEqual(alvoAcao + 8);

    const cortados = await page.evaluate(() =>
      [...document.querySelectorAll("span, p, h2, h3")]
        .filter((el) => el.children.length === 0 && (el.textContent ?? "").trim() && el.scrollWidth > el.clientWidth + 1)
        .map((el) => (el.textContent ?? "").trim().slice(0, 40)),
    );
    expect(cortados, "há texto cortado na Home").toEqual([]);
  });
}
