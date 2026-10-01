// UX-03-RESTO (2026-10-01): o ponto cego da medida de `medir-tela.ts` é o texto
// que se SOBREPÕE a outro sem ser cortado (o defeito da barra inferior em
// espanhol, UX3-09, só o olho viu). Aqui o texto vira caixas reais (as linhas
// que o navegador desenhou) e duas caixas de elementos diferentes que se
// cruzam são um achado.
import type { Page } from "@playwright/test";

export type Sobreposicao = { a: string; b: string; largura: number; altura: number };

export async function medirSobreposicao(page: Page): Promise<Sobreposicao[]> {
  await page.waitForLoadState("networkidle").catch(() => {});
  return page.evaluate(() => {
    const visivel = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
    };
    // Camada = o ancestral fixo/sticky mais próximo. Texto de uma barra fixa
    // passando por cima do conteúdo que rola é o desenho, não um defeito (o
    // "escondido pela barra" é outra medida); só se compara texto da mesma camada.
    const camada = (el: Element): Element | null => {
      for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
        const p = getComputedStyle(e).position;
        if (p === "fixed" || p === "sticky") return e;
      }
      return null;
    };
    const ignorar = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "OPTION"]);
    const itens = [...document.querySelectorAll("body *")]
      .filter(
        (el) =>
          !ignorar.has(el.tagName.toUpperCase()) &&
          visivel(el) &&
          !el.closest('[aria-hidden="true"]') &&
          [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0),
      )
      .map((el) => {
        const faixa = document.createRange();
        faixa.selectNodeContents(el);
        const caixas = [...faixa.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
        return { el, caixas, camada: camada(el) };
      })
      .filter((i) => i.caixas.length > 0);

    const rotulo = (el: Element) => `${el.tagName.toLowerCase()}:"${(el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}"`;
    const achados: { a: string; b: string; largura: number; altura: number }[] = [];
    for (let i = 0; i < itens.length; i++) {
      for (let j = i + 1; j < itens.length; j++) {
        const x = itens[i];
        const y = itens[j];
        if (x.camada !== y.camada) continue;
        if (x.el.contains(y.el) || y.el.contains(x.el)) continue;
        for (const r of x.caixas) {
          for (const s of y.caixas) {
            const largura = Math.min(r.right, s.right) - Math.max(r.left, s.left);
            const altura = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
            // 3 px de folga para o arredondamento das linhas de texto.
            if (largura > 3 && altura > 3) {
              achados.push({ a: rotulo(x.el), b: rotulo(y.el), largura: Math.round(largura), altura: Math.round(altura) });
            }
          }
        }
      }
    }
    return achados.slice(0, 12);
  });
}
