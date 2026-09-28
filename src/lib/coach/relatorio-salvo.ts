// lastro · o Coach gera o relatório de período e o GUARDA nos pareceres
// (AN-08 M2-3, pedido do dono: "tem que guardar isso no histórico"). Mesmo
// texto das perguntas 6 e 7 da Análise — um cálculo só, duas portas. Guarda
// o relatório, nunca o que a pessoa digitou (a Política continua valendo).
import type { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { dataLocalBrasil } from "@/lib/tempo";
import type { Idioma } from "@/lib/dados/idioma";
import { carregarExercicios, carregarTreinosDoUsuario } from "@/lib/dados/historico-analise";
import { parecerPorLogica } from "@/app/api/analise/parecer-por-logica";
import { perguntasDoIdioma } from "@/app/api/analise/perguntas";
import type { IntentRelatorio } from "./roteador";

type ClienteSupabaseServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

const ONDE_FICOU: Record<Idioma, string> = {
  "pt-BR": "Relatório salvo em Pareceres salvos (Ajustes → Relatórios e adesivos).",
  en: "Report saved to Saved analyses (Settings → Reports and stickers).",
  es: "Informe guardado en Informes guardados (Ajustes → Informes y adhesivos).",
};

export async function gerarESalvarRelatorio(entrada: {
  supabase: ClienteSupabaseServidor;
  usuarioId: string;
  intent: IntentRelatorio;
  idioma: Idioma;
}): Promise<string> {
  const { supabase, usuarioId, intent, idioma } = entrada;
  const pergunta = intent === "RELATORIO_MES" ? 6 : 7;

  const [treinos, exercicios] = await Promise.all([
    carregarTreinosDoUsuario(supabase, usuarioId),
    carregarExercicios(supabase, idioma),
  ]);
  const { texto, evidencia } = parecerPorLogica({ pergunta, treinos, exercicios, hojeISO: dataLocalBrasil(), idioma });

  // Sem treino nenhum não há relatório para guardar: só a frase dizendo isso.
  if (treinos.length === 0) return texto;

  const { error } = await supabase.from("parecer").insert({
    usuario_id: usuarioId,
    pergunta,
    pergunta_texto: perguntasDoIdioma(idioma)[pergunta],
    idioma,
    status: "pronto",
    confirmado: true,
    texto,
    evidencia,
    aviso_falha_interpretativa: false,
    falha_motivo: null,
  });
  if (error) throw new Error(`Falha ao salvar o relatório: ${error.message}`);

  return `${texto}\n\n${ONDE_FICOU[idioma]}`;
}
