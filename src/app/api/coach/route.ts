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
import { carregarVinculoDoAluno } from "@/lib/dados/personal";
import {
  sistemaCoach,
  montarPerguntaCoach,
  perguntaAceitavel,
  LIMITE_PERGUNTA,
} from "./prompt";
import { detalheParaLog, respostaDeFalha } from "./falha";
import { registrarUso, tetoAtingido, TETO_DIARIO } from "@/lib/dados/uso-ia";

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

  // Teto diário (migration 0020). O Coach dividia a cota de 20/dia com a
  // Análise Semanal e não tinha teto nenhum — só limitava o TAMANHO da
  // pergunta. Uma conversa longa esvaziava a cota e jogava a peça-assinatura
  // no fallback; a assimetria foi criada quando o parecer ganhou teto e o
  // chat não (DECISIONS 2026-09-05).
  if (await tetoAtingido(supabase, user.id, "coach")) {
    return NextResponse.json(
      { erro: "limite_diario", limite: TETO_DIARIO.coach },
      { status: 429 },
    );
  }
  // Vínculo (PRD §11.4.1) ANTES de registrar uso: se esta leitura falhar, a
  // requisição morre sem gastar cota. O prompt muda sob vínculo — ver a
  // explicação em `./prompt.ts`.
  //
  // Falha de leitura do vínculo derruba o pedido em vez de seguir com o
  // prompt de quem treina sozinho. O prompt errado aqui não é um detalhe de
  // tom: é o app encaminhando para lugar nenhum quem tem personal, ou
  // citando um personal que não existe.
  let temPersonal: boolean;
  try {
    temPersonal = (await carregarVinculoDoAluno()) !== null;
  } catch (erro) {
    console.error("[coach] falha ao ler vínculo", detalheParaLog(erro));
    return NextResponse.json(
      { erro: "Não foi possível verificar seu vínculo. Tente de novo." },
      { status: 503 },
    );
  }

  // Antes da chamada: a cota do Google é consumida pela TENTATIVA, mesmo
  // quando ela volta 503.
  await registrarUso(supabase, user.id, "coach");

  try {
    const cliente = new ClienteParecerGemini();
    const resposta = await cliente.gerar(
      sistemaCoach(temPersonal),
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
