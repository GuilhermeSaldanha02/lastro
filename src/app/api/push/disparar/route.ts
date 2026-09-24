// lastro · aviso de fim de descanso (pedido do dono, 2026-09-23).
//
// Quem chama esta rota é o BANCO: o job do pg_cron
// (`private.disparar_avisos_descanso`, a cada 5 s) pega os avisos vencidos,
// junta a inscrição de push de cada um e faz POST aqui com o segredo em
// `x-lastro-disparo`. A rota não lê dado de usuário nenhum — só assina
// (VAPID) e envia. Sem as variáveis de ambiente ela responde 503 e fica
// dormente.
import { NextResponse } from "next/server";
import webpush from "web-push";
import { disparoAutorizado, lerAvisosDoCorpo } from "@/lib/push/disparo";

export async function POST(requisicao: Request): Promise<NextResponse> {
  const segredo = process.env.PUSH_DISPARO_SEGREDO;
  const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const chavePrivada = process.env.VAPID_PRIVATE_KEY;
  if (!segredo || !chavePublica || !chavePrivada) {
    return NextResponse.json({ erro: "aviso de descanso desligado" }, { status: 503 });
  }
  if (!disparoAutorizado(requisicao.headers.get("x-lastro-disparo"), segredo)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const avisos = lerAvisosDoCorpo(await requisicao.json().catch(() => null));
  webpush.setVapidDetails("https://lastro-pi.vercel.app", chavePublica, chavePrivada);

  const resultados = await Promise.allSettled(
    avisos.map((aviso) =>
      webpush.sendNotification(
        { endpoint: aviso.endpoint, keys: { p256dh: aviso.p256dh, auth: aviso.auth } },
        JSON.stringify({
          titulo: "Descanso acabou",
          corpo: "Hora da próxima série.",
          url: `/treino/${aviso.treino_id}`,
        }),
        // Descanso vencido há mais de 2 min não serve pra nada: o serviço
        // de push descarta em vez de entregar tarde.
        { TTL: 120, urgency: "high", topic: "descanso" },
      ),
    ),
  );

  const enviados = resultados.filter((r) => r.status === "fulfilled").length;
  // 404/410 = inscrição que o aparelho já cancelou. Voltam na resposta para
  // aparecer em `net._http_response`; a limpeza da tabela é do banco.
  const expirados = resultados.flatMap((r, i) =>
    r.status === "rejected" && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0)
      ? [avisos[i].endpoint]
      : [],
  );
  return NextResponse.json({ recebidos: avisos.length, enviados, expirados });
}
