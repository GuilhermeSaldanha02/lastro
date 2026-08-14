// lastro · Ajustes consolida o que antes ficava espalhado: perfil, Coach
// e Sair. Pedido do dono (2026-08-12) — Coach deixa de ser link direto
// da pílula, vira sub-tela daqui. Ver
// docs/superpowers/specs/2026-08-12-ajustes-nav-perfil-design.md.
import Link from "next/link";
import { obterPerfil } from "@/lib/dados/perfil";
import { sair } from "@/lib/dados/auth";
import AbaInferior from "@/components/aba-inferior";

export default async function PaginaAjustes() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">lastro</p>
            <h1 className="barra-topo__titulo">Ajustes</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {perfil ? (
          <div className="pilha">
            <Link href="/perfil" className="atalho">
              <span className="atalho__titulo">{perfil.nome}</span>
              <span className="atalho__meta">Editar perfil</span>
            </Link>

            <ul className="lista">
              <li>
                <div className="item">
                  <Link href="/coach" className="item__link">
                    <span className="atalho__titulo">Coach</span>
                    <span className="atalho__meta">Tirar uma dúvida</span>
                  </Link>
                </div>
              </li>
              <li>
                <div className="item">
                  <Link href="/ajustes/modelos" className="item__link">
                    <span className="atalho__titulo">Modelos de treino</span>
                    <span className="atalho__meta">Montar listas de exercícios</span>
                  </Link>
                </div>
              </li>
            </ul>

            <form action={sair}>
              <button type="submit" className="botao-secundario">
                Sair
              </button>
            </form>
          </div>
        ) : (
          <p className="vazio">Entre para ver seus ajustes.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
