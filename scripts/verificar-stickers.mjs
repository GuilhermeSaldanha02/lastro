/** Bancada local sintética: não importa Supabase nem usa contas/ambiente de produção. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bancada = path.join(raiz, ".superpowers", "verificar-stickers");
const evidencias = path.join(raiz, "qa", "evidencias", "STICKERS-01");
await fs.mkdir(bancada, { recursive: true });
await fs.mkdir(evidencias, { recursive: true });
await fs.writeFile(path.join(bancada, "index.html"), '<html lang="pt-BR" data-tema="ouro"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bancada sintética stickers</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await fs.writeFile(path.join(bancada, "navigation.ts"), 'export const useRouter = () => ({ push() {}, replace() {} });');
await fs.writeFile(path.join(bancada, "main.tsx"), `
import React from "react";
import { createRoot } from "react-dom/client";
import Relatorio from "@/components/relatorio-pos-treino";
import { calcularMetricasSessao, type SerieParaMetricas } from "@/lib/dados/metricas-treino";
import { gerarSvgSticker } from "@/lib/stickers/modelos";
import { carregarLogoSticker, lerTemaSticker } from "@/lib/stickers/imagem";
import { BRICOLAGE_NORMAL, ARCHIVO_FORTE, FRAUNCES_VEREDITO } from "@/lib/pdf/fontes";
import "@/app/globals.css";
// Cortes locais das mesmas famílias do app; nenhuma requisição ao Google Fonts.
await Promise.all([["Bricolage", BRICOLAGE_NORMAL], ["Archivo", ARCHIVO_FORTE], ["Fraunces", FRAUNCES_VEREDITO]].map(async ([nome, url]) => {
  const fonte = new FontFace(nome, 'url("' + url + '")');
  document.fonts.add(await fonte.load());
}));
document.documentElement.style.setProperty("--fonte-bricolage", "Bricolage");
document.documentElement.style.setProperty("--fonte-archivo", "Archivo");
document.documentElement.style.setProperty("--fonte-fraunces", "Fraunces");
const grupos = new URLSearchParams(location.search).has("longo")
  ? ["peito", "ombro", "biceps", "triceps", "antebraco", "quadriceps", "posterior_coxa", "panturrilha", "gluteo", "abdomen", "grupo_futuro_com_nome_extenso"]
  : ["biceps", "triceps", "antebraco", "posterior_coxa"];
const series: SerieParaMetricas[] = grupos.map((grupo, i) => ({id: String(i), exercicioId: String(i), exercicioNome: "Exercício SINTÉTICO " + i, reps: 8, peso: 20, tipo: "valendo", exercicioGrupoMuscular: grupo}));
series.push({id: "a", exercicioId: "a", exercicioNome: "Aquecimento SINTÉTICO", reps: 10, peso: 5, tipo: "aquecimento", exercicioGrupoMuscular: "peito"});
const metricas = calcularMetricasSessao(series, 45 * 60);
(window as Window & { svgSintetico: () => Promise<string> }).svgSintetico = async () => gerarSvgSticker("anatomico", metricas, "pt-BR", await carregarLogoSticker(), lerTemaSticker()).svg;
createRoot(document.getElementById("root")!).render(<Relatorio metricas={metricas} idioma="pt-BR" onFechar={() => {}} />);
`);

const servidor = await createServer({
  configFile: false, root: bancada, publicDir: path.join(raiz, "public"), plugins: [react()],
  resolve: { alias: { "@": path.join(raiz, "src"), "next/navigation": path.join(bancada, "navigation.ts") } },
  server: { host: "127.0.0.1", port: 4187, strictPort: true, hmr: false, fs: { allow: [raiz] } },
});
const erros = [];
const consoleLog = ["ALEGADO — bancada sintética local, viewport 390 x 844; sem Supabase. Famílias UI com cortes estáticos locais do PDF; arte exportada usa tokens reais."];
const rede = [];
let navegador;
try {
  await servidor.listen();
  navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
  await contexto.route("**/*", async (rota) => {
    const url = new URL(rota.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname) || ["blob:", "data:"].includes(url.protocol)) return rota.continue();
    erros.push(`Rede externa bloqueada: ${url.origin}`);
    return rota.abort();
  });
  const pagina = await contexto.newPage();
  pagina.on("console", (evento) => { consoleLog.push(`${evento.type()}: ${evento.text()}`); if (evento.type() === "error") erros.push(evento.text()); });
  pagina.on("pageerror", (erro) => erros.push(erro.message));
  pagina.on("response", (resposta) => rede.push(`${resposta.status()} ${resposta.url()}`));
  pagina.on("requestfailed", (req) => erros.push(`Requisição falhou: ${req.url()} ${req.failure()?.errorText}`));
  const url = "http://127.0.0.1:4187";
  await pagina.goto(url);
  const botoes = pagina.locator(".pos-treino-modelo");
  const previa = pagina.locator(".pos-treino-previa-imagem");
  await botoes.last().waitFor();
  await pagina.waitForFunction(() => [...document.querySelectorAll(".pos-treino-modelo")].length === 9 && [...document.querySelectorAll(".pos-treino-modelo")].every((el) => !el.disabled));
  assert.equal(await pagina.locator("vite-error-overlay").count(), 0);
  assert.equal(await pagina.getByRole("dialog").count(), 1);
  const nomes = await botoes.allTextContents();
  for (const nome of nomes) {
    const botao = pagina.getByRole("button", { name: nome.trim(), exact: true });
    await botao.click();
    assert.equal(await botao.getAttribute("aria-pressed"), "true");
    assert.equal(await pagina.locator('.pos-treino-modelo[aria-pressed="true"]').count(), 1);
    await pagina.waitForFunction(() => { const img = document.querySelector(".pos-treino-previa-imagem"); return img?.complete && img.naturalWidth > 0; });
    assert.equal(await previa.getAttribute("src"), await botao.locator("img").getAttribute("src"));
    const dados = await previa.evaluate(async (img) => {
      const canvas = document.createElement("canvas"); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0);
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      const bytes = new Uint8Array(await (await fetch(img.src)).arrayBuffer());
      let binario = ""; for (const byte of bytes) binario += String.fromCharCode(byte);
      return { largura: img.naturalWidth, altura: img.naturalHeight, alpha: pixel[3], base64: btoa(binario) };
    });
    assert.equal(dados.largura, 1080); assert.ok(dados.altura > 0); assert.equal(dados.alpha, 0);
    const downloadPromise = pagina.waitForEvent("download");
    await pagina.getByRole("button", { name: "Salvar", exact: true }).click();
    const download = await downloadPromise;
    assert.deepEqual(await fs.readFile(await download.path()), Buffer.from(dados.base64, "base64"));
    consoleLog.push(`PASSOU ${nome.trim()}: PNG ${dados.largura} x ${dados.altura}; alpha canto 0; miniatura/prévia/arquivo idênticos.`);
  }
  const svg = await pagina.evaluate(() => window.svgSintetico());
  const anatomia = await pagina.evaluate((svg) => {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    return { vistas: [...doc.querySelectorAll("[data-vista]")].map((e) => e.getAttribute("data-vista")), ativos: [...doc.querySelectorAll('[data-ativo="true"]')].map((e) => e.getAttribute("data-grupo")) };
  }, svg);
  assert.deepEqual(anatomia.vistas, ["frente", "costas"]);
  assert.deepEqual([...new Set(anatomia.ativos)].sort(), ["antebraco", "biceps", "posterior_coxa", "triceps"]);
  consoleLog.push("PASSOU anatomia: quatro grupos reais ativos; peito aquecimento inativo; frente/costas presentes.");
  await pagina.reload();
  await previa.waitFor();
  assert.equal(await pagina.getByRole("button", { name: "Anatômico", exact: true }).getAttribute("aria-pressed"), "true");
  consoleLog.push("PASSOU persistência após recarregar: Anatômico.");
  await pagina.waitForFunction(() => [...document.querySelectorAll(".pos-treino-modelo")].every((el) => !el.disabled));
  const minimalista = pagina.getByRole("button", { name: "Minimalista", exact: true });
  await minimalista.focus();
  assert.equal(await minimalista.evaluate((el) => el === document.activeElement), true);
  await pagina.keyboard.press("Enter");
  assert.equal(await minimalista.getAttribute("aria-pressed"), "true");
  consoleLog.push("PASSOU foco de teclado e seleção por Enter.");
  for (const largura of [390, 320]) {
    await pagina.setViewportSize({ width: largura, height: 844 });
    await pagina.goto(`${url}/?longo=1`);
    await previa.waitFor();
    const geometria = await pagina.evaluate(() => {
      const overlay = document.querySelector(".pos-treino-overlay");
      const container = document.querySelector(".pos-treino-share-container");
      const img = document.querySelector(".pos-treino-previa-imagem");
      return { viewport: innerWidth, pagina: document.documentElement.scrollWidth, overlay: overlay.scrollWidth, container: container.getBoundingClientRect().width, imagem: img.getBoundingClientRect().width };
    });
    assert.ok(geometria.pagina <= largura); assert.ok(geometria.overlay <= largura); assert.ok(geometria.imagem <= geometria.container);
    consoleLog.push(`PASSOU lista longa/overflow ${largura}px: ${JSON.stringify(geometria)}`);
  }
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.goto(url);
  await previa.waitFor();
  await pagina.getByRole("button", { name: "Anatômico", exact: true }).click();
  await pagina.screenshot({ path: path.join(evidencias, "print.png"), fullPage: true });
  await pagina.evaluate(() => { document.documentElement.dataset.tema = "branco-ouro"; });
  assert.equal(await pagina.getByRole("button", { name: "Anatômico", exact: true }).getAttribute("aria-pressed"), "true");
  assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const contrastes = await pagina.evaluate(() => {
    const rgb = (cor) => cor.match(/[\d.]+/g).map(Number);
    const fundoBase = rgb(getComputedStyle(document.body).backgroundColor);
    const overlay = rgb(getComputedStyle(document.querySelector(".pos-treino-overlay")).backgroundColor);
    const alpha = overlay[3] ?? 1;
    const fundo = overlay.slice(0, 3).map((valor, i) => valor * alpha + fundoBase[i] * (1 - alpha));
    const luminancia = (cor) => cor.slice(0, 3).map((valor) => { const canal = valor / 255; return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4; }).reduce((total, valor, i) => total + valor * [0.2126, 0.7152, 0.0722][i], 0);
    const textos = [".pos-treino-share-titulo", ".pos-treino-btn-fechar-topo", ".pos-treino-sticker-ajuda"].map((seletor) => {
      const cor = rgb(getComputedStyle(document.querySelector(seletor)).color);
      const primeiro = luminancia(cor); const segundo = luminancia(fundo);
      return { seletor, minimo: 4.5, contraste: (Math.max(primeiro, segundo) + 0.05) / (Math.min(primeiro, segundo) + 0.05) };
    });
    const icones = [...document.querySelectorAll(".pos-treino-icone-circulo")].map((circulo, indice) => {
      const primeiro = luminancia(rgb(getComputedStyle(circulo.querySelector("svg")).color));
      const segundo = luminancia(rgb(getComputedStyle(circulo).backgroundColor));
      return { seletor: `icone-${indice}`, minimo: 3, contraste: (Math.max(primeiro, segundo) + 0.05) / (Math.min(primeiro, segundo) + 0.05) };
    });
    return [...textos, ...icones];
  });
  for (const item of contrastes) assert.ok(item.contraste >= item.minimo, `Contraste baixo no tema claro: ${JSON.stringify(item)}`);
  consoleLog.push(`PASSOU contraste tema claro: ${JSON.stringify(contrastes)}`);
  await pagina.screenshot({ path: path.join(evidencias, "print-claro.png"), fullPage: true });
  consoleLog.push("PASSOU tema branco-ouro: seleção e prévia presentes, sem overflow; print-claro.png.");

  // A marca falha de propósito nesta página isolada; não é falha de rede inesperada.
  const paginaFalha = await contexto.newPage();
  const errosFalha = [];
  paginaFalha.on("pageerror", (erro) => errosFalha.push(erro.message));
  paginaFalha.on("console", (evento) => consoleLog.push(`retry/${evento.type()}: ${evento.text()}`));
  let logoFalhou = false;
  await paginaFalha.route("**/logo-lastro.png", async (rota) => {
    if (!logoFalhou) {
      logoFalhou = true;
      rede.push("404 SIMULADO /logo-lastro.png (teste de retry, página isolada)");
      await rota.fulfill({ status: 404, body: "Logo ausente — teste sintético" });
    } else await rota.continue();
  });
  await paginaFalha.goto(url);
  await paginaFalha.getByRole("button", { name: "Tentar novamente", exact: true }).waitFor();
  assert.equal(await paginaFalha.locator(".pos-treino-modelo:disabled").count(), 9);
  assert.equal(await paginaFalha.locator(".pos-treino-btn-acao-share:disabled").count(), 3);
  await paginaFalha.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await paginaFalha.locator(".pos-treino-previa-imagem").waitFor();
  assert.equal(await paginaFalha.locator(".pos-treino-btn-acao-share:disabled").count(), 0);
  assert.deepEqual(errosFalha, []);
  consoleLog.push("PASSOU logo 404 simulado: ações/modelos bloqueados, mensagem e retry recuperam prévia e ações; sem exceção de página.");
  await paginaFalha.close();

  const paginaSemStorage = await contexto.newPage();
  const errosStorage = [];
  paginaSemStorage.on("pageerror", (erro) => errosStorage.push(erro.message));
  await paginaSemStorage.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Armazenamento bloqueado — teste", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Armazenamento bloqueado — teste", "SecurityError"); };
  });
  await paginaSemStorage.goto(url);
  await paginaSemStorage.locator(".pos-treino-previa-imagem").waitFor();
  await paginaSemStorage.getByRole("button", { name: "Bilhete", exact: true }).click();
  assert.equal(await paginaSemStorage.getByRole("button", { name: "Bilhete", exact: true }).getAttribute("aria-pressed"), "true");
  assert.deepEqual(errosStorage, []);
  consoleLog.push("PASSOU localStorage bloqueado: prévia e seleção funcionam; sem exceção de página.");
  await paginaSemStorage.close();
  assert.deepEqual(erros, []);
  consoleLog.push("PASSOU: zero erros inesperados de console/página/rede e zero acesso externo; logo 404 simulado registrado à parte.");
  console.log(consoleLog.join("\n"));
} catch (erro) {
  consoleLog.push(`FALHOU: ${erro.stack}`);
  console.error(erro);
  process.exitCode = 1;
} finally {
  consoleLog.push(...erros.map((erro) => `ERRO: ${erro}`));
  await fs.writeFile(path.join(evidencias, "console.txt"), consoleLog.join("\n"));
  await fs.writeFile(path.join(evidencias, "rede.txt"), ["ALEGADO — todas as requisições limitadas ao servidor local.", ...rede].join("\n"));
  await navegador?.close();
  await servidor.close();
  // Remove somente os três arquivos que esta bancada acabou de gerar.
  for (const nome of ["index.html", "main.tsx", "navigation.ts"]) {
    const arquivo = path.resolve(bancada, nome);
    assert.equal(path.dirname(arquivo), bancada);
    await fs.unlink(arquivo).catch((erro) => { if (erro.code !== "ENOENT") throw erro; });
  }
}
