"use client";

// lastro · O lado do PERSONAL — gerar convite e ver os alunos.
//
// O convite é um código, não um e-mail. Isso não é preferência de UX: com
// e-mail o app precisaria consultar `auth.users` para saber se aquela
// pessoa tem conta, e isso transforma a tela num oráculo de "este e-mail
// está cadastrado no lastro?". O código não revela nada sobre ninguém, e o
// canal para entregá-lo — WhatsApp — é o que já existe (§11.7).
import { useState } from "react";
import {
  apagarConvitePersonal,
  gerarConvitePersonal,
} from "@/lib/dados/personal-acoes";
import { formatarTelefoneBrasil } from "@/lib/texto/whatsapp";
import type { AlunoVinculado, ConviteDoPersonal } from "@/lib/dados/personal";

export default function ConvitesPersonal({
  convites,
  alunos,
  origem,
}: {
  convites: ConviteDoPersonal[];
  alunos: AlunoVinculado[];
  /** Origem absoluta do app, para montar o link que o aluno abre. */
  origem: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function gerar() {
    setErro(null);
    setOcupado(true);
    const resultado = await gerarConvitePersonal();
    setOcupado(false);
    if (!resultado.ok) setErro(resultado.erro);
  }

  async function apagar(id: string) {
    setErro(null);
    setOcupado(true);
    const resultado = await apagarConvitePersonal(id);
    setOcupado(false);
    if (!resultado.ok) setErro(resultado.erro);
  }

  async function copiar(codigo: string) {
    const link = `${origem}/ajustes/personal?codigo=${codigo}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(codigo);
    } catch {
      // Navegador sem permissão de área de transferência é caso normal,
      // não erro: o código continua visível e selecionável na tela.
      setCopiado(null);
      setErro("Não foi possível copiar. O código está aí para selecionar à mão.");
    }
  }

  return (
    <>
      <section className="card-obsidian">
        <span className="card-obsidian__titulo">Convidar um aluno</span>
        <p className="campo__nota">
          Gere um código e mande para o aluno. Ele aceita dentro do app dele —
          só aí você passa a ver os treinos, e só até ele revogar.
        </p>

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        <button
          type="button"
          className="botao-primario"
          onClick={gerar}
          disabled={ocupado}
        >
          {ocupado ? "Gerando…" : "Gerar código de convite"}
        </button>

        {convites.length > 0 && (
          <ul className="lista">
            {convites.map((convite) => (
              <li key={convite.id} className="pilha">
                <code className="codigo-convite">{convite.codigo}</code>
                <div className="grupo__confirmacao">
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => copiar(convite.codigo)}
                  >
                    {copiado === convite.codigo ? "Link copiado" : "Copiar link"}
                  </button>
                  <button
                    type="button"
                    className="botao-textual botao-textual--destrutivo"
                    onClick={() => apagar(convite.id)}
                    disabled={ocupado}
                  >
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {alunos.length > 0 && (
        <section className="card-obsidian">
          <span className="card-obsidian__titulo">
            {alunos.length === 1 ? "1 aluno vinculado" : `${alunos.length} alunos vinculados`}
          </span>
          <ul className="lista">
            {alunos.map((aluno) => (
              <li key={aluno.vinculoId}>
                <p className="alerta-personal__linha">
                  <strong>{aluno.nome}</strong>
                </p>
                <p className="campo__nota">
                  {aluno.telefoneWhatsApp
                    ? formatarTelefoneBrasil(aluno.telefoneWhatsApp)
                    : "Sem telefone salvo — a mensagem pronta não aparece até ele informar."}
                </p>
              </li>
            ))}
          </ul>
          <p className="campo__nota">
            Quem encerra o vínculo é o aluno, na tela dele. Você não tem esse
            botão de propósito.
          </p>
        </section>
      )}
    </>
  );
}
