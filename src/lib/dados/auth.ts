// lastro · tarefa 2.1 — login por e-mail/senha e logout. O login com
// Google (OAuth) não passa por aqui: precisa rodar no navegador
// (`signInWithOAuth` redireciona a aba pro consentimento do Google), então
// vive em `login/page.tsx` usando o cliente de navegador diretamente.
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PARAM_RETORNO } from "@/lib/rota-de-retorno";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { normalizarTelefoneWhatsApp } from "@/lib/texto/whatsapp";
import { crefValido, normalizarCref } from "@/lib/texto/cref";
import { validarSenhaNova } from "@/lib/texto/senha";

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
  if (error) {
    // O Supabase exige confirmar o e-mail antes da primeira entrada. Sem esta
    // mensagem, quem acabou de criar a conta e ainda não clicou no link via
    // "senha inválida" e tentava trocar uma senha que estava certa.
    if (error.code === "email_not_confirmed") {
      return {
        ok: false,
        erro: "Confirme seu e-mail antes de entrar. Procure a mensagem do lastro na caixa de entrada ou no spam.",
      };
    }
    return { ok: false, erro: "E-mail ou senha inválidos." };
  }
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

  // Senha forte no cadastro (pedido do dono, 2026-09-14). A proteção contra
  // senha vazada do Supabase só existe no plano Pro, e este projeto está no
  // gratuito — a régua do app é a única defesa. A tela checa antes de
  // enviar; esta repetição é o que vale contra quem chama a função direto.
  const senhaValida = validarSenhaNova(senha);
  if (!senhaValida.ok) {
    return { ok: false, erro: senhaValida.erro };
  }

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

/**
 * "Esqueci minha senha" (PU-05). Manda o link de recuperação do Supabase.
 *
 * A resposta é a MESMA exista ou não conta com esse e-mail: dizer "e-mail
 * não cadastrado" transformaria o formulário num verificador de quem tem
 * conta no lastro. A única falha que aparece é o limite de envio, que não
 * revela nada sobre o e-mail.
 *
 * O link cai em `/auth/callback` (troca o código por sessão) e segue para
 * `/redefinir-senha`, onde a sessão de recuperação vale só para trocar a
 * senha. O `redirectTo` precisa estar na lista de URLs permitidas do
 * Supabase Auth; o do Google já está.
 */
export async function pedirRecuperacaoSenha(
  email: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const enderecoLimpo = email.trim();
  if (!enderecoLimpo.includes("@")) {
    return { ok: false, erro: "Escreva o e-mail da sua conta." };
  }

  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
  const protocolo = host?.startsWith("localhost") ? "http" : "https";
  const callback = new URL(`${protocolo}://${host}/auth/callback`);
  callback.searchParams.set(PARAM_RETORNO, "/redefinir-senha");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(enderecoLimpo, {
    redirectTo: callback.toString(),
  });
  if (error?.status === 429) {
    return {
      ok: false,
      erro: "Muitos pedidos seguidos. Espere alguns minutos e tente de novo.",
    };
  }
  if (error) {
    console.error("[auth] falha ao pedir recuperação de senha", error.message);
  }
  return { ok: true };
}

/**
 * Grava a senha nova de quem chegou pelo link de recuperação (ou de
 * qualquer sessão válida). Passa pela mesma régua do cadastro
 * (`validarSenhaNova`): trocar por uma senha fraca seria a porta dos
 * fundos da regra de criar conta.
 */
export async function redefinirSenha(
  senhaNova: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const senhaValida = validarSenhaNova(senhaNova);
  if (!senhaValida.ok) return { ok: false, erro: senhaValida.erro };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      erro: "O link expirou. Peça um novo em “Esqueci minha senha”.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: senhaNova });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, erro: "Escolha uma senha diferente da atual." };
    }
    console.error("[auth] falha ao redefinir senha", error.message);
    return { ok: false, erro: "Não foi possível trocar a senha. Tente de novo." };
  }
  return { ok: true };
}
