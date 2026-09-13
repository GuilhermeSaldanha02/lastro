"use client";

// lastro · SDD.md §4.6 (PRD) — login por e-mail/senha ou Google. Rota
// pública; o middleware manda pra cá quem tenta acessar /treino ou
// /analise sem sessão.
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteBrowser } from "@/lib/supabase/cliente-browser";
import { criarContaComEmail, entrarComEmail, type TipoConta } from "@/lib/dados/auth";
import { crefValido } from "@/lib/texto/cref";
import { PARAM_RETORNO, sanitizarRotaDeRetorno } from "@/lib/rota-de-retorno";

function rotaDeRetorno(): string {
  return sanitizarRotaDeRetorno(
    new URLSearchParams(window.location.search).get(PARAM_RETORNO),
  );
}

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
  const [tipoConta, setTipoConta] = useState<TipoConta>("aluno");
  const [cref, setCref] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
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
        : await criarContaComEmail(email, senha, nome, telefone, tipoConta, cref);

    setCarregando(false);

    if (!resultado.ok) {
      setMensagem(resultado.erro);
      return;
    }
    if (resultado.confirmacaoPendente) {
      setMensagem("Conta criada — confirme seu e-mail antes de entrar.");
      return;
    }
    router.push(rotaDeRetorno());
    router.refresh();
  }

  async function entrarComGoogle() {
    const supabase = criarClienteBrowser();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set(PARAM_RETORNO, rotaDeRetorno());
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
  }

  return (
    <main className="tela tela--entrada">
      <div className="entrada">
        <header className="entrada__marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-lastro.png"
            alt="LASTRO"
            className="entrada__logo-img"
            width={150}
            height={150}
          />
        </header>

        <Suspense fallback={null}>
          <AvisoDeErroNaUrl />
        </Suspense>

        <div className="cartao cartao--vidro">
          <form className="formulario" onSubmit={aoEnviar}>
            {/* A ESCOLHA DA CONTA (PRD §11, emenda de 2026-09-11) — direção
                "Pílula segmentada", escolhida pelo dono no gate visual.

                Só aparece no cadastro: o tipo é decidido na ORIGEM e não
                se troca depois. Na tela de entrar, uma pílula aqui seria
                uma pergunta falsa — a conta já sabe o que é.

                A linha de consequência abaixo dela não é enfeite. Sem ela,
                "PERSONAL" é só o botão mais bonito, e a pessoa descobre
                que não tem "iniciar treino" depois de criar a conta. */}
            {modo === "criar-conta" && (
              <div className="seletor-conta" role="radiogroup" aria-label="Tipo de conta">
                <button
                  type="button"
                  role="radio"
                  aria-checked={tipoConta === "aluno"}
                  className={`seletor-conta__opcao${tipoConta === "aluno" ? " seletor-conta__opcao--ativa" : ""}`}
                  onClick={() => setTipoConta("aluno")}
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  USUÁRIO
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={tipoConta === "personal"}
                  className={`seletor-conta__opcao${tipoConta === "personal" ? " seletor-conta__opcao--ativa" : ""}`}
                  onClick={() => setTipoConta("personal")}
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />
                  </svg>
                  PERSONAL
                </button>
              </div>
            )}

            {modo === "criar-conta" && (
              <p className="seletor-conta__nota">
                {tipoConta === "personal"
                  ? "Abre na fila de alunos. Seu próprio treino fica na mesma conta, a um toque em Ajustes."
                  : "Registra seus treinos e recebe a análise semanal."}
              </p>
            )}

            {modo === "criar-conta" && (
              <div className="campo">
                <label className="campo__rotulo" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
            )}

            {modo === "criar-conta" && (
              /* Contato obrigatório no cadastro — decisão do dono em
                 2026-09-11. Vale para quem treina sozinho: o número é dado
                 do próprio usuário. Quem entra com Google não passa por
                 aqui e informa depois, em Ajustes > Personal. */
              <div className="campo">
                <label className="campo__rotulo" htmlFor="telefone">
                  WhatsApp, com DDD
                </label>
                <input
                  id="telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="83 99999-8888"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
            )}

            {/* CREF só existe para conta de personal, e é obrigatório nela.
                A mesma `crefValido` do servidor decide o aviso aqui: duas
                réguas diferentes dariam um "criou mas o registro sumiu",
                porque a check do banco é frouxa e o trigger descarta valor
                malformado em silêncio (migração 0024). */}
            {modo === "criar-conta" && tipoConta === "personal" && (
              <div className="campo">
                <label className="campo__rotulo" htmlFor="cref">
                  CREF
                </label>
                <input
                  id="cref"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="123456-G/PB"
                  value={cref}
                  onChange={(e) => setCref(e.target.value.toUpperCase())}
                  required
                />
                <p className="campo__nota">
                  Como está na sua carteira. O lastro guarda o número e não
                  verifica registro no CONFEF — ele aparece como informado
                  por você.
                </p>
                {cref.trim() !== "" && !crefValido(cref) && (
                  <p className="campo__nota campo__nota--alerta" role="status">
                    Formato esperado: 123456-G/PB — seis dígitos, categoria G
                    ou P, e a UF.
                  </p>
                )}
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
                placeholder="seu@email.com"
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
                placeholder="••••••••"
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

            <button type="submit" className="botao-primario botao-primario--heroi" disabled={carregando}>
              {carregando
                ? "Entrando…"
                : modo === "entrar"
                  ? "Entrar no Lastro"
                  : "Criar minha conta"}
            </button>
          </form>

          {/* O Google continua valendo para os dois tipos. A conta nasce sem
              tipo escolhido e a escolha acontece em `/boas-vindas`, logo
              depois do primeiro login (PRD §11, emenda 2026-09-13). */}
          <div className="divisor-ou">
            <span>ou</span>
          </div>

          <div className="pilha">
            <button
              type="button"
              className="botao-secundario botao-google"
              onClick={entrarComGoogle}
            >
              <svg className="icone-google" viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Entrar com Google
            </button>

            <button
              type="button"
              className="botao-texto"
              onClick={() => {
                setModo(modo === "entrar" ? "criar-conta" : "entrar");
                setMensagem(null);
              }}
            >
              {modo === "entrar" ? "Não tem uma conta? Cadastre-se" : "Já tem conta? Fazer login"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
