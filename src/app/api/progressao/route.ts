// lastro · dado do gráfico de progressão (DESIGN.md §3.7) pro cliente.
// GET /api/progressao — sem parâmetro: até 4 painéis, sem escolha do
// usuário (redesenho 2026-08-14, sem seletor). Sem IA, sem escrita — só
// leitura.
import { NextResponse } from "next/server";
import { carregarProgressao } from "@/lib/dados/progressao";

export async function GET() {
  try {
    const paineis = await carregarProgressao();
    return NextResponse.json(paineis);
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("Sessão ausente")) {
      return NextResponse.json({ erro: "sessao" }, { status: 401 });
    }
    return NextResponse.json({ erro: "falha" }, { status: 500 });
  }
}
