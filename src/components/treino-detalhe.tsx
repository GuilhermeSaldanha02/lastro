"use client";

// lastro · D6 — a série é gravada local (fila offline) e a lista atualiza
// na hora; a chamada de rede (`criarSerieRemoto`) roda em segundo plano,
// sem o dono esperar. Se a rede caiu no meio do treino (PRD J1, "o
// elevador derruba o sinal"), o registro continua funcionando — a série
// fica na fila até o próximo evento `online`.
import { useCallback, useEffect, useMemo, useState } from "react";
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

/**
 * Agrupa as séries por exercício, preservando a ordem de primeira
 * aparição — é assim que a tela do treino se lê (DESIGN.md §3.5). A
 * contagem exposta é só de séries VALENDO: aquecimento não entra em
 * volume, e1RM nem contagem (PRD A2).
 */
function agruparPorExercicio(series: Serie[]) {
  const grupos: { exercicioId: string; nome: string; series: Serie[] }[] = [];
  for (const serie of series) {
    const existente = grupos.find((g) => g.exercicioId === serie.exercicioId);
    if (existente) {
      existente.series.push(serie);
    } else {
      grupos.push({
        exercicioId: serie.exercicioId,
        nome: serie.exercicioNome,
        series: [serie],
      });
    }
  }
  return grupos;
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
  const [formularioAberto, setFormularioAberto] = useState(false);
  // D7 — reflete a fila de verdade: só vira "sincronizado" quando uma
  // drenagem termina sem falha. Nunca é apresentado como erro.
  const [sincronizado, setSincronizado] = useState(false);
  const grupos = useMemo(() => agruparPorExercicio(series), [series]);
  const ultima = series[series.length - 1];

  /** Drena a fila e reflete o resultado no indicador de sync (D7). */
  const drenar = useCallback(async () => {
    const resultado = await sincronizarPendentes();
    setSincronizado(!resultado.falhou);
    return resultado;
  }, []);

  useEffect(() => {
    // O dreno na montagem fica FUNCIONAL de propósito: ele não mexe no
    // indicador. Estado a partir do corpo de um efeito encadeia render, e
    // aqui não há ganho nenhum — "salvo no aparelho" já é verdade desde o
    // primeiro quadro (a série está gravada local). O indicador é
    // alimentado pelos callbacks abaixo e pelo registro de série, que são
    // os momentos em que a fila realmente muda de estado.
    void sincronizarPendentes();

    const aoVoltarARede = () => {
      void drenar();
    };
    window.addEventListener("online", aoVoltarARede);
    // Tarefa 2.3 — além do `online` (só funciona com a aba em primeiro
    // plano), o SW pode acordar via Background Sync e avisar por mensagem.
    const pararDeOuvir = ouvirPedidosDeSincronizacao(() => {
      void drenar();
    });
    return () => {
      window.removeEventListener("online", aoVoltarARede);
      pararDeOuvir();
    };
  }, [drenar]);

  /**
   * D3 (PRD §4.1) — "repetir a última série" é a ação mais frequente do
   * app: reaproveita exercício/tipo/reps/peso/RIR da última série e
   * registra de novo, sem passar pelo formulário.
   */
  async function repetirUltimaSerie(): Promise<void> {
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
    const resultado = await drenar();
    if (resultado.falhou) {
      void pedirSincronizacaoEmSegundoPlano();
    }
  }

  async function registrarPeloFormulario(dados: DadosNovaSerie): Promise<void> {
    await registrarSerie(dados);
    setFormularioAberto(false);
  }

  return (
    <>
      <div className="corpo corpo--com-nav">
        {series.length === 0 ? (
          <p className="vazio">
            Nenhuma série registrada ainda. Comece pela primeira aqui embaixo.
          </p>
        ) : (
          grupos.map((grupo) => {
            const valendo = grupo.series.filter((s) => s.tipo === "valendo").length;
            return (
              <section className="grupo" key={grupo.exercicioId}>
                <div className="grupo__cab">
                  <h2 className="grupo__nome">{grupo.nome}</h2>
                  <span className="grupo__cont">{valendo} valendo</span>
                </div>

                {grupo.series.map((serie, indice) => (
                  <div className="serie" key={serie.id}>
                    <span className="serie__i">{indice + 1}</span>
                    <span className="serie__v">
                      {serie.reps}
                      <span className="serie__x">×</span>
                      {serie.peso}
                      <span className="serie__un">kg</span>
                    </span>
                    {/* Cor nunca é o único canal: a palavra carrega o sentido. */}
                    <span
                      className={
                        serie.tipo === "aquecimento"
                          ? "marca marca--aquecimento"
                          : "marca marca--valendo"
                      }
                    >
                      {serie.tipo}
                    </span>
                  </div>
                ))}
              </section>
            );
          })
        )}

        {formularioAberto && (
          <section className="grupo">
            <div className="grupo__cab">
              <h2 className="grupo__nome">Registrar série</h2>
            </div>
            <FormularioSerie
              exercicios={exercicios}
              onRegistrar={registrarPeloFormulario}
            />
          </section>
        )}
      </div>

      {/* D2/D3 — a ação mais frequente do app, na metade inferior. */}
      <div className="acao-area">
        {ultima && (
          <button
            type="button"
            className="botao-primario"
            onClick={repetirUltimaSerie}
          >
            Repetir última série
            <span className="botao-primario__estado">
              {ultima.reps} × {ultima.peso} kg · {ultima.tipo}
            </span>
          </button>
        )}

        <div className={ultima ? "pilha" : undefined}>
          <button
            type="button"
            className="botao-secundario"
            aria-expanded={formularioAberto}
            onClick={() => setFormularioAberto((aberto) => !aberto)}
          >
            {formularioAberto ? "Fechar" : "Outra série"}
          </button>
        </div>

        {/* D7 — estado de sincronização sempre visível, nunca alarmante.
            "salvo no aparelho" é estado normal, não falha: a série já
            está gravada local e a fila sobe sozinha quando a rede voltar. */}
        <div className="sync--area">
          <p className="sync">
            <span className="sync__ponto" />
            {sincronizado ? "sincronizado" : "salvo no aparelho"}
          </p>
        </div>
      </div>
    </>
  );
}
