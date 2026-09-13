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
import type { Perfil } from "@/lib/dados/perfil";

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
export function exigirTipoEscolhido(perfil: Perfil | null): void {
  if (perfil && !perfil.tipoEscolhido) {
    redirect(ESCOLHA_DO_TIPO);
  }
}

/**
 * Chame nas telas que pressupõem QUEM TREINA — Home, treino, análise,
 * coach. Em modo trabalho, a conta cai na própria fila.
 *
 * Recebe o perfil que a página já carregou; não faz consulta própria.
 */
export function exigirCascaDeAluno(perfil: Perfil | null): void {
  exigirTipoEscolhido(perfil);
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
