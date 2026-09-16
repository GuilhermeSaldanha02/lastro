import { describe, expect, it } from "vitest";

import { apresentarErroPersonal } from "./erro-personal";

describe("apresentarErroPersonal", () => {
  it.each([
    "Sessão ausente — entre de novo.",
    "Não foi possível gerar o convite. Tente de novo.",
    "Não foi possível apagar o convite.",
    "Código inválido. Confira as 10 letras e números.",
    "Telefone inválido. Escreva com DDD, por exemplo 83 99999-8888.",
    "Você já tem um personal vinculado. Revogue o vínculo atual antes de aceitar outro.",
    "Esse código não existe ou já foi usado. Peça um novo ao seu personal.",
    "Telefone inválido. Escreva com DDD.",
    "Não foi possível aceitar o convite. Tente de novo.",
    "Não foi possível revogar. Tente de novo.",
    "CREF inválido. Use o formato 123456-G/PB, como está na sua carteira.",
    "Conta de usuário não vira conta de personal.",
    "Esta conta já tem CREF informado.",
    "Não foi possível salvar. Tente de novo.",
    "Tipo de conta inválido.",
    "O tipo desta conta já foi escolhido.",
    "Modo inválido.",
    "Não foi possível trocar de modo. Tente de novo.",
    "Não foi possível registrar o acionamento.",
    "Não foi possível concluir a ação. Tente de novo.",
  ])("traduz a falha determinística %s", (erro) => {
    expect(apresentarErroPersonal(erro, "pt-BR")).toBe(erro);
    expect(apresentarErroPersonal(erro, "en")).not.toBe(erro);
    expect(apresentarErroPersonal(erro, "es")).not.toBe(erro);
  });

  it("mantém o texto recebido quando a falha é inesperada", () => {
    expect(apresentarErroPersonal("Falha nova do servidor.", "en")).toBe("Falha nova do servidor.");
  });
});
