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
import { useState, type FormEvent } from "react";
import type { Exercicio } from "@/lib/dados/treino";

export type DadosNovaSerie = {
  exercicioId: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoCorporalIncluso: boolean;
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

  const exercicioSelecionado = exercicios.find((e) => e.id === exercicioId);

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

    await onRegistrar({ exercicioId, tipo: tipo as "aquecimento" | "valendo", reps, peso, rir, pesoCorporalIncluso });
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
