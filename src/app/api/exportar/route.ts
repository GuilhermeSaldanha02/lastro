// lastro · GET /api/exportar — backup dos dados do usuário em CSV.
import { NextResponse } from "next/server";
import { exportarDadosCsv } from "@/lib/dados/exportar";
import { exportarCheckinsCsv } from "@/lib/dados/checkin";

export async function GET(pedido: Request) {
  try {
    // `?dados=checkins` baixa só os check-ins diários (AN-08 A1).
    const checkins = new URL(pedido.url).searchParams.get("dados") === "checkins";
    const csv = checkins ? await exportarCheckinsCsv() : await exportarDadosCsv();
    const hoje = new Date().toISOString().slice(0, 10);
    const prefixo = checkins ? "lastro-checkins" : "lastro-dados";
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${prefixo}-${hoje}.csv"`,
      },
    });
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("Sessão ausente")) {
      return NextResponse.json({ erro: "sessao" }, { status: 401 });
    }
    return NextResponse.json({ erro: "falha" }, { status: 500 });
  }
}
