"use client";

// lastro · SDD.md §9.3 — formulário de criação de modelo: grupo(s)
// muscular(es) primeiro (reaproveita SeletorGrupoMuscular, mesmo padrão do
// registro de série), depois os exercícios daqueles grupos, depois o nome.
// Só grava lista de exercícios — nunca série, peso ou reps (ADR-009/FF8).
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ExercicioDoCatalogo } from "@/lib/dados/treino";
import { criarModelo } from "@/lib/dados/modelo-treino";
import SeletorGrupoMuscular, { type OpcaoGrupo } from "./seletor-grupo-muscular";

export default function ModeloTreinoForm({
  exercicios,
}: {
  exercicios: ExercicioDoCatalogo[];
}) {
  const router = useRouter();
  const [gruposEscolhidos, setGruposEscolhidos] = useState<string[]>([]);
  const [exerciciosEscolhidos, setExerciciosEscolhidos] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const opcoesGrupo = useMemo<OpcaoGrupo[]>(() => {
    const porId = new Map<string, string>();
    for (const e of exercicios) porId.set(e.grupoMuscularPrimario, e.grupoMuscularNome);
    return Array.from(porId.entries())
      .map(([id, nomeGrupo]) => ({ id, nome: nomeGrupo }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [exercicios]);

  const exerciciosFiltrados = useMemo(
    () => exercicios.filter((e) => gruposEscolhidos.includes(e.grupoMuscularPrimario)),
    [exercicios, gruposEscolhidos],
  );

  function alternarExercicio(id: string) {
    setExerciciosEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((e) => e !== id) : [...atual, id],
    );
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro("Dê um nome ao modelo.");
      return;
    }
    if (exerciciosEscolhidos.length === 0) {
      setErro("Escolha pelo menos um exercício.");
      return;
    }
    setEnviando(true);
    try {
      await criarModelo(nome.trim(), exerciciosEscolhidos);
      router.push("/ajustes/modelos");
    } catch {
      setErro("Não foi possível salvar. Tente de novo.");
      setEnviando(false);
    }
  }

  if (gruposEscolhidos.length === 0) {
    return <SeletorGrupoMuscular opcoes={opcoesGrupo} onConfirmar={setGruposEscolhidos} />;
  }

  return (
    <section className="grupo">
      <div className="grupo__cab">
        <h2 className="grupo__nome">Exercícios do modelo</h2>
        <button type="button" className="botao-textual" onClick={() => setGruposEscolhidos([])}>
          Trocar grupo
        </button>
      </div>

      <div className="selecao-grupos" role="group" aria-label="Exercícios do modelo">
        {exerciciosFiltrados.map((exercicio) => (
          <label key={exercicio.id} className="selecao-grupos__opcao">
            <input
              type="checkbox"
              checked={exerciciosEscolhidos.includes(exercicio.id)}
              onChange={() => alternarExercicio(exercicio.id)}
            />
            {exercicio.nome}
          </label>
        ))}
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="nome_modelo">
          Nome do modelo
        </label>
        <input
          id="nome_modelo"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Peito e tríceps"
        />
      </div>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        className="botao-primario"
        onClick={salvar}
        disabled={enviando}
      >
        {enviando ? "Salvando…" : "Salvar modelo"}
      </button>
    </section>
  );
}
