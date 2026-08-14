// lastro · backlog C5 — excluir a própria conta. A exclusão em cascata já
// existe no schema (todas as tabelas de dado do usuário referenciam
// auth.users com `on delete cascade`, verificado repetidamente por
// `qa-treino-helper.sh limpar-usuario`); faltava a porta na UI.
"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { criarClienteAdmin } from "@/lib/supabase/cliente-admin";

/**
 * Apaga a conta do usuário AUTENTICADO — nunca recebe um id como
 * argumento, de propósito: o alvo só pode ser "quem está logado agora"
 * (ADR-010). `auth.admin.deleteUser` exige a service_role key porque
 * `auth.users` não é uma tabela que RLS/grant comum alcança.
 */
export async function excluirConta(): Promise<void> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error: erroSessao,
  } = await supabase.auth.getUser();
  if (erroSessao || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }

  const admin = criarClienteAdmin();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`Falha ao excluir conta: ${error.message}`);

  await supabase.auth.signOut();
  redirect("/login");
}
