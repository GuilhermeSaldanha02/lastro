// lastro · PRD §4.4 — route handler do coach 24h.
//
// FF1 preservada: este arquivo NÃO importa @google/genai. Ele reusa o
// `ClienteParecerGemini` de `../analise/gemini`, que segue sendo o único
// ponto do repo que toca o SDK. A chave nunca chega ao cliente (ADR-002).
//
// O que este handler NÃO faz, de propósito: não lê treino, série nem
// resumo. O coach responde dúvida geral; quem lê os números do dono é a
// Análise Semanal. Isso mantém o dado do treino fora deste prompt.
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ClienteParecerGemini } from "../analise/gemini";
import {
  SISTEMA_COACH,
  montarPerguntaCoach,
  perguntaAceitavel,
  LIMITE_PERGUNTA,
} from "./prompt";
import { detalheParaLog, respostaDeFalha } from "./falha";

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();
  if (erroAuth || !user) {
    return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const pergunta = (corpo as { pergunta?: unknown })?.pergunta;
  if (!perguntaAceitavel(pergunta)) {
    return NextResponse.json(
      { erro: `Pergunta vazia ou acima de ${LIMITE_PERGUNTA} caracteres.` },
      { status: 400 },
    );
  }

  try {
    const cliente = new ClienteParecerGemini();
    const resposta = await cliente.gerar(
      SISTEMA_COACH,
      montarPerguntaCoach(pergunta),
    );
    const texto = resposta.trim();
    if (!texto) {
      return NextResponse.json(
        { erro: "O modelo respondeu vazio. Tente de novo." },
        { status: 502 },
      );
    }
    return NextResponse.json({ resposta: texto });
  } catch (erro) {
    // Logar é obrigatório: sem isto a falha some sem deixar rastro, e a
    // única pista que o dono tem é uma mensagem genérica na tela (achado
    // real do teste no aparelho, 2026-08-17 — a causa só foi encontrada
    // porque /api/analise, que loga, falhou junto).
    console.error("[coach] falha ao gerar", detalheParaLog(erro));

    const { erro: mensagem, status } = respostaDeFalha(erro);
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
