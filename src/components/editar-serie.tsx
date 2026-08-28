"use client";

// lastro · edição de série já registrada. Não é o mesmo formulário do
// registro (`formulario-serie.tsx`): `atualizarSerieRemoto` não aceita
// mudar `exercicioId` (SDD, treino.ts) — mudar a que exercício uma série
// pertence é outra operação, não uma correção. Por isso este formulário
// nem mostra o seletor de exercício: só o que pode mudar.
import { useState, type FormEvent } from "react";
import type { Serie } from "@/lib/dados/treino";
import { RIR_MINIMO, RIR_MAXIMO } from "@/lib/dados/limites-serie";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export type DadosEdicaoSerie = {
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  pesoPorLado: boolean;
};

export default function EditarSerie({
  serie,
  onSalvar,
  onCancelar,
  idioma,
}: {
  serie: Serie;
  onSalvar: (dados: DadosEdicaoSerie) => void | Promise<void>;
  onCancelar: () => void;
  idioma: Idioma;
}) {
  const [tipo, setTipo] = useState<"aquecimento" | "valendo">(serie.tipo);
  const [pesoPorLado, setPesoPorLado] = useState(serie.pesoPorLado);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formData = new FormData(evento.currentTarget);
    const reps = Number(formData.get("reps"));
    const peso = Number(formData.get("peso"));
    const rirBruto = formData.get("rir");

    if (!Number.isFinite(reps) || reps <= 0) {
      setErro(t("Reps precisa ser um número positivo.", idioma));
      return;
    }
    if (!Number.isFinite(peso) || peso < 0) {
      setErro(t("Peso precisa ser um número válido.", idioma));
      return;
    }

    let rir: number | null = null;
    if (tipo === "valendo" && rirBruto !== null && rirBruto !== "") {
      const rirNumero = Number(rirBruto);
      if (!Number.isFinite(rirNumero)) {
        setErro(t("RIR precisa ser um número válido.", idioma));
        return;
      }
      if (rirNumero < RIR_MINIMO || rirNumero > RIR_MAXIMO) {
        setErro(t("RIR precisa estar entre 0 e 10.", idioma));
        return;
      }
      rir = rirNumero;
    }

    setSalvando(true);
    try {
      await onSalvar({ tipo, reps, peso, rir, pesoPorLado });
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
          <option value="valendo">{t("Valendo", idioma)}</option>
          <option value="aquecimento">{t("Aquecimento", idioma)}</option>
        </select>
      </div>

      <div className="dupla">
        <div className="campo">
          <label className="campo__rotulo" htmlFor={`reps-${serie.id}`}>
            {t("Reps", idioma)}
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
            {t("Peso (kg)", idioma)}
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
            {t("RIR (opcional)", idioma)}
          </label>
          <input
            id={`rir-${serie.id}`}
            name="rir"
            type="number"
            inputMode="numeric"
            min={RIR_MINIMO}
            max={RIR_MAXIMO}
            defaultValue={serie.rir ?? undefined}
          />
        </div>
      )}

      <label className="interruptor" htmlFor={`ppl-${serie.id}`}>
        <input
          id={`ppl-${serie.id}`}
          className="interruptor__entrada"
          type="checkbox"
          checked={pesoPorLado}
          onChange={(e) => setPesoPorLado(e.target.checked)}
        />
        <span className="interruptor__trilho">
          <span className="interruptor__bolinha" />
        </span>
        {t("Peso é de cada lado (ex.: um halter em cada mão)", idioma)}
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
          {t("Cancelar", idioma)}
        </button>
        <button type="submit" className="botao-confirmar" disabled={salvando}>
          {salvando ? t("Salvando…", idioma) : t("Salvar", idioma)}
        </button>
      </div>
    </form>
  );
}
