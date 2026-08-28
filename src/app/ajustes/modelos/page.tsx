// lastro · SDD.md §9.3 — lista os modelos de treino do usuário. Criar é em
// /ajustes/modelos/novo; editar é FORA de escopo (§9.0) — só criar e excluir.
import Link from "next/link";
import { listarModelos } from "@/lib/dados/modelo-treino";
import { obterPerfil } from "@/lib/dados/perfil";
import ListaModelos from "@/components/lista-modelos";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";

export default async function PaginaModelos() {
  const [modelos, perfil] = await Promise.all([listarModelos(), obterPerfil()]);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Ajustes", idioma)}
        destaque={t("Modelos", idioma)}
        voltarHref="/ajustes"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <p className="campo__nota">
          {t(
            "Listas de exercícios pra reaproveitar ao iniciar um treino — sem série, peso ou reps. Isso continua sendo preenchido normalmente no dia.",
            idioma,
          )}
        </p>

        <ListaModelos modelos={modelos} idioma={idioma} />

        {/* Ação fantasma (DESIGN.md §6.5, peça 8, M6) — "criar modelo" é uma
            ação secundária dentro da seção, não deve competir em peso
            visual com nenhuma ação primária de tela. */}
        <Link href="/ajustes/modelos/novo" className="acao-fantasma">
          <span aria-hidden="true">+</span> {t("Criar modelo", idioma)}
        </Link>
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
