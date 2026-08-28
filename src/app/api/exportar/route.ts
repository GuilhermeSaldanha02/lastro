// lastro · GET /api/exportar — backup dos dados do usuário em CSV.
import { NextResponse } from "next/server";
import { exportarDadosCsv } from "@/lib/dados/exportar";

export async function GET() {
  try {
    const csv = await exportarDadosCsv();
    const hoje = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lastro-dados-${hoje}.csv"`,
      },
    });
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("Sessão ausente")) {
      return NextResponse.json({ erro: "sessao" }, { status: 401 });
    }
    return NextResponse.json({ erro: "falha" }, { status: 500 });
  }
}
