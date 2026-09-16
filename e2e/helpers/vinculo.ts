// lastro · O vínculo personal↔aluno como fixture (PRD §11.4.3).
//
// Extraído de `j6` e `j7`, que faziam a mesma dança inline: o personal
// gera o código, o aluno abre o link, informa o WhatsApp e aceita. Três
// specs precisando disso é sinal de fixture, não de repetição — e
// duplicar o fluxo de CONSENTIMENTO é o pior lugar para as cópias
// divergirem: um teste aceitando de um jeito que a tela não permite mais
// passaria a medir uma porta que não existe.
//
// Tudo passa pela INTERFACE, de propósito. Dava para chamar
// `aceitar_convite_personal` direto no banco e seria mais rápido, mas
// então o aceite dos testes deixaria de ser o aceite do produto — e a
// §11.4.3 é sobre consentimento, que é exatamente a parte que não pode
// ser simulada por atalho.
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { entrarComoUsuario, type UsuarioDescartavel } from "./usuario-descartavel";

/** Formato aceito pelo campo; o app normaliza para E.164 sem o "+". */
export const TELEFONE_PADRAO = "83 97777-6666";
export const TELEFONE_PADRAO_E164 = "5583977776666";

export type VinculoCriado = {
  contextoPersonal: BrowserContext;
  telaPersonal: Page;
  contextoAluno: BrowserContext;
  telaAluno: Page;
  codigo: string;
};

/**
 * Cria as duas sessões, gera o convite e aceita — deixando personal e
 * aluno logados e vinculados. Devolve os dois contextos para o spec
 * fechar o que abriu.
 */
export async function criarVinculoAceito({
  browser,
  personal,
  aluno,
  telefone = TELEFONE_PADRAO,
}: {
  browser: Browser;
  personal: UsuarioDescartavel;
  aluno: UsuarioDescartavel;
  telefone?: string;
}): Promise<VinculoCriado> {
  const contextoPersonal = await browser.newContext();
  const telaPersonal = await contextoPersonal.newPage();
  await entrarComoUsuario(telaPersonal, personal);
  await telaPersonal.goto("/ajustes/personal");
  await telaPersonal.getByRole("button", { name: "Gerar convite", exact: true }).click();

  const codigo = (
    await telaPersonal.locator(".codigo-convite").first().textContent({ timeout: 15_000 })
  )?.trim();
  // O alfabeto exclui O, I, L, 0 e 1 (`vinculo_codigo_formato`, migração
  // 0022). Conferir aqui evita o spec seguir com um código truncado e
  // falhar três passos adiante, num lugar que não diz o que aconteceu.
  expect(codigo, "o convite precisa ter gerado um código válido").toMatch(
    /^[A-HJ-NP-Z2-9]{10}$/,
  );

  const contextoAluno = await browser.newContext();
  const telaAluno = await contextoAluno.newPage();
  await entrarComoUsuario(telaAluno, aluno);
  await telaAluno.goto(`/ajustes/personal?codigo=${codigo}`);
  await telaAluno.locator("#telefone_whatsapp").fill(telefone);
  await telaAluno.getByRole("button", { name: /Aceitar convite/i }).click();
  // O sinal de aceite CONCLUÍDO é o botão de revogar, que só existe no ramo
  // `if (vinculo)` do `VinculoAluno`.
  //
  // A primeira versão esperava `getByText(/Seu personal/i)`, com um
  // comentário dizendo que esse texto "só existe depois do aceite". Era
  // falso: a tela ANTES do aceite já diz "É por aqui que o seu personal te
  // chama". A espera casava na hora, o helper voltava com o server action
  // do aceite ainda no ar ("Aceitando…"), e o spec que fechava a sessão do
  // aluno logo depois MATAVA o aceite. A j7 perdeu essa corrida duas vezes
  // seguidas no CI da casca (run 34621890356) e vinha ganhando por sorte
  // desde a extração deste helper.
  //
  // Regra que fica: sinal de "terminou" tem de ser algo que NÃO pode existir
  // antes — nunca um texto que por acaso aparece nos dois estados.
  await expect(
    telaAluno.getByRole("button", { name: /Revogar o vínculo/i }),
  ).toBeVisible({ timeout: 15_000 });

  return { contextoPersonal, telaPersonal, contextoAluno, telaAluno, codigo: codigo! };
}

/** Define o nome do perfil — contas criadas pela API de admin nascem sem ele. */
export async function nomear(
  cliente: SupabaseClient,
  usuarioId: string,
  nome: string,
): Promise<void> {
  const { error } = await cliente.from("usuario").update({ nome }).eq("id", usuarioId);
  if (error) throw new Error(`Falha ao nomear ${nome}: ${error.message}`);
}
