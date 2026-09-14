// lastro · o ícone "i" que guarda a explicação de "o que é tal coisa"
// (pedido do dono, 2026-09-14; DECISIONS 2026-09-14 (3)).
//
// Roda na tela pública de cadastro, com o CREF de conta de personal: não
// precisa de conta nenhuma e não cria conta nenhuma. O que prova:
//   · a explicação NÃO está mais à vista antes do toque;
//   · o "i" abre a folha com o texto;
//   · o foco vai para o botão de fechar ao abrir e volta para o ícone ao
//     fechar (quem usa teclado não é jogado para o topo);
//   · fechar — por Esc ou tocando fora — não navega: a folha aberta por
//     estado não pode chamar `router.back()` como a folha de rota.
import { expect, test } from "@playwright/test";
import { print } from "./helpers/caminho-triste";

test("dica: o i do CREF abre a explicação numa folha e fecha sem sair da tela", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await page.getByRole("button", { name: /Cadastre-se/i }).click();
  await page.getByRole("radio", { name: "PERSONAL" }).click();

  const gatilho = page.getByRole("button", { name: "Saiba mais sobre CREF" });
  await expect(gatilho, "o ícone de informação do CREF não aparece no cadastro de personal").toBeVisible();
  await expect(
    page.getByText("verifica registro no CONFEF", { exact: false }),
    "a explicação do CREF continua à vista antes do toque",
  ).toHaveCount(0);
  await print(page, "dica-fechada");

  await gatilho.click();
  const folha = page.getByRole("dialog", { name: "CREF" });
  await expect(folha, "tocar no i não abriu a folha").toBeVisible();
  await expect(folha).toContainText("verifica registro no CONFEF");
  await expect(
    page.getByRole("button", { name: "Fechar CREF" }),
    "ao abrir, o foco deveria ir para o botão de fechar",
  ).toBeFocused();
  // O print tem de mostrar a folha PRONTA. A primeira rodada (run
  // 34805657227) fotografou no meio da entrada: o fundo anima a opacidade
  // de 0 a 1 e a folha sobe, então tudo saiu semitransparente por cima do
  // formulário. Espera todas as animações do fundo e da folha terminarem.
  const fundo = page.locator(".folha-fundo");
  await fundo.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  await expect
    .poll(() => fundo.evaluate((el) => getComputedStyle(el).opacity), {
      message: "o fundo da folha não terminou de aparecer",
    })
    .toBe("1");
  await print(page, "dica-aberta");

  await page.keyboard.press("Escape");
  await expect(folha, "Esc não fechou a folha").toHaveCount(0);
  await expect(gatilho, "ao fechar, o foco deveria voltar para o ícone").toBeFocused();
  expect(new URL(page.url()).pathname, "fechar a dica com Esc saiu da tela de cadastro").toBe("/login");

  await gatilho.click();
  await expect(folha).toBeVisible();
  // Canto de cima: é o fundo escurecido; a folha fica colada embaixo.
  await page.locator(".folha-fundo").click({ position: { x: 10, y: 10 } });
  await expect(folha, "tocar fora não fechou a folha").toHaveCount(0);
  expect(new URL(page.url()).pathname, "fechar a dica tocando fora saiu da tela de cadastro").toBe("/login");
  await expect(page.getByRole("radio", { name: "PERSONAL" }), "o cadastro perdeu o estado ao fechar a dica").toHaveAttribute(
    "aria-checked",
    "true",
  );
});
