// lastro · bancada — prova de largura da coluna de VOLUME depois do
// agrupamento de milhar (2026-09-10).
//
// POR QUE ESTE ARQUIVO EXISTE. `formatarPeso` passou a agrupar milhar, e
// o separador torna o número mais LARGO — um caractere a cada três
// dígitos. A coluna de volume do PDF tem largura fixa (`L_VOLUME = 78`)
// e já foi quebrada antes nesta mesma tabela, ao espremer `formatarDelta`
// numa coluna de 54pt. Estimar largura de fonte é chute; renderizar e
// olhar é medição.
//
//   npx vitest run --config vitest.preview.config.mts scripts/preview/pdf.milhar.tsx
//
// Saída em qa/evidencias/pdf-milhar.pdf — abrir e conferir se algum
// volume encosta no nome do exercício ou sai da margem.
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import DocumentoParecer from "@/lib/pdf/documento-parecer";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { evidenciaReal, textoProsaExemplo } from "./dados";

/**
 * Volumes crescentes até uma ordem de grandeza que o app não deve
 * alcançar. 999.999 kg são 1.000 toneladas numa semana — se a coluna
 * aguenta isso, aguenta qualquer treino real com folga larga.
 */
const VOLUMES = [980, 7280, 15685, 128400, 999999];

test("gera PDF com volumes grandes, pra conferir a largura da coluna", async () => {
  mkdirSync("qa/evidencias", { recursive: true });

  const blocos = evidenciaReal.blocos.map((bloco, i) => ({
    ...bloco,
    volume: VOLUMES[i % VOLUMES.length],
  }));

  const parecer: ParecerSalvo = {
    id: "bancada-milhar",
    pergunta: 5,
    perguntaTexto: "O que mudar na próxima semana?",
    texto: textoProsaExemplo,
    avisoFalhaInterpretativa: false,
    falhaMotivo: null,
    evidencia: { ...evidenciaReal, blocos },
    idioma: "pt-BR",
    criadoEm: "2026-09-10T12:00:00.000Z",
    status: "pronto",
    confirmado: true,
  };

  writeFileSync(
    "qa/evidencias/pdf-milhar.pdf",
    await renderToBuffer(<DocumentoParecer parecer={parecer} />),
  );
}, 60_000);
