"use client";

// lastro · SDD.md §5.1 — formulário de registro de série.
//
// D6 (Fase 2): a gravação em si (fila offline + atualização otimista da
// lista) é responsabilidade do pai (`treino-detalhe.tsx`), que é quem tem
// o estado da lista de séries. Este componente só valida a entrada e
// entrega um objeto pronto — não sabe nada sobre rede nem sobre a fila.
//
// `unilateral` NÃO é campo deste formulário: é atributo do exercício
// escolhido, lido do catálogo (`exercicio.unilateral`). A tela só mostra um
// indicador de texto quando o exercício selecionado for unilateral — o dono
// não re-declara isso a cada série (SDD §5.1).
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Exercicio, SerieHistorica } from "@/lib/dados/treino";
import { historicoDoExercicio } from "@/lib/dados/treino";
import { ehRecorde } from "@/lib/analise/recorde-serie";

export type DadosNovaSerie = {
  exercicioId: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoCorporalIncluso: boolean;
  /** Calculado aqui (não no pai) porque é aqui que o histórico já foi
   * buscado — evita uma segunda consulta pra mesma informação (C4). */
  ehRecordePessoal: boolean;
};

export default function FormularioSerie({
  exercicios,
  onRegistrar,
}: {
  exercicios: Exercicio[];
  onRegistrar: (dados: DadosNovaSerie) => void | Promise<void>;
}) {
  // Começa em branco de propósito — a pessoa escolhe o exercício e o tipo,
  // nenhum dos dois vem pré-marcado. Com o catálogo crescendo, pré-marcar
  // `exercicios[0]` viraria "o primeiro em ordem alfabética", que não tem
  // relação nenhuma com o que a pessoa vai treinar (achado do dono, 2026-08-07).
  const [exercicioId, setExercicioId] = useState("");
  const [tipo, setTipo] = useState<"aquecimento" | "valendo" | "">("");
  const [erro, setErro] = useState<string | null>(null);
  // Histórico do exercício escolhido — fonte única pra "última vez" (C1),
  // "repetir por exercício" (C2) e detecção de PR (C4). `null` = ainda não
  // buscado ou a busca falhou; a UI degrada em silêncio nos dois casos —
  // sem rede (D6, elevador sem sinal) isto não pode virar erro visível.
  const [historico, setHistorico] = useState<SerieHistorica[] | null>(null);
  const repsRef = useRef<HTMLInputElement>(null);
  const pesoRef = useRef<HTMLInputElement>(null);

  const exercicioSelecionado = exercicios.find((e) => e.id === exercicioId);

  useEffect(() => {
    let cancelado = false;
    const buscar = exercicioId
      ? historicoDoExercicio(exercicioId)
      : Promise.resolve(null);
    buscar
      .then((dados) => {
        if (!cancelado) setHistorico(dados);
      })
      .catch(() => {
        if (!cancelado) setHistorico(null);
      });
    return () => {
      cancelado = true;
    };
  }, [exercicioId]);

  const ultimaDoHistorico = historico?.[0] ?? null;

  function usarUltimosValores() {
    if (!ultimaDoHistorico) return;
    setTipo("valendo");
    if (repsRef.current) repsRef.current.value = String(ultimaDoHistorico.reps);
    if (pesoRef.current) pesoRef.current.value = String(ultimaDoHistorico.peso);
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formulario = evento.currentTarget;
    const formData = new FormData(formulario);
    const reps = Number(formData.get("reps"));
    const peso = Number(formData.get("peso"));
    const rirBruto = formData.get("rir");
    const pesoCorporalIncluso = formData.get("peso_corporal_incluso") === "on";

    if (!exercicioId) {
      setErro("Exercício é obrigatório.");
      return;
    }
    if (tipo === "") {
      setErro("Escolha o tipo: aquecimento ou valendo.");
      return;
    }
    if (!Number.isFinite(reps) || reps <= 0) {
      setErro("Reps precisa ser um número positivo.");
      return;
    }
    if (!Number.isFinite(peso) || peso < 0) {
      setErro("Peso precisa ser um número válido.");
      return;
    }

    // RIR é campo de série valendo (SDD §3.2, constraint serie_rir_so_valendo).
    // Ausência é `null`, nunca `0` — RIR 0 é valor válido e diferente de
    // ausente (KNOWLEDGE.md §1). Aquecimento nunca carrega RIR.
    let rir: number | null = null;
    if (tipo === "valendo" && rirBruto !== null && rirBruto !== "") {
      const rirNumero = Number(rirBruto);
      if (!Number.isFinite(rirNumero)) {
        setErro("RIR precisa ser um número válido.");
        return;
      }
      rir = rirNumero;
    }

    // PR só existe pra série valendo (FF4) e só compara contra séries
    // elegíveis a e1RM do próprio exercício (backlog C4).
    const ehRecordePessoal =
      tipo === "valendo" &&
      ehRecorde({ reps, peso }, historico ?? []);

    await onRegistrar({
      exercicioId,
      tipo: tipo as "aquecimento" | "valendo",
      reps,
      peso,
      rir,
      pesoCorporalIncluso,
      ehRecordePessoal,
    });
    formulario.reset();
  }

  return (
    <form className="formulario" onSubmit={aoEnviar}>
      <div className="campo">
        <label className="campo__rotulo" htmlFor="exercicio_id">
          Exercício
        </label>
        <select
          id="exercicio_id"
          name="exercicio_id"
          value={exercicioId}
          onChange={(e) => setExercicioId(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione o exercício
          </option>
          {exercicios.map((exercicio) => (
            <option key={exercicio.id} value={exercicio.id}>
              {exercicio.nome}
            </option>
          ))}
        </select>
      </div>

      {exercicioSelecionado?.unilateral && (
        <p className="campo__nota">
          Exercício unilateral — reps contam por lado
        </p>
      )}

      {/* "Última vez" (C1) — só séries VALENDO entram no histórico (FF4),
          então isto nunca mostra um aquecimento como referência. Some em
          silêncio sem rede ou sem histórico — nunca vira erro (D6). */}
      {ultimaDoHistorico && (
        <div className="campo__historico">
          <p className="campo__nota">
            Última vez: {ultimaDoHistorico.reps} × {ultimaDoHistorico.peso} kg
          </p>
          <button type="button" className="botao-textual" onClick={usarUltimosValores}>
            Usar esses valores
          </button>
        </div>
      )}

      <div className="campo">
        <label className="campo__rotulo" htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "aquecimento" | "valendo" | "")}
          required
        >
          <option value="" disabled>
            Selecione o tipo
          </option>
          <option value="valendo">Valendo</option>
          <option value="aquecimento">Aquecimento</option>
        </select>
      </div>

      <div className="dupla">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="reps">
            Reps
          </label>
          <input
            ref={repsRef}
            id="reps"
            name="reps"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            required
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="peso">
            Peso (kg)
          </label>
          <input
            ref={pesoRef}
            id="peso"
            name="peso"
            type="number"
            inputMode="decimal"
            min={0}
            max={1000}
            step="0.01"
            required
          />
        </div>
      </div>

      {tipo === "valendo" && (
        <div className="campo">
          <label className="campo__rotulo" htmlFor="rir">
            RIR (opcional)
          </label>
          <input id="rir" name="rir" type="number" inputMode="numeric" min={0} max={10} />
        </div>
      )}

      <label className="campo-caixa" htmlFor="peso_corporal_incluso">
        <input
          id="peso_corporal_incluso"
          name="peso_corporal_incluso"
          type="checkbox"
        />
        Peso corporal incluso
      </label>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="botao-secundario">
        Registrar série
      </button>
    </form>
  );
}
