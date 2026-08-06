// lastro · tarefa 2.1 — login por e-mail/senha e logout. O login com
// Google (OAuth) não passa por aqui: precisa rodar no navegador
// (`signInWithOAuth` redireciona a aba pro consentimento do Google), então
// vive em `login/page.tsx` usando o cliente de navegador diretamente.
"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export type ResultadoAuth =
  | { ok: true; confirmacaoPendente: boolean }
  | { ok: false; erro: string };

export async function entrarComEmail(
  email: string,
  senha: string,
): Promise<ResultadoAuth> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) return { ok: false, erro: "E-mail ou senha inválidos." };
  return { ok: true, confirmacaoPendente: false };
}

/**
 * O projeto Supabase deste app tem confirmação de e-mail obrigatória
 * (`mailer_autoconfirm: false`, conferido em `/auth/v1/settings`) — uma
 * conta nova não ganha sessão até o dono clicar no link do e-mail. Por
 * isso o retorno distingue esse caso: a UI não pode assumir que criar
 * conta = já estar logado.
 */
export async function criarContaComEmail(
  email: string,
  senha: string,
): Promise<ResultadoAuth> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  });
  if (error) return { ok: false, erro: error.message };
  return { ok: true, confirmacaoPendente: !data.session };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
