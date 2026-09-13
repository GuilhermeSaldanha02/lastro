// lastro · tarefa 2.1 — login por e-mail/senha e logout. O login com
// Google (OAuth) não passa por aqui: precisa rodar no navegador
// (`signInWithOAuth` redireciona a aba pro consentimento do Google), então
// vive em `login/page.tsx` usando o cliente de navegador diretamente.
"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { normalizarTelefoneWhatsApp } from "@/lib/texto/whatsapp";
import { crefValido, normalizarCref } from "@/lib/texto/cref";

/** PRD §11, emenda de 2026-09-11: a escolha acontece no cadastro, não no uso. */
export type TipoConta = "aluno" | "personal";

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
  tipoConta: TipoConta = "aluno",
  crefBruto = "",
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
  // CREF é obrigatório para conta de personal, e a checagem é AQUI pelo
  // mesmo motivo do telefone: o banco não pode reclamar. A check de
  // `usuario_cref_formato` (0024) é frouxa de propósito e o trigger
  // descarta valor malformado em silêncio — sem esta camada, alguém
  // criaria conta de profissional achando que informou o registro, e ele
  // simplesmente não estaria lá.
  //
  // A validação estrita (seis dígitos, uma das 27 UFs) vive em
  // `texto/cref.ts`, testada, e é a mesma que a tela usa para habilitar o
  // botão. Duas réguas diferentes aqui e lá dariam um "salvou mas sumiu".
  let cref: string | null = null;
  if (tipoConta === "personal") {
    if (!crefValido(crefBruto)) {
      return {
        ok: false,
        erro: "CREF inválido. Use o formato 123456-G/PB, como está na sua carteira.",
      };
    }
    cref = normalizarCref(crefBruto);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        telefone_whatsapp: telefone,
        // O trigger falha FECHADO: qualquer coisa diferente de 'personal'
        // vira aluno lá dentro (0024). Mandar o valor explícito aqui é o
        // que torna a escolha da tela real.
        tipo_conta: tipoConta,
        ...(cref ? { cref } : {}),
      },
    },
  });
  if (error) return { ok: false, erro: error.message };
  return { ok: true, confirmacaoPendente: !data.session };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
