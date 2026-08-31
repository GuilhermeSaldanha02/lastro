// lastro · SDD.md §10.1/10.3 — histórico opt-in de pareceres salvos.
// Mesmo padrão de src/lib/dados/treino.ts: Server Actions, sem cache,
// `usuario_id` sempre resolvido do lado do servidor a partir da sessão.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { NumeroPergunta } from "@/app/api/analise/perguntas";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";
import type { Idioma } from "@/lib/dados/idioma";

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

export type NovoParecerInput = {
  pergunta: NumeroPergunta;
  perguntaTexto: string;
  texto: string;
  avisoFalhaInterpretativa: boolean;
  evidencia: EvidenciaParaTela;
  idioma: Idioma;
};

export type ParecerSalvo = {
  id: string;
  pergunta: NumeroPergunta;
  perguntaTexto: string;
  texto: string;
  avisoFalhaInterpretativa: boolean;
  evidencia: EvidenciaParaTela;
  idioma: Idioma;
  criadoEm: string;
};

type LinhaParecer = {
  id: string;
  pergunta: number;
  pergunta_texto: string;
  texto: string;
  aviso_falha_interpretativa: boolean;
  evidencia: EvidenciaParaTela;
  idioma: string;
  criado_em: string;
};

function paraParecerSalvo(linha: LinhaParecer): ParecerSalvo {
  return {
    id: linha.id,
    pergunta: linha.pergunta as NumeroPergunta,
    perguntaTexto: linha.pergunta_texto,
    texto: linha.texto,
    avisoFalhaInterpretativa: linha.aviso_falha_interpretativa,
    evidencia: linha.evidencia,
    idioma: linha.idioma as Idioma,
    criadoEm: linha.criado_em,
  };
}

/** Salva o parecer que a pessoa acabou de ler — nunca automático (SDD.md §10.0). */
export async function salvarParecer(dados: NovoParecerInput): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("parecer").insert({
    usuario_id: user.id,
    pergunta: dados.pergunta,
    pergunta_texto: dados.perguntaTexto,
    texto: dados.texto,
    aviso_falha_interpretativa: dados.avisoFalhaInterpretativa,
    evidencia: dados.evidencia,
    idioma: dados.idioma,
  });
  if (error) {
    throw new Error(`Falha ao salvar parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}

/** Todos os pareceres salvos do usuário logado (RLS filtra), mais recente primeiro. */
export async function listarPareceres(): Promise<ParecerSalvo[]> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data, error } = await supabase
    .from("parecer")
    .select(
      "id, pergunta, pergunta_texto, texto, aviso_falha_interpretativa, evidencia, idioma, criado_em",
    )
    .order("criado_em", { ascending: false });
  if (error) {
    throw new Error(`Falha ao listar pareceres: ${error.message}`);
  }

  return ((data ?? []) as unknown as LinhaParecer[]).map(paraParecerSalvo);
}

/** Um parecer salvo específico — RLS garante que só resolve se for do dono da sessão. */
export async function buscarParecer(id: string): Promise<ParecerSalvo | null> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { data, error } = await supabase
    .from("parecer")
    .select(
      "id, pergunta, pergunta_texto, texto, aviso_falha_interpretativa, evidencia, idioma, criado_em",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar parecer: ${error.message}`);
  }
  if (!data) return null;

  return paraParecerSalvo(data as unknown as LinhaParecer);
}

/** Exclui um parecer salvo — ação da própria pessoa, sem cascade especial (não referenciado por nada). */
export async function excluirParecer(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("parecer").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao excluir parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}
