// lastro · bancada — gera os PDFs do parecer em disco, sem autenticação
// e sem banco. Existe porque a rota /api/parecer/[id]/pdf exige sessão
// real: o PDF era o único renderizador do projeto que ninguém conseguia
// olhar localmente, e foi exatamente por isso que a correção da PR #177
// (veredito gigante no fallback) passou reto por ele.
//
//   npx vitest run --config vitest.preview.config.mts
//
// Saída em qa/evidencias/pdf-parecer-{prosa,fallback}.pdf.
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import DocumentoParecer from "@/lib/pdf/documento-parecer";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { evidenciaReal, textoFallbackReal, textoProsaExemplo } from "./dados";

const BASE: ParecerSalvo = {
  id: "bancada",
  pergunta: 5,
  perguntaTexto: "O que mudar na próxima semana?",
  texto: textoProsaExemplo,
  avisoFalhaInterpretativa: false,
  falhaMotivo: null,
  evidencia: evidenciaReal,
  idioma: "pt-BR",
  criadoEm: "2026-09-02T14:36:38.477Z",
  status: "pronto",
  confirmado: true,
};

test("gera os PDFs do parecer (prosa e fallback)", async () => {
  mkdirSync("qa/evidencias", { recursive: true });

  const prosa = await renderToBuffer(<DocumentoParecer parecer={BASE} />);
  writeFileSync("qa/evidencias/pdf-parecer-prosa.pdf", prosa);

  const fallback = await renderToBuffer(
    <DocumentoParecer
      parecer={{ ...BASE, texto: textoFallbackReal, avisoFalhaInterpretativa: true }}
    />,
  );
  writeFileSync("qa/evidencias/pdf-parecer-fallback.pdf", fallback);
}, 60_000);
