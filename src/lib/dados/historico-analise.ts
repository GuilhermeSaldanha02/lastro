// lastro · o histórico do usuário no formato do agregador, para a Análise
// Semanal e para as respostas locais do Coach. Um lugar só, para as duas
// portas lerem os mesmos números.
import type { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ehGrupoAcessorio } from "@/lib/analise/grupos-acessorios";
import type { ExercicioBruto, TreinoBruto } from "@/lib/analise/tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { mapaTraducaoExercicios, mapaTraducaoGrupos } from "@/lib/dados/traducao";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

type LinhaSerie = {
  id: string;
  exercicio_id: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  peso_por_lado: boolean;
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
  peso_por_lado: boolean;
};

/**
 * Todos os treinos do usuário informado, já com as séries.
 *
 * O FILTRO É EXPLÍCITO: desde a migração 0022 um personal com vínculo aceito
 * enxerga treino e série do aluno, então a consulta sem filtro traria as duas
 * pessoas — o parecer do personal sairia somando o treino do aluno ao dele,
 * sem erro nenhum em lugar nenhum.
 */
export async function carregarTreinosDoUsuario(
  supabase: ClienteSupabaseServidor,
  usuarioId: string,
): Promise<TreinoBruto[]> {
  const { data, error } = await supabase
    .from("treino")
    .select(
      "id, data, serie (id, exercicio_id, tipo, reps, peso, rir, peso_por_lado)",
    )
    .eq("usuario_id", usuarioId);
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
      pesoPorLado: s.peso_por_lado,
    })),
  }));
}

/**
 * Nome do grupo no idioma da pessoa. Em pt-BR `mapaTraducaoGrupos` devolve
 * mapa vazio, e sem o `formatarGrupoMuscular` a CHAVE DO BANCO
 * (`posterior_coxa`) sairia impressa no texto.
 */
export function nomeDoGrupo(
  traducaoGrupos: Map<string, string>,
  grupoId: string,
  idioma: Idioma,
): string {
  return traducaoGrupos.get(grupoId) ?? formatarGrupoMuscular(grupoId, idioma);
}

/**
 * Catálogo de exercícios — dado compartilhado, não filtrado por usuário.
 *
 * Nome e grupo muscular JÁ CHEGAM traduzidos pro idioma da pessoa: o parecer
 * cita nome de exercício, e traduzir na hora sairia diferente a cada chamada.
 * O texto final só pode citar o que está no resumo.
 */
export async function carregarExercicios(
  supabase: ClienteSupabaseServidor,
  idioma: Idioma,
): Promise<ExercicioBruto[]> {
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral, peso_por_lado");
  if (error) throw new Error(`Falha ao carregar exercícios: ${error.message}`);

  const [traducaoExercicios, traducaoGrupos] = await Promise.all([
    mapaTraducaoExercicios(idioma),
    mapaTraducaoGrupos(idioma),
  ]);

  return ((data ?? []) as LinhaExercicio[]).map((e) => ({
    id: e.id,
    nome: traducaoExercicios.get(e.id) ?? e.nome,
    grupoMuscularPrimario: nomeDoGrupo(traducaoGrupos, e.grupo_muscular_primario, idioma),
    unilateral: e.unilateral,
    pesoPorLado: e.peso_por_lado,
    grupoAcessorio: ehGrupoAcessorio(e.grupo_muscular_primario),
  }));
}
