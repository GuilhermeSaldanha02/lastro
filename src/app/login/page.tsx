"use client";

// lastro · SDD.md §4.6 (PRD) — login por e-mail/senha ou Google. Rota
// pública; o middleware manda pra cá quem tenta acessar /treino ou
// /analise sem sessão.
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteBrowser } from "@/lib/supabase/cliente-browser";
import { criarContaComEmail, entrarComEmail } from "@/lib/dados/auth";
import { PARAM_RETORNO, sanitizarRotaDeRetorno } from "@/lib/rota-de-retorno";

/**
 * Lê o retorno da URL na hora do clique, e não com `useSearchParams`, de
 * propósito: o hook obrigaria a envolver a página inteira em `Suspense` (ou
 * derrubaria a pré-renderização). Aqui isto só roda dentro de handler, que
 * é sempre cliente — `window` existe.
 *
 * A sanitização é a mesma do `/auth/callback`. Ela é ainda mais necessária
 * aqui: `router.push("//evil.com")` sai do domínio de verdade.
 */
function rotaDeRetorno(): string {
  return sanitizarRotaDeRetorno(
    new URLSearchParams(window.location.search).get(PARAM_RETORNO),
  );
}

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
  return (
    <p className="aviso-erro" role="alert">
      {MENSAGENS_DE_ERRO[erro] ?? "Falha na autenticação."}
    </p>
  );
}

export default function PaginaLogin() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "criar-conta">("entrar");
  const [nome, setNome] = useState("");
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
        : await criarContaComEmail(email, senha, nome);

    setCarregando(false);

    if (!resultado.ok) {
      setMensagem(resultado.erro);
      return;
    }
    if (resultado.confirmacaoPendente) {
      setMensagem("Conta criada — confirme seu e-mail antes de entrar.");
      return;
    }
    // A home (`/`) é a porta de entrada única do app — o dono pediu que
    // tudo parta dela, não só o ícone instalado (ver ESCOPO/DECISIONS
    // 2026-08-06), e ela segue sendo o padrão. A exceção é quem foi
    // mandado pra cá pelo `proxy.ts` ao tentar abrir uma rota privada:
    // esse volta pra rota que pediu, senão o login vira beco (A1).
    router.push(rotaDeRetorno());
    router.refresh();
  }

  async function entrarComGoogle() {
    const supabase = criarClienteBrowser();
    // O caminho do Google sai do app e volta pelo `/auth/callback`, então o
    // retorno precisa viajar na própria URL de callback — `URLSearchParams`
    // codifica o valor (interpolar cru quebraria no primeiro `&`).
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set(PARAM_RETORNO, rotaDeRetorno());
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
  }

  return (
    // Primeira e única tela antes de existir qualquer dado — é aqui que a
    // personalidade se estabelece. Ferramenta pessoal e séria: sem tour,
    // sem depoimento, sem promessa de marketing (ESCOPO.md §5.1).
    <main className="tela tela--entrada">
      <div className="entrada">
        <header className="entrada__marca">
          <h1>lastro</h1>
          <p>Registro de treino e leitura semanal.</p>
        </header>

        <Suspense fallback={null}>
          <AvisoDeErroNaUrl />
        </Suspense>

        <form className="formulario" onSubmit={aoEnviar}>
          {modo === "criar-conta" && (
            <div className="campo">
              <label className="campo__rotulo" htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          )}

          <div className="campo">
            <label className="campo__rotulo" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label className="campo__rotulo" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete={
                modo === "entrar" ? "current-password" : "new-password"
              }
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {mensagem && (
            <p className="aviso-erro" role="alert">
              {mensagem}
            </p>
          )}

          <button type="submit" className="botao-primario" disabled={carregando}>
            {carregando
              ? "Entrando…"
              : modo === "entrar"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <div className="pilha">
          <button
            type="button"
            className="botao-secundario"
            onClick={entrarComGoogle}
          >
            Entrar com Google
          </button>

          <button
            type="button"
            className="botao-secundario"
            onClick={() => {
              setModo(modo === "entrar" ? "criar-conta" : "entrar");
              setMensagem(null);
            }}
          >
            {modo === "entrar" ? "Criar uma conta" : "Já tenho conta"}
          </button>
        </div>
      </div>
    </main>
  );
}
