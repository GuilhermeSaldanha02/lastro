// lastro · SDD.md §10.1/10.3, §11.1-§11.2 — histórico opt-in de pareceres
// salvos + rascunho em geração assíncrona. Mesmo padrão de
// src/lib/dados/treino.ts: Server Actions, sem cache, `usuario_id`
// sempre resolvido do lado do servidor a partir da sessão.
"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ehUuid } from "@/lib/dados/id-valido";
import type { NumeroPergunta } from "@/app/api/analise/perguntas";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";
import type { Idioma } from "@/lib/dados/idioma";
import {
  LIMITE_GERACAO_TRAVADA_MINUTOS,
  EXPIRA_RASCUNHO_HORAS,
} from "./parecer-config";

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

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * Limpeza preguiçosa (SDD.md §11.2), sem cron: roda antes de qualquer
 * leitura/decisão sobre o rascunho do usuário. Apaga geração abandonada
 * (presa em 'gerando' além do limite) e rascunho pronto expirado (não
 * confirmado em 24h).
 */
export async function limparRascunhosExpirados(
  supabase: ClienteSupabaseServidor,
  usuarioId: string,
): Promise<void> {
  const geracaoTravadaDesde = new Date(
    Date.now() - LIMITE_GERACAO_TRAVADA_MINUTOS * 60_000,
  ).toISOString();
  const rascunhoExpiradoDesde = new Date(
    Date.now() - EXPIRA_RASCUNHO_HORAS * 3_600_000,
  ).toISOString();

  const { error } = await supabase
    .from("parecer")
    .delete()
    .eq("usuario_id", usuarioId)
    .or(
      `and(status.eq.gerando,criado_em.lt.${geracaoTravadaDesde}),and(status.eq.pronto,confirmado.eq.false,criado_em.lt.${rascunhoExpiradoDesde})`,
    );
  if (error) {
    console.error(
      "[parecer] falha ao limpar rascunhos expirados:",
      error.message,
    );
  }
}

export type StatusParecer = "gerando" | "pronto";

/**
 * Por que a interpretação por IA não saiu (migration 0019). `null` quando
 * saiu, e também nos pareceres anteriores à coluna — não dá pra inventar
 * retroativamente a causa de uma falha que já passou.
 *
 * Antes disto, quatro causas muito diferentes viravam o mesmo booleano, e
 * ninguém conseguia responder "por que meu parecer saiu sem prosa?" depois
 * do fato: o log da Vercel no plano Hobby retém 1 hora.
 */
export type FalhaMotivo =
  /** 503 e cia. — a API não respondeu. Transitório; já houve retry. */
  | "api_indisponivel"
  /** 429 — teto de cota (5 RPM / 20 RPD no nível gratuito). */
  | "cota_excedida"
  /** 404 — modelo não encontrado naquela versão da API. */
  | "modelo_ausente"
  /** Erro da API que não soubemos classificar. Balde honesto. */
  | "api_erro"
  /** Duas tentativas com número intruso (SDD §6.4). */
  | "validador_rejeitou";

export type ParecerSalvo = {
  id: string;
  pergunta: NumeroPergunta;
  perguntaTexto: string;
  texto: string | null;
  avisoFalhaInterpretativa: boolean;
  falhaMotivo: FalhaMotivo | null;
  evidencia: EvidenciaParaTela | null;
  idioma: Idioma;
  criadoEm: string;
  status: StatusParecer;
  confirmado: boolean;
};

type LinhaParecer = {
  id: string;
  pergunta: number;
  pergunta_texto: string;
  texto: string | null;
  aviso_falha_interpretativa: boolean;
  falha_motivo: FalhaMotivo | null;
  evidencia: EvidenciaParaTela | null;
  idioma: string;
  criado_em: string;
  status: StatusParecer;
  confirmado: boolean;
};

const COLUNAS_PARECER =
  "id, pergunta, pergunta_texto, texto, aviso_falha_interpretativa, falha_motivo, evidencia, idioma, criado_em, status, confirmado";

function paraParecerSalvo(linha: LinhaParecer): ParecerSalvo {
  return {
    id: linha.id,
    pergunta: linha.pergunta as NumeroPergunta,
    perguntaTexto: linha.pergunta_texto,
    texto: linha.texto,
    avisoFalhaInterpretativa: linha.aviso_falha_interpretativa,
    falhaMotivo: linha.falha_motivo,
    evidencia: linha.evidencia,
    idioma: linha.idioma as Idioma,
    criadoEm: linha.criado_em,
    status: linha.status,
    confirmado: linha.confirmado,
  };
}

/** Todos os pareceres do usuário logado (RLS filtra) — inclui rascunho em voo/aguardando decisão, se houver, sempre no topo (mais recente primeiro). */
export async function listarPareceres(): Promise<ParecerSalvo[]> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  await limparRascunhosExpirados(supabase, user.id);

  const { data, error } = await supabase
    .from("parecer")
    .select(COLUNAS_PARECER)
    .order("criado_em", { ascending: false });
  if (error) {
    throw new Error(`Falha ao listar pareceres: ${error.message}`);
  }

  return ((data ?? []) as unknown as LinhaParecer[]).map(paraParecerSalvo);
}

/** Rascunho em geração do usuário logado, se houver — usado pra travar o botão de pergunta ao carregar a tela (SDD.md §11.4). */
export async function buscarRascunhoEmAndamento(): Promise<{
  id: string;
  perguntaTexto: string;
} | null> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  await limparRascunhosExpirados(supabase, user.id);

  const { data, error } = await supabase
    .from("parecer")
    .select("id, pergunta_texto")
    .eq("status", "gerando")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar rascunho em andamento: ${error.message}`);
  }
  if (!data) return null;

  return { id: data.id, perguntaTexto: data.pergunta_texto };
}

/** Um parecer específico — RLS garante que só resolve se for do dono da sessão. */
export async function buscarParecer(id: string): Promise<ParecerSalvo | null> {
  const { supabase } = await usuarioAutenticadoOuErro();
  // Id que não é UUID não existe (achado B2): sem isto o Postgres responde
  // com erro, e a tela e o PDF viravam 500. Depois da sessão: sem login, 401.
  if (!ehUuid(id)) return null;

  const { data, error } = await supabase
    .from("parecer")
    .select(COLUNAS_PARECER)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar parecer: ${error.message}`);
  }
  if (!data) return null;

  return paraParecerSalvo(data as unknown as LinhaParecer);
}

/** Confirma um rascunho pronto — vira parecer permanente (SDD.md §11.4). */
export async function confirmarParecer(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase
    .from("parecer")
    .update({ confirmado: true })
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao confirmar parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}

/** Exclui um parecer — serve tanto "Excluir" (já confirmado) quanto "Descartar" (rascunho pronto não confirmado). */
export async function excluirParecer(id: string): Promise<void> {
  const { supabase } = await usuarioAutenticadoOuErro();

  const { error } = await supabase.from("parecer").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao excluir parecer: ${error.message}`);
  }

  revalidatePath("/ajustes/relatorios");
}
