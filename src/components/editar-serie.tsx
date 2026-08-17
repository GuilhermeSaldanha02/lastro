"use client";

// lastro · edição de série já registrada. Não é o mesmo formulário do
// registro (`formulario-serie.tsx`): `atualizarSerieRemoto` não aceita
// mudar `exercicioId` (SDD, treino.ts) — mudar a que exercício uma série
// pertence é outra operação, não uma correção. Por isso este formulário
// nem mostra o seletor de exercício: só o que pode mudar.
import { useState, type FormEvent } from "react";
import type { Serie } from "@/lib/dados/treino";

export type DadosEdicaoSerie = {
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoCorporalIncluso: boolean;
};

export default function EditarSerie({
  serie,
  onSalvar,
  onCancelar,
}: {
  serie: Serie;
  onSalvar: (dados: DadosEdicaoSerie) => void | Promise<void>;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<"aquecimento" | "valendo">(serie.tipo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formData = new FormData(evento.currentTarget);
    const reps = Number(formData.get("reps"));
    const peso = Number(formData.get("peso"));
    const rirBruto = formData.get("rir");
    const pesoCorporalIncluso = formData.get("peso_corporal_incluso") === "on";

    if (!Number.isFinite(reps) || reps <= 0) {
      setErro("Reps precisa ser um número positivo.");
      return;
    }
    if (!Number.isFinite(peso) || peso < 0) {
      setErro("Peso precisa ser um número válido.");
      return;
    }

    let rir: number | null = null;
    if (tipo === "valendo" && rirBruto !== null && rirBruto !== "") {
      const rirNumero = Number(rirBruto);
      if (!Number.isFinite(rirNumero)) {
        setErro("RIR precisa ser um número válido.");
        return;
      }
      rir = rirNumero;
    }

    setSalvando(true);
    try {
      await onSalvar({ tipo, reps, peso, rir, pesoCorporalIncluso });
    } finally {
      setSalvando(false);
    }
  }

  // noValidate: mesma razão de FormularioSerie — required/min/max nativos
  // interceptavam o submit antes de `aoEnviar` rodar, e as mensagens deste
  // componente nunca apareciam (achado real da auditoria, TDET-04/05,
  // 2026-08-17). Atributos mantidos por semântica, só sem bloquear o JS.
  return (
    <form className="formulario" onSubmit={aoEnviar} noValidate>
      <div className="campo">
        <label className="campo__rotulo" htmlFor={`tipo-${serie.id}`}>
          {serie.exercicioNome}
        </label>
        <select
          id={`tipo-${serie.id}`}
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "aquecimento" | "valendo")}
        >
          <option value="valendo">Valendo</option>
          <option value="aquecimento">Aquecimento</option>
        </select>
      </div>

      <div className="dupla">
        <div className="campo">
          <label className="campo__rotulo" htmlFor={`reps-${serie.id}`}>
            Reps
          </label>
          <input
            id={`reps-${serie.id}`}
            name="reps"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            defaultValue={serie.reps}
            required
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor={`peso-${serie.id}`}>
            Peso (kg)
          </label>
          <input
            id={`peso-${serie.id}`}
            name="peso"
            type="number"
            inputMode="decimal"
            min={0}
            max={1000}
            step="0.01"
            defaultValue={serie.peso}
            required
          />
        </div>
      </div>

      {tipo === "valendo" && (
        <div className="campo">
          <label className="campo__rotulo" htmlFor={`rir-${serie.id}`}>
            RIR (opcional)
          </label>
          <input
            id={`rir-${serie.id}`}
            name="rir"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            defaultValue={serie.rir ?? undefined}
          />
        </div>
      )}

      <label className="campo-caixa" htmlFor={`pc-${serie.id}`}>
        <input
          id={`pc-${serie.id}`}
          name="peso_corporal_incluso"
          type="checkbox"
          defaultChecked={serie.pesoCorporalIncluso}
        />
        Peso corporal incluso
      </label>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="confirma__acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={onCancelar}
          disabled={salvando}
        >
          Cancelar
        </button>
        <button type="submit" className="botao-confirmar" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
