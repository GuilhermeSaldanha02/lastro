// lastro · SDD.md §10.4 — download do PDF de um parecer salvo.
// Route handler, não Server Action: é o jeito certo do Next.js pra
// devolver um arquivo binário como download.
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buscarParecer } from "@/lib/dados/parecer";
import DocumentoParecer from "@/lib/pdf/documento-parecer";

// Explícito, não herdado do padrão do App Router: desde a direção visual
// de 2026-09-03 (SDD.md §10.4.1) este módulo registra fontes reais no
// import, e `fontkit` NÃO roda no runtime edge. Hoje funcionaria pelo
// default; deixar implícito é apostar que o default nunca muda.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let parecer;
  try {
    parecer = await buscarParecer(id);
  } catch (erro) {
    // Só cai em 401 se for de fato sessão ausente — qualquer outro erro não
    // é problema de autenticação e não deveria dizer que é (achado real na
    // revisão de qualidade desta task). Id que não é UUID não chega mais
    // aqui: `buscarParecer` devolve `null` e a resposta é 404 (achado B2).
    const semSessao = erro instanceof Error && erro.message.includes("Sessão ausente");
    if (semSessao) {
      return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
    }
    return NextResponse.json({ erro: "Falha ao buscar o parecer." }, { status: 500 });
  }

  // Rascunho ainda em geração não tem texto nem evidência, e renderizar o
  // PDF assim estourava dentro do `@react-pdf` — 500 (achado B3, QA,
  // 2026-09-13). Mesma resposta da tela do parecer para o mesmo caso: não
  // há parecer pronto com esse id.
  if (!parecer || !parecer.texto || !parecer.evidencia) {
    return NextResponse.json({ erro: "Parecer não encontrado." }, { status: 404 });
  }

  let buffer;
  try {
    buffer = await renderToBuffer(<DocumentoParecer parecer={parecer} />);
  } catch (erro) {
    // Logar, não engolir: o componente registra 4 fontes embutidas em
    // tempo de import (SDD.md §10.4.1) e este é o único ponto do sistema
    // onde uma falha dessas apareceria — sem a linha, o sintoma em
    // produção é um 500 mudo na peça-assinatura. Mesmo padrão de
    // `api/analise/route.ts`.
    console.error("[pdf] falha ao renderizar o parecer:", erro);
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
