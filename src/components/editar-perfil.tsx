"use client";

// lastro · item 9 do backlog (2026-08-12) — quem cadastrou por e-mail não
// tem avatar_url do Google pra baixar; este é o único lugar que grava uma
// foto manual. `validarArquivoAvatar` dá feedback antes de gastar uma
// chamada de rede; `atualizarAvatarManual` valida de novo no servidor
// (defesa contra cliente adulterado — ver perfil.ts).
import { useRef, useState, type ChangeEvent } from "react";
import { atualizarAvatarManual } from "@/lib/dados/atualizar-avatar";
import { validarArquivoAvatar } from "@/lib/dados/validar-avatar";
import Avatar from "./avatar";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function EditarPerfil({
  nome,
  avatarUrlInicial,
  idioma,
}: {
  nome: string;
  avatarUrlInicial: string | null;
  idioma: Idioma;
}) {
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o valor pra permitir escolher o MESMO arquivo de novo depois
    // de um erro — sem isto o evento `change` não dispara na segunda vez.
    evento.target.value = "";
    if (!arquivo) return;

    setErro(null);

    const validacao = validarArquivoAvatar(arquivo, idioma);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }

    setEnviando(true);
    const resultado = await atualizarAvatarManual(arquivo);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setAvatarUrl(resultado.avatarUrl);
  }

  return (
    <div className="pilha">
      <Avatar nome={nome} avatarUrl={avatarUrl} />
      <p className="perfil-nome">{nome}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="campo-arquivo-oculto"
        onChange={aoEscolherArquivo}
        aria-label={t("Escolher foto de perfil", idioma)}
      />
      <button
        type="button"
        className="botao-secundario"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
      >
        {enviando ? t("Enviando…", idioma) : t("Trocar foto", idioma)}
      </button>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
