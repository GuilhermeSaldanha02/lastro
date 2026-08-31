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
  } catch {
    return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
  }

  if (!parecer) {
    return NextResponse.json({ erro: "Parecer não encontrado." }, { status: 404 });
  }

  const buffer = await renderToBuffer(<DocumentoParecer parecer={parecer} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lastro-analise-${parecer.criadoEm.slice(0, 10)}.pdf"`,
    },
  });
}
