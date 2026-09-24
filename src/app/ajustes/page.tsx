// lastro · Ajustes consolidados em Bento Grid de alto padrão Apex Pro
import Link from "next/link";
import { obterPerfil } from "@/lib/dados/perfil";
import { cascaDaBarra, exigirTipoEscolhido } from "@/lib/dados/casca";
import { sair } from "@/lib/dados/auth";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import ExcluirConta from "@/components/excluir-conta";
import SetaNavegacao from "@/components/seta-navegacao";
import CabecalhoPro from "@/components/cabecalho-pro";
import MetaSemanalForm from "@/components/meta-semanal-form";
import IdiomaForm from "@/components/idioma-form";
import AvisoDescansoForm from "@/components/aviso-descanso-form";
import SeletorModo from "@/components/seletor-modo";
import { t } from "@/lib/texto/i18n";

export default async function PaginaAjustes() {
  const perfil = await obterPerfil();
  exigirTipoEscolhido(perfil);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Ajustes", idioma)}
        destaque={t("Preferências", idioma)}
        mostrarLogo={true}
        perfil={perfil}
        idioma={idioma}
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
                  <span className="card-perfil-bento__status">{t("Ver Perfil", idioma)}</span>
                </div>
              </div>
              <SetaNavegacao />
            </Link>

            {/* O seletor de modo mora aqui, logo abaixo de quem está logado:
                o modo é da conta, como o nome. Direção A do gate de
                2026-09-13. SÓ para quem nasceu personal (PRD §11, emenda
                2026-09-13): usuário não vê cápsula nem aviso. */}
            {perfil.tipoConta === "personal" && <SeletorModo modo={perfil.modo} idioma={idioma} />}

            <MetaSemanalForm metaInicial={perfil.metaTreinosSemana} idioma={idioma} />

            <IdiomaForm idiomaInicial={idioma} />

            <AvisoDescansoForm idioma={idioma} />

            {/* Menu de Funcionalidades */}
            <div className="bento-menu-grid">
              <Link href="/coach" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--ouro">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--lastro-ouro)">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">{t("Assistente de IA", idioma)}</h3>
                  <p className="bento-menu-item__desc">{t("Consultoria 24h e leitura de ciclo", idioma)}</p>
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
                  <h3 className="bento-menu-item__titulo">{t("Modelos de Treino", idioma)}</h3>
                  <p className="bento-menu-item__desc">{t("Criar e organizar rotinas", idioma)}</p>
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
                  <h3 className="bento-menu-item__titulo">{t("Calculadora de Anilhas", idioma)}</h3>
                  <p className="bento-menu-item__desc">{t("Configurar estoque e barra", idioma)}</p>
                </div>
                <SetaNavegacao />
              </Link>

              <Link href="/ajustes/temas" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--ouro">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--lastro-ouro)" strokeWidth="2">
                    <circle cx="13.5" cy="6.5" r="1.5" fill="var(--lastro-ouro)" />
                    <circle cx="17.5" cy="10.5" r="1.5" fill="var(--lastro-ouro)" />
                    <circle cx="8.5" cy="7.5" r="1.5" fill="var(--lastro-ouro)" />
                    <circle cx="6.5" cy="12.5" r="1.5" fill="var(--lastro-ouro)" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">{t("Temas & Cores", idioma)}</h3>
                  <p className="bento-menu-item__desc">{t("Personalizar paleta do aplicativo", idioma)}</p>
                </div>
                <SetaNavegacao />
              </Link>

              {/* PRD §11 — uma entrada só, para os dois lados do vínculo.
                  Não existe "modo personal": quem tem aluno vinculado
                  alcança a fila a partir daqui. */}
              <Link href="/ajustes/personal" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--ciano">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--lastro-ciano)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">{t("Personal", idioma)}</h3>
                  <p className="bento-menu-item__desc">{t("Vínculo, convites e fila de alunos", idioma)}</p>
                </div>
                <SetaNavegacao />
              </Link>

              <Link href="/ajustes/relatorios" className="bento-menu-item">
                <div className="bento-menu-item__icone bento-menu-item__icone--verde">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--lastro-esmeralda)" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="bento-menu-item__info">
                  <h3 className="bento-menu-item__titulo">{t("Relatórios e adesivos", idioma)}</h3>
                  <p className="bento-menu-item__desc">{t("Exportar imagem de treino para redes sociais", idioma)}</p>
                </div>
                <SetaNavegacao />
              </Link>
            </div>

            {/* Ações de Conta */}
            <div className="ajustes-acoes">
              <a href="/api/exportar" className="botao-secundario botao-com-icone" style={{ width: "100%" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 15V3M12 15l-4-4M12 15l4-4" />
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                <span>{t("Exportar Meus Dados (CSV)", idioma)}</span>
              </a>

              <form action={sair} style={{ width: "100%" }}>
                <button type="submit" className="botao-secundario botao-com-icone">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{t("Encerrar Sessão (Sair)", idioma)}</span>
                </button>
              </form>

              <ExcluirConta idioma={idioma} />
            </div>
          </div>
        ) : (
          <p className="vazio">{t("Entre para ver seus ajustes.", idioma)}</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} tipoConta={cascaDaBarra(perfil)} />
    </main>
  );
}
