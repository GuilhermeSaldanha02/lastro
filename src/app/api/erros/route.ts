// lastro · PU-07 — o navegador relata aqui o erro que quebrou uma tela.
//
// Só com sessão: relato de quem não tem conta seria um endpoint aberto para
// qualquer um encher a tabela. O `usuario_id` é o da sessão, nunca um campo
// do corpo. Sempre 204: quem relata não precisa saber se foi gravado.
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { registrarErro } from "@/lib/monitoramento/registrar-erro";

const LIMITE_CORPO = 16_000;

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  const texto = await request.text();
  if (texto.length > LIMITE_CORPO) return new Response(null, { status: 413 });

  let corpo: Record<string, unknown> = {};
  try {
    const lido: unknown = JSON.parse(texto);
    if (lido && typeof lido === "object") corpo = lido as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  await registrarErro(
    "cliente",
    {
      mensagem: corpo.mensagem,
      pilha: corpo.pilha,
      rota: corpo.rota,
      digest: corpo.digest,
      agente: request.headers.get("user-agent"),
    },
    user.id,
  );
  return new Response(null, { status: 204 });
}
