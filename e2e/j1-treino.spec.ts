// lastro · Fase 6 (E2E) — J1: registrar treino, resiliente a offline
// (PRD §6, critério A1/A2/D7). Cada teste cria e apaga seu próprio
// usuário QA descartável no Supabase hospedado (ver
// e2e/helpers/usuario-descartavel.ts) — nada de mock aqui: é a jornada
// que a Fase 6 pediu pra cobrir de ponta a ponta.
import { test, expect } from "@playwright/test";
import {
  criarUsuarioDescartavel,
  apagarUsuarioDescartavel,
  entrarComoUsuario,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";

let usuario: UsuarioDescartavel;

test.beforeAll(async () => {
  usuario = await criarUsuarioDescartavel("j1");
});

test.afterAll(async () => {
  await apagarUsuarioDescartavel(usuario);
});

/** Preenche o formulário de série já aberto (FormularioSerie) e registra. */
async function registrarSerie(
  page: import("@playwright/test").Page,
  { reps, peso }: { reps: string; peso: string },
) {
  await page.locator("#exercicio_id").selectOption({ index: 1 });
  await page.locator("#tipo").selectOption("valendo");
  await page.locator("#reps").fill(reps);
  await page.locator("#peso").fill(peso);
  await page.getByRole("button", { name: "Registrar série" }).click();
}

test("registra uma série e ela sobrevive a ficar offline e voltar (A1/A2/D7)", async ({
  page,
  context,
}) => {
  await entrarComoUsuario(page, usuario);

  await page.goto("/treino");
  await page.getByRole("button", { name: "Iniciar treino de hoje" }).click();
  await page.waitForURL(/\/treino\/[^/]+$/);

  // Primeiro exercício: escolhe o grupo muscular do dia (obrigatório antes
  // do formulário de série aparecer) e confirma — achado ao investigar o
  // timeout inicial deste teste: o formulário não fica visível de cara.
  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  // O input fica visualmente escondido atrás do rótulo estilizado
  // (`label.chip`) — clicar nele direto, não no input (achado real: o
  // input intercepta o clique do próprio label por cima e trava o teste).
  await page.locator("label.chip").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Primeira série, online — confirma o caminho feliz antes de testar offline.
  await registrarSerie(page, { reps: "8", peso: "40" });

  await expect(page.locator(".card-obsidian")).toHaveCount(1);
  await expect(page.getByText("1 série valendo")).toBeVisible();

  // "Outra série" reabre o formulário pro MESMO grupo/exercício já
  // escolhido — não precisa repetir a escolha de grupo muscular.
  await page.getByRole("button", { name: "Outra série" }).click();

  // Modo avião (PRD §6, J1: "modo avião → reconectar"): registra offline,
  // a série entra na fila local (Dexie) e a UI mostra "salvo no aparelho"
  // (D7) em vez de travar ou dar erro de rede.
  await context.setOffline(true);

  await registrarSerie(page, { reps: "6", peso: "42.5" });

  await expect(page.getByText("2 séries valendo")).toBeVisible();
  await expect(page.locator(".sync")).toContainText("salvo no aparelho");

  // Reconecta — o outbox (src/lib/offline/sincronizar-pendentes.ts) drena
  // sozinho, sem recarregar a página (é esse o ponto da fila global, OF-03).
  await context.setOffline(false);
  await expect(page.locator(".sync")).toContainText("sincronizado", {
    timeout: 20_000,
  });

  // Prova final: recarrega e confirma que as 2 séries estão persistidas no
  // servidor (não só otimistas na memória do cliente).
  await page.reload();
  await expect(page.getByText("2 séries valendo")).toBeVisible();
});
