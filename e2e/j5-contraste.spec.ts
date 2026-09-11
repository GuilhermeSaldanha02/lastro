// lastro · contraste WCAG medido no app RENDERIZADO, tema a tema.
//
// POR QUE ESTE ARQUIVO EXISTE, e por que ele não é opcional.
//
// O `DESIGN.md` §4.2 manda medir contraste no navegador, não estimar
// contra token. Em 2026-09-10 a tarefa T3b foi feita à mão e três
// medições saíram erradas antes de a certa aparecer:
//
//   1. Token contra token acusou acentos reprovando sobre superfícies em
//      que eles NUNCA são desenhados (o esmeralda fica sobre
//      `--lastro-esmeralda-fundo`, não sobre `--lastro-sup-3`).
//   2. Trocar `data-tema` por JS de fora do app acusou 31 falhas — mas o
//      app não re-tematiza assim, e a varredura comparava tokens novos
//      com fundos antigos.
//   3. O número herdado do `DESIGN.md` ("33 elementos, 1,79:1") antecede
//      uma correção já feita em 21/ago.
//
// A conclusão que virou este arquivo: medir contraste é fácil de fazer
// errado, e o erro é SILENCIOSO — sai um número plausível. A única
// medição que vale é a do pixel renderizado, no tema aplicado pelo
// PRÓPRIO app, com as camadas translúcidas compostas. É isso aqui.
//
// Troca de tema pela INTERFACE (clicando o card em /ajustes/temas), não
// por atributo — foi exatamente o atalho que produziu o erro 2.
//
// Usa usuário descartável: o tema mora no `localStorage`, então rodar
// isto na conta do dono trocaria o tema do aparelho dele.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito, nomear } from "./helpers/vinculo";
import { semearGrupoAbandonado } from "./helpers/semear-abandono";

let usuario: UsuarioDescartavel;
let aluno: UsuarioDescartavel;

/**
 * Mesma montagem da `j4`, pela mesma razão: sem vínculo aceito a
 * `/personal` redireciona, e medir contraste na tela errada devolve um
 * número plausível — exatamente o modo de falha que este arquivo existe
 * para evitar.
 *
 * O alerta semeado importa MAIS aqui do que na varredura: o card da fila é
 * onde o módulo usa cor com significado (a faixa do abandono, o ouro da
 * ação, os cinzas de metadado). Medir a fila vazia seria medir uma moldura.
 */
test.beforeAll(async ({ browser }) => {
  usuario = await criarUsuarioDescartavel("contraste");
  aluno = await criarUsuarioDescartavel("contraste-aluno");

  const comoPersonal = await clienteAutenticado(usuario);
  await nomear(comoPersonal, usuario.id, "Marina Alencar");

  const comoAluno = await clienteAutenticado(aluno);
  await nomear(comoAluno, aluno.id, "Ana Ribeiro");
  await semearGrupoAbandonado(comoAluno, aluno.id);

  const { contextoPersonal, contextoAluno } = await criarVinculoAceito({
    browser,
    personal: usuario,
    aluno,
  });
  await contextoPersonal.close();
  await contextoAluno.close();
});

test.afterAll(async () => {
  if (usuario) await apagarUsuarioDescartavel(usuario);
  if (aluno) await apagarUsuarioDescartavel(aluno);
});

/** Os sete temas de `seletor-temas.tsx`, pelo rótulo que aparece na tela. */
const TEMAS = [
  { id: "ouro", rotulo: "Obsidian Ouro" },
  { id: "branco-ouro", rotulo: "Marfim & Ouro Imperial" },
  { id: "areia", rotulo: "Duna Areia & Âmbar" },
  { id: "clean", rotulo: "Clean Monolith" },
  { id: "petroleo", rotulo: "Slate Petróleo & Ouro Antigo" },
  { id: "moka", rotulo: "Café Moka & Caramelo" },
  { id: "oliva", rotulo: "Oliva Tático" },
] as const;

/**
 * Telas com densidade de texto e cor suficiente para valer a medição.
 *
 * `/ajustes/personal` entrou com o módulo Personal (PRD §11): ela é quase
 * só texto corrido em card, que é o formato onde contraste fraco passa
 * despercebido. `/personal` entrou depois, quando o `beforeAll` passou a
 * montar um vínculo de verdade — é a tela com mais cor com SIGNIFICADO do
 * app, e era a única que faltava (PE-04).
 */
const ROTAS = [
  "/",
  "/treino",
  "/catalogo",
  "/analise",
  "/ajustes",
  "/ajustes/personal",
  "/personal",
];

type Falha = {
  tema: string;
  rota: string;
  texto: string;
  classe: string;
  cor: string;
  fundo: string;
  px: number;
  peso: number;
  razao: number;
  piso: number;
};

/**
 * Roda dentro da página: para cada elemento com texto próprio, resolve o
 * fundo EFETIVO (subindo a árvore e compondo camadas translúcidas) e
 * aplica a fórmula de contraste da WCAG 2.x.
 *
 * Elemento cujo fundo passa por gradiente/imagem é DEVOLVIDO COMO NÃO
 * MEDIDO, não chutado — compor cor sobre gradiente exigiria amostrar
 * pixel, e inventar um número aqui seria repetir o erro que este arquivo
 * existe para não repetir.
 */
async function medirPagina(page: Page) {
  return page.evaluate(() => {
    const parse = (s: string) => {
      const m = String(s).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(",").map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    type Cor = { r: number; g: number; b: number; a: number };
    const sobre = (f: Cor, t: Cor): Cor => ({
      r: f.r * f.a + t.r * (1 - f.a),
      g: f.g * f.a + t.g * (1 - f.a),
      b: f.b * f.a + t.b * (1 - f.a),
      a: 1,
    });

    const corpo = parse(getComputedStyle(document.body).backgroundColor);
    const base: Cor = corpo && corpo.a === 1 ? corpo : { r: 255, g: 255, b: 255, a: 1 };

    const fundoDe = (el: Element): { fundo?: Cor; indeterminado?: boolean } => {
      const pilha: Cor[] = [];
      let n: Element | null = el;
      while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== "none") return { indeterminado: true };
        const bg = parse(cs.backgroundColor);
        if (bg && bg.a > 0) {
          pilha.push(bg);
          if (bg.a === 1) break;
        }
        n = n.parentElement;
      }
      let acc = base;
      for (let i = pilha.length - 1; i >= 0; i--) acc = sobre(pilha[i], acc);
      return { fundo: acc };
    };

    const lum = (c: Cor) => {
      const f = (v: number) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const razao = (a: Cor, b: Cor) => {
      const la = lum(a), lb = lum(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };

    const falhas: Omit<Falha, "tema" | "rota">[] = [];
    let naoMedidos = 0;

    document.querySelectorAll("*").forEach((el) => {
      const texto = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent!.trim())
        .join(" ");
      if (!texto) return;

      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return;
      if (!el.getClientRects().length) return;

      const cor = parse(cs.color);
      if (!cor) return;

      const r0 = fundoDe(el);
      if (r0.indeterminado || !r0.fundo) {
        naoMedidos += 1;
        return;
      }
      const frente = cor.a < 1 ? sobre(cor, r0.fundo) : cor;
      const r = razao(frente, r0.fundo);

      const px = parseFloat(cs.fontSize);
      const peso = parseInt(cs.fontWeight) || 400;
      // WCAG AA: texto grande (>=24px, ou >=18.66px em negrito) tem piso 3.
      const piso = px >= 24 || (px >= 18.66 && peso >= 700) ? 3 : 4.5;

      if (r < piso) {
        falhas.push({
          texto: texto.slice(0, 40),
          classe: (el.className || el.tagName).toString().slice(0, 44),
          cor: cs.color,
          fundo: `rgb(${Math.round(r0.fundo.r)},${Math.round(r0.fundo.g)},${Math.round(r0.fundo.b)})`,
          px,
          peso,
          razao: Number(r.toFixed(2)),
          piso,
        });
      }
    });

    return { falhas, naoMedidos };
  });
}

test("nenhum texto reprova AA, em nenhum dos sete temas", async ({ page }) => {
  test.setTimeout(300_000);

  await entrarComoUsuario(page, usuario);

  // Um treino com série, para as telas não serem julgadas só no estado
  // vazio — texto de dado é onde os acentos de cor aparecem.
  await page.goto("/treino");
  await page.getByRole("button", { name: /iniciar treino/i }).click();
  await page.waitForURL(/\/treino\/[^/]+$/, { timeout: 20_000 });

  const falhas: Falha[] = [];
  let naoMedidosTotal = 0;

  for (const tema of TEMAS) {
    await page.goto("/ajustes/temas");
    await page.getByRole("button", { name: new RegExp(tema.rotulo, "i") }).first().click();

    // Confirma que o app APLICOU o tema antes de medir. Sem esta espera a
    // medição pode pegar o tema anterior e o número sai plausível e errado
    // — o modo de falha que este arquivo existe para evitar.
    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("lastro_tema")),
      )
      .toBe(tema.id);

    for (const rota of ROTAS) {
      await page.goto(rota, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      const { falhas: f, naoMedidos } = await medirPagina(page);
      naoMedidosTotal += naoMedidos;
      for (const x of f) falhas.push({ ...x, tema: tema.id, rota });
    }
  }

  if (falhas.length > 0) {
    console.log("\n=== CONTRASTE ABAIXO DO PISO AA ===");
    for (const f of falhas.sort((a, b) => a.razao - b.razao)) {
      console.log(
        `[${f.tema}] ${f.rota} · ${f.razao}:1 (piso ${f.piso})\n` +
          `    "${f.texto}" · ${f.classe}\n` +
          `    ${f.cor} sobre ${f.fundo} · ${f.px}px/${f.peso}`,
      );
    }
    console.log(`=== total: ${falhas.length} ===\n`);
  }
  console.log(`(elementos sobre gradiente, não medíveis por composição: ${naoMedidosTotal})`);

  expect(
    falhas,
    `${falhas.length} texto(s) abaixo do piso AA — ver lista acima`,
  ).toEqual([]);
});
