// lastro · Detalhes do Exercício com Histórico de Séries e Recordes Pessoais
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarExercicio, historicoDoExercicio } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { marcarRecordesHistoricos } from "@/lib/analise/recorde-serie";
import { formatarDataCurta } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import SetaNavegacao from "@/components/seta-navegacao";
import EtiquetaRecorde from "@/components/etiqueta-recorde";
import CabecalhoPro from "@/components/cabecalho-pro";
import PlayerExecucaoExercicio from "@/components/player-execucao-exercicio";
import { obterMidiaExercicio } from "@/lib/dados/midia-exercicio";
import { t } from "@/lib/texto/i18n";

export default async function PaginaHistoricoExercicio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exercicio, historico, perfil] = await Promise.all([
    buscarExercicio(id),
    historicoDoExercicio(id),
    obterPerfil(),
  ]);
  const idioma = perfil?.idioma ?? "pt-BR";

  if (!exercicio) notFound();

  const cronologico = [...historico].reverse();
  const marcasCronologicas = marcarRecordesHistoricos(cronologico);
  const marcas = [...marcasCronologicas].reverse();

  // Calcula o PR de carga máxima de todos os tempos
  const cargaMaxima = historico.length > 0
    ? Math.max(...historico.map((s) => s.peso))
    : 0;

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={exercicio.nome}
        destaque={exercicio.grupoMuscularNome}
        voltarHref="/catalogo"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        {/* Banner do Exercício & Tags */}
        <div className="exercicio-hero-card">
          <div className="exercicio-hero-card__tags">
            <span className="tag-grupo">{exercicio.grupoMuscularNome.toUpperCase()}</span>
            {exercicio.unilateral && <span className="tag-unilateral">{t("Unilateral", idioma)}</span>}
            {exercicio.pesoPorLado && <span className="tag-unilateral">{t("Peso por lado", idioma)}</span>}
            {cargaMaxima > 0 && (
              <span className="disciplina-card__streak">
                PR: {cargaMaxima} kg
              </span>
            )}
          </div>

          {/* Player com modos: Ver Execução (vídeo animado) e Ver Aparelho / Posição */}
          <PlayerExecucaoExercicio
            exercicioId={exercicio.id}
            nomeExercicio={exercicio.nome}
            idioma={idioma}
          />

          {/* Informações Biomecânicas e Instruções Técnicas */}
          <div className="exercicio-hero-card__dica">
            <div className="dica-header">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--lastro-ouro)" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>{t("Biomecânica & Instruções Técnicas", idioma)}</span>
            </div>

            {(() => {
              const midia = obterMidiaExercicio(exercicio.id);
              return (
                <div className="dica-corpo">
                  <div className="dica-grade-anatomi">
                    {midia?.musculo_alvo && (
                      <div className="dica-bloco-info">
                        <span className="dica-rotulo">{t("Músculo Alvo", idioma)}</span>
                        <span className="dica-valor">{midia.musculo_alvo}</span>
                      </div>
                    )}
                    {midia?.musculos_sinergistas && (
                      <div className="dica-bloco-info">
                        <span className="dica-rotulo">{t("Sinergistas", idioma)}</span>
                        <span className="dica-valor">{midia.musculos_sinergistas}</span>
                      </div>
                    )}
                    {midia?.mecanica_articular && (
                      <div className="dica-bloco-info">
                        <span className="dica-rotulo">{t("Mecânica Articular", idioma)}</span>
                        <span className="dica-valor">{midia.mecanica_articular}</span>
                      </div>
                    )}
                  </div>

                  {/* Sem dica, a tela DIZ que não há — não preenche o buraco.
                      Até 2026-09-09 aqui vinha uma frase genérica ("controle
                      articular completo, cadência uniforme...") idêntica nos
                      102 exercícios, ocupando o lugar da dica curada com a
                      mesma tipografia. Quem lia achava que era instrução
                      daquele movimento. É o mesmo defeito do botão que
                      aparecia sem funcionar: a tela afirmando mais do que o
                      dado sustenta. A tela da lista já falava assim
                      ("aguardando curadoria"); agora as duas combinam. */}
                  {exercicio.dicaExecucao ? (
                    <p className="dica-texto-principal">{exercicio.dicaExecucao}</p>
                  ) : (
                    <p className="dica-texto-principal dica-texto-principal--vazio">
                      {t("Dica de execução ainda não escrita para este exercício.", idioma)}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

        </div>

        {/* Histórico de Séries Executadas */}
        <div className="secao-header">
          <h2 className="secao-header__titulo">{t("Histórico de Séries", idioma)}</h2>
          <span className="secao-header__subtitulo">
            {historico.length} {t(historico.length === 1 ? "registro" : "registros", idioma)}
          </span>
        </div>

        {historico.length === 0 ? (
          <p className="vazio">
            {t("Nenhuma série valendo registrada ainda para", idioma)} {exercicio.nome}.
          </p>
        ) : (
          <div className="feed-treinos">
            {historico.map((serie, indice) => (
              <Link
                key={`${serie.treinoId}-${serie.criadoEm}-${indice}`}
                href={`/treino/${serie.treinoId}`}
                className="cartao-treino-item"
              >
                <div className="cartao-treino-item__esquerda">
                  <span className="cartao-treino-item__data">
                    {formatarDataCurta(serie.dataTreino)}
                  </span>
                  {marcas[indice] && <EtiquetaRecorde idioma={idioma} />}
                </div>

                <div className="cartao-treino-item__direita">
                  <div className="cartao-treino-item__metricas">
                    <span className="cartao-treino-item__vol">
                      {serie.reps} × {serie.peso} kg
                    </span>
                  </div>
                  <SetaNavegacao />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AbaInferior ativa="catalogo" idioma={idioma} />
    </main>
  );
}
