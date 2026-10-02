// lastro · A1-ACEITE — o reaceite da Política não interrompe quem está
// treinando. Conta com o aceite pendente (texto novo) e um treino EM ABERTO
// hoje: a Home (por onde o app reabre) abre e leva ao treino; as outras telas
// guardadas continuam mandando para /aceite; o aceite libera tudo.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { primeiroExercicio, semearTreino } from "./helpers/caminho-triste";
import { dataLocalBrasil } from "../src/lib/tempo";

let conta: UsuarioDescartavel;
let treinoId: string;

test.beforeAll(async () => {
  conta = await criarUsuarioDescartavel("j44-aceite-treino", "aluno", { comAceitePendente: true });
  const cliente = await clienteAutenticado(conta);
  const exercicio = await primeiroExercicio(cliente);
  ({ treinoId } = await semearTreino(cliente, conta.id, dataLocalBrasil(), exercicio.id, { reps: 8, peso: 40 }));
});

test.afterAll(async () => {
  if (conta) await apagarUsuarioDescartavel(conta);
});

test("com treino em aberto, a Home e o treino abrem sem o aceite; o resto continua guardado", async ({ page }) => {
  test.setTimeout(120_000);
  await entrarComoUsuario(page, conta);

  await page.goto("/");
  await expect(page, "a Home mandou para /aceite com treino em aberto").toHaveURL(/\/$/);
  const continuar = page.getByRole("link", { name: "Continuar Treino de Hoje" });
  await expect(continuar).toBeVisible({ timeout: 15_000 });
  await continuar.click();
  await expect(page).toHaveURL(new RegExp(`/treino/${treinoId}$`));

  // Fora da Home e do treino em si, o guarda segue valendo.
  await page.goto("/treino");
  await expect(page, "/treino abriu sem o aceite").toHaveURL(/\/aceite$/);
  await page.goto("/ajustes");
  await expect(page, "/ajustes abriu sem o aceite").toHaveURL(/\/aceite$/);

  await page.getByRole("button", { name: "Aceito e continuar" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
  await page.goto("/treino");
  await expect(page).toHaveURL(/\/treino$/);
});
