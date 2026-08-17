// lastro · SDD.md §5.1 — lista os treinos do usuário logado e permite
// iniciar um treino novo. A sessão em si é responsabilidade do
// middleware (tarefa 2.1) — esta página só assume que, se chegou até
// aqui, o usuário está autenticado.
//
// Modo Bancada (DESIGN.md §3.5): poucos elementos, grandes. A ação
// primária fica na metade inferior, ao alcance do polegar (D2).
import Link from "next/link";
import { listarTreinos, criarTreino } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { listarModelos } from "@/lib/dados/modelo-treino";
import { dataLocalBrasil } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import ExcluirTreino from "@/components/excluir-treino";
import SetaNavegacao from "@/components/seta-navegacao";
import Avatar from "@/components/avatar";
import IniciarTreino from "@/components/iniciar-treino";
import TituloTela from "@/components/titulo-tela";

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
  const [treinos, perfil, modelos] = await Promise.all([
    listarTreinos(),
    obterPerfil(),
    listarModelos(),
  ]);
  // Mesma checagem da home (src/app/page.tsx) — sem isto, esta tela sempre
  // oferecia "Iniciar treino de hoje" mesmo com um treino de hoje já em
  // andamento, e clicar de novo criava outro (achado do dono, 2026-08-07;
  // `criarTreino` agora reaproveita, mas o rótulo do botão ficava errado
  // até essa correção).
  const treinoDeHojeId = treinos.find((t) => t.data === dataLocalBrasil())?.id ?? null;

  return (
    <main className="tela">
      {/* Aba de nível de topo — sem `VoltarFlutuante`. */}
      <TituloTela
        contexto="lastro"
        titulo="Treinos"
        acessorio={perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <h2 className="doc__secao">Histórico</h2>

        {treinos.length === 0 ? (
          <p className="vazio">
            Nenhum treino registrado ainda. O primeiro começa aqui embaixo.
          </p>
        ) : (
          <ul className="lista">
            {treinos.map((treino) => (
              <li key={treino.id}>
                <div className="item">
                  <Link href={`/treino/${treino.id}`} className="item__link">
                    <span className="item__conteudo">
                      <span className="item__data">{formatarData(treino.data)}</span>
                      {/* "ver" era rótulo em verbo numa linha de navegação —
                          reprova de peça 3 (§6.3/§6.4). A seta (M4) já
                          carrega esse recado; a meta virou informação de
                          verdade, mesmo padrão de `/` (Início). */}
                      <span className="item__meta">
                        {treino.totalSeries}{" "}
                        {treino.totalSeries === 1 ? "série" : "séries"}
                      </span>
                    </span>
                    <SetaNavegacao />
                  </Link>
                  <ExcluirTreino
                    id={treino.id}
                    data={formatarData(treino.data)}
                    series={treino.totalSeries}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="acao-area">
        {treinoDeHojeId ? (
          <Link href={`/treino/${treinoDeHojeId}`} className="botao-primario">
            Continuar treino de hoje
          </Link>
        ) : modelos.length > 0 ? (
          <IniciarTreino modelos={modelos} />
        ) : (
          <form action={criarTreino}>
            <button type="submit" className="botao-primario">
              Iniciar treino de hoje
            </button>
          </form>
        )}
      </div>

      <AbaInferior ativa="bancada" />
    </main>
  );
}
