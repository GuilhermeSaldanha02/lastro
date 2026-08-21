// lastro · Ajustes consolidados em Bento Grid de alto padrão Apex Pro
import Link from "next/link";
import { obterPerfil } from "@/lib/dados/perfil";
import { sair } from "@/lib/dados/auth";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import ExcluirConta from "@/components/excluir-conta";
import SetaNavegacao from "@/components/seta-navegacao";
import CabecalhoPro from "@/components/cabecalho-pro";

export default async function PaginaAjustes() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Ajustes"
        destaque="Preferências"
        mostrarLogo={true}
        perfil={perfil}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        {perfil ? (
          <div className="pilha">
            {/* Card Hero de Perfil */}
            <Link href="/perfil" className="card-perfil-bento">
              <div className="card-perfil-bento__esquerda">
                <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />
                <div>
                  <h2 className="card-perfil-bento__nome">{perfil.nome}</h2>
                  <span className="card-perfil-bento__status">Ver Perfil</span>
                </div>
              </div>
              <SetaNavegacao />
            </Link>

            {/* Menu de Funcionalidades */}
            <div className="bento-menu-grid">
              <Link href="/coach" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--ouro">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--lastro-ouro)">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">Coach IA</h3>
                  <p className="bento-menu-item__desc">Consultoria 24h e leitura de ciclo</p>
                </div>
                <SetaNavegacao />
              </Link>

              <Link href="/ajustes/modelos" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--verde">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--lastro-esmeralda)" strokeWidth="2">
                    <path d="M4 8v8M20 8v8M8 6v12M16 6v12M8 12h8" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">Modelos de Treino</h3>
                  <p className="bento-menu-item__desc">Criar e organizar rotinas</p>
                </div>
                <SetaNavegacao />
              </Link>

              <Link href="/ajustes/anilhas" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--ciano">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--lastro-ciano)" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">Calculadora de Anilhas</h3>
                  <p className="bento-menu-item__desc">Configurar estoque e barra</p>
                </div>
                <SetaNavegacao />
              </Link>
            </div>

            {/* Ações de Conta */}
            <div className="ajustes-acoes">
              <form action={sair} style={{ width: "100%" }}>
                <button type="submit" className="botao-secundario">
                  Encerrar Sessão (Sair)
                </button>
              </form>

              <ExcluirConta />
            </div>
          </div>
        ) : (
          <p className="vazio">Entre para ver seus ajustes.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
