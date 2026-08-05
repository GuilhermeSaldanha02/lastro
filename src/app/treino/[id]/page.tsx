// lastro · SDD.md §5.1 — mostra o treino, lista as séries já registradas
// nele, e o formulário pra adicionar mais uma.
// D6: a lista + o formulário vivem juntos em `TreinoDetalhe` (client) —
// precisam compartilhar estado pra atualização otimista funcionar.
import { notFound } from "next/navigation";
import { buscarTreino, listarExercicios } from "@/lib/dados/treino";
import TreinoDetalhe from "@/components/treino-detalhe";

export default async function PaginaTreinoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [treino, exercicios] = await Promise.all([
    buscarTreino(id),
    listarExercicios(),
  ]);

  if (!treino) notFound();

  return (
    <main>
      <h1>Treino de {treino.data}</h1>
      <TreinoDetalhe
        treinoId={treino.id}
        seriesIniciais={treino.series}
        exercicios={exercicios}
      />
    </main>
  );
}
