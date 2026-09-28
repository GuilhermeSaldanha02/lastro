// lastro · o parecer que o próprio lastro escreve, sem Gemini (AN-08 M2-1 e
// M2-2). Perguntas 1 a 4: leitura focada na pergunta, sobre a última semana
// fechada. Perguntas 6 e 7: relatório de período (mês e desde o primeiro
// treino). Função pura — quem lê o banco é quem chama.
import { achatarSeriesValendo, montarResumoCompacto } from "@/lib/analise/agregar";
import { leituraDaPergunta } from "@/lib/analise/leitura-por-pergunta";
import { montarRelatorioPeriodo, periodoDoRelatorio, textoDoRelatorio } from "@/lib/analise/relatorio-periodo";
import { paraDataUTC } from "@/lib/analise/semanas";
import type { ExercicioBruto, TreinoBruto } from "@/lib/analise/tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { evidenciaDaPergunta, montarEvidenciaParaTela, type EvidenciaParaTela } from "./evidencia";
import type { NumeroPergunta } from "./perguntas";

export type PerguntaPorLogica = Exclude<NumeroPergunta, 5>;

/** Só a 5 (o que mudar) vai à Gemini: prescrever por regra é proibido (PRD §5). */
export function respondidaPorLogica(pergunta: NumeroPergunta): pergunta is PerguntaPorLogica {
  return pergunta !== 5;
}

export function parecerPorLogica(entrada: {
  pergunta: PerguntaPorLogica;
  treinos: TreinoBruto[];
  exercicios: ExercicioBruto[];
  hojeISO: string;
  idioma: Idioma;
}): { texto: string; evidencia: EvidenciaParaTela } {
  const { pergunta, treinos, exercicios, hojeISO, idioma } = entrada;

  if (pergunta <= 4) {
    const resumo = montarResumoCompacto({ treinos, exercicios, agora: paraDataUTC(hojeISO) });
    return {
      texto: leituraDaPergunta(resumo, pergunta as 1 | 2 | 3 | 4, idioma),
      evidencia: evidenciaDaPergunta(montarEvidenciaParaTela(resumo), pergunta),
    };
  }

  const tipo = pergunta === 6 ? "mes" : "historico";
  const series = achatarSeriesValendo(treinos, new Map(exercicios.map((e) => [e.id, e])));
  const periodo = periodoDoRelatorio(tipo, hojeISO, series);
  const relatorio = periodo ? montarRelatorioPeriodo(tipo, periodo, series) : null;
  return {
    texto: textoDoRelatorio(relatorio, idioma),
    evidencia: {
      periodo: {
        semana_atual_inicio: periodo?.inicio ?? hojeISO,
        semana_atual_fim: periodo?.fim ?? hojeISO,
        janela_semanas: relatorio?.semanasNoPeriodo ?? 0,
        tipo_periodo: tipo,
      },
      blocos: [],
    },
  };
}
