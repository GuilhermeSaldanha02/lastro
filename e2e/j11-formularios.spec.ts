// lastro · O CAMINHO TRISTE dos formulários de configuração — modelo de
// treino, anilhas e meta semanal. QA independente, 2026-09-13.
//
// A pergunta de cada caso não é "a tela mostra erro?", é "o que sobra no
// banco depois do erro?". O modelo grava o cabeçalho ANTES dos exercícios
// (`criarModelo`), então um exercício recusado pode deixar um modelo vazio
// para trás a cada tentativa.
//
// Falha aqui é ACHADO: cada mensagem diz o dano se o app aceitar.
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import {
  anotarAchado,
  apagarSemErro,
  contarLinhas,
  esperarDesfecho,
  montarModelo,
  print,
  vazamentoHorizontal,
} from "./helpers/caminho-triste";

let conta: UsuarioDescartavel;
let cliente: SupabaseClient;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j11-formularios");
  cliente = await clienteAutenticado(conta);
});

test.afterAll(async () => {
  await apagarSemErro(conta);
});

const contarModelos = () => contarLinhas(cliente, "modelo_treino", { usuario_id: conta.id });

const IDIOMAS_FORMULARIO = [
  { opcao: "Português", salvo: "Idioma salvo.", acao: "Salvar meta", erro: "A meta precisa ser um número inteiro entre 1 e 7." },
  { opcao: "English", salvo: "Language saved.", acao: "Save goal", erro: "The goal must be a whole number between 1 and 7." },
  { opcao: "Español", salvo: "Idioma guardado.", acao: "Guardar meta", erro: "La meta debe ser un número entero entre 1 y 7." },
] as const;

async function trocarIdiomaPelaTela(page: Page, idioma: (typeof IDIOMAS_FORMULARIO)[number]): Promise<void> {
  await page.goto("/ajustes");
  await page.getByRole("radio", { name: idioma.opcao }).click();
  await expect(page.getByText(idioma.salvo, { exact: true })).toBeVisible();
}

// ============================================================
// 1. MODELO DE TREINO
// ============================================================

const PLANOS_FORA_DO_LIMITE = [
  { nome: "reps 150", plano: { reps: "150" } },
  { nome: "reps 2,5", plano: { reps: "2.5" } },
  { nome: "peso 1000,5", plano: { peso: "1000.5" } },
];

for (const caso of PLANOS_FORA_DO_LIMITE) {
  test(`modelo: plano com ${caso.nome} não pode deixar um modelo vazio no banco`, async ({ page }) => {
    await entrarComoUsuario(page, conta);
    const antes = await contarModelos();
    await montarModelo(page, `QA ${caso.nome} ${Date.now()}`, caso.plano);
    await page.getByRole("button", { name: "Salvar modelo" }).click();
    await esperarDesfecho(page, "/ajustes/modelos");
    await print(page, `modelo-${caso.nome.replace(/\W+/g, "-")}`);

    const criados = (await contarModelos()) - antes;
    if (criados > 0) {
      const { data } = await cliente
        .from("modelo_treino")
        .select("id, modelo_treino_exercicio(id)")
        .eq("usuario_id", conta.id)
        .order("criado_em", { ascending: false })
        .limit(1)
        .single();
      const itens = (data?.modelo_treino_exercicio as unknown[] | undefined)?.length ?? 0;
      anotarAchado(`${caso.nome}: ${criados} modelo(s) criado(s); o mais recente tem ${itens} exercício(s)`);
    }
    expect(criados, `ACHADO: ${caso.nome} deixou ${criados} modelo(s) no banco apesar da recusa`).toBe(0);
  });
}

test("modelo: nome só de espaços não avança", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes/modelos/novo");
  await page.locator("#nome_modelo").fill("      ");
  await expect(page.getByRole("button", { name: "Continuar" }), "nome só de espaços liberou o botão").toBeDisabled();
});

test("modelo: nome de 10 mil caracteres não quebra a lista de modelos no celular", async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoUsuario(page, conta);
  await page.setViewportSize({ width: 375, height: 812 });
  await montarModelo(page, `Treino${"A".repeat(10_000)}`);
  await page.getByRole("button", { name: "Salvar modelo" }).click();
  await esperarDesfecho(page, "/ajustes/modelos");

  if (new URL(page.url()).pathname === "/ajustes/modelos") {
    await page.waitForLoadState("networkidle").catch(() => {});
    const vazamento = await vazamentoHorizontal(page);
    await print(page, "lista-com-nome-gigante");
    if (vazamento > 1) anotarAchado(`nome de 10 mil caracteres estourou a lista em ${vazamento}px a 375px`);
    expect.soft(vazamento, "ACHADO: o nome gigante empurrou a lista de modelos para fora da tela").toBeLessThanOrEqual(1);
  } else {
    await print(page, "nome-gigante-recusado");
  }
  expect.soft(await page.getByText(/Application error/i).count()).toBe(0);
});

test("modelo: nome com símbolo gráfico é salvo e aparece igual na lista", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  const nome = `Peito \u{1F4AA} & <b>tríceps</b> ${Date.now()}`;
  await montarModelo(page, nome);
  await page.getByRole("button", { name: "Salvar modelo" }).click();
  await esperarDesfecho(page, "/ajustes/modelos");
  await print(page, "nome-com-simbolo");
  await expect(page.getByText(nome), "o nome digitado não aparece literal na lista").toBeVisible();
});

test("modelo: duplo clique em 'Salvar modelo' cria um modelo só", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  const antes = await contarModelos();
  await montarModelo(page, `QA duplo clique ${Date.now()}`);
  await page.getByRole("button", { name: "Salvar modelo" }).dblclick();
  await esperarDesfecho(page, "/ajustes/modelos");
  await page.waitForTimeout(2_000);
  const criados = (await contarModelos()) - antes;
  await print(page, "modelo-duplo-clique");
  expect(criados, `ACHADO: o duplo clique criou ${criados} modelos`).toBe(1);
});

// ============================================================
// 2. ANILHAS
// ============================================================

test("anilhas: peso da barra zero, negativo ou absurdo não é salvo", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  for (const valor of ["0", "-5", "99999999"]) {
    await page.goto("/ajustes/anilhas");
    await page.getByLabel("Peso da barra em kg").fill(valor);
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.locator(".aviso-erro").or(page.getByText("Configuração salva."))).toBeVisible({
      timeout: 15_000,
    });
    await print(page, `barra-${valor}`);
    expect.soft(await page.getByText("Configuração salva.").count(), `barra de ${valor} kg foi salva`).toBe(0);
  }
  const { data } = await cliente.from("usuario").select("peso_barra").eq("id", conta.id).single();
  expect.soft(Number(data?.peso_barra), "uma barra inválida chegou ao banco").toBe(20);
});

test("anilhas: anilha de 0,001 kg não pode virar anilha de 0 kg", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  try {
    await page.goto("/ajustes/anilhas");
    await page.locator("#nova_anilha").fill("0.001");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.locator(".aviso-erro").or(page.getByText("Configuração salva."))).toBeVisible({
      timeout: 15_000,
    });
    await page.reload();
    await print(page, "anilha-milesimal");

    const { data } = await cliente.from("usuario").select("anilhas_disponiveis").eq("id", conta.id).single();
    const anilhas = ((data?.anilhas_disponiveis as number[] | undefined) ?? []).map(Number);
    if (anilhas.some((a) => a <= 0)) anotarAchado(`inventário salvo: ${anilhas.join(", ")}`);
    expect(anilhas.some((a) => a <= 0), "ACHADO: a anilha de 0,001 kg foi arredondada e salva como 0 kg").toBe(false);
  } finally {
    await cliente
      .from("usuario")
      .update({ peso_barra: 20, anilhas_disponiveis: [20, 15, 10, 5, 2.5, 1.25] })
      .eq("id", conta.id);
  }
});

// ============================================================
// 3. META SEMANAL
// ============================================================

test("meta: 0, 8, 3,5 e -1 são recusados na tela, e 99 é recusado pelo banco", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  for (const valor of ["0", "8", "3.5", "-1"]) {
    await page.goto("/ajustes");
    await page.locator("#meta_treinos").fill(valor);
    await page.getByRole("button", { name: "Salvar meta" }).click();
    await expect(page.locator(".aviso-erro").or(page.getByText(/Meta salva\./))).toBeVisible({ timeout: 15_000 });
    await print(page, `meta-${valor}`);
    expect.soft(await page.getByText(/Meta salva\./).count(), `meta ${valor} foi salva`).toBe(0);
  }
  const { error } = await cliente.from("usuario").update({ meta_treinos_semana: 99 }).eq("id", conta.id);
  expect.soft(error, "meta 99 gravada direto pela API").not.toBeNull();
});

for (const idioma of IDIOMAS_FORMULARIO) {
  test(`meta inválida: ação e erro aparecem em ${idioma.opcao}`, async ({ page }) => {
    await entrarComoUsuario(page, conta);
    await trocarIdiomaPelaTela(page, idioma);
    await page.goto("/ajustes");
    await page.locator("#meta_treinos").fill("0");
    await page.getByRole("button", { name: idioma.acao, exact: true }).click();
    await expect(page.locator(".aviso-erro")).toHaveText(idioma.erro);
  });
}
