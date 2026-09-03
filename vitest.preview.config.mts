// lastro · config da BANCADA em modo node (scripts/preview/*.render.tsx)
// — hoje só o gerador de PDF, que precisa rodar fora do navegador. A
// bancada de tela é a outra: vite.preview.config.mts.
//
//   npx vitest run --config vitest.preview.config.mts
//
// Separada de vitest.config.ts de propósito: `npm run test` é a suíte do
// produto e não deve gerar arquivo em qa/evidencias/ como efeito colateral.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["scripts/preview/*.render.tsx"],
  },
});
