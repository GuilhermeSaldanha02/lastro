/**
 * Server Actions do módulo Personal — PRD §11.4.3 e §11.7.
 *
 * Arquivo separado de `personal.ts` porque `"use server"` é diretiva de
 * ARQUIVO INTEIRO nesta base (mesma razão registrada em `meta-semanal.ts`
 * e `atualizar-avatar.ts`).
 *
 * As duas transições de estado do vínculo — aceitar e revogar — NÃO
 * acontecem aqui: elas são `rpc` para as funções `security definer` da
 * migração 0022, que carregam as guardas. Este arquivo só traduz erro do
 * banco em mensagem de tela. A regra mora no banco de propósito: Server
 * Action é código de aplicação, e consentimento que depende de código de
 * aplicação é consentimento que uma refatoração apaga.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crefValido, normalizarCref } from "@/lib/texto/cref";
import { normalizarTelefoneWhatsApp } from "@/lib/texto/whatsapp";

export type Resultado = { ok: true } | { ok: false; erro: string };
export type ResultadoCom<T> = { ok: true; valor: T } | { ok: false; erro: string };

/**
 * Alfabeto sem caractere ambíguo: sem I, L, O, 0 e 1. O código é ditado
 * em voz alta e digitado à mão — "O ou zero?" é o tipo de atrito que some
 * tirando o caractere, não explicando na tela. Igual à constraint
 * `vinculo_codigo_formato` da migração 0022.
 */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TAMANHO_CODIGO = 10;

/**
 * `crypto.getRandomValues`, não `Math.random`. 10 caracteres de um
 * alfabeto de 31 são ~49 bits — o código é o que atrela uma conta a um
 * personal, então adivinhá-lo precisa ser inviável, e `Math.random` é
 * previsível por construção.
 *
 * O módulo enviesa levemente (256 não é múltiplo de 31). Irrelevante para
 * 49 bits, e dito aqui para ninguém "consertar" isso achando que era
 * descuido.
 */
function gerarCodigo(): string {
  const bytes = new Uint8Array(TAMANHO_CODIGO);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

/**
 * Cria um convite. Não toca em conta nenhuma além da de quem chama — o
 * convite nasce SEM aluno (§11.4.3: digitar o contato de alguém não
 * concede acesso a nada).
 */
export async function gerarConvitePersonal(): Promise<ResultadoCom<string>> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  const codigo = gerarCodigo();
  const { error } = await supabase
    .from("vinculo_personal")
    .insert({ personal_id: user.id, codigo, estado: "pendente" });

  if (error) {
    return { ok: false, erro: "Não foi possível gerar o convite. Tente de novo." };
  }

  revalidatePath("/ajustes/personal");
  return { ok: true, valor: codigo };
}

/** Desiste de um convite que ninguém aceitou. */
export async function apagarConvitePersonal(
  conviteId: string,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("vinculo_personal")
    .delete()
    .eq("id", conviteId)
    .eq("estado", "pendente");

  if (error) return { ok: false, erro: "Não foi possível apagar o convite." };

  revalidatePath("/ajustes/personal");
  return { ok: true };
}

/**
 * O ACEITE — o único caminho pelo qual um vínculo passa a existir.
 *
 * O telefone é obrigatório aqui porque é ele que faz o botão do §11.7
 * existir: sem número, o alerta vira relatório para ler, que é o modo de
 * falha declarado. Normalizado no app (função pura e testada) e validado
 * de novo no banco — a tela não pode ser mais frouxa que a constraint.
 */
export async function aceitarConvitePersonal(
  codigo: string,
  telefoneBruto: string,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  const codigoLimpo = (codigo ?? "").trim().toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{10}$/.test(codigoLimpo)) {
    return { ok: false, erro: "Código inválido. Confira as 10 letras e números." };
  }

  const telefone = normalizarTelefoneWhatsApp(telefoneBruto);
  if (!telefone) {
    return {
      ok: false,
      erro: "Telefone inválido. Escreva com DDD, por exemplo 83 99999-8888.",
    };
  }

  const { error } = await supabase.rpc("aceitar_convite_personal", {
    p_codigo: codigoLimpo,
    p_telefone_whatsapp: telefone,
  });

  if (error) {
    // As mensagens vêm das guardas da função no banco. Traduzir aqui (e
    // não reimplementar a checagem antes da chamada) é o que impede as
    // duas pontas de divergirem.
    const mensagem = error.message ?? "";
    if (mensagem.includes("já existe vínculo aceito")) {
      return {
        ok: false,
        erro: "Você já tem um personal vinculado. Revogue o vínculo atual antes de aceitar outro.",
      };
    }
    if (mensagem.includes("código inválido")) {
      return {
        ok: false,
        erro: "Esse código não existe ou já foi usado. Peça um novo ao seu personal.",
      };
    }
    if (mensagem.includes("telefone inválido")) {
      return { ok: false, erro: "Telefone inválido. Escreva com DDD." };
    }
    return { ok: false, erro: "Não foi possível aceitar o convite. Tente de novo." };
  }

  revalidatePath("/ajustes/personal");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * A REVOGAÇÃO — do aluno, e de mais ninguém (§11.4.3). Corte imediato:
 * no instante em que o estado sai de `aceito`, as policies
 * `treino_visivel_ao_personal`, `serie_visivel_ao_personal` e
 * `usuario_visivel_ao_personal` param de devolver linha, e os alertas
 * daquele vínculo deixam de ser legíveis. O telefone do aluno continua
 * sendo dele — o que desaparece é o acesso.
 */
export async function revogarVinculoPersonal(): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("revogar_vinculo_personal");
  if (error) return { ok: false, erro: "Não foi possível revogar. Tente de novo." };

  revalidatePath("/ajustes/personal");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Registra que o personal acionou o alerta — §11.7: "o clique acontece
 * DENTRO do lastro e é registrável". É o que permite responder, depois, se
 * o alerta virou ação; sem isto o botão abriria o WhatsApp e o produto
 * não saberia de nada.
 *
 * Não bloqueia a abertura do WhatsApp: a tela navega de qualquer jeito. O
 * registro que falha perde uma medida; o registro que impede a ação mata o
 * produto (§11.4.7 — agir é o objetivo).
 */
export async function registrarAcionamentoAlerta(
  alertaId: string,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("alerta_personal")
    .update({ acionado_em: new Date().toISOString() })
    .eq("id", alertaId)
    .is("acionado_em", null);

  if (error) return { ok: false, erro: "Não foi possível registrar o acionamento." };

  revalidatePath("/personal");
  return { ok: true };
}

/**
 * Salva o telefone de quem já tem conta. O dono decidiu em 2026-09-11 que
 * contato é obrigatório no cadastro — esta ação é o caminho para as contas
 * que nasceram ANTES disso (inclusive a do dono) e para o login com
 * Google, que não entrega telefone.
 */
export async function salvarTelefoneWhatsApp(
  telefoneBruto: string,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  const telefone = normalizarTelefoneWhatsApp(telefoneBruto);
  if (!telefone) {
    return {
      ok: false,
      erro: "Telefone inválido. Escreva com DDD, por exemplo 83 99999-8888.",
    };
  }

  const { error } = await supabase
    .from("usuario")
    .update({ telefone_whatsapp: telefone })
    .eq("id", user.id);

  if (error) return { ok: false, erro: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/ajustes/personal");
  revalidatePath("/perfil");
  return { ok: true };
}

/**
 * Abre a área de trabalho: CREF e WhatsApp. Serve aos dois caminhos da
 * emenda de 2026-09-12 (2) — quem treina e decide virar personal, e a
 * conta que nasceu personal sem CREF (Google).
 *
 * A gravação é `rpc` para `ativar_area_de_trabalho` (migração 0025), e não
 * update: desde a 0025 a própria conta não escreve `tipo_conta` nem `cref`
 * direto. As checagens abaixo existem para a mensagem sair em português
 * antes da viagem ao banco; a regra que vale é a da função.
 */
export async function completarCadastroPersonal(
  crefBruto: string,
  telefoneBruto: string,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  if (!crefValido(crefBruto)) {
    return {
      ok: false,
      erro: "CREF inválido. Use o formato 123456-G/PB, como está na sua carteira.",
    };
  }

  const telefone = normalizarTelefoneWhatsApp(telefoneBruto);
  if (!telefone) {
    return {
      ok: false,
      erro: "Telefone inválido. Escreva com DDD, por exemplo 83 99999-8888.",
    };
  }

  const { error } = await supabase.rpc("ativar_area_de_trabalho", {
    p_cref: normalizarCref(crefBruto),
    p_telefone_whatsapp: telefone,
  });

  if (error) {
    const mensagem = error.message ?? "";
    if (mensagem.includes("cref inválido")) {
      return {
        ok: false,
        erro: "CREF inválido. Use o formato 123456-G/PB, como está na sua carteira.",
      };
    }
    if (mensagem.includes("cref já informado")) {
      return { ok: false, erro: "Esta conta já tem CREF informado." };
    }
    if (mensagem.includes("telefone inválido")) {
      return { ok: false, erro: "Telefone inválido. Escreva com DDD." };
    }
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/personal");
}

/**
 * Troca o modo ativo da conta (emenda 2026-09-12 (2)). O gesto é
 * explícito: abrir um link da fila em modo treino NÃO troca de modo.
 *
 * `trabalho` em conta sem área de trabalho é recusado pela check
 * `usuario_modo_trabalho_exige_personal` — o erro volta daqui, e ninguém
 * se promove pelo seletor de modo.
 */
export async function alternarModo(modo: "treino" | "trabalho"): Promise<Resultado> {
  if (modo !== "treino" && modo !== "trabalho") {
    return { ok: false, erro: "Modo inválido." };
  }
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão ausente — entre de novo." };

  const { error } = await supabase
    .from("usuario")
    .update({ modo_ativo: modo })
    .eq("id", user.id);

  if (error) return { ok: false, erro: "Não foi possível trocar de modo. Tente de novo." };

  revalidatePath("/", "layout");
  redirect(modo === "trabalho" ? "/personal" : "/");
}
