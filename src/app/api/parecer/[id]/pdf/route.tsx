// lastro · SDD.md §10.4 — download do PDF de um parecer salvo.
// Route handler, não Server Action: é o jeito certo do Next.js pra
// devolver um arquivo binário como download.
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buscarParecer } from "@/lib/dados/parecer";
import DocumentoParecer from "@/lib/pdf/documento-parecer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let parecer;
  try {
    parecer = await buscarParecer(id);
  } catch (erro) {
    // Só cai em 401 se for de fato sessão ausente — qualquer outro erro
    // (ex.: id que não é UUID válido, rejeitado pelo Postgres antes da
    // RLS) não é problema de autenticação e não deveria dizer que é
    // (achado real na revisão de qualidade desta task).
    const semSessao = erro instanceof Error && erro.message.includes("Sessão ausente");
    if (semSessao) {
      return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
    }
    return NextResponse.json({ erro: "Falha ao buscar o parecer." }, { status: 500 });
  }

  if (!parecer) {
    return NextResponse.json({ erro: "Parecer não encontrado." }, { status: 404 });
  }

  let buffer;
  try {
    buffer = await renderToBuffer(<DocumentoParecer parecer={parecer} />);
  } catch {
    return NextResponse.json({ erro: "Falha ao gerar o PDF." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lastro-analise-${parecer.criadoEm.slice(0, 10)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
