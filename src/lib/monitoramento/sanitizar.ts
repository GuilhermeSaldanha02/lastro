// lastro · PU-07 — o que pode ser gravado de um erro de produção.
//
// O app guarda dado de treino e de saúde de estranhos (PU-06). Um log de erro
// que copiasse e-mail, token ou a query da URL viraria um segundo cofre de
// dado pessoal, sem RLS pensada para isso. Então o registro leva só o
// necessário para achar o bug: mensagem, pilha e rota SEM query, com e-mail
// e sequências que parecem token trocados por marcadores, e tamanho limitado.
//
// Função pura, sem "use server": usada pelo servidor e testada sozinha.

export const LIMITE_MENSAGEM = 500;
export const LIMITE_PILHA = 4000;
export const LIMITE_ROTA = 200;
export const LIMITE_AGENTE = 200;

export type EntradaErro = {
  mensagem?: unknown;
  pilha?: unknown;
  rota?: unknown;
  digest?: unknown;
  tipoRota?: unknown;
  agente?: unknown;
};

export type ErroSanitizado = {
  mensagem: string;
  pilha: string | null;
  rota: string | null;
  digest: string | null;
  tipo_rota: string | null;
  agente: string | null;
};

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// JWT (três blocos base64url) e qualquer sequência longa sem espaço que
// pareça chave/token.
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const SEQUENCIA_LONGA = /[A-Za-z0-9_-]{40,}/g;

function limpar(texto: string, limite: number): string {
  return texto
    .replace(JWT, "[token]")
    .replace(EMAIL, "[e-mail]")
    .replace(SEQUENCIA_LONGA, "[token]")
    .slice(0, limite);
}

function comoTexto(valor: unknown): string | null {
  if (typeof valor === "string") return valor;
  if (valor instanceof Error) return valor.message;
  return null;
}

/** Só o caminho: sem `?query` nem `#fragmento`, que carregam código de convite, retorno etc. */
export function rotaSemQuery(bruto: unknown): string | null {
  if (typeof bruto !== "string" || bruto === "") return null;
  const semHost = bruto.replace(/^https?:\/\/[^/]+/i, "");
  return limpar(semHost.split(/[?#]/)[0], LIMITE_ROTA) || null;
}

export function sanitizarErro(entrada: EntradaErro): ErroSanitizado {
  const mensagem = comoTexto(entrada.mensagem);
  const pilha = comoTexto(entrada.pilha);
  const digest = typeof entrada.digest === "string" ? entrada.digest.slice(0, 64) : null;
  const tipo = typeof entrada.tipoRota === "string" ? entrada.tipoRota.slice(0, 40) : null;
  const agente = typeof entrada.agente === "string" ? limpar(entrada.agente, LIMITE_AGENTE) : null;

  return {
    mensagem: limpar(mensagem ?? "erro sem mensagem", LIMITE_MENSAGEM),
    pilha: pilha ? limpar(pilha, LIMITE_PILHA) : null,
    rota: rotaSemQuery(entrada.rota),
    digest,
    tipo_rota: tipo,
    agente,
  };
}
