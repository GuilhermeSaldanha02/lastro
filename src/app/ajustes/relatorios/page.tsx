// lastro · Relatórios de Sessões e Geração de Stickers para Stories
import Link from "next/link";
import { redirect } from "next/navigation";
import { listarTreinos } from "@/lib/dados/treino";
import { listarPareceres } from "@/lib/dados/parecer";
import { obterPerfil } from "@/lib/dados/perfil";
import { obterMetricasDoTreino } from "@/lib/dados/relatorio-treino";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import HistoricoRelatoriosPosTreino from "@/components/historico-relatorios-pos-treino";
import PareceresSalvos from "@/components/pareceres-salvos";
import { t } from "@/lib/texto/i18n";

export default async function PaginaRelatoriosAjustes() {
  const perfil = await obterPerfil();
  if (!perfil) {
    redirect("/login?proximo=/ajustes/relatorios");
  }

  const idioma = perfil.idioma ?? "pt-BR";
  const [treinos, pareceres] = await Promise.all([listarTreinos(), listarPareceres()]);

  return (
    <main className="tela">
      <CabecalhoPro
        // UX3-05: título curto — "Relatórios e adesivos · Histórico" era cortado ("Histó…")
        // na pílula do cabeçalho a 390px. O nome completo continua no menu de Ajustes.
        titulo={t("Relatórios", idioma)}
        destaque={t("Histórico", idioma)}
        voltarHref="/ajustes"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        {pareceres.length > 0 && (
          // Antes do histórico de treinos, de propósito (achado do dono,
          // 2026-09-02): com várias sessões já registradas, um rascunho de
          // Análise recém-gerado ficava escondido rolando a tela pra baixo,
          // atrás de todos os cards de sticker.
          <div className="pilha">
            <h2 className="doc__secao">{t("Pareceres salvos", idioma)}</h2>
            <PareceresSalvos pareceres={pareceres} idioma={idioma} />
          </div>
        )}

        {treinos.length > 0 ? (
          <div className="pilha">
            <p className="subtitulo-secao">
              {t(
                "Selecione um treino passado, escolha o modelo e exporte um sticker transparente com os grupos musculares treinados.",
                idioma,
              )}
            </p>

            <HistoricoRelatoriosPosTreino
              treinos={treinos}
              idioma={idioma}
              obterMetricasAcao={obterMetricasDoTreino}
              // ^ mesma ação de servidor de `relatorio-treino.ts`, reusada agora
              // também em `/treino` (UX-02) — o cálculo mora num lugar só.
            />
          </div>
        ) : (
          <div className="estado-vazio-card">
            <div className="estado-vazio-card__icone">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="var(--lastro-ouro)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h2 className="estado-vazio-card__titulo">
              {t("Nenhum treino registrado ainda", idioma)}
            </h2>
            <p className="estado-vazio-card__texto">
              {t(
                "Assim que você concluir sua primeira sessão de treino, ela aparecerá aqui com métricas completas e opções de adesivo.",
                idioma,
              )}
            </p>
            <Link href="/treino" className="botao-primario">
              {t("Ir para Treinos", idioma)}
            </Link>
          </div>
        )}
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
