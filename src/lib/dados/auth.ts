// lastro · tarefa 2.1 — login por e-mail/senha e logout. O login com
// Google (OAuth) não passa por aqui: precisa rodar no navegador
// (`signInWithOAuth` redireciona a aba pro consentimento do Google), então
// vive em `login/page.tsx` usando o cliente de navegador diretamente.
"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { normalizarTelefoneWhatsApp } from "@/lib/texto/whatsapp";

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
  nome: string,
  telefoneBruto: string,
): Promise<ResultadoAuth> {
  const supabase = await criarClienteServidor();

  // Contato obrigatório no cadastro — decisão do dono em 2026-09-11. Vale
  // para quem treina sozinho também: o número é dado do próprio usuário,
  // e não uma concessão ao personal (migração 0022, seção 1).
  //
  // Validado AQUI porque o trigger do banco não pode reclamar: exceção
  // dentro do insert em `auth.users` aborta a criação da conta inteira, e
  // o trigger por isso descarta telefone inválido em silêncio. Se a
  // checagem não acontecer nesta camada, a pessoa cria a conta achando que
  // informou o contato e ele simplesmente não está lá.
  const telefone = normalizarTelefoneWhatsApp(telefoneBruto);
  if (!telefone) {
    return {
      ok: false,
      erro: "Telefone inválido. Escreva com DDD, por exemplo 83 99999-8888.",
    };
  }

  // `options.data` vira `raw_user_meta_data` em auth.users — é de lá que
  // o trigger `usuario_cria_perfil` (migrações 0004 e 0022) lê o nome e o
  // telefone pra criar a linha de perfil. Sem isto, a conta nasceria sem
  // nome nenhum e o trigger cairia no fallback de e-mail (PROGRESS.md
  // pendência 4).
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, telefone_whatsapp: telefone } },
  });
  if (error) return { ok: false, erro: error.message };
  return { ok: true, confirmacaoPendente: !data.session };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
