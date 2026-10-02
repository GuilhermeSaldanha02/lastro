// Bancada isolada: componentes reais, dados sintéticos e nenhum acesso ao banco.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const src = fileURLToPath(new URL("./src", import.meta.url));
const stubs = fileURLToPath(new URL("./scripts/preview/stubs", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./scripts/preview", import.meta.url)),
  plugins: [react()],
  server: { port: 4332, strictPort: true },
  resolve: { alias: [
    { find: /^@\/lib\/offline\/checkin$/, replacement: `${stubs}/checkin-home.ts` },
    { find: /^next\/navigation$/, replacement: `${stubs}/navigation.ts` },
    { find: /^next\/link$/, replacement: `${stubs}/link-home.tsx` },
    { find: /^@\//, replacement: `${src}/` },
  ] },
});
