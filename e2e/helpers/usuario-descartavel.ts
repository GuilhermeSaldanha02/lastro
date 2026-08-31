// lastro · Fase 6 (E2E) — usuário QA descartável por spec.
//
// Mesma técnica do `scripts/qa-treino-helper.sh` (criar via admin, apagar
// no final, cascade garante `sobrou: 0`), mas via `@supabase/supabase-js`
// em vez de SQL cru — não depende de `npx supabase link` (que o
// `qa-treino-helper.sh` original precisa, e que o CI não tem configurado).
// Roda contra o projeto Supabase HOSPEDADO (não há stack local, ver
// KNOWLEDGE.md) — por isso cada spec cria e apaga o próprio usuário.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export function clienteAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes — configure .env.local (dev) ou os secrets do GitHub Actions (CI).",
    );
  }
  return createClient(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type UsuarioDescartavel = { id: string; email: string; senha: string };

/** Cria um usuário QA já com e-mail confirmado — pronto pra logar pela UI. */
export async function criarUsuarioDescartavel(
  prefixo: string,
): Promise<UsuarioDescartavel> {
  const admin = clienteAdmin();
  const email = `qa.e2e.${prefixo}.${Date.now()}@lastro.test`;
  const senha = `Qa!${Math.random().toString(36).slice(2)}A1`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário QA descartável: ${error?.message}`);
  }
  return { id: data.user.id, email, senha };
}

/** Apaga o usuário — `on delete cascade` (0001_schema_inicial.sql) cuida de treino/serie. */
export async function apagarUsuarioDescartavel(
  usuario: UsuarioDescartavel,
): Promise<void> {
  const admin = clienteAdmin();
  const { error } = await admin.auth.admin.deleteUser(usuario.id);
  if (error) {
    throw new Error(
      `Falha ao apagar usuário QA descartável ${usuario.email}: ${error.message}`,
    );
  }
}

/**
 * Cliente autenticado como o usuário QA (chave publishable + login real),
 * pra semear dado (treino/serie) sem passar pela UI.
 *
 * Achado ao rodar a suíte pela primeira vez: `service_role` neste projeto
 * NÃO tem GRANT nenhum nas tabelas do PostgREST (só as chamadas
 * `auth.admin.*`, que são API do GoTrue, funcionam) — `select`/`insert`
 * direto via `clienteAdmin()` falha com "permission denied for table X".
 * Não é RLS (que `service_role` ignoraria de qualquer forma), é ausência
 * de GRANT de base — `cliente-admin.ts` nunca precisou disso porque seu
 * único uso (`auth.admin.deleteUser`, C5) também não toca PostgREST.
 * Corrigir os GRANTs é mudança de permissão no banco de produção — fora
 * do escopo desta tarefa, fica registrado pro dono decidir (QA.md). Este
 * helper contorna sem precisar de privilégio nenhum além do que qualquer
 * usuário real já tem: loga como o próprio usuário QA e insere só o que a
 * RLS já deixaria a pessoa inserir para si mesma.
 */
export async function clienteAutenticado(
  usuario: UsuarioDescartavel,
): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes — configure .env.local (dev) ou os secrets do GitHub Actions (CI).",
    );
  }
  const cliente = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.email,
    password: usuario.senha,
  });
  if (error) {
    throw new Error(`Falha ao autenticar usuário QA ${usuario.email}: ${error.message}`);
  }
  return cliente;
}

/** Login real pela UI (não pelo cookie construído à mão) — cobre a mesma tela que a pessoa usa. */
export async function entrarComoUsuario(
  page: Page,
  usuario: UsuarioDescartavel,
): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(usuario.email);
  await page.locator("#senha").fill(usuario.senha);
  await page.getByRole("button", { name: "Entrar no Lastro" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}
