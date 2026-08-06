"use client";

// lastro · SDD.md §4.6 (PRD) — login por e-mail/senha ou Google. Rota
// pública; o middleware manda pra cá quem tenta acessar /treino ou
// /analise sem sessão.
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteBrowser } from "@/lib/supabase/cliente-browser";
import { criarContaComEmail, entrarComEmail } from "@/lib/dados/auth";

/**
 * O callback do OAuth redireciona pra cá com `?erro=...` quando algo falha.
 * Sem exibir isso, o login com Google que dá errado devolve o dono pra tela
 * de login sem explicação nenhuma — foi exatamente o que aconteceu no teste
 * em celular (2026-08-06) e o que tornou o diagnóstico difícil.
 */
const MENSAGENS_DE_ERRO: Record<string, string> = {
  troca: "Não foi possível concluir o login com o Google. Tente de novo.",
  "sem-codigo": "O Google não retornou a autorização. Tente de novo.",
  auth: "Falha na autenticação. Tente de novo.",
};

function AvisoDeErroNaUrl() {
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  if (!erro) return null;
  return <p role="alert">{MENSAGENS_DE_ERRO[erro] ?? "Falha na autenticação."}</p>;
}

export default function PaginaLogin() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "criar-conta">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem(null);
    setCarregando(true);

    const resultado =
      modo === "entrar"
        ? await entrarComEmail(email, senha)
        : await criarContaComEmail(email, senha);

    setCarregando(false);

    if (!resultado.ok) {
      setMensagem(resultado.erro);
      return;
    }
    if (resultado.confirmacaoPendente) {
      setMensagem("Conta criada — confirme seu e-mail antes de entrar.");
      return;
    }
    router.push("/treino");
    router.refresh();
  }

  async function entrarComGoogle() {
    const supabase = criarClienteBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main>
      <h1>lastro</h1>

      <Suspense fallback={null}>
        <AvisoDeErroNaUrl />
      </Suspense>

      <button type="button" onClick={entrarComGoogle}>
        Entrar com Google
      </button>

      <form onSubmit={aoEnviar}>
        <div>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {mensagem && <p role="alert">{mensagem}</p>}

        <button type="submit" disabled={carregando}>
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo(modo === "entrar" ? "criar-conta" : "entrar");
          setMensagem(null);
        }}
      >
        {modo === "entrar" ? "Criar uma conta" : "Já tenho conta"}
      </button>
    </main>
  );
}
