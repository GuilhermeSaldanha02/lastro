// lastro · a página de endereço inexistente.
//
// Achado B8 (QA, 2026-09-13, em produção): sem este arquivo o Next mostrava
// a 404 padrão dele — fundo branco, texto em inglês, sem a marca e sem
// caminho de volta — no meio de um app escuro em português. Toda busca por
// id que não acha nada (`notFound()` em treino, catálogo e parecer, e o id
// digitado errado desde o B2) cai aqui.
//
// Vale com e sem sessão: sem conta, `obterPerfil` devolve `null`, o
// cabeçalho sai sem avatar e o texto em PT-BR. "Voltar ao início" leva a
// `/`, que já manda cada um para o lugar certo (login, Home ou a área de
// trabalho do personal). Sem barra inferior: a 404 não pertence a nenhuma
// aba.
import Link from "next/link";
import CabecalhoPro from "@/components/cabecalho-pro";
import { obterPerfil } from "@/lib/dados/perfil";
import { t } from "@/lib/texto/i18n";

export default async function PaginaNaoEncontrada() {
  // A 404 não pode ela mesma quebrar: falha ao ler o perfil vira "sem perfil".
  const perfil = await obterPerfil().catch(() => null);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Página não encontrada", idioma)}
        // Curto de propósito: a cápsula do cabeçalho corta com reticências,
        // e um subtítulo em palavras virava "Ende…" a 375px (conferido na
        // prévia da Vercel desta branch).
        destaque="404"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          <p className="vazio">
            {t("Este endereço não existe ou não é da sua conta. Nada foi perdido.", idioma)}
          </p>
          <Link href="/" className="botao-primario">
            {t("Voltar ao início", idioma)}
          </Link>
        </div>
      </div>
    </main>
  );
}
