// lastro · UX3-09 — os rótulos da barra inferior cabem no item de cada aba em
// inglês e espanhol (achado da cobertura de 2026-09-26: em espanhol
// "Entrenamientos" e "Análisis" se sobrepunham).
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
  conta = await criarUsuarioDescartavel("j27-nav", "aluno");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

for (const idioma of ["pt-BR", "en", "es"] as const) {
  for (const largura of [360, 375, 390]) {
    test(`${idioma} a ${largura}px: cada rótulo cabe no próprio item da barra`, async ({ page }) => {
      const cliente = await clienteAutenticado(conta);
      await cliente.from("usuario").update({ idioma }).eq("id", conta.id);
      await page.setViewportSize({ width: largura, height: 812 });
      await entrarComoUsuario(page, conta);
      await page.goto("/");

      const itens = await page.locator(".nav a").evaluateAll((els) =>
        els.map((a) => {
          const r = document.createRange();
          r.selectNodeContents(a);
          const texto = [...a.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
          // largura só do texto: o range cobre ícone + texto, então mede o nó de texto
          const no = [...a.childNodes].find((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
          const rt = document.createRange();
          if (no) rt.selectNodeContents(no);
          return { texto, largTexto: Math.round(rt.getBoundingClientRect().width), largItem: Math.round(a.getBoundingClientRect().width) };
        }),
      );
      expect(itens.length).toBeGreaterThanOrEqual(4);
      // Tolerância de 2px: a medida do texto e a do item têm arredondamento de
      // subpixel (e o texto centrado sobra igual dos dois lados). O defeito que
      // este teste guarda era de dezenas de px ("Entrenamientos" sobre "Análisis").
      for (const it of itens) {
        expect(it.largTexto, `ACHADO UX3-09: "${it.texto}" (${it.largTexto}px) não cabe no item (${it.largItem}px)`).toBeLessThanOrEqual(it.largItem + 2);
      }
    });
  }
}

test.afterEach(async () => {
  const cliente = await clienteAutenticado(conta);
  await cliente.from("usuario").update({ idioma: "pt-BR" }).eq("id", conta.id);
});
