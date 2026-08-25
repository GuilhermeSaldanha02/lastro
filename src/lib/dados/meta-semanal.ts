// lastro · T4 — meta semanal de treinos configurável. Arquivo próprio,
// não em `perfil.ts`: mesma razão documentada em `atualizar-avatar.ts`
// — `"use server"` é diretiva de ARQUIVO INTEIRO no Next.js/Turbopack
// deste projeto, e `perfil.ts` tem funções que não são Server Actions
// (`obterPerfil`, `sincronizarAvatarGoogle`) misturadas com imports que
// quebram o build se viraram uma coisa só.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obterIdioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

export type ResultadoDefinirMeta = { ok: true } | { ok: false; erro: string };

/**
 * Grava a meta semanal de treinos. `null` limpa a preferência — a Home
 * volta a mostrar só a contagem, sem fração nem barra (achado A13,
 * docs/AUDITORIA-APEX-PRO.md: o denominador antigo era cravado em
 * código, `const metaTreinos = 4`, número que o dono nunca escolheu).
 */
export async function definirMetaTreinosSemana(
  meta: number | null,
): Promise<ResultadoDefinirMeta> {
  const idioma = await obterIdioma();

  if (meta !== null && (!Number.isInteger(meta) || meta < 1 || meta > 7)) {
    return { ok: false, erro: t("A meta precisa ser um número inteiro entre 1 e 7.", idioma) };
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: t("Sessão ausente — entre de novo.", idioma) };

  const { error } = await supabase
    .from("usuario")
    .update({ meta_treinos_semana: meta })
    .eq("id", user.id);

  if (error) return { ok: false, erro: t("Não foi possível salvar. Tente de novo.", idioma) };

  revalidatePath("/", "layout");

  return { ok: true };
}
