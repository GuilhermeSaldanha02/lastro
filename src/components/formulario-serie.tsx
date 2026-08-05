"use client";

// lastro · SDD.md §5.1 — formulário de registro de série.
//
// `unilateral` NÃO é campo deste formulário: é atributo do exercício
// escolhido, lido do catálogo (`exercicio.unilateral`). A tela só mostra um
// indicador de texto quando o exercício selecionado for unilateral — o dono
// não re-declara isso a cada série (SDD §5.1).
import { useState } from "react";
import { criarSerie, type Exercicio } from "@/lib/dados/treino";

export default function FormularioSerie({
  treinoId,
  exercicios,
}: {
  treinoId: string;
  exercicios: Exercicio[];
}) {
  const [exercicioId, setExercicioId] = useState(exercicios[0]?.id ?? "");
  const [tipo, setTipo] = useState<"aquecimento" | "valendo">("valendo");

  const exercicioSelecionado = exercicios.find((e) => e.id === exercicioId);
  const criarSerieDoTreino = criarSerie.bind(null, treinoId);

  return (
    <form action={criarSerieDoTreino}>
      <div>
        <label htmlFor="exercicio_id">Exercício</label>
        <select
          id="exercicio_id"
          name="exercicio_id"
          value={exercicioId}
          onChange={(e) => setExercicioId(e.target.value)}
          required
        >
          {exercicios.map((exercicio) => (
            <option key={exercicio.id} value={exercicio.id}>
              {exercicio.nome}
            </option>
          ))}
        </select>
      </div>

      {exercicioSelecionado?.unilateral && (
        <p>Exercício unilateral — reps contam por lado</p>
      )}

      <div>
        <label htmlFor="tipo">Tipo</label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "aquecimento" | "valendo")}
        >
          <option value="valendo">Valendo</option>
          <option value="aquecimento">Aquecimento</option>
        </select>
      </div>

      <div>
        <label htmlFor="reps">Reps</label>
        <input id="reps" name="reps" type="number" min={1} max={200} required />
      </div>

      <div>
        <label htmlFor="peso">Peso (kg)</label>
        <input
          id="peso"
          name="peso"
          type="number"
          min={0}
          max={1000}
          step="0.01"
          required
        />
      </div>

      {tipo === "valendo" && (
        <div>
          <label htmlFor="rir">RIR (opcional)</label>
          <input id="rir" name="rir" type="number" min={0} max={10} />
        </div>
      )}

      <div>
        <label htmlFor="peso_corporal_incluso">
          <input
            id="peso_corporal_incluso"
            name="peso_corporal_incluso"
            type="checkbox"
          />
          Peso corporal incluso
        </label>
      </div>

      <button type="submit">Registrar série</button>
    </form>
  );
}
