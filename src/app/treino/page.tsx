// lastro · SDD.md §5.1 — lista os treinos do usuário logado e permite
// iniciar um treino novo. A sessão em si é responsabilidade do
// middleware (tarefa 2.1) — esta página só assume que, se chegou até
// aqui, o usuário está autenticado.
import Link from "next/link";
import { listarTreinos, criarTreino } from "@/lib/dados/treino";
import { sair } from "@/lib/dados/auth";

export default async function PaginaTreino() {
  const treinos = await listarTreinos();

  return (
    <main>
      <h1>Treinos</h1>

      <form action={sair}>
        <button type="submit">Sair</button>
      </form>

      <form action={criarTreino}>
        <button type="submit">Iniciar treino de hoje</button>
      </form>

      <h2>Histórico</h2>
      {treinos.length === 0 ? (
        <p>Nenhum treino registrado ainda.</p>
      ) : (
        <ul>
          {treinos.map((treino) => (
            <li key={treino.id}>
              <Link href={`/treino/${treino.id}`}>{treino.data}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
