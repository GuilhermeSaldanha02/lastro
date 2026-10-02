"use server";

// lastro · AN-08 A1 — check-in diário: leitura e gravação no servidor.
//
// REGRA QUE NÃO PODE SER QUEBRADA: nada daqui entra em prompt, resumo ou payload
// da IA. `src/lib/checkin/nao-vai-para-ia.test.ts` reprova se um arquivo que monta
// o que vai para a Gemini mencionar `checkin`.

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ehErroPermanenteDoPostgres } from "@/lib/offline/erro-permanente";
import { dataLocalBrasil } from "@/lib/tempo";
import { CAMPOS_CHECKIN, validarCheckin, type NotaCheckin } from "@/lib/checkin/escala";

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

/**
 * Mesmo contrato de `ResultadoGravacaoSerie`: recusa PERMANENTE (dado que o
 * servidor sempre vai rejeitar) volta como VALOR. Lançada, a mensagem some no
 * build de produção, a fila offline nunca a reconhece como permanente e para
 * nela, travando as séries que vêm depois (achado A1 do QA de 2026-09-13).
 */
export type ResultadoGravacaoCheckin = { ok: true } | { ok: false; permanente: true; mensagem: string };

/**
 * Grava (ou corrige) o check-in de um dia. Upsert por (usuário, dia): reenviar
 * pela fila ou tocar duas vezes não duplica, e só as notas que chegaram mudam —
 * as outras ficam como estavam. `usuario_id` vem da sessão, nunca do cliente.
 */
export async function registrarCheckinRemoto(entrada: unknown): Promise<ResultadoGravacaoCheckin> {
  const { supabase, user } = await usuarioAutenticadoOuErro();

  const validado = validarCheckin(entrada, dataLocalBrasil());
  if (!validado.ok) {
    return { ok: false, permanente: true, mensagem: `Check-in recusado: ${validado.erro}` };
  }

  const { error } = await supabase
    .from("checkin")
    .upsert({ ...validado.dados, usuario_id: user.id }, { onConflict: "usuario_id,dia" });
  if (error) {
    const mensagem = `Falha ao registrar check-in: ${error.message}`;
    if (ehErroPermanenteDoPostgres(error.code)) return { ok: false, permanente: true, mensagem };
    throw new Error(mensagem);
  }
  revalidatePath("/");
  return { ok: true };
}

export type CheckinDoDia = {
  dia: string;
  sono: NotaCheckin | null;
  energia: NotaCheckin | null;
  dorMuscular: NotaCheckin | null;
  estresse: NotaCheckin | null;
};

type LinhaCheckin = {
  dia: string;
  sono: NotaCheckin | null;
  energia: NotaCheckin | null;
  dor_muscular: NotaCheckin | null;
  estresse: NotaCheckin | null;
};

/** Os check-ins mais recentes da PRÓPRIA conta (do mais novo para o mais antigo). */
export async function listarCheckinsRecentes(quantos = 7): Promise<CheckinDoDia[]> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("checkin")
    .select("dia, sono, energia, dor_muscular, estresse")
    // Escopo explícito, mesmo com a RLS: o personal com vínculo também
    // enxerga linhas de aluno aqui (migração 20261001233025), e esta tela é
    // a PRÓPRIA conta.
    .eq("usuario_id", user.id)
    .order("dia", { ascending: false })
    .limit(Math.min(Math.max(quantos, 1), 90));
  if (error) throw new Error(`Falha ao listar check-ins: ${error.message}`);
  return ((data ?? []) as LinhaCheckin[]).map((l) => ({
    dia: l.dia,
    sono: l.sono,
    energia: l.energia,
    dorMuscular: l.dor_muscular,
    estresse: l.estresse,
  }));
}

/** O check-in de um dia da PRÓPRIA conta, ou `null` se ainda não respondeu. */
export async function buscarCheckinDoDia(dia: string): Promise<CheckinDoDia | null> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("checkin")
    .select("dia, sono, energia, dor_muscular, estresse")
    .eq("usuario_id", user.id)
    .eq("dia", dia)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar o check-in do dia: ${error.message}`);
  if (!data) return null;
  const l = data as LinhaCheckin;
  return { dia: l.dia, sono: l.sono, energia: l.energia, dorMuscular: l.dor_muscular, estresse: l.estresse };
}

/** O aluno liga ou desliga o compartilhamento do check-in com o personal vinculado. */
export async function definirCompartilhaCheckin(compartilha: boolean): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  const { error } = await supabase
    .from("usuario")
    .update({ compartilha_checkin: compartilha === true })
    .eq("id", user.id);
  if (error) throw new Error(`Falha ao salvar o compartilhamento do check-in: ${error.message}`);
  revalidatePath("/ajustes/personal");
}

/**
 * Apaga TODOS os check-ins da PRÓPRIA conta (a retirada do consentimento sem
 * apagar a conta, LGPD art. 8º §5º). Escopo explícito, mesmo com a RLS.
 */
export async function apagarMeusCheckins(): Promise<void> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  const { error } = await supabase.from("checkin").delete().eq("usuario_id", user.id);
  if (error) throw new Error(`Falha ao apagar os check-ins: ${error.message}`);
  revalidatePath("/checkin");
  revalidatePath("/");
}

function escaparCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

/** Backup dos check-ins da conta em CSV (a mesma promessa da exportação das séries). */
export async function exportarCheckinsCsv(): Promise<string> {
  const { supabase, user } = await usuarioAutenticadoOuErro();
  const { data, error } = await supabase
    .from("checkin")
    .select("dia, sono, energia, dor_muscular, estresse")
    .eq("usuario_id", user.id)
    .order("dia", { ascending: true });
  if (error) throw new Error(`Falha ao exportar check-ins: ${error.message}`);

  const cabecalho = ["dia", ...CAMPOS_CHECKIN].join(",");
  const linhas = ((data ?? []) as LinhaCheckin[]).map((l) =>
    [escaparCsv(l.dia), l.sono ?? "", l.energia ?? "", l.dor_muscular ?? "", l.estresse ?? ""].join(","),
  );
  return [cabecalho, ...linhas].join("\n");
}
