// lastro · O CAMINHO TRISTE do módulo Personal — pedido do dono em
// 2026-09-12, antes de decidir se o módulo vai para a `main`.
//
// "Nada de caminho feliz. Onde seria número, digitar letra." As specs
// j6, j7 e j8 provam que o módulo funciona quando a pessoa faz o certo.
// Esta prova o que acontece quando ela faz o errado — por descuido, por
// pressa no meio do salão, ou de propósito.
//
// COMO LER UMA FALHA AQUI: cada asserção descreve o comportamento
// CORRETO. Falha nesta spec é ACHADO, não teste quebrado — a mensagem de
// cada `expect` diz qual é o dano se o app aceitar.
//
// Regras de construção, todas aprendidas nesta sessão:
//
// 1. SEM `describe.serial`: em modo serial a primeira falha pula o resto,
//    e um achado esconderia os seguintes. Cada teste monta o próprio
//    estado (`garantirSemVinculo`, convite novo) e sobrevive ao retry.
// 2. Em laço de casos, TELA NOVA a cada caso. A mensagem de erro do caso
//    anterior continua na tela e satisfaria a asserção do caso seguinte
//    antes de o clique terminar — sinal de "pronto" que já existia antes
//    (`DECISIONS.md` "2026-09-12 (1)").
// 3. Todo teste que muda o estado de uma conta compartilhada desfaz a
//    mudança num `finally`, para um achado não contaminar os outros.
//
// Nenhuma conta deve nascer do cadastro público: todo caso de cadastro
// precisa morrer numa validação ANTES do `signUp`. Se uma validação
// faltar, o `afterAll` apaga o que tiver nascido.
import { expect, test, type Page } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAdmin,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

/** Prefixo dos e-mails do cadastro público — nenhum deveria virar conta. */
const PREFIXO_CADASTRO = "qa.triste.";

let personal: UsuarioDescartavel;
let alunoA: UsuarioDescartavel;
let alunoB: UsuarioDescartavel;
let personalSemCref: UsuarioDescartavel;

test.beforeAll(async () => {
  personal = await criarUsuarioDescartavel("j9-personal", "personal");
  alunoA = await criarUsuarioDescartavel("j9-aluno-a");
  alunoB = await criarUsuarioDescartavel("j9-aluno-b");
  personalSemCref = await criarUsuarioDescartavel("j9-sem-cref", "personal", {
    semCref: true,
  });
});

test.afterAll(async () => {
  for (const conta of [personal, alunoA, alunoB, personalSemCref]) {
    if (!conta) continue;
    try {
      await apagarUsuarioDescartavel(conta);
    } catch {
      /* segue apagando as demais */
    }
  }
  // Conta que tenha nascido de um cadastro que devia ter sido recusado.
  const admin = clienteAdmin();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if ((u.email ?? "").startsWith(PREFIXO_CADASTRO)) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
});

// ============================================================
// Ferramentas de estado
// ============================================================

/**
 * Registra o achado na anotação do teste E no log do CI — a anotação sozinha
 * só aparece no relatório HTML, que ninguém abre numa leitura rápida.
 *
 * Nota de seletor: erro da tela é `.aviso-erro`, nunca `getByRole("alert")`.
 * O Next.js injeta `#__next-route-announcer__` com `role="alert"` em toda
 * página, e a primeira rodada desta spec caiu inteira nesse strict mode.
 */
function anotarAchado(achado: { type: string; description: string }) {
  test.info().annotations.push(achado);
  console.log(`[achado] ${test.info().title}: ${achado.description}`);
}

/** Alfabeto do app (`gerarCodigo`): sem I, L, O, 0 e 1. */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function codigoAleatorio(): string {
  let c = "";
  for (let i = 0; i < 10; i++) c += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return c;
}

/**
 * Convite novo do personal, com o JWT DELE — a mesma policy que a tela
 * usa. Gerar convite pela interface já está provado na j8.
 */
async function conviteNovo(): Promise<string> {
  const cliente = await clienteAutenticado(personal);
  const codigo = codigoAleatorio();
  const { error } = await cliente
    .from("vinculo_personal")
    .insert({ personal_id: personal.id, codigo, estado: "pendente" });
  if (error) throw new Error(`Preparação: falha ao criar convite: ${error.message}`);
  return codigo;
}

async function temVinculoAceito(aluno: UsuarioDescartavel): Promise<boolean> {
  const cliente = await clienteAutenticado(aluno);
  const { data, error } = await cliente
    .from("vinculo_personal")
    .select("id")
    .eq("aluno_id", aluno.id)
    .eq("estado", "aceito");
  if (error) throw new Error(`Falha ao ler vínculo: ${error.message}`);
  return (data ?? []).length > 0;
}

async function garantirSemVinculo(aluno: UsuarioDescartavel): Promise<void> {
  const cliente = await clienteAutenticado(aluno);
  await cliente.rpc("revogar_vinculo_personal");
}

async function garantirVinculado(aluno: UsuarioDescartavel): Promise<void> {
  if (await temVinculoAceito(aluno)) return;
  const cliente = await clienteAutenticado(aluno);
  const { error } = await cliente.rpc("aceitar_convite_personal", {
    p_codigo: await conviteNovo(),
    p_telefone_whatsapp: "5583977776666",
  });
  if (error) throw new Error(`Preparação: falha ao vincular: ${error.message}`);
}

async function contar(aluno: UsuarioDescartavel, tabela: "uso_ia" | "parecer"): Promise<number> {
  const cliente = await clienteAutenticado(aluno);
  const { count, error } = await cliente
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", aluno.id);
  if (error) throw new Error(`Falha ao contar ${tabela}: ${error.message}`);
  return count ?? -1;
}

/** Formulário de cadastro limpo, com o tipo de conta escolhido. */
async function abrirCadastro(page: Page, tipo: "USUÁRIO" | "PERSONAL") {
  await page.goto("/login");
  await page.getByRole("button", { name: /Cadastre-se/i }).click();
  await page.getByRole("radio", { name: tipo }).click();
  await expect(page.getByRole("radio", { name: tipo })).toHaveAttribute("aria-checked", "true");
  await page.locator("#nome").fill("Teste Triste");
  await page.locator("#email").fill(`${PREFIXO_CADASTRO}${Date.now()}@example.com`);
  await page.locator("#senha").fill("Senha!123");
}

/** Tela de vínculo do aluno, recarregada — sem erro de caso anterior. */
async function abrirVinculo(page: Page) {
  await page.goto("/ajustes/personal");
  await expect(page.locator("#codigo_convite")).toBeVisible();
  await expect(page.locator(".aviso-erro")).toHaveCount(0);
}

// ============================================================
// 1. CADASTRO
// ============================================================

test("cadastro: telefone só com letras é recusado", async ({ page }) => {
  await abrirCadastro(page, "USUÁRIO");
  await page.locator("#telefone").fill("abcdefghij");
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await expect(
    page.locator(".aviso-erro"),
    "a mensagem esperada é a de telefone; qualquer outra (inclusive erro de e-mail) prova que o telefone passou",
  ).toContainText(/Telefone inválido/i, { timeout: 15_000 });
});

test("cadastro: telefone com letra O no lugar do zero NÃO pode virar outro número", async ({ page }) => {
  // `83 99990-8888` digitado com a letra O. Se a normalização só descartar
  // o que não é dígito, sobram 10 dígitos — tamanho válido — e o app
  // salva OUTRO número, sem erro. O personal chamaria um desconhecido.
  await abrirCadastro(page, "USUÁRIO");
  await page.locator("#telefone").fill("83 9999O-8888");
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await expect(
    page.locator(".aviso-erro"),
    "ACHADO: a letra O foi descartada em silêncio e o telefone passou como outro número (83 9999-8888)",
  ).toContainText(/Telefone inválido/i, { timeout: 15_000 });
});

const CREFS_INVALIDOS = [
  { valor: "ABCDEF-G/PB", porque: "letras onde são dígitos" },
  { valor: "12345O-G/PB", porque: "letra O no lugar do zero" },
  { valor: "12345-G/PB", porque: "cinco dígitos, a norma exige seis" },
  { valor: "123456-E/PB", porque: "categoria E não existe" },
  { valor: "123456-G/XX", porque: "UF XX não existe" },
  { valor: "123456-G/P8", porque: "número na UF" },
];

for (const { valor, porque } of CREFS_INVALIDOS) {
  test(`cadastro de personal: CREF ${valor} (${porque}) é recusado`, async ({ page }) => {
    await abrirCadastro(page, "PERSONAL");
    // Telefone VÁLIDO de propósito: o servidor valida telefone antes do
    // CREF, e um telefone ruim mascararia a recusa do CREF.
    await page.locator("#telefone").fill("83 97777-6666");
    await page.locator("#cref").fill(valor);

    await expect(page.locator(".campo__nota--alerta"), "aviso de formato ausente").toBeVisible();

    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.locator(".aviso-erro"), "o servidor aceitou o CREF").toContainText(/CREF inválido/i, {
      timeout: 15_000,
    });
  });
}

test("cadastro de personal: CREF vazio não passa (o campo é obrigatório)", async ({ page }) => {
  await abrirCadastro(page, "PERSONAL");
  await page.locator("#telefone").fill("83 97777-6666");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  // `required` do navegador segura o envio: a tela não sai do cadastro e
  // o campo fica inválido.
  const valido = await page.locator("#cref").evaluate((el) => (el as HTMLInputElement).validity.valid);
  expect(valido, "CREF vazio foi considerado válido pelo formulário").toBe(false);
  expect(new URL(page.url()).pathname).toBe("/login");
});

// ============================================================
// 2. ACEITE DO CONVITE
// ============================================================

test("aceite: botão travado com qualquer campo vazio", async ({ page }) => {
  await garantirSemVinculo(alunoA);
  await entrarComoUsuario(page, alunoA);
  await abrirVinculo(page);

  const aceitar = page.getByRole("button", { name: /Aceitar convite/i });
  await expect(aceitar).toBeDisabled();
  await page.locator("#codigo_convite").fill("ABCDEFGHJK");
  await page.locator("#telefone_whatsapp").fill("");
  await expect(aceitar, "telefone vazio precisa travar o botão").toBeDisabled();
  await page.locator("#codigo_convite").fill("   ");
  await page.locator("#telefone_whatsapp").fill("83 97777-6666");
  await expect(aceitar, "código só de espaços precisa travar o botão").toBeDisabled();
});

const CODIGOS_INVALIDOS = [
  { codigo: "OOOOOOOOOO", porque: "letra O fora do alfabeto" },
  { codigo: "1111111111", porque: "dígito 1 fora do alfabeto" },
  { codigo: "ABC", porque: "curto demais" },
  { codigo: "ABC!@#$%^&", porque: "símbolos" },
];

test("aceite: código fora do formato é recusado sem criar vínculo", async ({ page }) => {
  await garantirSemVinculo(alunoA);
  await entrarComoUsuario(page, alunoA);

  for (const { codigo, porque } of CODIGOS_INVALIDOS) {
    await abrirVinculo(page);
    await page.locator("#codigo_convite").fill(codigo);
    await page.locator("#telefone_whatsapp").fill("83 97777-6666");
    await page.getByRole("button", { name: /Aceitar convite/i }).click();
    await expect(page.locator(".aviso-erro"), `código "${codigo}" (${porque})`).toContainText(
      /Código inválido/i,
      { timeout: 15_000 },
    );
  }
  expect(await temVinculoAceito(alunoA), "um código inválido criou vínculo").toBe(false);
});

test("aceite: código no formato certo que ninguém gerou é recusado", async ({ page }) => {
  await garantirSemVinculo(alunoA);
  await entrarComoUsuario(page, alunoA);
  await abrirVinculo(page);

  await page.locator("#codigo_convite").fill("ZZZZZZZZZZ");
  await page.locator("#telefone_whatsapp").fill("83 97777-6666");
  await page.getByRole("button", { name: /Aceitar convite/i }).click();

  await expect(page.locator(".aviso-erro")).toContainText(/não existe ou já foi usado/i, { timeout: 15_000 });
  expect(await temVinculoAceito(alunoA)).toBe(false);
});

for (const telefone of ["abcdefghij", "83 9999", "0000000000000000000"]) {
  test(`aceite: código verdadeiro com telefone "${telefone}" é recusado e não gasta o convite`, async ({
    page,
  }) => {
    await garantirSemVinculo(alunoA);
    const codigo = await conviteNovo();
    await entrarComoUsuario(page, alunoA);
    await abrirVinculo(page);

    await page.locator("#codigo_convite").fill(codigo);
    await page.locator("#telefone_whatsapp").fill(telefone);
    await page.getByRole("button", { name: /Aceitar convite/i }).click();

    await expect(page.locator(".aviso-erro")).toContainText(/Telefone inválido/i, { timeout: 15_000 });
    expect(await temVinculoAceito(alunoA), "telefone inválido criou vínculo").toBe(false);
  });
}

test("aceite: telefone com letra O no lugar do zero não pode vincular com o número ERRADO", async ({
  page,
}) => {
  await garantirSemVinculo(alunoA);
  const codigo = await conviteNovo();
  await entrarComoUsuario(page, alunoA);
  await abrirVinculo(page);

  await page.locator("#codigo_convite").fill(codigo);
  await page.locator("#telefone_whatsapp").fill("83 9999O-8888");
  await page.getByRole("button", { name: /Aceitar convite/i }).click();

  // Cada desfecho tem sinal próprio e exclusivo: o alerta de erro, ou o
  // botão de revogar, que só existe com vínculo.
  const recusou = page.locator(".aviso-erro");
  const vinculou = page.getByRole("button", { name: /Revogar o vínculo/i });
  await expect(recusou.or(vinculou)).toBeVisible({ timeout: 15_000 });

  if (await vinculou.isVisible()) {
    // Registra QUAL número foi parar no vínculo — o que o personal vê.
    const comoPersonal = await clienteAutenticado(personal);
    const { data } = await comoPersonal
      .from("usuario")
      .select("telefone_whatsapp")
      .eq("id", alunoA.id)
      .maybeSingle();
    anotarAchado({
      type: "achado",
      description: `"83 9999O-8888" foi aceito e salvo como ${data?.telefone_whatsapp ?? "?"}`,
    });
  }
  await expect(
    recusou,
    "ACHADO: vinculou com o telefone errado — a letra O sumiu em silêncio (ver a anotação 'achado')",
  ).toContainText(/Telefone inválido/i);
});

test("aceite: ?codigo= com lixo no link não chega preenchido", async ({ page }) => {
  await garantirSemVinculo(alunoA);
  await entrarComoUsuario(page, alunoA);

  await page.goto(`/ajustes/personal?codigo=${encodeURIComponent("<script>alert(1)</script>")}`);
  await expect(page.locator("#codigo_convite")).toHaveValue("");

  await page.goto("/ajustes/personal?codigo=OOOOOOOOOO");
  await expect(page.locator("#codigo_convite"), "código de alfabeto inválido veio pré-preenchido").toHaveValue("");
});

// ============================================================
// 3. VÍNCULO JÁ EXISTENTE
// ============================================================

test("vínculo: código já usado por um aluno não serve para outro", async ({ page }) => {
  await garantirSemVinculo(alunoA);
  await garantirSemVinculo(alunoB);

  const codigo = await conviteNovo();
  const comoA = await clienteAutenticado(alunoA);
  const { error } = await comoA.rpc("aceitar_convite_personal", {
    p_codigo: codigo,
    p_telefone_whatsapp: "5583977776666",
  });
  expect(error, "preparação: o aluno A precisava aceitar").toBeNull();

  await entrarComoUsuario(page, alunoB);
  await abrirVinculo(page);
  await page.locator("#codigo_convite").fill(codigo);
  await page.locator("#telefone_whatsapp").fill("83 96666-5555");
  await page.getByRole("button", { name: /Aceitar convite/i }).click();

  await expect(page.locator(".aviso-erro")).toContainText(/não existe ou já foi usado/i, { timeout: 15_000 });
  expect(await temVinculoAceito(alunoB), "o aluno B entrou por um código já consumido").toBe(false);
});

test("vínculo: aluno já vinculado não aceita um segundo convite", async () => {
  await garantirVinculado(alunoA);
  // Vinculado não vê o campo na tela — então pela API, com o JWT do
  // próprio aluno, que é o que um cliente adulterado teria.
  const comoA = await clienteAutenticado(alunoA);
  const { error } = await comoA.rpc("aceitar_convite_personal", {
    p_codigo: await conviteNovo(),
    p_telefone_whatsapp: "5583977776666",
  });
  expect(error?.message ?? "", "segundo vínculo aceito para o mesmo aluno").toMatch(/já existe vínculo aceito/i);
});

test("vínculo: desistir da revogação no meio mantém o vínculo", async ({ page }) => {
  await garantirVinculado(alunoA);
  await entrarComoUsuario(page, alunoA);
  await page.goto("/ajustes/personal");

  await page.getByRole("button", { name: /Revogar o vínculo/i }).click();
  await page.getByRole("button", { name: /Manter o vínculo/i }).click();

  await expect(page.getByRole("button", { name: /Revogar o vínculo/i })).toBeVisible();
  expect(await temVinculoAceito(alunoA), "cancelar a revogação revogou").toBe(true);
});

// ============================================================
// 4. PORTAS SEM TELA — o que um cliente adulterado tentaria
// ============================================================

test("portas: conta de personal não aceita convite", async () => {
  const comoPersonal = await clienteAutenticado(personal);
  const { error } = await comoPersonal.rpc("aceitar_convite_personal", {
    p_codigo: await conviteNovo(),
    p_telefone_whatsapp: "5583977776666",
  });
  expect(error?.message ?? "", "conta de personal virou aluna de alguém").toMatch(
    /conta de personal não aceita convite/i,
  );
});

test("portas: conta de aluno não gera convite", async () => {
  const comoB = await clienteAutenticado(alunoB);
  const { error } = await comoB
    .from("vinculo_personal")
    .insert({ personal_id: alunoB.id, codigo: codigoAleatorio(), estado: "pendente" });
  expect(error, "aluno criou convite — a policy da 0024 não segurou").not.toBeNull();
});

test("portas: personal não revoga o vínculo do aluno", async () => {
  await garantirVinculado(alunoA);
  const comoPersonal = await clienteAutenticado(personal);
  await comoPersonal.rpc("revogar_vinculo_personal");
  expect(await temVinculoAceito(alunoA), "o personal revogou o vínculo do aluno (§11.4.3)").toBe(true);
});

test("portas: CREF em texto livre e tipo de conta inventado são barrados pelo banco", async () => {
  const comoPersonal = await clienteAutenticado(personal);

  const cref = await comoPersonal.from("usuario").update({ cref: "sou personal" }).eq("id", personal.id);
  expect(cref.error, "CREF em texto livre foi gravado").not.toBeNull();

  const tipo = await comoPersonal.from("usuario").update({ tipo_conta: "admin" }).eq("id", personal.id);
  expect(tipo.error, "tipo de conta inventado foi gravado").not.toBeNull();
});

test("portas: aluno não pode se promover a personal com um update na própria linha", async () => {
  // Decisão do dono (2026-09-11): o tipo é escolhido NA ORIGEM e não se
  // troca depois. Se a própria conta grava `tipo_conta`, a cápsula do
  // cadastro vira sugestão.
  const comoB = await clienteAutenticado(alunoB);
  try {
    await comoB.from("usuario").update({ tipo_conta: "personal" }).eq("id", alunoB.id);
    const { data } = await comoB.from("usuario").select("tipo_conta").eq("id", alunoB.id).maybeSingle();

    if (data?.tipo_conta === "personal") {
      // O que a promoção destrava: gerar convite, que era ato de profissional.
      const convite = await comoB
        .from("vinculo_personal")
        .insert({ personal_id: alunoB.id, codigo: codigoAleatorio(), estado: "pendente" });
      anotarAchado({
        type: "achado",
        description: `aluno virou personal pela API; gerar convite depois disso: ${convite.error ? "recusado" : "ACEITO"}`,
      });
    }
    expect(
      data?.tipo_conta,
      "ACHADO: o aluno se promoveu a personal pela API — a escolha do cadastro não é garantida pelo banco",
    ).toBe("aluno");
  } finally {
    await comoB.from("vinculo_personal").delete().eq("personal_id", alunoB.id);
    await comoB.from("usuario").update({ tipo_conta: "aluno" }).eq("id", alunoB.id);
  }
});

test("portas: personal sem CREF não pode gravar um CREF fora da norma direto no banco", async ({ page }) => {
  // A tela de completar valida com `crefValido` (seis dígitos, UF real).
  // A check do banco é frouxa DE PROPÓSITO (0024). Se a própria conta pode
  // escrever `cref` pela API, a régua apertada da tela é contornável.
  const comoSemCref = await clienteAutenticado(personalSemCref);
  try {
    await comoSemCref.from("usuario").update({ cref: "1-G/ZZ" }).eq("id", personalSemCref.id);
    const { data } = await comoSemCref.from("usuario").select("cref").eq("id", personalSemCref.id).maybeSingle();

    if (data?.cref) {
      await entrarComoUsuario(page, personalSemCref);
      await page.goto("/personal", { waitUntil: "domcontentloaded" });
      anotarAchado({
        type: "achado",
        description: `CREF "1-G/ZZ" gravado pela API; /personal abriu em ${new URL(page.url()).pathname}`,
      });
    }
    expect(
      data?.cref ?? null,
      "ACHADO: CREF '1-G/ZZ' (um dígito, UF inexistente) foi gravado direto pela API, contornando a validação da tela",
    ).toBeNull();
  } finally {
    await comoSemCref.from("usuario").update({ cref: null }).eq("id", personalSemCref.id);
  }
});

test("portas: /api/analise recusa pergunta que não é 1 a 5 sem gastar cota", async ({ page }) => {
  await entrarComoUsuario(page, alunoB);
  const cotaAntes = await contar(alunoB, "uso_ia");
  const pareceresAntes = await contar(alunoB, "parecer");

  for (const corpo of [{ pergunta: "5" }, { pergunta: 6 }, { pergunta: 0 }, { pergunta: "abc" }, { pergunta: 2.5 }, {}]) {
    const r = await page.request.post("/api/analise", { data: corpo });
    expect(r.status(), `corpo ${JSON.stringify(corpo)} não foi recusado`).toBe(400);
  }
  const lixo = await page.request.post("/api/analise", {
    data: "isto não é json",
    headers: { "content-type": "application/json" },
  });
  expect(lixo.status(), "corpo que não é JSON").toBe(400);

  expect(await contar(alunoB, "uso_ia"), "pedido inválido gastou cota").toBe(cotaAntes);
  expect(await contar(alunoB, "parecer"), "pedido inválido criou rascunho").toBe(pareceresAntes);
});

test("portas: /api/coach recusa pergunta vazia, só espaços, gigante ou numérica sem gastar cota", async ({
  page,
}) => {
  await entrarComoUsuario(page, alunoB);
  const cotaAntes = await contar(alunoB, "uso_ia");

  for (const pergunta of ["", "     ", "x".repeat(501), 12345]) {
    const r = await page.request.post("/api/coach", { data: { pergunta } });
    expect(r.status(), `pergunta ${JSON.stringify(pergunta).slice(0, 30)} não foi recusada`).toBe(400);
  }
  expect(await contar(alunoB, "uso_ia"), "pergunta inválida ao coach gastou cota").toBe(cotaAntes);
});

// ============================================================
// 5. ROTAS DIGITADAS POR QUEM NÃO DEVIA
// ============================================================

test("rotas: sem sessão, a área do personal manda para o login", async ({ page }) => {
  for (const rota of ["/personal", "/personal/alunos", "/personal/completar"]) {
    await page.goto(rota, { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).pathname, `${rota} abriu sem sessão`).toBe("/login");
  }
});

test("rotas: aluno digitando a tela de completar cadastro volta para a Home", async ({ page }) => {
  await entrarComoUsuario(page, alunoB);
  await page.goto("/personal/completar", { waitUntil: "domcontentloaded" });
  expect(new URL(page.url()).pathname).toBe("/");
});

test("rotas: personal com cadastro completo não reabre a tela de completar", async ({ page }) => {
  await entrarComoUsuario(page, personal);
  await page.goto("/personal/completar", { waitUntil: "domcontentloaded" });
  expect(new URL(page.url()).pathname).toBe("/personal");
});

// ============================================================
// 6. COMPLETAR CADASTRO (entrada pelo Google)
// ============================================================

test("completar cadastro: personal sem CREF não abre nenhuma tela de trabalho", async ({ page }) => {
  await entrarComoUsuario(page, personalSemCref);
  for (const rota of ["/personal", "/personal/alunos", "/", "/treino"]) {
    await page.goto(rota, { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).pathname, `${rota} abriu para personal sem CREF`).toBe("/personal/completar");
  }
});

for (const cref of ["ABCDEF-G/PB", "12345O-G/PB", "123456-X/PB", "123456-G/ZZ"]) {
  test(`completar cadastro: CREF ${cref} mostra o aviso e trava o botão`, async ({ page }) => {
    await entrarComoUsuario(page, personalSemCref);
    await page.goto("/personal/completar");

    await page.locator("#telefone_completar").fill("83 97777-6666");
    await page.locator("#cref_completar").fill(cref);
    await expect(page.locator(".campo__nota--alerta")).toBeVisible();
    await expect(page.getByRole("button", { name: /Abrir minha fila/i })).toBeDisabled();
  });
}

test("completar cadastro: CREF válido com telefone só de letras é recusado", async ({ page }) => {
  await entrarComoUsuario(page, personalSemCref);
  await page.goto("/personal/completar");

  await page.locator("#cref_completar").fill("123456-G/PB");
  await page.locator("#telefone_completar").fill("abcdefghij");
  await page.getByRole("button", { name: /Abrir minha fila/i }).click();

  await expect(page.locator(".aviso-erro")).toContainText(/Telefone inválido/i, { timeout: 15_000 });
  expect(new URL(page.url()).pathname, "cadastro completou com telefone de letras").toBe("/personal/completar");
});

test("completar cadastro: letra O no telefone não completa com o número errado", async ({ page }) => {
  const comoSemCref = await clienteAutenticado(personalSemCref);
  try {
    await entrarComoUsuario(page, personalSemCref);
    await page.goto("/personal/completar");

    await page.locator("#cref_completar").fill("123456-G/PB");
    await page.locator("#telefone_completar").fill("83 9999O-8888");
    await page.getByRole("button", { name: /Abrir minha fila/i }).click();

    const recusou = page.locator(".aviso-erro");
    await expect(recusou.or(page.getByText("Você ainda não tem alunos."))).toBeVisible({ timeout: 15_000 });
    await expect(
      recusou,
      "ACHADO: o cadastro de personal completou com a letra O descartada — telefone salvo é outro número",
    ).toContainText(/Telefone inválido/i);
  } finally {
    await comoSemCref
      .from("usuario")
      .update({ cref: null, telefone_whatsapp: null })
      .eq("id", personalSemCref.id);
  }
});
