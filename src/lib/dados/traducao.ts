// lastro · leitura das tabelas de tradução (migração 0012). Devolve
// Map em vez de objeto: chave é UUID/id de texto, e `Map.get` que
// retorna `undefined` por padrão é o mecanismo natural pro fallback
// "sem tradução, usa o PT-BR" que o resto do módulo de idiomas depende.
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { Idioma } from "@/lib/dados/idioma";

/** pt-BR não tem tabela de tradução — é o que `exercicio.nome` já guarda. */
export async function mapaTraducaoExercicios(
  idioma: Idioma,
): Promise<Map<string, string>> {
  if (idioma === "pt-BR") return new Map();

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("exercicio_traducao")
    .select("exercicio_id, nome")
    .eq("idioma", idioma);
  if (error) throw new Error(`Falha ao carregar tradução de exercícios: ${error.message}`);

  return new Map((data ?? []).map((linha) => [linha.exercicio_id, linha.nome]));
}

export async function mapaTraducaoGrupos(
  idioma: Idioma,
): Promise<Map<string, string>> {
  if (idioma === "pt-BR") return new Map();

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("grupo_muscular_traducao")
    .select("grupo_muscular_id, nome")
    .eq("idioma", idioma);
  if (error) throw new Error(`Falha ao carregar tradução de grupos musculares: ${error.message}`);

  return new Map((data ?? []).map((linha) => [linha.grupo_muscular_id, linha.nome]));
}

/**
 * Dica de execução de UM exercício no idioma da pessoa (A1, migração
 * `dica_execucao_traduzida`). `null` quando o idioma é pt-BR ou quando não há
 * tradução: quem chama cai na dica em português, o mesmo fallback do nome.
 */
export async function dicaTraduzidaDoExercicio(
  exercicioId: string,
  idioma: Idioma,
): Promise<string | null> {
  if (idioma === "pt-BR") return null;

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("exercicio_traducao")
    .select("dica_execucao")
    .eq("exercicio_id", exercicioId)
    .eq("idioma", idioma)
    .maybeSingle();
  if (error) {
    console.error("[traducao] falha ao ler dica traduzida:", error.message);
    return null;
  }
  return data?.dica_execucao ?? null;
}
