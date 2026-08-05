// lastro · SDD.md §5.1 — mostra o treino, lista as séries já registradas
// nele, e o formulário pra adicionar mais uma.
import { notFound } from "next/navigation";
import { buscarTreino, listarExercicios } from "@/lib/dados/treino";
import FormularioSerie from "@/components/formulario-serie";

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

      <h2>Séries registradas</h2>
      {treino.series.length === 0 ? (
        <p>Nenhuma série registrada ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Exercício</th>
              <th>Tipo</th>
              <th>Reps</th>
              <th>Peso</th>
              <th>RIR</th>
              <th>Peso corporal</th>
            </tr>
          </thead>
          <tbody>
            {treino.series.map((serie) => (
              <tr key={serie.id}>
                <td>
                  {serie.exercicioNome}
                  {serie.exercicioUnilateral ? " (unilateral)" : ""}
                </td>
                <td>{serie.tipo}</td>
                <td>{serie.reps}</td>
                <td>{serie.peso}</td>
                <td>{serie.rir ?? "—"}</td>
                <td>{serie.pesoCorporalIncluso ? "sim" : "não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Registrar série</h2>
      <FormularioSerie treinoId={treino.id} exercicios={exercicios} />
    </main>
  );
}
