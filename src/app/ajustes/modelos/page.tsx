// lastro · SDD.md §9.3 — lista os modelos de treino do usuário. Criar é em
// /ajustes/modelos/novo; editar é FORA de escopo (§9.0) — só criar e excluir.
import Link from "next/link";
import { listarModelos } from "@/lib/dados/modelo-treino";
import ExcluirModelo from "@/components/excluir-modelo";
import AbaInferior from "@/components/aba-inferior";

export default async function PaginaModelos() {
  const modelos = await listarModelos();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Ajustes</p>
            <h1 className="barra-topo__titulo">Modelos de treino</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        <p className="campo__nota">
          Listas de exercícios pra reaproveitar ao iniciar um treino — sem
          série, peso ou reps. Isso continua sendo preenchido normalmente no
          dia.
        </p>

        {modelos.length === 0 ? (
          <p className="vazio">Nenhum modelo criado ainda.</p>
        ) : (
          <ul className="lista">
            {modelos.map((modelo) => (
              <li key={modelo.id}>
                <div className="item">
                  <span className="item__data">{modelo.nome}</span>
                  <ExcluirModelo id={modelo.id} nome={modelo.nome} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Ação fantasma (DESIGN.md §6.5, peça 8, M6) — "criar modelo" é uma
            ação secundária dentro da seção, não deve competir em peso
            visual com nenhuma ação primária de tela. */}
        <Link href="/ajustes/modelos/novo" className="acao-fantasma">
          <span aria-hidden="true">+</span> Criar modelo
        </Link>
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
