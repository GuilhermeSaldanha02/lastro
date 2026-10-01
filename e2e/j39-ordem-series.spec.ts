// lastro · TR-17 (relato do dono, 2026-09-29): registrar 3 exercícios, apagar
// o 2º, adicionar um 4º e readicionar o apagado "fica dando bug".
//
// Causa: a série nova usava `ordem = series.length + 1`. Apagar encolhia a
// lista e a série seguinte repetia a `ordem` de outra; o carregador ordena por
// `ordem`, então o empate embaralhava a tela e o "Repetir série".
//
// A prova é o roteiro do dono: as `ordem` no banco ficam todas diferentes, e
// depois de recarregar os exercícios aparecem na ordem em que foram
// registrados, com "Repetir série" repetindo o último.
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import {
  apagarSemErro,
  esperarFilaAssentar,
  hojeNoBrasil,
  primeiroExercicio,
  print,
  semearTreino,
} from "./helpers/caminho-triste";

let aluno: UsuarioDescartavel;
let comoAluno: SupabaseClient;
let treinoId: string;
/** Quatro exercícios do mesmo grupo: o formulário só lista os do grupo do dia. */
let nomes: [string, string, string, string];

test.beforeAll(async () => {
  aluno = await criarUsuarioDescartavel("j39-ordem");
  comoAluno = await clienteAutenticado(aluno);
  const primeiro = await primeiroExercicio(comoAluno);
  const { data, error } = await comoAluno
    .from("exercicio")
    .select("id, nome")
    .eq("grupo_muscular_primario", primeiro.grupo)
    .order("nome")
    .limit(4);
  if (error || !data || data.length < 4) {
    throw new Error(`Preparação: o grupo ${primeiro.grupo} precisa de 4 exercícios: ${error?.message}`);
  }
  nomes = data.map((e) => e.nome) as typeof nomes;
  // O 1º exercício já entra semeado (ordem 1): a tela abre com o grupo escolhido.
  const semeado = await semearTreino(comoAluno, aluno.id, hojeNoBrasil(), data[0].id, { reps: 10, peso: 20 });
  treinoId = semeado.treinoId;
});

test.afterAll(async () => {
  await apagarSemErro(aluno);
});

async function registrarPelaTela(page: Page, nome: string, peso: string): Promise<void> {
  await page.getByRole("button", { name: /^(Outra série|Adicionar exercício)$/ }).click();
  await expect(page.locator("#reps")).toBeVisible();
  await page.locator("#exercicio_id").selectOption({ label: nome });
  await page.locator("#tipo").selectOption("valendo");
  await page.locator("#reps").fill("8");
  await page.locator("#peso").fill(peso);
  await page.getByRole("button", { name: "Registrar série" }).click();
  await expect(page.locator(".grade-exercicio__nome", { hasText: exato(nome) })).toBeVisible();
}

/** Nome exato: um exercício pode ser prefixo de outro ("Supino" e "Supino inclinado"). */
const exato = (nome: string) => new RegExp(`^${nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);

const nomesNaTela = (page: Page) => page.locator(".grade-exercicio__nome").allInnerTexts();

test("TR-17: apagar o 2º exercício e readicionar não repete a ordem nem embaralha a tela", async ({ page }) => {
  test.setTimeout(150_000);
  const [a, b, c, d] = nomes;
  await entrarComoUsuario(page, aluno);
  await page.goto(`/treino/${treinoId}`);

  await registrarPelaTela(page, b, "21");
  await registrarPelaTela(page, c, "22");

  // Apaga o 2º exercício (b): a única série dele.
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  const grupoB = page.locator(".grade-exercicio", { has: page.locator(".grade-exercicio__nome", { hasText: exato(b) }) });
  await grupoB.getByRole("button", { name: /Excluir série/ }).click();
  await page.locator(".confirma").getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(grupoB).toHaveCount(0);
  await page.getByRole("button", { name: "Concluído", exact: true }).click();

  await registrarPelaTela(page, d, "23");
  await registrarPelaTela(page, b, "24");
  await esperarFilaAssentar(page, 30_000);

  const { data: linhas, error } = await comoAluno
    .from("serie")
    .select("ordem, peso")
    .eq("treino_id", treinoId)
    .order("ordem");
  expect(error).toBeNull();
  const ordens = (linhas ?? []).map((s) => s.ordem);
  expect(new Set(ordens).size, `ordem repetida no banco: ${ordens.join(", ")}`).toBe(ordens.length);
  expect((linhas ?? []).map((s) => Number(s.peso)), "a ordem do banco segue a ordem de registro").toEqual([20, 22, 23, 24]);

  await page.reload();
  await expect.poll(() => nomesNaTela(page)).toEqual([a, c, d, b]);
  await print(page, "tr17-depois-de-recarregar");

  // "Repetir série" repete o último registrado (b), não um do empate.
  const grupoBDeNovo = page.locator(".grade-exercicio", { has: page.locator(".grade-exercicio__nome", { hasText: exato(b) }) });
  await page.getByRole("button", { name: "Repetir série" }).click();
  await expect(grupoBDeNovo.locator(".grade-series__linha")).toHaveCount(2);
});
