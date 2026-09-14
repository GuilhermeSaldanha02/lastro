import { describe, expect, it } from "vitest";

import { possuiTraducao, t } from "./i18n";

describe("i18n", () => {
  it.each(["pt-BR", "en", "es"] as const)("devolve a própria chave inexistente em %s", (idioma) => {
    expect(t("Chave inexistente", idioma)).toBe("Chave inexistente");
  });

  it.each([
    "Fila",
    "Alunos",
    "Modo do app",
    "Nada pede atenção nesta semana.",
    "Sessão expirada. Entre novamente.",
    "Página não encontrada",
    "Convidar aluno",
    "Gerar convite",
    "Copiar link",
    "Encerrar acesso",
    "Abrir novamente",
    "Enviar pelo WhatsApp",
    "Sem telefone cadastrado",
    "Modo treino",
    "Modo trabalho",
    "Conta de personal",
    "Formato esperado",
    "Salvar e abrir a fila",
    "Informado pelo profissional. O lastro não verifica registro no CONFEF.",
    "Sem conexão",
    "Salvo no aparelho",
    "Falha ao sincronizar",
    "Treino não encontrado",
    "Valor fora do limite",
    "Sessão expirada",
    "Finalizar treino",
    "Reabrir treino",
    "Descartar série",
    "Treino LASTRO",
    "TREINO",
    "Revisão",
    "Músculos que ajudam",
    "Movimento das articulações",
    "Dica de execução",
    "Conteúdo gerado por IA",
    "Aviso de saúde",
    "Exercício não encontrado",
    "Nenhum modelo criado ainda.",
    "Nenhuma anilha configurada ainda.",
    "Dê um nome ao modelo.",
    "Escolha pelo menos um exercício.",
    "Reps do plano precisa ser um número inteiro entre 1 e 100.",
    "Peso do plano precisa estar entre 0 e 1000 kg.",
    "Peso da anilha precisa estar entre 0,01 e 9999,99 kg.",
    "Peso da barra precisa estar entre 0,01 e 9999,99 kg.",
  ])("tem cobertura completa para %s", (chave) => {
    expect(possuiTraducao(chave)).toBe(true);
    expect(t(chave, "en")).not.toBe(chave);
    expect(t(chave, "es")).not.toBe(chave);
  });
});
