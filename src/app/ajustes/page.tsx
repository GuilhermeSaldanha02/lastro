// lastro · Ajustes consolida o que antes ficava espalhado: perfil, Coach
// e Sair. Pedido do dono (2026-08-12) — Coach deixa de ser link direto
// da pílula, vira sub-tela daqui. Ver
// docs/superpowers/specs/2026-08-12-ajustes-nav-perfil-design.md.
import Link from "next/link";
import { obterPerfil } from "@/lib/dados/perfil";
import { sair } from "@/lib/dados/auth";
import AbaInferior from "@/components/aba-inferior";
import ExcluirConta from "@/components/excluir-conta";
import SetaNavegacao from "@/components/seta-navegacao";
import TituloTela from "@/components/titulo-tela";

export default async function PaginaAjustes() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      {/* Aba de nível de topo — sem `VoltarFlutuante`. */}
      <TituloTela contexto="lastro" titulo="Ajustes" />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
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
                    <span className="item__conteudo">
                      <span className="atalho__titulo">Coach</span>
                      <span className="atalho__meta">Tirar uma dúvida</span>
                    </span>
                    <SetaNavegacao />
                  </Link>
                </div>
              </li>
              <li>
                <div className="item">
                  <Link href="/ajustes/modelos" className="item__link">
                    <span className="item__conteudo">
                      <span className="atalho__titulo">Modelos de treino</span>
                      <span className="atalho__meta">Montar listas de exercícios</span>
                    </span>
                    <SetaNavegacao />
                  </Link>
                </div>
              </li>
              <li>
                <div className="item">
                  <Link href="/ajustes/anilhas" className="item__link">
                    <span className="item__conteudo">
                      <span className="atalho__titulo">Anilhas</span>
                      <span className="atalho__meta">Configurar e calcular</span>
                    </span>
                    <SetaNavegacao />
                  </Link>
                </div>
              </li>
            </ul>

            <form action={sair}>
              <button type="submit" className="botao-secundario">
                Sair
              </button>
            </form>

            <ExcluirConta />
          </div>
        ) : (
          <p className="vazio">Entre para ver seus ajustes.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
