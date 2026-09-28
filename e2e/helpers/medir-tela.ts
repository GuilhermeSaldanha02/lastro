// Medição da UX-03: mede e grava, não reprova. Cada tela vira `metricas.json`
// + capturas de viewport (topo e fim) na pasta do teste em `test-results/`.
import fs from "node:fs";
import { test, type Page } from "@playwright/test";

export type Metricas = {
  rota: string;
  idioma: string;
  tema: string;
  url: string;
  vazamentoHorizontal: number;
  alvosPequenos: { tag: string; texto: string; w: number; h: number }[];
  textoCortado: { tag: string; texto: string; visivel: number; total: number }[];
  escondidoPelaNav: { ultimoBottom: number; navTop: number; escondido: number } | null;
  alturaDocumento: number;
};

export async function medir(page: Page, rota: string, idioma: string, tema: string): Promise<Metricas> {
  await page.waitForLoadState("networkidle").catch(() => {});
  return page.evaluate(
    ({ rota, idioma, tema }) => {
      const visivel = (el: Element) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
      };
      const alvos = [...document.querySelectorAll("a, button, input, select, textarea, [role=button], [role=radio], [role=tab]")]
        .filter((el) => visivel(el) && getComputedStyle(el).display !== "inline")
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), texto: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((a) => a.h < 44 || a.w < 44);

      const cortados = [...document.querySelectorAll("body *")]
        .filter((el) => visivel(el) && el.children.length === 0 && (el.textContent ?? "").trim().length > 0)
        .filter((el) => {
          const s = getComputedStyle(el);
          return (s.overflow === "hidden" || s.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 1;
        })
        .map((el) => ({ tag: el.tagName.toLowerCase(), texto: (el.textContent ?? "").trim().slice(0, 50), visivel: el.clientWidth, total: el.scrollWidth }));

      // Fim da página: o último elemento de conteúdo passa por baixo da barra inferior?
      window.scrollTo(0, document.documentElement.scrollHeight);
      const nav = document.querySelector(".nav");
      const corpo = document.querySelector(".corpo");
      let escondido: { ultimoBottom: number; navTop: number; escondido: number } | null = null;
      if (nav && corpo) {
        const filhos = [...corpo.querySelectorAll("*")].filter((el) => visivel(el) && el.children.length === 0);
        const ultimoBottom = Math.max(0, ...filhos.map((el) => el.getBoundingClientRect().bottom));
        const navTop = nav.getBoundingClientRect().top;
        escondido = { ultimoBottom: Math.round(ultimoBottom), navTop: Math.round(navTop), escondido: Math.round(Math.max(0, ultimoBottom - navTop)) };
      }

      return {
        rota,
        idioma,
        tema,
        url: location.pathname,
        vazamentoHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        alvosPequenos: alvos.slice(0, 12),
        textoCortado: cortados.slice(0, 12),
        escondidoPelaNav: escondido,
        alturaDocumento: document.documentElement.scrollHeight,
      };
    },
    { rota, idioma, tema },
  );
}

export async function registrarTela(page: Page, rota: string, idioma: string, tema = "ouro"): Promise<Metricas> {
  const id = `${rota.replace(/[^a-z0-9]+/gi, "_") || "raiz"}__${idioma}__${tema}`;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: test.info().outputPath(`${id}__topo.png`) }).catch(() => {});
  const m = await medir(page, rota, idioma, tema);
  await page.screenshot({ path: test.info().outputPath(`${id}__fim.png`) }).catch(() => {});
  fs.writeFileSync(test.info().outputPath(`${id}__metricas.json`), JSON.stringify(m, null, 2));
  return m;
}
