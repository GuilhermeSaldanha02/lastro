// lastro · PROGRESS.md pendência 4 — perfil do usuário (nome, foto).
// A criação da linha em `usuario` é responsabilidade do trigger da
// migração 0004 (dispara no INSERT em auth.users); este arquivo só lê o
// perfil já existente e, no caso do Google, baixa o avatar pra Storage.
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Perfil = {
  nome: string;
  avatarUrl: string | null;
};

export async function obterPerfil(): Promise<Perfil | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuario")
    .select("nome, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // O trigger da 0004 garante que a linha existe pra toda conta nova;
  // null aqui só acontece se o backfill ainda não rodou nesta base.
  if (!data) return null;
  return { nome: data.nome, avatarUrl: data.avatar_url };
}

const CAMINHO_BUCKET = "avatares";

/**
 * Baixa a foto do Google pro Storage do projeto e grava a URL pública em
 * `usuario.avatar_url`. Chamada só depois de login com sessão real — nunca
 * bloqueia o fluxo de auth: quem chama envolve isto em try/catch e ignora
 * falha (DECISIONS.md 2026-08-07 — o Google pode mudar a URL ou dar 404 a
 * qualquer momento, e isso não pode derrubar o login).
 */
export async function sincronizarAvatarGoogle(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const avatarGoogle = user.user_metadata?.avatar_url as string | undefined;
  if (!avatarGoogle) return;

  const { data: perfil } = await supabase
    .from("usuario")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  // Já baixado nesta conta — não repetir a cada login (o `?` acima cobre
  // a linha não existir ainda, embora o trigger já devesse ter criado).
  if (!perfil || perfil.avatar_url) return;

  const resposta = await fetch(avatarGoogle);
  if (!resposta.ok) return;

  const bytes = await resposta.arrayBuffer();
  const tipo = resposta.headers.get("content-type") ?? "image/jpeg";
  const extensao = tipo.includes("png") ? "png" : "jpg";
  const caminho = `${user.id}/avatar.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(CAMINHO_BUCKET)
    .upload(caminho, bytes, { contentType: tipo, upsert: true });
  if (erroUpload) return;

  const {
    data: { publicUrl },
  } = supabase.storage.from(CAMINHO_BUCKET).getPublicUrl(caminho);

  await supabase.from("usuario").update({ avatar_url: publicUrl }).eq("id", user.id);
}
