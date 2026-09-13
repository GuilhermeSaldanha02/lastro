// lastro · As duas cascas do app (PRD §11, emendas de 2026-09-11 e
// 2026-09-12 (2)).
//
// Desde a emenda de 2026-09-12 (2), as cascas não são de CONTAS
// diferentes: são MODOS da mesma conta. Toda conta treina; a conta com
// área de trabalho alterna entre `treino` e `trabalho`. Os guardas leem o
// modo ativo, não o tipo da conta.
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
import type { Perfil } from "@/lib/dados/perfil";

/** Onde o modo trabalho mora. A fila é a casa dele, não a Home de treino. */
export const CASA_DO_PERSONAL = "/personal";
/** Onde mora quem treina. */
export const CASA_DO_ALUNO = "/";

/**
 * Chame nas telas que pressupõem QUEM TREINA — Home, treino, análise,
 * coach. Em modo trabalho, a conta cai na própria fila.
 *
 * Recebe o perfil que a página já carregou; não faz consulta própria.
 */
export function exigirCascaDeAluno(perfil: Perfil | null): void {
  if (perfil?.modo === "trabalho") {
    redirect(CASA_DO_PERSONAL);
  }
}

/**
 * Chame nas telas que só fazem sentido para quem ACOMPANHA — a fila e a
 * lista de alunos. Conta sem área de trabalho, ou com ela em modo treino,
 * volta para a Home: trocar de modo é um gesto explícito em Ajustes, não
 * efeito colateral de abrir um link.
 */
export function exigirCascaDePersonal(perfil: Perfil | null): void {
  if (perfil?.modo !== "trabalho") {
    redirect(CASA_DO_ALUNO);
  }
}

/**
 * `true` quando a conta tem área de trabalho e ainda não informou o CREF.
 *
 * É o estado de quem nasceu personal sem CREF (Google, ou metadado fora da
 * régua — o trigger da 0025 anula CREF inválido). Legítimo no banco e
 * bloqueado no app, onde a mensagem é visível e acionável.
 */
export function precisaCompletarCadastro(perfil: Perfil | null): boolean {
  return perfil?.tipoConta === "personal" && !perfil.cref;
}

/** Qual barra inferior desenhar. Segue o modo, pela mesma razão dos guardas. */
export function cascaDaBarra(perfil: Perfil | null): "aluno" | "personal" {
  return perfil?.modo === "trabalho" ? "personal" : "aluno";
}
