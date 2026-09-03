// lastro · config da BANCADA VISUAL (scripts/preview). Fora do build do
// app: o Next nunca lê este arquivo. Ver scripts/preview/main.tsx.
//   npx vite --config vite.preview.config.mts
// Extensao .mts (nao .ts) porque o package.json nao tem "type": "module"
// e o carregador nativo do Vite avisa em config CommonJS com sintaxe ESM.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = fileURLToPath(new URL("./src", import.meta.url));
const stubs = fileURLToPath(new URL("./scripts/preview/stubs", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL("./scripts/preview", import.meta.url)),
  plugins: [react()],
  server: { port: 4321 },
  resolve: {
    alias: [
      // Server Actions e roteador do Next não existem fora do Next.
      { find: /^@\/lib\/dados\/parecer$/, replacement: `${stubs}/parecer.ts` },
      { find: /^next\/navigation$/, replacement: `${stubs}/navigation.ts` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
});
