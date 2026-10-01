// lastro · AN-08 A1 — quem pode ler e escrever o check-in (migração
// 20261001233025). É dado sensível, e a regra de acesso é a parte que não pode
// ser só "provada por quem a escreveu": este spec roda contra o banco de
// verdade, com contas descartáveis e o vínculo feito pela INTERFACE (o aceite
// do aluno é consentimento e não se simula por atalho).
//
// O que se prova:
//   1. a conta grava e corrige o PRÓPRIO check-in (upsert por dia, só as notas
//      que chegam mudam);
//   2. o banco recusa nota fora de 1 a 5 e linha sem nenhuma nota;
//   3. o personal com vínculo aceito LÊ, e deixa de ler na hora em que o aluno
//      desliga o compartilhamento, e volta quando ele religa;
//   4. o personal NUNCA escreve no check-in do aluno;
//   5. um estranho (sem vínculo) não lê nada, e ninguém grava em nome de outro.
import { expect, test } from "@playwright/test";
import {
  apagarUsuarioDescartavel,
  clienteAutenticado,
  criarUsuarioDescartavel,
  type UsuarioDescartavel,
} from "./helpers/usuario-descartavel";
import { criarVinculoAceito } from "./helpers/vinculo";
import { dataLocalBrasil } from "../src/lib/tempo";

let personal: UsuarioDescartavel;
let aluno: UsuarioDescartavel;
let estranho: UsuarioDescartavel;

test.beforeAll(async () => {
  personal = await criarUsuarioDescartavel("j42-personal", "personal");
  aluno = await criarUsuarioDescartavel("j42-aluno");
  estranho = await criarUsuarioDescartavel("j42-estranho");
});

test.afterAll(async () => {
  for (const c of [personal, aluno, estranho]) if (c) await apagarUsuarioDescartavel(c);
});

function ontem(hoje: string): string {
  const [a, m, d] = hoje.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
}

test("o check-in é do aluno, o personal vinculado lê enquanto o aluno compartilha, e ninguém mais", async ({ browser }) => {
  test.setTimeout(180_000);
  const vinculo = await criarVinculoAceito({ browser, personal, aluno });
  await vinculo.contextoPersonal.close();
  await vinculo.contextoAluno.close();

  const comAluno = await clienteAutenticado(aluno);
  const comPersonal = await clienteAutenticado(personal);
  const comEstranho = await clienteAutenticado(estranho);
  const hoje = dataLocalBrasil();

  // 1. Grava e corrige o próprio check-in.
  const primeiro = await comAluno
    .from("checkin")
    .upsert({ usuario_id: aluno.id, dia: hoje, sono: 4, energia: 3 }, { onConflict: "usuario_id,dia" });
  expect(primeiro.error, "o aluno grava o próprio check-in").toBeNull();

  const corrigido = await comAluno
    .from("checkin")
    .upsert({ usuario_id: aluno.id, dia: hoje, energia: 5 }, { onConflict: "usuario_id,dia" });
  expect(corrigido.error, "corrigir o mesmo dia").toBeNull();

  const doAluno = await comAluno.from("checkin").select("dia, sono, energia, dor_muscular, estresse").eq("usuario_id", aluno.id);
  expect(doAluno.data, "uma linha por dia, e só a nota enviada mudou").toEqual([
    { dia: hoje, sono: 4, energia: 5, dor_muscular: null, estresse: null },
  ]);

  // 2. O banco recusa o que não faz sentido.
  const foraDaEscala = await comAluno
    .from("checkin")
    .upsert({ usuario_id: aluno.id, dia: hoje, energia: 6 }, { onConflict: "usuario_id,dia" });
  expect(foraDaEscala.error?.code, "nota 6 viola o check de 1 a 5").toBe("23514");

  const vazio = await comAluno.from("checkin").insert({ usuario_id: aluno.id, dia: ontem(hoje) });
  expect(vazio.error?.code, "linha sem nenhuma nota viola `checkin_algum_campo`").toBe("23514");

  // 3. O personal vinculado lê enquanto o aluno compartilha...
  const personalLe = await comPersonal.from("checkin").select("dia, energia").eq("usuario_id", aluno.id);
  expect(personalLe.error).toBeNull();
  expect(personalLe.data, "personal com vínculo aceito lê").toEqual([{ dia: hoje, energia: 5 }]);

  // ...um estranho não lê...
  const estranhoLe = await comEstranho.from("checkin").select("dia").eq("usuario_id", aluno.id);
  expect(estranhoLe.data, "sem vínculo, nada").toEqual([]);

  // ...e o aluno desliga: o acesso cai na hora.
  const desliga = await comAluno.from("usuario").update({ compartilha_checkin: false }).eq("id", aluno.id);
  expect(desliga.error, "o aluno desliga o compartilhamento").toBeNull();
  const semAcesso = await comPersonal.from("checkin").select("dia").eq("usuario_id", aluno.id);
  expect(semAcesso.data, "compartilhamento desligado: o personal não lê").toEqual([]);

  // O aluno continua lendo o próprio.
  const alunoAindaLe = await comAluno.from("checkin").select("dia").eq("usuario_id", aluno.id);
  expect(alunoAindaLe.data?.length, "desligar não esconde do próprio aluno").toBe(1);

  // Religa: volta.
  await comAluno.from("usuario").update({ compartilha_checkin: true }).eq("id", aluno.id);
  const volta = await comPersonal.from("checkin").select("dia").eq("usuario_id", aluno.id);
  expect(volta.data?.length, "religou: o personal volta a ler").toBe(1);

  // 4. O personal nunca escreve no check-in do aluno.
  const personalInsere = await comPersonal.from("checkin").insert({ usuario_id: aluno.id, dia: ontem(hoje), sono: 1 });
  expect(personalInsere.error, "personal não insere no check-in do aluno").not.toBeNull();
  const personalAltera = await comPersonal
    .from("checkin")
    .update({ sono: 1 })
    .eq("usuario_id", aluno.id)
    .select("dia");
  expect(personalAltera.data ?? [], "personal não altera o check-in do aluno").toEqual([]);
  const personalApaga = await comPersonal.from("checkin").delete().eq("usuario_id", aluno.id).select("dia");
  expect(personalApaga.data ?? [], "personal não apaga o check-in do aluno").toEqual([]);

  // 5. Ninguém grava em nome de outro.
  const emNomeDeOutro = await comEstranho.from("checkin").insert({ usuario_id: aluno.id, dia: ontem(hoje), sono: 2 });
  expect(emNomeDeOutro.error, "estranho não grava em nome do aluno").not.toBeNull();

  // O que sobrou do aluno continua intacto e é dele.
  const intacto = await comAluno.from("checkin").select("dia, sono, energia").eq("usuario_id", aluno.id);
  expect(intacto.data).toEqual([{ dia: hoje, sono: 4, energia: 5 }]);

  // O aluno apaga o próprio.
  const apaga = await comAluno.from("checkin").delete().eq("usuario_id", aluno.id);
  expect(apaga.error, "o aluno apaga o próprio check-in").toBeNull();
  const restou = await comAluno.from("checkin").select("dia").eq("usuario_id", aluno.id);
  expect(restou.data).toEqual([]);
});
