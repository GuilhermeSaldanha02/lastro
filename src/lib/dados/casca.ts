// lastro · As duas cascas do app (PRD §11, emenda de 2026-09-11).
//
// Trocar a barra inferior NÃO é a trava: a barra é pista, não porta.
// `/treino` continua respondendo por URL digitada, por link velho no
// histórico e pelo HTML que o service worker guardou de antes do
// cadastro. Se a casca do personal existisse só na navegação, um personal
// chegaria na tela de registrar série e a decisão "conta de personal não
// treina" seria decorativa — o mesmo erro que a trava da prescrição
// evitou no `/api/analise`.
//
// Estes guardas ficam nas PÁGINAS e não no `proxy.ts` de propósito. O
// middleware roda em toda requisição do matcher e hoje só chama
// `getUser()`; saber o tipo da conta exige ler o perfil, e pagar essa
// consulta em todo request — inclusive nos que não ligam para isso — para
// resolver uma regra de meia dúzia de telas é caro no lugar errado.
import { redirect } from "next/navigation";
import type { Perfil } from "@/lib/dados/perfil";

/** Onde a conta de personal mora. A fila é a casa dela, não a Home de treino. */
export const CASA_DO_PERSONAL = "/personal";
/** Onde mora quem treina. */
export const CASA_DO_ALUNO = "/";

/**
 * Chame nas telas que pressupõem QUEM TREINA — Home, treino, análise,
 * coach. Conta de personal cai na própria fila em vez de ver uma tela que
 * não é dela.
 *
 * Recebe o perfil que a página já carregou; não faz consulta própria.
 */
export function exigirCascaDeAluno(perfil: Perfil | null): void {
  if (perfil?.tipoConta === "personal") {
    redirect(CASA_DO_PERSONAL);
  }
}

/**
 * Chame nas telas que só fazem sentido para quem ACOMPANHA — a fila e a
 * lista de alunos.
 *
 * O aluno vinculado não entra aqui: ele tem personal, não é personal. E a
 * tela dele para esse assunto é `/ajustes/personal`, que continua sendo a
 * porta dos dois lados do vínculo.
 */
export function exigirCascaDePersonal(perfil: Perfil | null): void {
  if (perfil?.tipoConta !== "personal") {
    redirect(CASA_DO_ALUNO);
  }
}

/**
 * `true` quando a conta é de personal e ainda não informou o CREF.
 *
 * Este é o estado de quem entrou por Google: legítimo no banco (não
 * existe constraint "personal implica CREF", e não pode existir — ela
 * abortaria o cadastro dentro do insert em `auth.users`), e bloqueado no
 * app, que é onde a mensagem é visível e acionável.
 */
export function precisaCompletarCadastro(perfil: Perfil | null): boolean {
  return perfil?.tipoConta === "personal" && !perfil.cref;
}
