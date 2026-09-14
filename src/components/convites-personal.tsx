"use client";

// lastro · O lado do PERSONAL — gerar convite e ver os alunos.
//
// O convite é um código, não um e-mail. Isso não é preferência de UX: com
// e-mail o app precisaria consultar `auth.users` para saber se aquela
// pessoa tem conta, e isso transforma a tela num oráculo de "este e-mail
// está cadastrado no lastro?". O código não revela nada sobre ninguém, e o
// canal para entregá-lo — WhatsApp — é o que já existe (§11.7).
import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import {
  apagarConvitePersonal,
  gerarConvitePersonal,
} from "@/lib/dados/personal-acoes";
import { formatarTelefoneBrasil } from "@/lib/texto/whatsapp";
import DicaInfo from "./dica-info";
import type { AlunoVinculado, ConviteDoPersonal } from "@/lib/dados/personal";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { apresentarErroPersonal } from "@/lib/texto/erro-personal";

export default function ConvitesPersonal({
  convites,
  alunos,
  origem,
  idioma,
}: {
  convites: ConviteDoPersonal[];
  alunos: AlunoVinculado[];
  /** Origem absoluta do app, para montar o link que o aluno abre. */
  origem: string;
  idioma: Idioma;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function gerar() {
    setErro(null);
    setOcupado(true);
    try {
      const resultado = await gerarConvitePersonal();
      if (!resultado.ok) setErro(apresentarErroPersonal(resultado.erro, idioma));
    } catch (falha) {
      unstable_rethrow(falha);
      setErro(apresentarErroPersonal("Não foi possível concluir a ação. Tente de novo.", idioma));
    } finally {
      setOcupado(false);
    }
  }

  async function apagar(id: string) {
    setErro(null);
    setOcupado(true);
    try {
      const resultado = await apagarConvitePersonal(id);
      if (!resultado.ok) setErro(apresentarErroPersonal(resultado.erro, idioma));
    } catch (falha) {
      unstable_rethrow(falha);
      setErro(apresentarErroPersonal("Não foi possível concluir a ação. Tente de novo.", idioma));
    } finally {
      setOcupado(false);
    }
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
      setErro(t("Não foi possível copiar. O código está disponível para selecionar manualmente.", idioma));
    }
  }

  return (
    <>
      <section className="card-obsidian">
        <div className="titulo-com-dica">
          <span className="card-obsidian__titulo">{t("Convidar aluno", idioma)}</span>
          <DicaInfo titulo={t("Convidar aluno", idioma)} idioma={idioma}>
            {t("Gere um código e envie ao aluno. O acesso só começa depois do aceite.", idioma)}
          </DicaInfo>
        </div>

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
          {ocupado ? t("Gerando…", idioma) : t("Gerar convite", idioma)}
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
                    {copiado === convite.codigo ? t("Link copiado", idioma) : t("Copiar link", idioma)}
                  </button>
                  <button
                    type="button"
                    className="botao-textual botao-textual--destrutivo"
                    onClick={() => apagar(convite.id)}
                    disabled={ocupado}
                  >
                    {t("Apagar", idioma)}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {alunos.length > 0 && (
        <section className="card-obsidian">
          <div className="titulo-com-dica">
            <span className="card-obsidian__titulo">
              {alunos.length === 1 ? `1 ${t("aluno com acesso", idioma)}` : `${alunos.length} ${t("alunos com acesso", idioma)}`}
            </span>
            <DicaInfo titulo={t("Alunos", idioma)} idioma={idioma}>
              {t("O aluno controla o acesso na própria tela de Ajustes.", idioma)}
            </DicaInfo>
          </div>
          <ul className="lista">
            {alunos.map((aluno) => (
              <li key={aluno.vinculoId}>
                <p className="alerta-personal__linha">
                  <strong>{aluno.nome}</strong>
                </p>
                <p className="campo__nota">
                  {aluno.telefoneWhatsApp
                    ? formatarTelefoneBrasil(aluno.telefoneWhatsApp)
                    : t("Sem telefone cadastrado", idioma)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
