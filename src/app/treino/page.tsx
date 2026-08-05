// lastro · SDD.md §5.1 — lista os treinos do usuário logado e permite
// iniciar um treino novo. Fase 1: assume sessão já autenticada (§3.6) —
// nenhuma tela de login é construída aqui.
import Link from "next/link";
import { listarTreinos, criarTreino } from "@/lib/dados/treino";

export default async function PaginaTreino() {
  const treinos = await listarTreinos();

  return (
    <main>
      <h1>Treinos</h1>

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
