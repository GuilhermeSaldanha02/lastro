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
import DicaInfo from "@/components/dica-info";
import PlayerExecucaoExercicio from "@/components/player-execucao-exercicio";
import { obterMidiaExercicio, traduzirBiomecanica } from "@/lib/dados/midia-exercicio";
import { dicaTraduzidaDoExercicio } from "@/lib/dados/traducao";
import { t } from "@/lib/texto/i18n";
import { formatarPercentual, formatarPeso } from "@/lib/texto/formatar-delta";
import { desempenhoDoExercicio } from "@/lib/analise/desempenho-exercicio";

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

  // A1: a dica no idioma da pessoa; sem tradução, cai na dica em português.
  const dicaNoIdioma = (await dicaTraduzidaDoExercicio(id, idioma)) ?? exercicio.dicaExecucao;

  const cronologico = [...historico].reverse();
  const marcasCronologicas = marcarRecordesHistoricos(cronologico);
  const marcas = [...marcasCronologicas].reverse();

  // AN-08 C1: recorde é o maior e1RM (o mesmo da estrela das séries, da
  // Análise e do Coach); a maior carga fica como dado, sem estrela. Antes
  // daqui a "Melhor marca" era o maior peso e contradizia o resto do app.
  const desempenho = desempenhoDoExercicio(historico);

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
              <span className="titulo-com-dica">
                <span>{t("Dica de execução", idioma)}</span>
                <DicaInfo titulo={t("Dica de execução", idioma)} idioma={idioma}>
                  {t(
                    "Veja os músculos envolvidos, o movimento das articulações e a orientação para executar o exercício.",
                    idioma,
                  )}
                </DicaInfo>
              </span>
            </div>

            {(() => {
              const midia = obterMidiaExercicio(exercicio.id);
              return (
                <div className="dica-corpo">
                  {midia?.anatomia_origem === "claude" && (
                    <p className="campo__nota">{t("Conteúdo gerado por IA", idioma)}</p>
                  )}
                  <div className="dica-grade-anatomi">
                    {midia?.musculo_alvo && (
                      <div className="dica-bloco-info">
                        <span className="dica-rotulo">{t("Músculo Alvo", idioma)}</span>
                        <span className="dica-valor">{traduzirBiomecanica(midia.musculo_alvo, idioma)}</span>
                      </div>
                    )}
                    {midia?.musculos_sinergistas && (
                      <div className="dica-bloco-info">
                        <span className="dica-rotulo titulo-com-dica">
                          <span>{t("Músculos que ajudam", idioma)}</span>
                          <DicaInfo titulo={t("Músculos que ajudam", idioma)} idioma={idioma}>
                            {t("São músculos que participam do movimento junto com o músculo alvo.", idioma)}
                          </DicaInfo>
                        </span>
                        <span className="dica-valor">{traduzirBiomecanica(midia.musculos_sinergistas, idioma)}</span>
                      </div>
                    )}
                    {midia?.mecanica_articular && (
                      <div className="dica-bloco-info">
                        <span className="dica-rotulo titulo-com-dica">
                          <span>{t("Movimento das articulações", idioma)}</span>
                          <DicaInfo titulo={t("Movimento das articulações", idioma)} idioma={idioma}>
                            {t("Mostra como as articulações se movem durante o exercício.", idioma)}
                          </DicaInfo>
                        </span>
                        <span className="dica-valor">{traduzirBiomecanica(midia.mecanica_articular, idioma)}</span>
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
                  {dicaNoIdioma ? (
                    <>
                      {exercicio.dicaExecucaoOrigem === "claude" && (
                        <p className="campo__nota">{t("Conteúdo gerado por IA", idioma)}</p>
                      )}
                      <p className="dica-texto-principal">{dicaNoIdioma}</p>
                    </>
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

        {/* AN-08 C1 — "Seu recorde" (direção C do portão de 2026-09-29):
            o recorde de e1RM grande, e embaixo a maior carga e a evolução.
            Sem gráfico: o histórico logo abaixo já é a linha do tempo, e o
            gráfico de progressão mora na Análise. */}
        {desempenho.recorde && (
          <section className="desempenho-exercicio">
            <span className="desempenho-exercicio__rotulo titulo-com-dica">
              <span>
                <span aria-hidden="true">★ </span>
                {t("Seu recorde · e1RM", idioma)}
              </span>
              <DicaInfo titulo={t("O que é o e1RM", idioma)} idioma={idioma}>
                {t(
                  "O e1RM estima a carga máxima para uma repetição a partir do peso e das repetições de cada série (fórmula de Epley, em séries de até 12 repetições). É por ele que o lastro marca recordes, no app inteiro.",
                  idioma,
                )}
              </DicaInfo>
            </span>
            <span className="desempenho-exercicio__recorde">
              {formatarPeso(Math.round(desempenho.recorde.e1rm * 10) / 10, idioma)} kg
            </span>
            <span className="desempenho-exercicio__serie">
              {desempenho.recorde.reps} × {formatarPeso(desempenho.recorde.peso, idioma)} kg
              {" · "}
              {formatarDataCurta(desempenho.recorde.data, idioma)}
              {" · "}
              {desempenho.recorde.sessoesDepois === 0
                ? t("batido na última sessão", idioma)
                : desempenho.recorde.sessoesDepois === 1
                  ? t("batido há 1 sessão", idioma)
                  : t("batido há {n} sessões", idioma).replace("{n}", String(desempenho.recorde.sessoesDepois))}
            </span>
            <div className="desempenho-exercicio__fatos">
              {desempenho.maiorCarga && (
                <div className="desempenho-exercicio__fato">
                  <span className="desempenho-exercicio__fato-rotulo">{t("Maior carga", idioma)}</span>
                  <span className="desempenho-exercicio__fato-valor">
                    {formatarPeso(desempenho.maiorCarga.peso, idioma)} kg
                  </span>
                  <span className="desempenho-exercicio__fato-nota">
                    {desempenho.maiorCarga.reps} {t("reps", idioma)} · {formatarDataCurta(desempenho.maiorCarga.data, idioma)}
                  </span>
                </div>
              )}
              {desempenho.evolucaoPct !== null && (
                <div className="desempenho-exercicio__fato">
                  <span className="desempenho-exercicio__fato-rotulo">{t("Evolução", idioma)}</span>
                  <span
                    className={`desempenho-exercicio__fato-valor desempenho-exercicio__fato-valor--${
                      desempenho.evolucaoPct >= 0 ? "alta" : "queda"
                    }`}
                  >
                    {formatarPercentual(Math.round(desempenho.evolucaoPct), idioma)}
                  </span>
                  <span className="desempenho-exercicio__fato-nota">{t("melhor da 1ª × 2ª metade", idioma)}</span>
                </div>
              )}
            </div>
          </section>
        )}

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
                      {serie.reps} × {formatarPeso(serie.peso, idioma)} kg
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
