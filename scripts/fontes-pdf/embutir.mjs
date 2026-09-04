// lastro · transforma os cortes de `instanciar.py` em `src/lib/pdf/fontes.ts`.
//
//   node scripts/fontes-pdf/embutir.mjs <pasta-com-os-ttf>
//
// POR QUE BASE64 E NÃO ARQUIVO EM DISCO. O @react-pdf aceita caminho local
// (`fontkit.open`), o que seria mais leve — mas obriga o arquivo a ser
// rastreado pro bundle serverless da Vercel (`outputFileTracingIncludes`),
// e este projeto NÃO consegue rodar o app localmente (não existe
// `.env.local` nesta máquina, PROGRESS.md). Ou seja: uma falha de
// rastreamento só apareceria em produção, na peça-assinatura, exatamente o
// modo de falha que já mordeu este PDF antes (bug do veredito, PR #177 →
// #181, dois dias invisível). Data URI não depende de filesystem nem de
// config de bundler: se renderiza na bancada, renderiza em produção.
//
// Custo aceito: ~190 KB de base64 num módulo TS, carregado só pela rota do
// PDF. Diff feio uma vez; 500 em produção seria pior.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = process.argv[2] ?? "scripts/fontes-pdf/saida";

const CORTES = [
  ["FRAUNCES_VEREDITO", "Fraunces-Veredito.ttf"],
  ["BRICOLAGE_NORMAL", "Bricolage-Normal.ttf"],
  ["ARCHIVO_MEDIO", "Archivo-Medio.ttf"],
  ["ARCHIVO_FORTE", "Archivo-Forte.ttf"],
];

const faltando = CORTES.filter(([, a]) => !existsSync(join(DIR, a)));
if (faltando.length) {
  console.error(
    `faltam cortes em ${DIR}: ${faltando.map(([, a]) => a).join(", ")}\n` +
      `rode antes: python scripts/fontes-pdf/instanciar.py ${DIR}`,
  );
  process.exit(1);
}

const partes = CORTES.map(([nome, arquivo]) => {
  const b64 = readFileSync(join(DIR, arquivo)).toString("base64");
  return `/** ${arquivo} — ${Math.round(b64.length / 1024)} KB em base64. */\nexport const ${nome} =\n  "data:font/ttf;base64,${b64}";`;
});

const cabecalho = `// GERADO por scripts/fontes-pdf/embutir.mjs — NÃO EDITAR À MÃO.
// Cortes estáticos das três famílias variáveis do app, instanciados por
// scripts/fontes-pdf/instanciar.py. O porquê de tudo isto está nos dois
// scripts e em SDD.md §10.4. Para regenerar:
//
//   python scripts/fontes-pdf/instanciar.py scripts/fontes-pdf/saida
//   node   scripts/fontes-pdf/embutir.mjs   scripts/fontes-pdf/saida
//
// eslint-disable
`;

writeFileSync("src/lib/pdf/fontes.ts", `${cabecalho}\n${partes.join("\n\n")}\n`);
const kb = Math.round(partes.join("").length / 1024);
console.log(`src/lib/pdf/fontes.ts gerado — ${kb} KB, ${CORTES.length} cortes`);
