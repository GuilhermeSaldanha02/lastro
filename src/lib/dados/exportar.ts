// lastro · Exportação dos dados do usuário em CSV (PRD §4.6 — a conta
// existe "para backup"; até aqui a promessa nunca tinha um caminho real:
// o sticker exporta uma imagem, não os números).
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

async function usuarioAutenticadoOuErro() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Sessão ausente — usuário não autenticado.");
  }
  return { supabase, user };
}

function escaparCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

/**
 * Todas as séries do usuário, uma linha por série, com o treino e o
 * exercício já resolvidos — backup completo em formato aberto (CSV),
 * legível em qualquer planilha, sem depender do Lastro pra ler de volta.
 */
export async function exportarDadosCsv(): Promise<string> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data, error } = await supabase
    .from("serie")
    .select(
      "tipo, reps, peso, rir, peso_por_lado, criado_em, treino:treino_id (data), exercicio:exercicio_id (nome)",
    )
    .order("criado_em", { ascending: true });
  if (error) {
    throw new Error(`Falha ao exportar dados: ${error.message}`);
  }

  type Linha = {
    tipo: string;
    reps: number;
    peso: number;
    rir: number | null;
    peso_por_lado: boolean;
    criado_em: string;
    treino: { data: string } | { data: string }[] | null;
    exercicio: { nome: string } | { nome: string }[] | null;
  };

  const linhas = (data ?? []) as unknown as Linha[];

  const cabecalho = [
    "data_treino",
    "exercicio",
    "tipo",
    "reps",
    "peso_kg",
    "rir",
    "peso_por_lado",
    "registrado_em",
  ];

  const corpo = linhas.map((l) => {
    const treino = Array.isArray(l.treino) ? l.treino[0] : l.treino;
    const exercicio = Array.isArray(l.exercicio) ? l.exercicio[0] : l.exercicio;
    return [
      treino?.data ?? "",
      exercicio?.nome ?? "",
      l.tipo,
      String(l.reps),
      String(l.peso),
      l.rir === null ? "" : String(l.rir),
      l.peso_por_lado ? "sim" : "não",
      l.criado_em,
    ]
      .map(escaparCsv)
      .join(",");
  });

  // BOM UTF-8: sem ele o Excel lê "posterior de coxa" como "posterior de
  // coxa" corrompido — acentuação quebrada é o tipo de coisa que mina a
  // confiança num backup logo na primeira abertura.
  const BOM = String.fromCharCode(0xfeff);
  return [BOM + cabecalho.map(escaparCsv).join(","), ...corpo].join("\r\n");
}
