// lastro · módulo de idiomas (pedido do dono, 2026-08-24). Preferência
// de idioma vive em `usuario.idioma` (migração 0012) — precisa ser lida
// no SERVIDOR antes de qualquer render, porque o catálogo e o parecer
// da Gemini são resolvidos no servidor (diferente do tema, que é
// localStorage e só afeta CSS no cliente).
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { t } from "@/lib/texto/i18n";

export type Idioma = "pt-BR" | "en" | "es";

const IDIOMAS_VALIDOS: readonly Idioma[] = ["pt-BR", "en", "es"];

/**
 * Idioma efetivo desta requisição. `usuario.idioma` é `null` até a
 * pessoa escolher em /ajustes (mesmo raciocínio honesto do
 * `meta_treinos_semana`) — aqui é o único lugar que decide o
 * PADRÃO de exibição para esse `null`: pt-BR, porque é o idioma
 * original do app e o que `exercicio.nome`/`grupo_muscular.nome`
 * já guardam sem lookup nenhum.
 */
export async function obterIdioma(): Promise<Idioma> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "pt-BR";

  const { data } = await supabase
    .from("usuario")
    .select("idioma")
    .eq("id", user.id)
    .maybeSingle();

  const idioma = data?.idioma;
  return idioma && IDIOMAS_VALIDOS.includes(idioma as Idioma)
    ? (idioma as Idioma)
    : "pt-BR";
}

export type ResultadoDefinirIdioma = { ok: true } | { ok: false; erro: string };

export async function definirIdioma(idioma: Idioma): Promise<ResultadoDefinirIdioma> {
  if (!IDIOMAS_VALIDOS.includes(idioma)) {
    return { ok: false, erro: "Idioma inválido." };
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Erro traduzido no idioma que a pessoa ACABOU DE ESCOLHER na tela
  // (não o idioma antigo salvo) — é a língua que ela está lendo agora.
  if (!user) return { ok: false, erro: t("Sessão ausente — entre de novo.", idioma) };

  const { error } = await supabase
    .from("usuario")
    .update({ idioma })
    .eq("id", user.id);

  if (error) return { ok: false, erro: t("Não foi possível salvar. Tente de novo.", idioma) };

  // "layout" porque o idioma afeta praticamente toda tela — catálogo,
  // formulário de série, histórico, home — não só /ajustes.
  revalidatePath("/", "layout");

  return { ok: true };
}
