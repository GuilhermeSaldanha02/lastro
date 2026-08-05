"use client";

// lastro · D6 — a série é gravada local (fila offline) e a lista atualiza
// na hora; a chamada de rede (`criarSerieRemoto`) roda em segundo plano,
// sem o dono esperar. Se a rede caiu no meio do treino (PRD J1, "o
// elevador derruba o sinal"), o registro continua funcionando — a série
// fica na fila até o próximo evento `online`.
import { useEffect, useState } from "react";
import type { Exercicio, NovaSerieInput, Serie } from "@/lib/dados/treino";
import { criarSerieRemoto } from "@/lib/dados/treino";
import { enfileirar, sincronizar } from "@/lib/offline/outbox";
import {
  ouvirPedidosDeSincronizacao,
  pedirSincronizacaoEmSegundoPlano,
} from "@/lib/offline/sincronizacao-em-segundo-plano";
import FormularioSerie, { type DadosNovaSerie } from "./formulario-serie";

async function sincronizarPendentes() {
  return sincronizar({
    // Sincronização de treino ainda não existe (só séries, por ora) — a
    // fila nunca recebe "criar_treino" até essa próxima etapa existir.
    criar_treino: async () => {},
    criar_serie: async (payload) => {
      await criarSerieRemoto(payload as unknown as NovaSerieInput);
    },
  });
}

export default function TreinoDetalhe({
  treinoId,
  seriesIniciais,
  exercicios,
}: {
  treinoId: string;
  seriesIniciais: Serie[];
  exercicios: Exercicio[];
}) {
  const [series, setSeries] = useState(seriesIniciais);

  useEffect(() => {
    void sincronizarPendentes();
    window.addEventListener("online", sincronizarPendentes);
    // Tarefa 2.3 — além do `online` (só funciona com a aba em primeiro
    // plano), o SW pode acordar via Background Sync e avisar por mensagem.
    const pararDeOuvir = ouvirPedidosDeSincronizacao(() => {
      void sincronizarPendentes();
    });
    return () => {
      window.removeEventListener("online", sincronizarPendentes);
      pararDeOuvir();
    };
  }, []);

  /**
   * D3 (PRD §4.1) — "repetir a última série" é a ação mais frequente do
   * app: reaproveita exercício/tipo/reps/peso/RIR da última série e
   * registra de novo, sem passar pelo formulário.
   */
  async function repetirUltimaSerie(): Promise<void> {
    const ultima = series[series.length - 1];
    if (!ultima) return;
    await registrarSerie({
      exercicioId: ultima.exercicioId,
      tipo: ultima.tipo,
      reps: ultima.reps,
      peso: ultima.peso,
      rir: ultima.rir,
      pesoCorporalIncluso: ultima.pesoCorporalIncluso,
    });
  }

  async function registrarSerie(dados: DadosNovaSerie): Promise<void> {
    const exercicio = exercicios.find((e) => e.id === dados.exercicioId);
    if (!exercicio) throw new Error("Exercício não encontrado no catálogo.");

    const novaSerie: Serie = {
      id: crypto.randomUUID(),
      exercicioId: dados.exercicioId,
      exercicioNome: exercicio.nome,
      exercicioUnilateral: exercicio.unilateral,
      tipo: dados.tipo,
      reps: dados.reps,
      peso: dados.peso,
      rir: dados.rir,
      pesoCorporalIncluso: dados.pesoCorporalIncluso,
    };
    const ordem = series.length + 1;

    // A UI confirma AQUI, antes de qualquer chamada de rede (D6).
    setSeries((atual) => [...atual, novaSerie]);

    await enfileirar("criar_serie", {
      id: novaSerie.id,
      treinoId,
      exercicioId: novaSerie.exercicioId,
      ordem,
      tipo: novaSerie.tipo,
      reps: novaSerie.reps,
      peso: novaSerie.peso,
      rir: novaSerie.rir,
      pesoCorporalIncluso: novaSerie.pesoCorporalIncluso,
    });

    // Melhor esforço — se não houver rede, a série já está na fila.
    // Pede ao navegador (Background Sync) para tentar de novo quando a
    // rede voltar, mesmo se a aba ficar em segundo plano; o listener
    // `online` acima segue como fallback nos navegadores sem suporte.
    const resultado = await sincronizarPendentes();
    if (resultado.falhou) {
      void pedirSincronizacaoEmSegundoPlano();
    }
  }

  return (
    <>
      <h2>Séries registradas</h2>
      {series.length === 0 ? (
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
            {series.map((serie) => (
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

      {series.length > 0 && (
        <button type="button" onClick={repetirUltimaSerie}>
          Repetir última série
        </button>
      )}

      <h2>Registrar série</h2>
      <FormularioSerie exercicios={exercicios} onRegistrar={registrarSerie} />
    </>
  );
}
