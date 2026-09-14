"use client";

// lastro · O lado do ALUNO do vínculo — PRD §11.4.3.
//
// Consentimento é daqui: o aluno aceita, e o aluno revoga. O personal não
// tem botão nenhum nesta tela, por desenho — cadastrar o contato de alguém
// não concede acesso a nada.
import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import {
  aceitarConvitePersonal,
  revogarVinculoPersonal,
} from "@/lib/dados/personal-acoes";
import { formatarTelefoneBrasil } from "@/lib/texto/whatsapp";
import DicaInfo from "./dica-info";
import type { VinculoDoAluno } from "@/lib/dados/personal";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { apresentarErroPersonal } from "@/lib/texto/erro-personal";

export default function VinculoAluno({
  vinculo,
  telefoneAtual,
  codigoDoLink,
  idioma,
}: {
  vinculo: VinculoDoAluno | null;
  telefoneAtual: string | null;
  /** Código que veio no link do convite (`?codigo=`), já preenchido. */
  codigoDoLink: string;
  idioma: Idioma;
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
    try {
      const resultado = await aceitarConvitePersonal(codigo, telefone);
      if (!resultado.ok) setErro(apresentarErroPersonal(resultado.erro, idioma));
    } catch (falha) {
      unstable_rethrow(falha);
      setErro(apresentarErroPersonal("Não foi possível concluir a ação. Tente de novo.", idioma));
    } finally {
      setEnviando(false);
    }
  }

  async function revogar() {
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await revogarVinculoPersonal();
      if (!resultado.ok) setErro(apresentarErroPersonal(resultado.erro, idioma));
    } catch (falha) {
      unstable_rethrow(falha);
      setErro(apresentarErroPersonal("Não foi possível concluir a ação. Tente de novo.", idioma));
    } finally {
      setEnviando(false);
      setConfirmandoRevogacao(false);
    }
  }

  if (vinculo) {
    return (
      <section className="card-obsidian">
        <span className="card-obsidian__titulo">{t("Seu personal", idioma)}</span>
        <p className="alerta-personal__titulo">{vinculo.nomeDoPersonal}</p>
        <p className="campo__nota">
          {t("O personal pode ver seus treinos, séries e contato de WhatsApp, sem editar seu histórico.", idioma)}
        </p>

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        {confirmandoRevogacao ? (
          <div className="grupo__confirmacao">
            <p className="campo__nota">
              {t("Encerrar acesso corta a leitura imediatamente. Seu histórico continua inteiro.", idioma)}
            </p>
            <button
              type="button"
              className="botao-destrutivo"
              onClick={revogar}
              disabled={enviando}
            >
              {enviando ? t("Encerrando…", idioma) : t("Encerrar acesso", idioma)}
            </button>
            <button
              type="button"
              className="botao-textual"
              onClick={() => setConfirmandoRevogacao(false)}
              disabled={enviando}
            >
              {t("Manter acesso", idioma)}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="botao-textual-com-icone botao-textual-com-icone--destrutivo"
            onClick={() => setConfirmandoRevogacao(true)}
          >
            {t("Encerrar acesso", idioma)}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="card-obsidian">
      <div className="titulo-com-dica">
        <span className="card-obsidian__titulo">{t("Conectar-se a um personal", idioma)}</span>
        <DicaInfo titulo={t("Conectar-se a um personal", idioma)} idioma={idioma}>
          {t("Cole o código enviado pelo personal. Nada acontece sem seu aceite.", idioma)}
        </DicaInfo>
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="codigo_convite">
          {t("Código do convite", idioma)}
        </label>
        <input
          id="codigo_convite"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          placeholder={t("10 letras e números", idioma)}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />
      </div>

      <div className="campo">
        <div className="campo__rotulo-linha">
          <label className="campo__rotulo" htmlFor="telefone_whatsapp">
            {t("Seu WhatsApp, com DDD", idioma)}
          </label>
          <DicaInfo titulo={t("Seu WhatsApp", idioma)} idioma={idioma}>
            {t("O personal usa este telefone para falar com você. O lastro não envia mensagens sozinho.", idioma)}
          </DicaInfo>
        </div>
        <input
          id="telefone_whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="83 99999-8888"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
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
        {enviando ? t("Aceitando…", idioma) : t("Aceitar convite", idioma)}
      </button>
    </section>
  );
}
