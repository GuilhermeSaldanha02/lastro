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
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

const DIAS_POR_IDIOMA: Record<Idioma, string[]> = {
  "pt-BR": ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  en: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
};
const MESES_POR_IDIOMA: Record<Idioma, string[]> = {
  "pt-BR": ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
};

/** "2026-08-06" → "quinta · 6 ago". Montado em UTC para não deslizar de dia. */
function formatarContexto(iso: string, idioma: Idioma): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const dias = DIAS_POR_IDIOMA[idioma];
  const meses = MESES_POR_IDIOMA[idioma];
  return `${dias[data.getUTCDay()]} · ${dia} ${meses[mes - 1]}`;
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

  const idioma = perfil?.idioma ?? "pt-BR";

  // Busca o plano sempre que veio de um modelo — SEM travar em
  // `treino.series.length === 0` (achado TR-03, QA.md 2026-08-28): esse
  // gate era por TREINO INTEIRO, não por exercício, então a primeira
  // série de QUALQUER exercício do modelo apagava os atalhos de TODOS os
  // outros, mesmo os que ainda não tinham nenhuma série. Quem decide
  // quais exercícios ainda estão pendentes é `pendentesDoModelo` em
  // `treino-detalhe.tsx` — ele já filtra corretamente POR EXERCÍCIO (via
  // `jaTemGrupo`); esse filtro nunca chegava a rodar porque o servidor
  // zerava a lista inteira antes.
  const exerciciosPreSelecionados = modeloId
    ? (await buscarModelo(modeloId))?.exercicios
    : undefined;

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={formatarContexto(treino.data, idioma)}
        destaque={t("Bancada", idioma)}
        voltarHref="/treino"
        perfil={perfil}
        idioma={idioma}
      />

      <TreinoDetalhe
        treinoId={treino.id}
        /* `treino.iniciado_em` (migration 0001) — a âncora de tempo que o
           cronômetro e os DOIS relatórios usam. Existia no banco desde
           sempre e nunca era lida; sem ela o cronômetro inventava um
           início ao abrir treino antigo (relato de uso real, 2026-09-04). */
        iniciadoEm={treino.iniciadoEm}
        seriesIniciais={treino.series}
        exercicios={exercicios}
        exerciciosPreSelecionados={exerciciosPreSelecionados}
        /* Só quem veio de um modelo ganha o `+` com plano — "se for em um
           treino normal, não aparecer" (dono, 2026-08-27). Passar o id em
           vez de um booleano é o que permite o write-back saber ONDE
           gravar de volta. */
        modeloId={exerciciosPreSelecionados ? modeloId : undefined}
        idioma={idioma}
        /* Dono dos itens da fila offline (achado M1): lido da sessão do
           servidor, não do navegador, para valer mesmo com o token local
           vencido no meio do treino. */
        usuarioId={perfil?.id}
      />

      <AbaInferior ativa="bancada" idioma={idioma} />
    </main>
  );
}
