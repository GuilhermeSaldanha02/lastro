import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // `proxy.ts` (e qualquer arquivo futuro testado que importe via
    // "@/...") depende do alias do tsconfig — next.js resolve isso em
    // build, mas o vitest precisa do mapeamento explícito.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/analise/**/*.ts"],
      exclude: ["src/lib/analise/**/*.test.ts"],
    },
  },
});
