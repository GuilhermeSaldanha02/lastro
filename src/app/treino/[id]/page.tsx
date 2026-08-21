// lastro · SDD.md §5.1 — mostra o treino, lista as séries já registradas
// nele, e o formulário pra adicionar mais uma.
// D6: a lista + o formulário vivem juntos em `TreinoDetalhe` (client) —
// precisam compartilhar estado pra atualização otimista funcionar.
import { notFound } from "next/navigation";
import { buscarTreino, listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { buscarModelo } from "@/lib/dados/modelo-treino";
import TreinoDetalhe from "@/components/treino-detalhe";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modelo?: string }>;
}) {
  const { id } = await params;
  const { modelo: modeloId } = await searchParams;
  const [treino, exercicios, perfil] = await Promise.all([
    buscarTreino(id),
    listarCatalogo(),
    obterPerfil(),
  ]);

  if (!treino) notFound();

  // Pré-seleção só faz sentido no primeiro carregamento de um treino vazio
  // (SDD §9.3) — um treino que já tem série não tem mais "exercício ainda
  // não começado" pra oferecer.
  const exerciciosPreSelecionados =
    modeloId && treino.series.length === 0
      ? (await buscarModelo(modeloId))?.exercicios
      : undefined;

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={formatarContexto(treino.data)}
        destaque="Bancada"
        voltarHref="/treino"
        perfil={perfil}
      />

      <TreinoDetalhe
        treinoId={treino.id}
        seriesIniciais={treino.series}
        exercicios={exercicios}
        exerciciosPreSelecionados={exerciciosPreSelecionados}
      />

      <AbaInferior ativa="bancada" />
    </main>
  );
}
