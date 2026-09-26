// lastro · PU-06 — leitura dos Termos e da Política. Server Components, sem
// estado. `CorpoDocumento` é o texto; ele é reaproveitado em `/aceite` (onde
// termina no botão Aceito) e em `/ajustes/politicas` (dentro do app).
import Link from "next/link";
import { VERSAO_DOCUMENTOS, type Documento } from "@/lib/legal/documentos";

export function CorpoDocumento({ documento, id }: { documento: Documento; id?: string }) {
  return (
    <article className="pilha documento-legal" id={id}>
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
    </article>
  );
}

/** Página pública de um documento só (`/termos`, `/privacidade`): quem ainda não tem conta lê aqui. */
export default function DocumentoLegal({ documento }: { documento: Documento }) {
  return (
    <main className="tela">
      <div className="corpo corpo--titulo-conteudo">
        <div className="pilha">
          <CorpoDocumento documento={documento} />

          <nav className="pilha" aria-label="Documentos">
            <Link href="/termos" className="botao-texto">Termos de Uso</Link>
            <Link href="/privacidade" className="botao-texto">Política de Privacidade</Link>
            <Link href="/login" className="botao-secundario">Voltar</Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
