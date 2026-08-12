"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { validarArquivoAvatar } from "./validar-avatar";

const CAMINHO_BUCKET = "avatares";

export type ResultadoAtualizarAvatar =
  | { ok: true; avatarUrl: string }
  | { ok: false; erro: string };

/**
 * Upload manual de foto — quem cadastrou por e-mail não tem `avatar_url`
 * do Google pra baixar (`sincronizarAvatarGoogle` em `perfil.ts` não se
 * aplica). Chamada direto do componente cliente de `/perfil`.
 *
 * Vive em arquivo próprio (não em `perfil.ts`) porque `"use server"` no
 * Next.js 16/Turbopack deste projeto é diretiva de ARQUIVO INTEIRO, não
 * de função individual: um Client Component que importa qualquer coisa
 * de um arquivo arrasta os imports de topo desse arquivo inteiro pro
 * bundle do cliente. `perfil.ts` usa `next/headers`/`next/cache` em
 * funções que não são Server Actions (`obterPerfil`,
 * `sincronizarAvatarGoogle`) — misturar essas com uma Server Action no
 * mesmo arquivo quebra o build (`npm run build` confirmou o erro).
 */
export async function atualizarAvatarManual(
  arquivo: File,
): Promise<ResultadoAtualizarAvatar> {
  const validacao = validarArquivoAvatar(arquivo);
  if (!validacao.ok) return validacao;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  const extensao = arquivo.type.includes("png") ? "png" : "jpg";
  const caminho = `${user.id}/avatar.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(CAMINHO_BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: true });
  if (erroUpload) {
    return { ok: false, erro: "Não foi possível enviar a foto. Tente de novo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CAMINHO_BUCKET).getPublicUrl(caminho);

  // Cache-buster: o caminho é determinístico por formato (upsert sobrescreve
  // o mesmo arquivo), então trocar de foto duas vezes com o mesmo formato
  // gera a mesma `publicUrl` — sem isso, nem o banco muda nem o navegador
  // rebusca a imagem.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: erroAtualizar } = await supabase
    .from("usuario")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (erroAtualizar) {
    return {
      ok: false,
      erro: "Foto enviada, mas não deu para salvar o perfil. Tente de novo.",
    };
  }

  revalidatePath("/", "layout");

  return { ok: true, avatarUrl };
}
