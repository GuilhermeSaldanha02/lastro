// lastro · Relatórios de Sessões e Geração de Stickers para Stories
import Link from "next/link";
import { redirect } from "next/navigation";
import { listarTreinos, buscarTreino } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { calcularMetricasSessao } from "@/lib/dados/metricas-treino";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import HistoricoRelatoriosPosTreino from "@/components/historico-relatorios-pos-treino";
import { t } from "@/lib/texto/i18n";

export default async function PaginaRelatoriosAjustes() {
  const perfil = await obterPerfil();
  if (!perfil) {
    redirect("/login?proximo=/ajustes/relatorios");
  }

  const idioma = perfil.idioma ?? "pt-BR";
  const treinos = await listarTreinos();

  async function obterMetricasDoTreino(treinoId: string) {
    "use server";
    const treinoComSeries = await buscarTreino(treinoId);
    if (!treinoComSeries) return null;

    // Converte séries para o formato esperado pelo calculador de métricas
    const seriesParaMetricas = treinoComSeries.series.map((s) => ({
      id: s.id,
      exercicioId: s.exercicioId,
      exercicioNome: s.exercicioNome,
      reps: s.reps,
      peso: s.peso,
      tipo: s.tipo,
      pesoPorLado: s.pesoPorLado,
    }));

    // Duração real: intervalo entre a primeira e a última série registrada
    // (mesma fonte que o relatório gerado na tela de treino usa, só que ali
    // vem de um cronômetro ao vivo — aqui não existe, então reconstruímos a
    // partir de `serie.criado_em`). Antes disto o fallback era um valor fixo
    // de 45 min pra todo treino, por isso o tempo batia diferente do
    // relatório original (achado do dono, 2026-08-27).
    const timestamps = treinoComSeries.series
      .map((s) => new Date(s.criadoEm).getTime())
      .filter((t) => !Number.isNaN(t));
    const duracaoSegundos =
      timestamps.length > 0
        ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000)
        : 0;

    return calcularMetricasSessao(seriesParaMetricas, duracaoSegundos, undefined, {
      identificadorTreino: `TREINO ${treinoId.slice(-4).toUpperCase()}`,
    });
  }

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Relatórios & Stickers", idioma)}
        destaque={t("Histórico e Stories", idioma)}
        voltarHref="/ajustes"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        {treinos.length > 0 ? (
          <div className="pilha">
            <p className="subtitulo-secao">
              {t(
                "Selecione qualquer treino passado para visualizar as estatísticas e exportar o sticker oficial transparente (1080×1080) para Instagram Stories.",
                idioma,
              )}
            </p>

            <HistoricoRelatoriosPosTreino
              treinos={treinos}
              idioma={idioma}
              obterMetricasAcao={obterMetricasDoTreino}
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
                "Assim que você concluir sua primeira sessão de treino, ela aparecerá aqui com métricas completas e opções de sticker.",
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
