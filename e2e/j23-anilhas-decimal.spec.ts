// lastro · UX3-06 — em português as anilhas usam vírgula decimal ("2,5", não "2.5").
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let conta: UsuarioDescartavel;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j23-anilhas", "aluno");
  const cliente = await clienteAutenticado(conta);
  const { error } = await cliente
    .from("usuario")
    .update({ anilhas_disponiveis: [20, 10, 2.5, 1.25], idioma: "pt-BR" })
    .eq("id", conta.id);
  if (error) throw new Error(`não semeou anilhas: ${error.message}`);
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(conta);
});

test("anilhas: separador decimal em português é a vírgula", async ({ page }) => {
  await entrarComoUsuario(page, conta);
  await page.goto("/ajustes/anilhas");
  const texto = (await page.locator(".anilha").allTextContents()).join(" ");
  expect(texto, "ACHADO UX3-06: 2.5 com ponto em português").toMatch(/2,5/);
  expect(texto).toMatch(/1,25/);
  expect(texto).not.toMatch(/2\.5|1\.25/);
});
