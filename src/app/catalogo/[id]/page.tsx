// lastro · backlog C4 parte 2 — histórico do exercício, com recorde
// pessoal marcado onde aconteceu (não só o maior de todos os tempos —
// cada série marcada foi recorde NO MOMENTO em que aconteceu).
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarExercicio, historicoDoExercicio } from "@/lib/dados/treino";
import { marcarRecordesHistoricos } from "@/lib/analise/recorde-serie";
import { dataLocalBrasil, formatarDataCurta } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import SetaNavegacao from "@/components/seta-navegacao";

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

  // historicoDoExercicio vem do mais recente pro mais antigo;
  // marcarRecordesHistoricos precisa do sentido cronológico (mais antigo
  // primeiro) pra saber o que "veio antes" de cada série. Reverte pra
  // marcar, reverte de novo pra alinhar com a ordem de exibição.
  const cronologico = [...historico].reverse();
  const marcasCronologicas = marcarRecordesHistoricos(cronologico);
  const marcas = [...marcasCronologicas].reverse();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Catálogo</p>
            <h1 className="barra-topo__titulo">{exercicio.nome}</h1>
          </div>
          <Link href="/catalogo" className="botao-barra">
            Catálogo
          </Link>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {historico.length === 0 ? (
          <p className="vazio">
            Nenhuma série valendo registrada ainda para {exercicio.nome}.
          </p>
        ) : (
          <ul className="lista">
            {historico.map((serie, indice) => (
              <li key={`${serie.treinoId}-${serie.criadoEm}-${indice}`}>
                <div className="item">
                  <Link href={`/treino/${serie.treinoId}`} className="item__link">
                    <span className="item__conteudo">
                      <span className="item__data">
                        {formatarDataCurta(dataLocalBrasil(new Date(serie.criadoEm)))}
                      </span>
                      <span className="serie__v">
                        {serie.reps}
                        <span className="serie__x">×</span>
                        {serie.peso}
                        <span className="serie__un">kg</span>
                      </span>
                      {marcas[indice] && (
                        <span className="marca marca--recorde">recorde</span>
                      )}
                    </span>
                    <SetaNavegacao />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AbaInferior ativa="catalogo" />
    </main>
  );
}
