"use client";

// lastro · PU-05 — formulário de senha nova. A régua é a do cadastro
// (`validarSenhaNova`); o servidor repete a checagem em `redefinirSenha`.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { redefinirSenha } from "@/lib/dados/auth";
import { SENHA_MINIMO, validarSenhaNova } from "@/lib/texto/senha";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function FormRedefinirSenha({ idioma }: { idioma: Idioma }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const valida = validarSenhaNova(senha);
    if (!valida.ok) {
      setErro(valida.erro);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }

    setEnviando(true);
    const resultado = await redefinirSenha(senha);
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form className="formulario" onSubmit={aoEnviar}>
      <h1 className="campo__rotulo">{t("Criar senha nova", idioma)}</h1>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="senha-nova">
          {t("Senha nova", idioma)}
        </label>
        <input
          id="senha-nova"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={SENHA_MINIMO}
        />
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="senha-confirmacao">
          {t("Repita a senha nova", idioma)}
        </label>
        <input
          id="senha-confirmacao"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
        />
      </div>

      {erro && (
        <p className="aviso-erro" role="alert">
          {t(erro, idioma)}
        </p>
      )}

      <button type="submit" className="botao-primario botao-primario--heroi" disabled={enviando}>
        {enviando ? t("Salvando…", idioma) : t("Salvar senha nova", idioma)}
      </button>
    </form>
  );
}
