// lastro · SDD.md §6.2 — route handler da Gemini (D5).
// ÚNICO lugar do repo (com gemini.ts, mesma pasta) que importa
// @google/genai (FF1).
//
// Contrato: POST /api/analise · corpo { pergunta: 1|2|3|4|5 } — e nada mais.
// O cliente NUNCA envia resumo nem séries: o handler autentica, lê as
// séries do usuário no Supabase, chama `montarResumoCompacto` e só então
// monta o prompt. Isso torna estruturalmente impossível o cliente injetar
// dado cru no prompt.
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { montarResumoCompacto } from "@/lib/analise/agregar";
import { paraDataUTC } from "@/lib/analise/semanas";
import type {
  ExercicioBruto,
  ResumoCompacto,
  TreinoBruto,
} from "@/lib/analise/tipos";
import { dataLocalBrasil } from "@/lib/tempo";
import { ClienteParecerGemini } from "./gemini";
import { montarPrompt } from "./prompt";
import { validarNumeros } from "./validador";
import { perguntaValida } from "./perguntas";

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

type LinhaSerie = {
  id: string;
  exercicio_id: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  peso_corporal_incluso: boolean;
};

type LinhaTreino = {
  id: string;
  data: string;
  serie: LinhaSerie[] | null;
};

type LinhaExercicio = {
  id: string;
  nome: string;
  grupo_muscular_primario: string;
  unilateral: boolean;
};

/** Todos os treinos do usuário logado (RLS filtra), já com as séries. */
async function carregarTreinosDoUsuario(
  supabase: ClienteSupabaseServidor,
): Promise<TreinoBruto[]> {
  const { data, error } = await supabase
    .from("treino")
    .select(
      "id, data, serie (id, exercicio_id, tipo, reps, peso, rir, peso_corporal_incluso)",
    );
  if (error) throw new Error(`Falha ao carregar treinos: ${error.message}`);

  return ((data ?? []) as unknown as LinhaTreino[]).map((t) => ({
    id: t.id,
    data: t.data,
    series: (t.serie ?? []).map((s) => ({
      id: s.id,
      exercicioId: s.exercicio_id,
      tipo: s.tipo,
      reps: s.reps,
      peso: Number(s.peso),
      rir: s.rir ?? undefined,
      pesoCorporalIncluso: s.peso_corporal_incluso,
    })),
  }));
}

/** Catálogo de exercícios — dado compartilhado, não filtrado por usuário. */
async function carregarExercicios(
  supabase: ClienteSupabaseServidor,
): Promise<ExercicioBruto[]> {
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral");
  if (error) throw new Error(`Falha ao carregar exercícios: ${error.message}`);

  return ((data ?? []) as LinhaExercicio[]).map((e) => ({
    id: e.id,
    nome: e.nome,
    grupoMuscularPrimario: e.grupo_muscular_primario,
    unilateral: e.unilateral,
  }));
}

/**
 * Fallback determinístico (SDD §6.4, política de retry, 2ª falha):
 * template em código, sem prosa do LLM, montado só do resumo.
 */
function fallbackDeterministico(resumo: ResumoCompacto): string {
  const linhas: string[] = [];

  linhas.push(
    `Semana de ${resumo.periodo.semana_atual_inicio} — ${resumo.periodo.semanas_com_dados} de ${resumo.periodo.janela_semanas} semanas da janela com dados.`,
  );

  for (const v of resumo.volume_semanal) {
    linhas.push(`Volume total em ${v.semana_inicio}: ${v.volume_total}.`);
  }

  for (const g of resumo.volume_por_grupo_muscular) {
    const delta =
      g.delta_volume_pct !== undefined ? ` (${g.delta_volume_pct}% vs. semana anterior)` : "";
    linhas.push(
      `${g.grupo_muscular}: ${g.series_valendo} séries valendo, volume ${g.volume}${delta} — ${g.posicao_na_faixa} da faixa de referência.`,
    );
  }

  for (const t of resumo.tendencia_e1rm) {
    linhas.push(
      `${t.exercicio}: e1RM de ${t.e1rm_inicial} para ${t.e1rm_atual} (${t.delta_pct}%), em ${t.sessoes} sessões.`,
    );
  }

  if (resumo.estagnacoes.length > 0) {
    for (const e of resumo.estagnacoes) {
      linhas.push(`${e.exercicio}: ${e.semanas_sem_progresso} semanas sem progresso.`);
    }
  }

  for (const p of resumo.prs) {
    linhas.push(
      `PR em ${p.exercicio} (${p.tipo}): ${p.valor} (anterior ${p.valor_anterior}).`,
    );
  }

  linhas.push(
    `Frequência na semana atual: ${resumo.frequencia.treinos_semana_atual} treino(s).`,
  );
  if (resumo.frequencia.grupos_sem_estimulo.length > 0) {
    linhas.push(
      `Sem estímulo esta semana: ${resumo.frequencia.grupos_sem_estimulo.join(", ")}.`,
    );
  }

  return linhas.join("\n");
}

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
  const pergunta = (corpo as { pergunta?: unknown } | null)?.pergunta;
  if (!perguntaValida(pergunta)) {
    return NextResponse.json(
      { erro: "pergunta precisa ser 1, 2, 3, 4 ou 5." },
      { status: 400 },
    );
  }

  const [treinos, exercicios] = await Promise.all([
    carregarTreinosDoUsuario(supabase),
    carregarExercicios(supabase),
  ]);

  // Ancorado no calendário de Brasília (src/lib/tempo.ts), não UTC —
  // `semanas.ts` trata todo Date recebido como calendário Y-M-D via
  // getUTC*; sem essa conversão, checar a Análise à noite podia calcular
  // a semana errada perto da virada do dia.
  const agora = paraDataUTC(dataLocalBrasil());
  const resumo = montarResumoCompacto({ treinos, exercicios, agora });

  if (resumo.versao !== 1) {
    console.error("[analise] resumo em versão inesperada", resumo.versao);
    return NextResponse.json(
      { erro: "Resumo em versão inesperada." },
      { status: 500 },
    );
  }

  const { sistema, usuario, contexto } = montarPrompt(resumo, pergunta, agora);
  const cliente = new ClienteParecerGemini();

  const respostaUm = await cliente.gerar(sistema, usuario);
  let resultado = validarNumeros(respostaUm, resumo, contexto);
  // Sempre logar pergunta, intrusos e resposta bruta (SDD §6.4, tabela).
  console.log("[analise] tentativa 1", {
    pergunta,
    resultado,
    respostaBruta: respostaUm,
  });

  if (resultado.ok) {
    return NextResponse.json({ parecer: respostaUm });
  }

  // 1ª falha (SDD §6.4, tabela): uma nova chamada, com o parecer rejeitado
  // e os intrusos anexados.
  const instrucaoRetry =
    resultado.motivo === "intrusos"
      ? `Os números ${resultado.intrusos.join(", ")} não existem nos dados. Reescreva usando apenas números do JSON.`
      : "Sua resposta anterior não citou nenhum número específico do JSON. Reescreva citando ao menos um número real do JSON.";
  const usuarioRetry = [
    usuario,
    "",
    `Sua resposta anterior foi rejeitada: "${respostaUm}"`,
    instrucaoRetry,
  ].join("\n\n");

  const respostaDois = await cliente.gerar(sistema, usuarioRetry);
  resultado = validarNumeros(respostaDois, resumo, contexto);
  console.log("[analise] tentativa 2", {
    pergunta,
    resultado,
    respostaBruta: respostaDois,
  });

  if (resultado.ok) {
    return NextResponse.json({ parecer: respostaDois });
  }

  // 2ª falha: não exibir parecer do LLM. Fallback determinístico + aviso.
  return NextResponse.json({
    parecer: fallbackDeterministico(resumo),
    avisoFalhaInterpretativa: true,
  });
}
