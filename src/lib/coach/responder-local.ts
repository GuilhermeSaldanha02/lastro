// lastro · a ponte entre a rota do Coach e as respostas locais (AN-08 M1).
// Lê o histórico com o MESMO carregador da Análise Semanal, e só do próprio
// usuário (filtro explícito — ver `historico-analise.ts`).
import type { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { achatarSeriesValendo, montarResumoCompacto } from "@/lib/analise/agregar";
import { paraDataUTC } from "@/lib/analise/semanas";
import { dataLocalBrasil } from "@/lib/tempo";
import type { Idioma } from "@/lib/dados/idioma";
import { carregarExercicios, carregarTreinosDoUsuario, nomeDoGrupo } from "@/lib/dados/historico-analise";
import { mapaTraducaoGrupos } from "@/lib/dados/traducao";
import type { ClassificacaoDados } from "./roteador";
import { responder } from "./responder";

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

export async function responderComDados(entrada: {
  supabase: ClienteSupabaseServidor;
  usuarioId: string;
  classificacao: ClassificacaoDados;
  idioma: Idioma;
}): Promise<string> {
  const { supabase, usuarioId, classificacao, idioma } = entrada;
  const hojeISO = dataLocalBrasil();

  const [treinos, exercicios, perfil, traducaoGrupos] = await Promise.all([
    carregarTreinosDoUsuario(supabase, usuarioId),
    carregarExercicios(supabase, idioma),
    supabase.from("usuario").select("meta_treinos_semana").eq("id", usuarioId).maybeSingle(),
    mapaTraducaoGrupos(idioma),
  ]);
  if (perfil.error) throw new Error(`Falha ao ler a meta semanal: ${perfil.error.message}`);

  return responder(classificacao, {
    series: achatarSeriesValendo(treinos, new Map(exercicios.map((e) => [e.id, e]))),
    resumo: montarResumoCompacto({ treinos, exercicios, agora: paraDataUTC(hojeISO) }),
    hojeISO,
    metaSemana: (perfil.data?.meta_treinos_semana as number | null | undefined) ?? null,
    idioma,
    nomeGrupoAlvo:
      classificacao.intent === "DIAS_SEM_GRUPO"
        ? nomeDoGrupo(traducaoGrupos, classificacao.grupo, idioma)
        : undefined,
  });
}
