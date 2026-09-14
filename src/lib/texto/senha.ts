// lastro · régua da senha de quem CRIA conta por e-mail.
//
// Por que existe (pedido do dono, 2026-09-14): o verificador de segurança do
// Supabase aponta que a proteção contra senha vazada (HaveIBeenPwned) está
// desligada, e ela só existe do plano Pro para cima. O projeto está no plano
// gratuito. Sem essa proteção, a única defesa contra senha fraca é a régua
// do próprio app — e ela era só o `minLength={6}` do navegador.
//
// A régua: pelo menos 10 caracteres, com letra minúscula, letra maiúscula e
// número. Símbolo não é exigido de propósito: atrapalha no teclado do
// celular e rende pouco perto do comprimento. Máximo de 72 caracteres, o
// limite do bcrypt que o Supabase Auth usa (o que passa disso é ignorado).
//
// Vale só para CRIAR conta. Quem já tem conta continua entrando com a senha
// que tem — mudar a régua não pode trancar ninguém do lado de fora.
//
// Função pura, sem "use server"/"use client": a tela usa para avisar antes
// de enviar e o servidor (`criarContaComEmail`) repete a mesma checagem.
export const SENHA_MINIMO = 10;
export const SENHA_MAXIMO = 72;

export function validarSenhaNova(senha: string): { ok: true } | { ok: false; erro: string } {
  if (senha.length < SENHA_MINIMO) {
    return { ok: false, erro: `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.` };
  }
  if (senha.length > SENHA_MAXIMO) {
    return { ok: false, erro: `A senha pode ter no máximo ${SENHA_MAXIMO} caracteres.` };
  }
  if (!/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return {
      ok: false,
      erro: "A senha precisa ter letra minúscula, letra maiúscula e número.",
    };
  }
  return { ok: true };
}
