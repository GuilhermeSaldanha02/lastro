// lastro · As duas cascas do app (PRD §11, emendas de 2026-09-11,
// 2026-09-12 (2) e 2026-09-13).
//
// As cascas são MODOS de uma conta de personal: quem nasceu personal treina
// e trabalha na mesma conta, alternando entre `treino` e `trabalho`. Quem
// nasceu usuário só tem o modo treino, para sempre. Os guardas leem o modo
// ativo, não o tipo da conta.
//
// Trocar a barra inferior NÃO é a trava: a barra é pista, não porta.
// `/treino` continua respondendo por URL digitada, por link velho no
// histórico e pelo HTML que o service worker guardou. Se a casca existisse
// só na navegação, o modo trabalho chegaria na tela de registrar série e a
// separação seria decorativa — o mesmo erro que a trava da prescrição
// evitou no `/api/analise`.
//
// Estes guardas ficam nas PÁGINAS e não no `proxy.ts` de propósito. O
// middleware roda em toda requisição do matcher e hoje só chama
// `getUser()`; saber o modo exige ler o perfil, e pagar essa consulta em
// todo request para resolver uma regra de meia dúzia de telas é caro no
// lugar errado.
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Perfil } from "@/lib/dados/perfil";
import { COOKIE_ONBOARDING_VISTO } from "@/lib/onboarding-cookie";

/** Onde o modo trabalho mora. A fila é a casa dele, não a Home de treino. */
export const CASA_DO_PERSONAL = "/personal";
/** Onde mora quem treina. */
export const CASA_DO_ALUNO = "/";
/** Onde a conta nascida pelo Google escolhe entre usuário e personal. */
export const ESCOLHA_DO_TIPO = "/boas-vindas";

/**
 * A conta criada pelo Google ainda não escolheu o tipo (migração 0026):
 * nenhuma tela do app abre antes. Sem isto, a pessoa usaria o app como
 * usuário e só depois escolheria personal — o que é exatamente a promoção
 * que a regra de 2026-09-13 proíbe.
 */
export function exigirTipoEscolhido(
  perfil: Perfil | null,
  opcoes: { treinoEmAndamento?: boolean } = {},
): void {
  if (perfil && !perfil.tipoEscolhido) {
    redirect(ESCOLHA_DO_TIPO);
  }
  // Aceite dos Termos e da Política (PU-06), DEPOIS da escolha do tipo e
  // ANTES de qualquer tela: conta nova, conta antiga e texto atualizado caem
  // no mesmo lugar. Todo guarda de casca passa por esta função.
  //
  // A1-ACEITE (decisão do dono, 2026-10-01): quem está com um treino em aberto
  // não é interrompido pelo reaceite. A Home, que é por onde o app reabre e onde
  // mora "Continuar Treino de Hoje", passa `treinoEmAndamento`; o aceite fica
  // para a primeira tela guardada depois que o treino terminar. O treino em si
  // (`/treino/[id]`) já não passa por este guarda.
  if (perfil && !perfil.termosAceitos && !opcoes.treinoEmAndamento) {
    redirect(ACEITE_DOS_TERMOS);
  }
}

/** Onde a conta lê e aceita os Termos e a Política (PU-06). */
export const ACEITE_DOS_TERMOS = "/aceite";

/** Onde a conta nova passa pelo passo a passo (PU-08). */
export const ONBOARDING = "/onboarding";

/**
 * Conta nova cai no passo a passo uma vez, na primeira Home (ou fila) que
 * abrir. Vem DEPOIS de `exigirTipoEscolhido`: quem ainda escolhe entre
 * usuário e personal não vê onboarding antes disso. O cookie é a reserva de
 * quando a gravação da conclusão falhou (`dados/onboarding.ts`).
 */
export async function exigirOnboarding(perfil: Perfil | null): Promise<void> {
  if (!perfil || perfil.onboardingConcluido) return;
  if ((await cookies()).get(COOKIE_ONBOARDING_VISTO)) return;
  redirect(ONBOARDING);
}

/**
 * Chame nas telas que pressupõem QUEM TREINA — Home, treino, análise,
 * coach. Em modo trabalho, a conta cai na própria fila.
 *
 * Recebe o perfil que a página já carregou; não faz consulta própria.
 */
export function exigirCascaDeAluno(
  perfil: Perfil | null,
  opcoes: { treinoEmAndamento?: boolean } = {},
): void {
  exigirTipoEscolhido(perfil, opcoes);
  if (perfil?.modo === "trabalho") {
    redirect(CASA_DO_PERSONAL);
  }
}

/**
 * Chame nas telas que só fazem sentido para quem ACOMPANHA — a fila e a
 * lista de alunos. Conta de usuário, ou personal em modo treino, volta para
 * a Home: trocar de modo é um gesto explícito em Ajustes, não efeito
 * colateral de abrir um link.
 */
export function exigirCascaDePersonal(perfil: Perfil | null): void {
  exigirTipoEscolhido(perfil);
  if (perfil?.modo !== "trabalho") {
    redirect(CASA_DO_ALUNO);
  }
}

/**
 * `true` quando a conta é de personal e ainda não informou o CREF.
 *
 * Estado legítimo e raro: o trigger de cadastro anula CREF fora da régua.
 * Bloqueado no app, onde a mensagem é visível e acionável.
 */
export function precisaCompletarCadastro(perfil: Perfil | null): boolean {
  return perfil?.tipoConta === "personal" && !perfil.cref;
}

/** Qual barra inferior desenhar. Segue o modo, pela mesma razão dos guardas. */
export function cascaDaBarra(perfil: Perfil | null): "aluno" | "personal" {
  return perfil?.modo === "trabalho" ? "personal" : "aluno";
}
