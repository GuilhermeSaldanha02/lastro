import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function render() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1680, height: 1050 });

  const filePath = path.resolve("public/preview-temas.html");
  await page.goto("file://" + filePath, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Full screenshot
  await page.screenshot({ path: "public/comparacao_4_temas.png", fullPage: true });

  const artifactDir = "C:\\Users\\danin\\.gemini\\antigravity-ide\\brain\\cff517cc-fd13-483b-b420-f46b67397e30";
  fs.copyFileSync("public/comparacao_4_temas.png", path.join(artifactDir, "comparacao_4_temas.png"));

  // Also capture each phone separately
  const phones = await page.$$(".mockup-phone");
  const names = ["01_tema_ouro", "02_tema_ciano", "03_tema_carmesim", "04_tema_monolitico"];
  for (let i = 0; i < phones.length; i++) {
    const pPath = path.join(artifactDir, `${names[i]}.png`);
    await phones[i].screenshot({ path: pPath });
  }

  console.log("Screenshots captured successfully!");
  await browser.close();
}

render();
