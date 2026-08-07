// lastro · dado do gráfico de progressão (DESIGN.md §3.7) pro cliente.
// GET /api/progressao?exercicioId=<id> — exercicioId é opcional, escolhe
// o padrão (ver carregarProgressao). Sem IA, sem escrita — só leitura.
import { NextResponse } from "next/server";
import { carregarProgressao } from "@/lib/dados/progressao";

export async function GET(request: Request) {
  const exercicioId = new URL(request.url).searchParams.get("exercicioId") ?? undefined;

  try {
    const dados = await carregarProgressao(exercicioId);
    return NextResponse.json(dados);
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("Sessão ausente")) {
      return NextResponse.json({ erro: "sessao" }, { status: 401 });
    }
    return NextResponse.json({ erro: "falha" }, { status: 500 });
  }
}
