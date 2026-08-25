import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/d20afdf2-f74e-45f6-bd30-1bf6dfc11d51";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
  });

  const filePath = "file:///" + path.resolve("public/preview-conceito-3d-player.html").replace(/\\/g, "/");
  await page.goto(filePath, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const outPath = path.resolve("docs/screenshots/player_exercicio/conceito_3d_player.png");
  await page.screenshot({ path: outPath, fullPage: false });

  const artifactPath = path.join(ARTIFACT_DIR, "screenshots/conceito_3d_player.png");
  fs.copyFileSync(outPath, artifactPath);

  console.log("📸 Screenshot conceitual salva em:", outPath);
  await browser.close();
}

main().catch(console.error);
