"use client";

// lastro · T4 — meta semanal de treinos configurável. Padrão de
// componente igual ao AnilhasForm: estado local em string, valida e
// converte só no salvar, feedback de erro/sucesso inline.
import { useState } from "react";
import { definirMetaTreinosSemana } from "@/lib/dados/meta-semanal";

export default function MetaSemanalForm({
  metaInicial,
}: {
  metaInicial: number | null;
}) {
  const [valor, setValor] = useState(metaInicial === null ? "" : String(metaInicial));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setErro(null);
    setSalvo(false);

    if (valor.trim() === "") {
      setSalvando(true);
      const resultado = await definirMetaTreinosSemana(null);
      setSalvando(false);
      if (!resultado.ok) return setErro(resultado.erro);
      return setSalvo(true);
    }

    const meta = Number(valor);
    if (!Number.isInteger(meta) || meta < 1 || meta > 7) {
      setErro("A meta precisa ser um número inteiro entre 1 e 7.");
      return;
    }

    setSalvando(true);
    const resultado = await definirMetaTreinosSemana(meta);
    setSalvando(false);
    if (!resultado.ok) return setErro(resultado.erro);
    setSalvo(true);
  }

  return (
    <section className="card-obsidian">
      <span className="card-obsidian__titulo">Meta Semanal de Treinos</span>
      <p className="campo__nota">
        Quantos treinos por semana é a sua meta. Deixe em branco para não
        mostrar meta nenhuma na Home.
      </p>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="meta_treinos">
          Treinos por semana (1 a 7)
        </label>
        <input
          id="meta_treinos"
          type="number"
          inputMode="numeric"
          min={1}
          max={7}
          step={1}
          placeholder="Sem meta"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setSalvo(false);
          }}
        />
      </div>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="grupo__confirmacao">
        <button
          type="button"
          className="botao-primario"
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? "Salvando…" : "Salvar meta"}
        </button>
        {salvo && (
          <p className="campo__nota" aria-live="polite">
            {valor.trim() === "" ? "Meta removida." : "Meta salva."}
          </p>
        )}
      </div>
    </section>
  );
}
