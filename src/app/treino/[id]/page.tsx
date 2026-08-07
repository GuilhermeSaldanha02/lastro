// lastro · SDD.md §5.1 — mostra o treino, lista as séries já registradas
// nele, e o formulário pra adicionar mais uma.
// D6: a lista + o formulário vivem juntos em `TreinoDetalhe` (client) —
// precisam compartilhar estado pra atualização otimista funcionar.
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarTreino, listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import TreinoDetalhe from "@/components/treino-detalhe";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";

const DIAS = [
  "domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado",
];
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "2026-08-06" → "quinta · 6 ago". Montado em UTC para não deslizar de dia. */
function formatarContexto(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return `${DIAS[data.getUTCDay()]} · ${dia} ${MESES[mes - 1]}`;
}

export default async function PaginaTreinoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [treino, exercicios, perfil] = await Promise.all([
    buscarTreino(id),
    listarCatalogo(),
    obterPerfil(),
  ]);

  if (!treino) notFound();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div>
            <p className="barra-topo__contexto">{formatarContexto(treino.data)}</p>
            <h1 className="barra-topo__titulo">Treino em andamento</h1>
          </div>
          <div className="barra-topo__usuario">
            {perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
            <Link href="/treino" className="botao-barra">
              Treinos
            </Link>
          </div>
        </div>
      </header>

      <TreinoDetalhe
        treinoId={treino.id}
        seriesIniciais={treino.series}
        exercicios={exercicios}
      />

      <AbaInferior ativa="bancada" />
    </main>
  );
}
