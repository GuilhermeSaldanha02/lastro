// lastro · Detalhes do Exercício com Histórico de Séries e Recordes Pessoais
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarExercicio, historicoDoExercicio } from "@/lib/dados/treino";
import { marcarRecordesHistoricos } from "@/lib/analise/recorde-serie";
import { formatarDataCurta } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import SetaNavegacao from "@/components/seta-navegacao";
import EtiquetaRecorde from "@/components/etiqueta-recorde";
import CabecalhoPro from "@/components/cabecalho-pro";

export default async function PaginaHistoricoExercicio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exercicio, historico] = await Promise.all([
    buscarExercicio(id),
    historicoDoExercicio(id),
  ]);

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
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        {/* Banner do Exercício & Tags */}
        <div className="exercicio-hero-card">
          <div className="exercicio-hero-card__tags">
            <span className="tag-grupo">{exercicio.grupoMuscularNome.toUpperCase()}</span>
            {exercicio.unilateral && <span className="tag-unilateral">Unilateral</span>}
            {cargaMaxima > 0 && (
              <span className="disciplina-card__streak">
                PR: {cargaMaxima} kg
              </span>
            )}
          </div>

          {exercicio.dicaExecucao ? (
            <div className="exercicio-hero-card__dica">
              <div className="dica-header">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--lastro-ouro)">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>Instruções Técnicas</span>
              </div>
              <p>{exercicio.dicaExecucao}</p>
            </div>
          ) : (
            <p className="exercicio-hero-card__sem-dica">
              Dica técnica de execução ainda não cadastrada.
            </p>
          )}
        </div>

        {/* Histórico de Séries Executadas */}
        <div className="secao-header">
          <h2 className="secao-header__titulo">Histórico de Séries</h2>
          <span className="secao-header__subtitulo">
            {historico.length} {historico.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {historico.length === 0 ? (
          <p className="vazio">
            Nenhuma série valendo registrada ainda para {exercicio.nome}.
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
                  {marcas[indice] && <EtiquetaRecorde />}
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

      <AbaInferior ativa="catalogo" />
    </main>
  );
}
