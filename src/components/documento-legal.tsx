// lastro · PU-06 — casca de leitura dos Termos e da Política. Server
// Component, sem estado. O banner de rascunho é parte do contrato: sai
// junto com a revisão do advogado, não antes.
import Link from "next/link";
import { VERSAO_DOCUMENTOS, type Documento } from "@/lib/legal/documentos";

export default function DocumentoLegal({ documento }: { documento: Documento }) {
  return (
    <main className="tela">
      <div className="corpo corpo--titulo-conteudo">
        <article className="pilha documento-legal">
          <p className="aviso-saude" role="note">
            <strong>Rascunho em revisão jurídica.</strong> Este texto ainda não foi revisado
            por advogado e pode mudar. Trechos entre colchetes serão preenchidos antes da
            versão final.
          </p>

          <header>
            <h1>{documento.titulo}</h1>
            <p className="vazio">{documento.resumo}</p>
            <p className="campo__nota">Versão {VERSAO_DOCUMENTOS}</p>
          </header>

          {documento.secoes.map((secao) => (
            <section key={secao.titulo}>
              <h2>{secao.titulo}</h2>
              {secao.paragrafos?.map((p) => <p key={p}>{p}</p>)}
              {secao.itens && (
                <ul>
                  {secao.itens.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}

          <nav className="pilha" aria-label="Documentos">
            <Link href="/termos" className="botao-texto">Termos de Uso</Link>
            <Link href="/privacidade" className="botao-texto">Política de Privacidade</Link>
            <Link href="/login" className="botao-secundario">Voltar</Link>
          </nav>
        </article>
      </div>
    </main>
  );
}
