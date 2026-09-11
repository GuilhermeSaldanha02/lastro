"use client";

// lastro · O lado do ALUNO do vínculo — PRD §11.4.3.
//
// Consentimento é daqui: o aluno aceita, e o aluno revoga. O personal não
// tem botão nenhum nesta tela, por desenho — cadastrar o contato de alguém
// não concede acesso a nada.
import { useState } from "react";
import {
  aceitarConvitePersonal,
  revogarVinculoPersonal,
} from "@/lib/dados/personal-acoes";
import { formatarTelefoneBrasil } from "@/lib/texto/whatsapp";
import type { VinculoDoAluno } from "@/lib/dados/personal";

export default function VinculoAluno({
  vinculo,
  telefoneAtual,
  codigoDoLink,
}: {
  vinculo: VinculoDoAluno | null;
  telefoneAtual: string | null;
  /** Código que veio no link do convite (`?codigo=`), já preenchido. */
  codigoDoLink: string;
}) {
  const [codigo, setCodigo] = useState(codigoDoLink);
  const [telefone, setTelefone] = useState(
    telefoneAtual ? formatarTelefoneBrasil(telefoneAtual) : "",
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoRevogacao, setConfirmandoRevogacao] = useState(false);

  async function aceitar() {
    setErro(null);
    setEnviando(true);
    const resultado = await aceitarConvitePersonal(codigo, telefone);
    setEnviando(false);
    if (!resultado.ok) setErro(resultado.erro);
  }

  async function revogar() {
    setErro(null);
    setEnviando(true);
    const resultado = await revogarVinculoPersonal();
    setEnviando(false);
    setConfirmandoRevogacao(false);
    if (!resultado.ok) setErro(resultado.erro);
  }

  if (vinculo) {
    return (
      <section className="card-obsidian">
        <span className="card-obsidian__titulo">Seu personal</span>
        <p className="alerta-personal__titulo">{vinculo.nomeDoPersonal}</p>
        <p className="campo__nota">
          Ele vê seus treinos, suas séries e seu contato de WhatsApp. Ele não
          pode registrar, editar nem apagar nada no seu histórico. A
          prescrição da próxima semana passa a ser dele.
        </p>

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        {confirmandoRevogacao ? (
          <div className="grupo__confirmacao">
            <p className="campo__nota">
              Revogar corta o acesso dele na hora. Seu histórico continua
              inteiro, e seu telefone continua sendo seu — ele só deixa de ver.
            </p>
            <button
              type="button"
              className="botao-destrutivo"
              onClick={revogar}
              disabled={enviando}
            >
              {enviando ? "Revogando…" : "Confirmar e revogar"}
            </button>
            <button
              type="button"
              className="botao-textual"
              onClick={() => setConfirmandoRevogacao(false)}
              disabled={enviando}
            >
              Manter o vínculo
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="botao-textual-com-icone botao-textual-com-icone--destrutivo"
            onClick={() => setConfirmandoRevogacao(true)}
          >
            Revogar o vínculo
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="card-obsidian">
      <span className="card-obsidian__titulo">Vincular a um personal</span>
      <p className="campo__nota">
        Se um personal te passou um código, cole aqui. Nada acontece sem você
        aceitar, e você pode revogar quando quiser.
      </p>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="codigo_convite">
          Código do convite
        </label>
        <input
          id="codigo_convite"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          placeholder="10 letras e números"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="telefone_whatsapp">
          Seu WhatsApp, com DDD
        </label>
        <input
          id="telefone_whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="83 99999-8888"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <p className="campo__nota">
          É por aqui que ele te chama quando vê algo no seu treino. O lastro
          nunca manda mensagem no seu lugar nem no dele.
        </p>
      </div>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        className="botao-primario"
        onClick={aceitar}
        disabled={enviando || codigo.trim() === "" || telefone.trim() === ""}
      >
        {enviando ? "Aceitando…" : "Aceitar convite"}
      </button>
    </section>
  );
}
