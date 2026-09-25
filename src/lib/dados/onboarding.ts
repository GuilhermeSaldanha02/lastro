// lastro · PU-08 — marca que a conta passou (ou pulou) o onboarding.
"use server";

import { cookies } from "next/headers";
import { COOKIE_ONBOARDING_VISTO } from "@/lib/onboarding-cookie";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

// Se a gravação no banco falhar, um cookie de 30 dias segura o passo a passo
// para ele não voltar em toda abertura da Home (`exigirOnboarding`).

export async function concluirOnboarding(): Promise<{ ok: boolean }> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("usuario")
    .update({ onboarding_concluido_em: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding] falha ao gravar conclusão:", error.message);
    (await cookies()).set(COOKIE_ONBOARDING_VISTO, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return { ok: false };
  }
  return { ok: true };
}
