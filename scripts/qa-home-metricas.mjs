// Executar com a bancada: npx vite --config vite.home.config.mts
// Somente dados sintéticos; nenhum endpoint ou conta de produção.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const erros = [];
page.on("pageerror", e => erros.push(e.message));
await mkdir("qa/evidencias", { recursive: true });
const url = "http://localhost:4332/home.html";
async function semOverflow() {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Overflow horizontal");
}
try {
  await page.goto(url);
  await page.getByRole("tab", { name: "Check-in", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.getByRole("tab", { name: "Check-in", exact: true }).getAttribute("aria-selected"), "true");
  assert.equal(await page.locator(".checkin-resumo__linha").count(), 4);
  await page.screenshot({ path: "qa/evidencias/home-checkin.png", fullPage: true });
  for (const nome of ["Volume", "Séries", "Grupos"]) {
    await page.getByRole("tab", { name: nome, exact: true }).click();
    await semOverflow();
    await page.screenshot({ path: `qa/evidencias/home-${nome === "Séries" ? "series" : nome.toLowerCase()}.png`, fullPage: true });
  }
  assert((await page.locator(".mapa-grupos__fora").innerText()).includes("58,8%"));
  await page.getByRole("button", { name: "Costas", exact: true }).click();
  assert((await page.locator(".mapa-grupos__canvas").innerText()).includes("58,8%"));
  await page.getByRole("button", { name: "Volume", exact: true }).click();
  assert((await page.locator(".mapa-grupos__canvas").innerText()).includes("69%"));
  // Exercícios sem carga continuam sendo grupos treinados.
  await page.goto(`${url}?semcarga`);
  await page.getByRole("tab", { name: "Grupos", exact: true }).click();
  await page.getByRole("button", { name: "Volume", exact: true }).click();
  assert.match(await page.getByRole("tabpanel").innerText(), /3\s*grupos/);
  // Datas e pontos alinhados em histórico curto.
  await page.goto(`${url}?sessoes=2`);
  await page.getByRole("tab", { name: "Volume", exact: true }).click();
  const alinhado = await page.evaluate(() => {
    const painel = document.querySelector('[role="tabpanel"]:not([hidden])');
    const pontos = [...painel.querySelectorAll("circle")];
    const datas = [...painel.querySelectorAll(".historico-metrica__datas span")];
    return pontos.every((p, i) => { const a=p.getBoundingClientRect(), b=datas[i].getBoundingClientRect(); return Math.abs(a.x+a.width/2-b.x-b.width/2)<2; });
  });
  assert(alinhado);
  await page.getByRole("button", { name: "Treino anterior" }).click();
  assert((await page.locator('[role="tabpanel"]:not([hidden]) .historico-metrica__selecao').innerText()).includes("4.800"));
  // Todos os grupos, idiomas e temas em celular estreito.
  await page.setViewportSize({ width: 320, height: 760 });
  for (const idioma of ["pt-BR", "en", "es"]) {
    for (const tema of ["branco-ouro", "ouro"]) {
      await page.goto(`${url}?todos&idioma=${idioma}&tema=${tema}`);
      await page.getByRole("tab").last().click();
      await page.evaluate(() => document.fonts.ready);
      await semOverflow();
      for (const indice of [0, 1]) {
        await page.locator(".mapa-grupos__vistas button").nth(indice).click();
        const colisoes = await page.locator(".mapa-grupos__rotulo").evaluateAll(els => {
          const rects=els.map(el=>el.getBoundingClientRect());
          return rects.some((a,i)=>rects.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
        });
        assert(!colisoes, `Rótulos colidem: ${idioma}/${tema}/${indice}`);
      }
      await page.screenshot({ path: `qa/evidencias/home-grupos-320-${idioma}-${tema}.png`, fullPage: true });
    }
  }
  // Estado vazio não inventa gráfico.
  await page.goto(`${url}?vazio`);
  await page.getByRole("tab", { name: "Volume", exact: true }).click();
  assert.equal(await page.locator(".historico-metrica__grafico").count(), 0);
  await page.goto(`${url}?sessoes=1`);
  await page.getByRole("tab", { name: "Volume", exact: true }).click();
  assert.equal(await page.locator('[role="tabpanel"]:not([hidden]) circle').count(), 1);
  assert(await page.getByRole("button", { name: "Treino anterior" }).isDisabled());
  assert(await page.getByRole("button", { name: "Próximo treino" }).isDisabled());
  // Teclado e edição do check-in continuam funcionais.
  await page.goto(url);
  await page.getByRole("tab", { name: "Check-in", exact: true }).focus();
  await page.keyboard.press("End");
  assert.equal(await page.getByRole("tab", { name: "Grupos", exact: true }).getAttribute("aria-selected"), "true");
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Agora não", exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.deepEqual(erros, []);
  console.log("PASSOU: 4 abas, mapa/%/sem carga, histórico curto, 320px/3 idiomas/2 temas, vazio, teclado e edição. Dados sintéticos; persistência remota não testada.");
} finally { await browser.close(); }
