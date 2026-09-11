// lastro · Fase 6 (E2E) — semeia o ÚNICO estado que faz a fila do personal
// ter o que mostrar: um grupo muscular abandonado (PRD §11.4.6).
//
// Arquivo separado de `semear-historico.ts` de propósito. Aquele semeia
// quatro treinos do MESMO exercício para liberar a Análise Semanal, e a
// j2 depende desse formato exato; o alerta de abandono precisa do oposto —
// DOIS grupos, um recente e um parado há mais de
// `DIAS_SEM_ESTIMULO_PARA_ALERTA` (21) dias. Botar uma bandeira no helper
// da j2 acoplaria dois testes que não têm nada a ver um com o outro.
//
// Por que precisa dos dois: `diasSemEstimuloPorGrupo` só devolve grupo que
// a pessoa JÁ treinou alguma vez — "você parou de treinar costas" é
// acionável, "você nunca treinou panturrilha" é escolha de programa. Um
// aluno com um grupo só, treinado há 30 dias, não produz alerta de
// abandono: produz um aluno que sumiu, que é outra conversa.
//
// O cliente recebido é o do PRÓPRIO ALUNO (`clienteAutenticado`), nunca o
// admin: `service_role` não tem GRANT nenhum no PostgREST deste projeto
// (ver `usuario-descartavel.ts`), e a RLS já permite a pessoa inserir o
// próprio treino.
import type { SupabaseClient } from "@supabase/supabase-js";

function dataISOHaDias(dias: number): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() - dias);
  return data.toISOString().slice(0, 10);
}

export type GruposSemeados = {
  /** Grupo cuja última série valendo é antiga o bastante para virar alerta. */
  abandonado: string;
  /** Grupo treinado na semana passada — é ele que mantém o aluno "ativo". */
  ativo: string;
};

/**
 * Semeia um histórico em que UM grupo está parado há ~28 dias e outro foi
 * treinado há 7. Devolve os dois nomes para o spec poder afirmar que o
 * alerta aponta o grupo certo — e não apenas que "algum" alerta apareceu.
 */
export async function semearGrupoAbandonado(
  cliente: SupabaseClient,
  usuarioId: string,
): Promise<GruposSemeados> {
  const { data: exercicios, error: erroCatalogo } = await cliente
    .from("exercicio")
    .select("id, grupo_muscular_primario")
    .limit(200);
  if (erroCatalogo || !exercicios?.length) {
    throw new Error(
      `Falha ao ler catálogo: ${erroCatalogo?.message ?? "catálogo vazio"}`,
    );
  }

  // Dois exercícios de grupos DIFERENTES. O catálogo é dado compartilhado e
  // pode mudar de conteúdo; escolher pelo primeiro par distinto que
  // aparecer não depende de nenhum exercício específico existir.
  const porGrupo = new Map<string, string>();
  for (const e of exercicios as { id: string; grupo_muscular_primario: string }[]) {
    if (!porGrupo.has(e.grupo_muscular_primario)) {
      porGrupo.set(e.grupo_muscular_primario, e.id);
    }
  }
  const grupos = [...porGrupo.entries()];
  if (grupos.length < 2) {
    throw new Error(
      `Catálogo com menos de dois grupos musculares (${grupos.length}) — impossível semear abandono.`,
    );
  }
  const [[grupoAbandonado, exercicioAbandonado], [grupoAtivo, exercicioAtivo]] =
    grupos;

  const plano: { exercicioId: string; dias: number }[] = [
    // O grupo abandonado existiu no treino, e parou. 35 e 28 dias atrás:
    // a recência é medida contra o FIM da semana analisada, então 28 dias
    // dá folga confortável sobre o limiar de 21 sem depender do dia da
    // semana em que o CI roda.
    { exercicioId: exercicioAbandonado, dias: 35 },
    { exercicioId: exercicioAbandonado, dias: 28 },
    // O outro grupo segue vivo — inclusive na semana passada.
    { exercicioId: exercicioAtivo, dias: 21 },
    { exercicioId: exercicioAtivo, dias: 14 },
    { exercicioId: exercicioAtivo, dias: 7 },
  ];

  for (const { exercicioId, dias } of plano) {
    const { data: treino, error: erroTreino } = await cliente
      .from("treino")
      .insert({ usuario_id: usuarioId, data: dataISOHaDias(dias) })
      .select("id")
      .single();
    if (erroTreino || !treino) {
      throw new Error(`Falha ao semear treino (${dias}d): ${erroTreino?.message}`);
    }

    // `tipo: "valendo"` não é detalhe: aquecimento não conta para recência
    // (FF4), então um histórico semeado com aquecimento produziria zero
    // alerta e um teste verde que não testa nada.
    const { error: erroSerie } = await cliente.from("serie").insert({
      usuario_id: usuarioId,
      treino_id: treino.id,
      exercicio_id: exercicioId,
      ordem: 1,
      tipo: "valendo",
      reps: 8,
      peso: 40,
      rir: 2,
    });
    if (erroSerie) {
      throw new Error(`Falha ao semear série (${dias}d): ${erroSerie.message}`);
    }
  }

  return { abandonado: grupoAbandonado, ativo: grupoAtivo };
}
