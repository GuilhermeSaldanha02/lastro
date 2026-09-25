"use client";

// lastro · SDD.md §4.6 (PRD) — login por e-mail/senha ou Google. Rota
// pública; o middleware manda pra cá quem tenta acessar /treino ou
// /analise sem sessão.
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteBrowser } from "@/lib/supabase/cliente-browser";
import { criarContaComEmail, entrarComEmail, pedirRecuperacaoSenha, type TipoConta } from "@/lib/dados/auth";
import { crefValido } from "@/lib/texto/cref";
import DicaInfo from "@/components/dica-info";
import { SENHA_MINIMO, validarSenhaNova } from "@/lib/texto/senha";
import { PARAM_RETORNO, sanitizarRotaDeRetorno } from "@/lib/rota-de-retorno";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

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

function AvisoDeErroNaUrl({ idioma }: { idioma: Idioma }) {
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  if (!erro) return null;
  return (
    <p className="aviso-erro" role="alert">
      {t(MENSAGENS_DE_ERRO[erro] ?? "Falha na autenticação.", idioma)}
    </p>
  );
}

export default function PaginaLogin() {
  // Não há sessão antes do login para recuperar a preferência. A entrada
  // pública começa em português e passa a usar o idioma salvo após entrar.
  const idioma: Idioma = "pt-BR";
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "criar-conta" | "recuperar">("entrar");
  const [tipoConta, setTipoConta] = useState<TipoConta>("aluno");
  const [cref, setCref] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [avisoOk, setAvisoOk] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem(null);
    setAvisoOk(null);

    // "Esqueci minha senha" (PU-05): só o e-mail; a resposta é a mesma
    // exista ou não a conta.
    if (modo === "recuperar") {
      setCarregando(true);
      const pedido = await pedirRecuperacaoSenha(email);
      setCarregando(false);
      if (pedido.ok) {
        setAvisoOk("Se existir uma conta com esse e-mail, enviamos um link para criar uma senha nova. Confira também o spam.");
      } else {
        setMensagem(pedido.erro);
      }
      return;
    }

    // Só no cadastro: quem já tem conta entra com a senha que tem. A mesma
    // régua roda de novo no servidor (`criarContaComEmail`).
    if (modo === "criar-conta") {
      const senhaValida = validarSenhaNova(senha);
      if (!senhaValida.ok) {
        setMensagem(senhaValida.erro);
        return;
      }
    }

    setCarregando(true);

    const resultado =
      modo === "entrar"
        ? await entrarComEmail(email, senha)
        : await criarContaComEmail(email, senha, nome, telefone, tipoConta, cref, aceitouTermos);

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
          <AvisoDeErroNaUrl idioma={idioma} />
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
              <div className="seletor-conta" role="radiogroup" aria-label={t("Tipo de conta", idioma)}>
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
                  {t("USUÁRIO", idioma)}
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
                  {t("PERSONAL", idioma)}
                </button>
              </div>
            )}

            {modo === "criar-conta" && (
              <p className="seletor-conta__nota">
                {tipoConta === "personal"
                  ? t("Abre na fila de alunos. Seu próprio treino fica na mesma conta, a um toque em Ajustes.", idioma)
                  : t("Registra seus treinos e recebe a análise semanal.", idioma)}
              </p>
            )}

            {modo === "criar-conta" && (
              <div className="campo">
                <label className="campo__rotulo" htmlFor="nome">
                  {t("Nome", idioma)}
                </label>
                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  placeholder={t("Seu nome", idioma)}
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
                  {t("WhatsApp, com DDD", idioma)}
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
                <div className="campo__rotulo-linha">
                  <label className="campo__rotulo" htmlFor="cref">
                    CREF
                  </label>
                  <DicaInfo titulo="CREF" idioma={idioma}>
                    {t("Como está na sua carteira. O Lastro guarda o número e não verifica registro no CONFEF — ele aparece como informado por você.", idioma)}
                  </DicaInfo>
                </div>
                <input
                  id="cref"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t("123456-G/PB", idioma)}
                  value={cref}
                  onChange={(e) => setCref(e.target.value.toUpperCase())}
                  required
                />
                {cref.trim() !== "" && !crefValido(cref) && (
                  <p className="campo__nota campo__nota--alerta" role="status">
                    {t("Formato esperado: 123456-G/PB — seis dígitos, categoria G ou P e a UF.", idioma)}
                  </p>
                )}
              </div>
            )}

            <div className="campo">
              <label className="campo__rotulo" htmlFor="email">
                {t("E-mail", idioma)}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("seu@email.com", idioma)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {modo !== "recuperar" && (
            <div className="campo">
              <label className="campo__rotulo" htmlFor="senha">
                {t("Senha", idioma)}
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
                minLength={modo === "criar-conta" ? SENHA_MINIMO : 6}
              />
            </div>
            )}

            {modo === "entrar" && (
              <button
                type="button"
                className="botao-texto"
                onClick={() => {
                  setModo("recuperar");
                  setMensagem(null);
                  setAvisoOk(null);
                }}
              >
                {t("Esqueci minha senha", idioma)}
              </button>
            )}

            {modo === "criar-conta" && (
              <label className="campo__nota" htmlFor="aceite-termos">
                <input
                  id="aceite-termos"
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                />{" "}
                {t("Li e aceito os", idioma)}{" "}
                <Link href="/termos" target="_blank" rel="noopener">
                  {t("Termos de Uso", idioma)}
                </Link>{" "}
                {t("e a", idioma)}{" "}
                <Link href="/privacidade" target="_blank" rel="noopener">
                  {t("Política de Privacidade", idioma)}
                </Link>
                .
              </label>
            )}

            {avisoOk && (
              <p className="campo__nota" role="status">
                {t(avisoOk, idioma)}
              </p>
            )}

            {mensagem && (
              <p className="aviso-erro" role="alert">
                {mensagem}
              </p>
            )}

            <button type="submit" className="botao-primario botao-primario--heroi" disabled={carregando}>
              {carregando
                ? t(modo === "recuperar" ? "Enviando link…" : "Entrando…", idioma)
                : modo === "entrar"
                  ? t("Entrar no Lastro", idioma)
                  : modo === "recuperar"
                    ? t("Enviar link", idioma)
                    : t("Criar minha conta", idioma)}
            </button>
          </form>

          {/* O Google continua valendo para os dois tipos. A conta nasce sem
              tipo escolhido e a escolha acontece em `/boas-vindas`, logo
              depois do primeiro login (PRD §11, emenda 2026-09-13). */}
          <div className="divisor-ou">
            <span>{t("ou", idioma)}</span>
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
              {t("Entrar com Google", idioma)}
            </button>

            <p className="campo__nota">
              {t("Ao continuar com o Google você aceita os", idioma)}{" "}
              <Link href="/termos" target="_blank" rel="noopener">
                {t("Termos de Uso", idioma)}
              </Link>{" "}
              {t("e a", idioma)}{" "}
              <Link href="/privacidade" target="_blank" rel="noopener">
                {t("Política de Privacidade", idioma)}
              </Link>
              .
            </p>

            <button
              type="button"
              className="botao-texto"
              onClick={() => {
                setModo(modo === "entrar" ? "criar-conta" : "entrar");
                setMensagem(null);
                setAvisoOk(null);
              }}
            >
              {modo === "recuperar"
                ? t("Voltar para o login", idioma)
                : modo === "criar-conta"
                  ? t("Já tem conta? Fazer login", idioma)
                  : t("Não tem uma conta? Cadastre-se", idioma)}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
