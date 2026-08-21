import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/danin/.gemini/antigravity-ide/brain/6c6e6dee-9f5d-410e-8054-72ad0b5bc87b";

async function snap() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    ...devices["iPhone 14"],
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
  });

  await page.goto("http://localhost:3000/design-concept-pro.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const shotPath = path.join(ARTIFACT_DIR, "live_concept_pro_rendered.png");
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log("Screenshot do protótipo gerado em:", shotPath);

  await browser.close();
}

snap().catch(console.error);
