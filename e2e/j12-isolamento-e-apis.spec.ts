// lastro · ISOLAMENTO ENTRE CONTAS e as portas HTTP — QA independente,
// 2026-09-13.
//
// A PE-01 provou a RLS entre personal e aluno. Faltava a direção que mais
// barato quebra: DUAS CONTAS SEM RELAÇÃO NENHUMA, nas tabelas fora do
// módulo Personal, e as rotas que dependem só da RLS (`buscarParecer` não
// filtra dono). Também as APIs que a j9 não toca: exportar, progressão e
// PDF, e o 409/429 da análise e do coach.
//
// O instrumento é o do atacante: o JWT da própria conta, chamando a API
// pública do Supabase ou o route handler do app.
//
// CUSTO DE COTA DA GEMINI: zero. O CI não passa `GEMINI_API_KEY` ao e2e;
// os casos de concorrência medem só linha de banco e status HTTP.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito, nomear } from "./helpers/vinculo";
import { semearHistoricoParaAnalise } from "./helpers/semear-historico";
import {
  anotarAchado,
  apagarSemErro,
  contarLinhas,
  dataHaDias,
  excluirContaPelaTela,
  primeiroExercicio,
  print,
  semearTreino,
  seriesDoTreino,
} from "./helpers/caminho-triste";

let aluna: UsuarioDescartavel;
let desconhecida: UsuarioDescartavel;
let personal: UsuarioDescartavel;
let comoAluna: SupabaseClient;
let comoDesconhecida: SupabaseClient;
let comoPersonal: SupabaseClient;

const PESO_DA_ALUNA = 61.37;
const TEXTO_DO_PARECER = "Parecer semeado da aluna: não pode aparecer para nenhuma outra conta.";
const NOME_DA_ALUNA = "Aluna Isolada";
const semeado = { treinoId: "", serieId: "", modeloId: "", parecerId: "", exercicioId: "" };

/** PNG 1x1 transparente. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  aluna = await criarUsuarioDescartavel("j12-aluna");
  desconhecida = await criarUsuarioDescartavel("j12-desconhecida");
  personal = await criarUsuarioDescartavel("j12-personal", "personal");
  comoAluna = await clienteAutenticado(aluna);
  comoDesconhecida = await clienteAutenticado(desconhecida);
  comoPersonal = await clienteAutenticado(personal);

  await nomear(comoAluna, aluna.id, NOME_DA_ALUNA);
  const exercicio = await primeiroExercicio(comoAluna);
  semeado.exercicioId = exercicio.id;
  const treino = await semearTreino(comoAluna, aluna.id, dataHaDias(2), exercicio.id, {
    reps: 8,
    peso: PESO_DA_ALUNA,
  });
  semeado.treinoId = treino.treinoId;
  semeado.serieId = treino.serieId;
  // Quatro semanas fechadas: dá à aluna painel de progressão, que é o que
  // um vazamento em `/api/progressao` levaria para o personal.
  await semearHistoricoParaAnalise(comoAluna, aluna.id);

  const { data: modelo, error: erroModelo } = await comoAluna
    .from("modelo_treino")
    .insert({ usuario_id: aluna.id, nome: "Modelo da aluna" })
    .select("id")
    .single();
  if (erroModelo || !modelo) throw new Error(`Preparação: modelo: ${erroModelo?.message}`);
  semeado.modeloId = modelo.id;
  await comoAluna
    .from("modelo_treino_exercicio")
    .insert({ modelo_treino_id: modelo.id, exercicio_id: exercicio.id, ordem: 1, reps: 8, peso: 40 });

  const { data: parecer, error: erroParecer } = await comoAluna
    .from("parecer")
    .insert({
      usuario_id: aluna.id,
      pergunta: 1,
      pergunta_texto: "Estou progredindo?",
      idioma: "pt-BR",
      status: "pronto",
      confirmado: true,
      texto: TEXTO_DO_PARECER,
      evidencia: { periodo: { semana_atual_inicio: "2026-08-24", semana_atual_fim: "2026-08-30", janela_semanas: 4 }, blocos: [] },
    })
    .select("id")
    .single();
  if (erroParecer || !parecer) throw new Error(`Preparação: parecer: ${erroParecer?.message}`);
  semeado.parecerId = parecer.id;

  await comoAluna.from("uso_ia").insert({ usuario_id: aluna.id, origem: "parecer" });
  await comoAluna.storage.from("avatares").upload(`${aluna.id}/avatar.png`, PNG, {
    contentType: "image/png",
    upsert: true,
  });

  const vinculo = await criarVinculoAceito({ browser, personal, aluno: aluna });
  await vinculo.contextoPersonal.close();
  await vinculo.contextoAluno.close();
});

test.afterAll(async () => {
  for (const conta of [aluna, desconhecida, personal]) await apagarSemErro(conta);
});

// ============================================================
// 1. CONTA DESCONHECIDA, PELA API, COM O PRÓPRIO JWT
// ============================================================

test("isolamento: conta sem relação não lê, não altera, não apaga e não cria nada em nome de outra", async () => {
  const b = comoDesconhecida;

  for (const [tabela, coluna, valor] of [
    ["treino", "id", semeado.treinoId],
    ["serie", "id", semeado.serieId],
    ["parecer", "id", semeado.parecerId],
    ["modelo_treino", "id", semeado.modeloId],
    ["modelo_treino_exercicio", "modelo_treino_id", semeado.modeloId],
    ["uso_ia", "usuario_id", aluna.id],
    ["vinculo_personal", "aluno_id", aluna.id],
  ] as const) {
    const { data } = await b.from(tabela).select("*").eq(coluna, valor);
    expect.soft(data?.length ?? 0, `a desconhecida LEU ${tabela} da aluna`).toBe(0);
  }
  const { data: perfil } = await b.from("usuario").select("nome, telefone_whatsapp").eq("id", aluna.id);
  expect.soft(perfil?.length ?? 0, "a desconhecida leu o perfil (nome e telefone) da aluna").toBe(0);

  await b.from("serie").update({ reps: 1 }).eq("id", semeado.serieId);
  await b.from("usuario").update({ nome: "invadido" }).eq("id", aluna.id);
  await b.from("treino").delete().eq("id", semeado.treinoId);
  await b.from("parecer").delete().eq("id", semeado.parecerId);
  await b.from("modelo_treino").delete().eq("id", semeado.modeloId);

  const series = await seriesDoTreino(comoAluna, semeado.treinoId);
  expect.soft(series.find((s) => s.id === semeado.serieId)?.reps, "a desconhecida alterou a série da aluna").toBe(8);
  const { data: nome } = await comoAluna.from("usuario").select("nome").eq("id", aluna.id).single();
  expect.soft(nome?.nome, "a desconhecida renomeou a aluna").toBe(NOME_DA_ALUNA);
  expect.soft(await contarLinhas(comoAluna, "parecer", { id: semeado.parecerId }), "a desconhecida apagou o parecer").toBe(1);
  expect.soft(await contarLinhas(comoAluna, "modelo_treino", { id: semeado.modeloId }), "a desconhecida apagou o modelo").toBe(1);

  const insercoes = {
    treino: await b.from("treino").insert({ usuario_id: aluna.id, data: dataHaDias(1) }),
    serie: await b.from("serie").insert({
      treino_id: semeado.treinoId,
      exercicio_id: semeado.exercicioId,
      ordem: 99,
      tipo: "valendo",
      reps: 1,
      peso: 1,
    }),
    parecer: await b.from("parecer").insert({
      usuario_id: aluna.id,
      pergunta: 1,
      pergunta_texto: "x",
      idioma: "pt-BR",
      status: "gerando",
      confirmado: false,
    }),
    modelo_treino_exercicio: await b
      .from("modelo_treino_exercicio")
      .insert({ modelo_treino_id: semeado.modeloId, exercicio_id: semeado.exercicioId, ordem: 9 }),
    uso_ia: await b.from("uso_ia").insert({ usuario_id: aluna.id, origem: "parecer" }),
  };
  for (const [tabela, resultado] of Object.entries(insercoes)) {
    expect.soft(resultado.error, `a desconhecida INSERIU em ${tabela} em nome da aluna`).not.toBeNull();
  }

  const avatar = await b.storage
    .from("avatares")
    .upload(`${aluna.id}/avatar.png`, PNG, { contentType: "image/png", upsert: true });
  expect.soft(avatar.error, "a desconhecida sobrescreveu a foto da aluna no storage").not.toBeNull();
});

test("isolamento: ninguém move a própria série para dentro do treino de outra conta", async () => {
  const antes = (await seriesDoTreino(comoAluna, semeado.treinoId)).length;

  for (const [quem, cliente, conta] of [
    ["desconhecida", comoDesconhecida, desconhecida],
    // O personal ENXERGA o treino da aluna (0022) — é o caso em que o
    // trigger `serie_herda_usuario` encontra a linha e só a RLS segura.
    ["personal vinculado", comoPersonal, personal],
  ] as const) {
    const exercicio = await primeiroExercicio(cliente);
    const propria = await semearTreino(cliente, conta.id, dataHaDias(5), exercicio.id, { reps: 5, peso: 5 });
    const { error } = await cliente
      .from("serie")
      .update({ treino_id: semeado.treinoId })
      .eq("id", propria.serieId);
    expect.soft(error, `a conta ${quem} moveu a própria série para o treino da aluna`).not.toBeNull();
  }
  expect((await seriesDoTreino(comoAluna, semeado.treinoId)).length, "o treino da aluna ganhou série de outra conta").toBe(antes);
});

test("isolamento: a conta não apaga o próprio consumo de IA para recuperar cota", async () => {
  const antes = await contarLinhas(comoAluna, "uso_ia", { usuario_id: aluna.id });
  await comoAluna.from("uso_ia").delete().eq("usuario_id", aluna.id);
  expect(await contarLinhas(comoAluna, "uso_ia", { usuario_id: aluna.id }), "ACHADO: a conta apagou o próprio uso_ia e zerou o teto").toBe(antes);
});

// ============================================================
// 2. ROTAS COM O ID DE OUTRA CONTA
// ============================================================

for (const quem of ["desconhecida", "personal vinculado"] as const) {
  test(`rotas: a conta ${quem} não vê treino, parecer nem PDF da aluna pelo id`, async ({ page }) => {
    await entrarComoUsuario(page, quem === "desconhecida" ? desconhecida : personal);

    const treino = await page.goto(`/treino/${semeado.treinoId}`);
    await print(page, "treino-da-aluna");
    expect.soft(await page.getByText(String(PESO_DA_ALUNA)).count(), "a tela mostrou a série da aluna").toBe(0);
    if (new URL(page.url()).pathname === `/treino/${semeado.treinoId}`) {
      expect.soft(treino?.status(), "treino de outra conta deveria responder 404").toBe(404);
    }

    const parecer = await page.goto(`/ajustes/relatorios/parecer/${semeado.parecerId}`);
    await print(page, "parecer-da-aluna");
    expect.soft(await page.getByText(TEXTO_DO_PARECER).count(), "a tela mostrou o parecer da aluna").toBe(0);
    if (new URL(page.url()).pathname.startsWith("/ajustes/relatorios/parecer/")) {
      expect.soft(parecer?.status(), "parecer de outra conta deveria responder 404").toBe(404);
    }

    const pdf = await page.request.get(`/api/parecer/${semeado.parecerId}/pdf`);
    expect.soft(pdf.status(), "o PDF do parecer da aluna foi entregue a outra conta").toBe(404);
  });
}

test("rotas: ?modelo= com o modelo de outra conta não traz o plano dela", async ({ page }) => {
  const exercicio = await primeiroExercicio(comoDesconhecida);
  const proprio = await semearTreino(comoDesconhecida, desconhecida.id, dataHaDias(3), exercicio.id, {
    reps: 6,
    peso: 6,
  });
  await entrarComoUsuario(page, desconhecida);
  const resposta = await page.goto(`/treino/${proprio.treinoId}?modelo=${semeado.modeloId}`);
  await print(page, "modelo-de-outra-conta");
  expect.soft(resposta?.status() ?? 0, "a tela quebrou com o modelo de outra conta").toBeLessThan(500);
  expect(await page.locator(".botao-plano").count(), "o plano do modelo da aluna apareceu para outra conta").toBe(0);
});

test("personal vinculado: CSV e progressão levam só os dados do próprio personal", async ({ page }) => {
  await entrarComoUsuario(page, personal);
  const csv = await page.request.get("/api/exportar");
  expect(csv.status()).toBe(200);
  const linhas = (await csv.text()).trim().split("\r\n").length - 1;
  const proprias = await contarLinhas(comoPersonal, "serie", { usuario_id: personal.id });
  expect.soft(linhas, "ACHADO: o CSV do personal levou séries da aluna para fora do app").toBe(proprias);

  const progressao = await page.request.get("/api/progressao");
  expect(progressao.status()).toBe(200);
  const paineis = (await progressao.json()) as unknown[];
  // O personal tem no máximo um treino semeado; painel exige duas semanas.
  expect.soft(paineis.length, "ACHADO: a progressão do personal mostrou painel com o histórico da aluna").toBe(0);
});

// ============================================================
// 3. PORTAS HTTP
// ============================================================

test("APIs: sem sessão, todas respondem 401", async ({ request }) => {
  const id = randomUUID();
  const chamadas = [
    () => request.get("/api/exportar", { maxRedirects: 0 }),
    () => request.get("/api/progressao", { maxRedirects: 0 }),
    () => request.get(`/api/parecer/${id}/pdf`, { maxRedirects: 0 }),
    () => request.post("/api/analise", { data: { pergunta: 1 }, maxRedirects: 0 }),
    () => request.post("/api/coach", { data: { pergunta: "oi" }, maxRedirects: 0 }),
  ];
  const nomes = ["GET /api/exportar", "GET /api/progressao", "GET /api/parecer/[id]/pdf", "POST /api/analise", "POST /api/coach"];
  for (const [i, chamar] of chamadas.entries()) {
    expect.soft((await chamar()).status(), `${nomes[i]} sem sessão`).toBe(401);
  }
});

test("rotas: id que não é UUID ou que não existe responde 404, não 500", async ({ page }) => {
  await entrarComoUsuario(page, desconhecida);
  const pdf = await page.request.get("/api/parecer/abc/pdf");
  if (pdf.status() >= 500) anotarAchado(`/api/parecer/abc/pdf respondeu ${pdf.status()}`);
  expect.soft(pdf.status(), "PDF com id que não é UUID").toBe(404);

  for (const rota of [
    "/treino/abc",
    "/catalogo/abc",
    "/ajustes/relatorios/parecer/abc",
    `/treino/${randomUUID()}`,
    `/catalogo/${randomUUID()}`,
    `/ajustes/relatorios/parecer/${randomUUID()}`,
  ]) {
    const resposta = await page.goto(rota);
    const status = resposta?.status() ?? 0;
    if (status >= 500) {
      anotarAchado(`${rota} respondeu ${status}`);
      await print(page, `erro${rota.replace(/\//g, "_")}`);
    }
    expect.soft(status, `${rota} digitada à mão`).toBe(404);
  }
});

test("PDF: parecer ainda em geração não derruba o servidor", async ({ page }) => {
  const { data: rascunho, error } = await comoDesconhecida
    .from("parecer")
    .insert({ usuario_id: desconhecida.id, pergunta: 1, pergunta_texto: "x", idioma: "pt-BR", status: "gerando", confirmado: false })
    .select("id")
    .single();
  if (error || !rascunho) throw new Error(`Preparação: rascunho: ${error?.message}`);
  try {
    await entrarComoUsuario(page, desconhecida);
    const pdf = await page.request.get(`/api/parecer/${rascunho.id}/pdf`);
    if (pdf.status() >= 500) anotarAchado(`PDF de rascunho em geração respondeu ${pdf.status()}`);
    expect(pdf.status(), "ACHADO: PDF de um parecer ainda sem texto derrubou a rota").toBeLessThan(500);
  } finally {
    await comoDesconhecida.from("parecer").delete().eq("id", rascunho.id);
  }
});

test("análise: dois pedidos simultâneos não criam dois rascunhos nem gastam cota dupla", async ({ page }) => {
  const conta = await criarUsuarioDescartavel("j12-concorrencia");
  try {
    const cliente = await clienteAutenticado(conta);
    await entrarComoUsuario(page, conta);
    const respostas = await Promise.all([
      page.request.post("/api/analise", { data: { pergunta: 1 } }),
      page.request.post("/api/analise", { data: { pergunta: 2 } }),
    ]);
    const status = respostas.map((r) => r.status());
    const pareceres = await contarLinhas(cliente, "parecer", { usuario_id: conta.id });
    const usos = await contarLinhas(cliente, "uso_ia", { usuario_id: conta.id, origem: "parecer" });
    if (pareceres > 1 || usos > 1) anotarAchado(`status ${status.join(" e ")}: ${pareceres} rascunho(s), ${usos} uso(s) de cota`);
    expect.soft(pareceres, `ACHADO: dois pedidos simultâneos criaram ${pareceres} rascunhos`).toBeLessThanOrEqual(1);
    expect.soft(usos, `ACHADO: dois pedidos simultâneos gastaram ${usos} da cota`).toBeLessThanOrEqual(1);
  } finally {
    await apagarSemErro(conta);
  }
});

test("análise e coach: em andamento responde 409 e teto responde 429, sem gastar cota", async ({ page }) => {
  const conta = await criarUsuarioDescartavel("j12-tetos");
  try {
    const cliente = await clienteAutenticado(conta);
    const usos = (origem: string) => contarLinhas(cliente, "uso_ia", { usuario_id: conta.id, origem });
    await entrarComoUsuario(page, conta);

    await cliente
      .from("parecer")
      .insert({ usuario_id: conta.id, pergunta: 1, pergunta_texto: "x", idioma: "pt-BR", status: "gerando", confirmado: false });
    const emAndamento = await page.request.post("/api/analise", { data: { pergunta: 2 } });
    expect.soft(emAndamento.status(), "com geração em andamento").toBe(409);
    expect.soft(await usos("parecer"), "o 409 gastou cota").toBe(0);
    await cliente.from("parecer").delete().eq("usuario_id", conta.id);

    await cliente.from("uso_ia").insert(Array.from({ length: 5 }, () => ({ usuario_id: conta.id, origem: "parecer" })));
    const tetoAnalise = await page.request.post("/api/analise", { data: { pergunta: 1 } });
    expect.soft(tetoAnalise.status(), "análise com o teto de 5 atingido").toBe(429);
    expect.soft(await usos("parecer"), "o 429 da análise gastou cota").toBe(5);
    expect.soft(await contarLinhas(cliente, "parecer", { usuario_id: conta.id }), "o 429 criou rascunho").toBe(0);

    await cliente.from("uso_ia").insert(Array.from({ length: 10 }, () => ({ usuario_id: conta.id, origem: "coach" })));
    const tetoCoach = await page.request.post("/api/coach", { data: { pergunta: "O que é RIR?" } });
    expect.soft(tetoCoach.status(), "coach com o teto de 10 atingido").toBe(429);
    expect.soft(await usos("coach"), "o 429 do coach gastou cota").toBe(10);
  } finally {
    await apagarSemErro(conta);
  }
});

test("coach: pergunta invisível é recusada e pedidos simultâneos não furam o teto de 10", async ({ page }) => {
  const conta = await criarUsuarioDescartavel("j12-coach");
  try {
    const cliente = await clienteAutenticado(conta);
    const usos = () => contarLinhas(cliente, "uso_ia", { usuario_id: conta.id, origem: "coach" });
    await entrarComoUsuario(page, conta);

    const invisivel = await page.request.post("/api/coach", { data: { pergunta: "​​​" } });
    expect.soft(invisivel.status(), "ACHADO: pergunta feita só de caractere invisível foi aceita").toBe(400);
    expect.soft(await usos(), "pergunta invisível gastou cota").toBe(0);

    await cliente.from("uso_ia").insert(Array.from({ length: 9 }, () => ({ usuario_id: conta.id, origem: "coach" })));
    const respostas = await Promise.all(
      [1, 2, 3].map(() => page.request.post("/api/coach", { data: { pergunta: "O que é volume?" } })),
    );
    const total = await usos();
    if (total > 10) anotarAchado(`3 pedidos simultâneos com 9 usos: ${total} usos, status ${respostas.map((r) => r.status()).join(", ")}`);
    expect.soft(total, `ACHADO: pedidos simultâneos levaram o coach a ${total} usos, acima do teto de 10`).toBeLessThanOrEqual(10);
  } finally {
    await apagarSemErro(conta);
  }
});

// ============================================================
// 4. CONTA EXCLUÍDA COM VÍNCULO VIVO
// ============================================================

test("conta excluída: a aluna sai e as telas do personal continuam de pé", async ({ browser }) => {
  test.setTimeout(180_000);
  const p = await criarUsuarioDescartavel("j12-exc-personal", "personal");
  const a = await criarUsuarioDescartavel("j12-exc-aluna");
  try {
    const v = await criarVinculoAceito({ browser, personal: p, aluno: a });
    await excluirContaPelaTela(v.telaAluno);
    for (const rota of ["/personal", "/personal/alunos"]) {
      const resposta = await v.telaPersonal.goto(rota);
      await print(v.telaPersonal, `personal${rota.replace(/\//g, "_")}-sem-aluna`);
      expect.soft(resposta?.status() ?? 0, `${rota} depois de a aluna excluir a conta`).toBeLessThan(500);
      expect.soft(await v.telaPersonal.getByText(/Application error/i).count(), `${rota} quebrou`).toBe(0);
    }
    await v.contextoPersonal.close();
    await v.contextoAluno.close();
  } finally {
    await apagarSemErro(p);
    await apagarSemErro(a);
  }
});

test("conta excluída: o personal sai e a aluna recupera a prescrição sem erro", async ({ browser }) => {
  test.setTimeout(180_000);
  const p = await criarUsuarioDescartavel("j12-exc2-personal", "personal");
  const a = await criarUsuarioDescartavel("j12-exc2-aluna");
  try {
    const v = await criarVinculoAceito({ browser, personal: p, aluno: a });
    await excluirContaPelaTela(v.telaPersonal);

    const analise = await v.telaAluno.goto("/analise");
    await print(v.telaAluno, "analise-sem-personal");
    expect.soft(analise?.status() ?? 0, "/analise depois de o personal excluir a conta").toBeLessThan(500);
    expect.soft(await v.telaAluno.locator(".pergunta").count(), "a prescrição não voltou para a aluna").toBe(5);

    const ajustes = await v.telaAluno.goto("/ajustes/personal");
    await print(v.telaAluno, "vinculo-sem-personal");
    expect.soft(ajustes?.status() ?? 0, "/ajustes/personal depois de o personal excluir a conta").toBeLessThan(500);
    await expect(v.telaAluno.locator("#codigo_convite"), "a aluna não voltou a poder aceitar convite").toBeVisible();
    await v.contextoPersonal.close();
    await v.contextoAluno.close();
  } finally {
    await apagarSemErro(p);
    await apagarSemErro(a);
  }
});
