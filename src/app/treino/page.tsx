// lastro · SDD.md §5.1 — lista os treinos do usuário logado e permite
// iniciar um treino novo. A sessão em si é responsabilidade do
// middleware (tarefa 2.1) — esta página só assume que, se chegou até
// aqui, o usuário está autenticado.
//
// Modo Bancada (DESIGN.md §3.5): poucos elementos, grandes. A ação
// primária fica na metade inferior, ao alcance do polegar (D2).
import Link from "next/link";
import { listarTreinos, criarTreino } from "@/lib/dados/treino";
import { sair } from "@/lib/dados/auth";
import AbaInferior from "@/components/aba-inferior";

/** "2026-08-06" → "6 ago". A data já vem local; não há fuso a converter. */
function formatarData(iso: string): string {
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const [, mes, dia] = iso.split("-");
  const indice = Number(mes) - 1;
  if (!meses[indice] || !dia) return iso;
  return `${Number(dia)} ${meses[indice]}`;
}

export default async function PaginaTreino() {
  const treinos = await listarTreinos();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div>
            <p className="barra-topo__contexto">lastro</p>
            <h1 className="barra-topo__titulo">Treinos</h1>
          </div>
          <form action={sair}>
            <button type="submit" className="botao-barra">
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        <h2 className="doc__secao">Histórico</h2>

        {treinos.length === 0 ? (
          <p className="vazio">
            Nenhum treino registrado ainda. O primeiro começa aqui embaixo.
          </p>
        ) : (
          <ul className="lista">
            {treinos.map((treino) => (
              <li key={treino.id}>
                <Link href={`/treino/${treino.id}`} className="item">
                  <span className="item__data">{formatarData(treino.data)}</span>
                  <span className="item__meta">ver</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="acao-area">
        <form action={criarTreino}>
          <button type="submit" className="botao-primario">
            Iniciar treino de hoje
          </button>
        </form>
      </div>

      <AbaInferior ativa="bancada" />
    </main>
  );
}
