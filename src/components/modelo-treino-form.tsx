"use client";

// lastro · SDD.md §9.3 — formulário de criação de modelo, em 3 passos:
// nome, grupo(s) muscular(es) (reaproveita SeletorGrupoMuscular, mesmo
// padrão do registro de série) e os exercícios daqueles grupos.
// Só grava lista de exercícios — nunca série, peso ou reps (ADR-009/FF8).
//
// O nome era o ÚLTIMO campo, solto embaixo da lista de caixas de seleção,
// e o dono reprovou no teste de aparelho (2026-08-17): "não vi muito
// sentido". Virou o primeiro passo — nomear a intenção e depois preencher
// é a ordem de quem monta um treino.
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ExercicioDoCatalogo } from "@/lib/dados/treino";
import { criarModelo } from "@/lib/dados/modelo-treino";
import SeletorGrupoMuscular, { type OpcaoGrupo } from "./seletor-grupo-muscular";

export default function ModeloTreinoForm({
  exercicios,
  naFolha = false,
}: {
  exercicios: ExercicioDoCatalogo[];
  /** H1 — dentro da folha, fechar é `router.back()` (o próprio mecanismo de
   * histórico da folha), não `router.push`: empurrar uma rota nova por cima
   * da entrada da folha deixaria ela presa por baixo — o voltar do
   * navegador cairia de novo nela, num modelo que já foi criado. Fora da
   * folha (rota cheia por URL direta), `push` continua certo: não existe
   * entrada de folha pra fechar. */
  naFolha?: boolean;
}) {
  const router = useRouter();
  const [gruposEscolhidos, setGruposEscolhidos] = useState<string[]>([]);
  const [exerciciosEscolhidos, setExerciciosEscolhidos] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [nomeConfirmado, setNomeConfirmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);

  // Mesmo motivo do foco em SeletorGrupoMuscular (PR #83): a folha revela
  // conteúdo sem trocar de rota, então o foco não vem sozinho — sem isto
  // quem usa só teclado abre "Criar modelo" e não alcança o campo.
  useEffect(() => {
    if (!nomeConfirmado) nomeRef.current?.focus();
  }, [nomeConfirmado]);

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
      if (naFolha) {
        router.back();
      } else {
        router.push("/ajustes/modelos");
      }
    } catch {
      setErro("Não foi possível salvar. Tente de novo.");
      setEnviando(false);
    }
  }

  // Passo 1 — o nome.
  if (!nomeConfirmado) {
    return (
      <section className="grupo">
        <div className="grupo__cab">
          <h2 className="grupo__nome">Que treino é esse?</h2>
        </div>
        <p className="campo__nota">
          Dê um nome — os exercícios vêm no passo seguinte.
        </p>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="nome_modelo">
            Nome do modelo
          </label>
          <input
            ref={nomeRef}
            id="nome_modelo"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Peito e tríceps"
          />
        </div>

        <button
          type="button"
          className="botao-primario"
          disabled={!nome.trim()}
          onClick={() => setNomeConfirmado(true)}
        >
          Continuar
        </button>
      </section>
    );
  }

  // Passo 2 — os grupos musculares.
  if (gruposEscolhidos.length === 0) {
    return <SeletorGrupoMuscular opcoes={opcoesGrupo} onConfirmar={setGruposEscolhidos} />;
  }

  // Passo 3 — os exercícios. O nome vira o título, que é o que dá contexto
  // ao que se está montando; "Renomear" existe pra um erro de digitação não
  // custar a seleção inteira.
  return (
    <section className="grupo">
      <div className="grupo__cab">
        <h2 className="grupo__nome">{nome.trim()}</h2>
        <button
          type="button"
          className="botao-textual"
          onClick={() => setNomeConfirmado(false)}
        >
          Renomear
        </button>
      </div>

      <div className="grupo__cab">
        <p className="campo__nota">Exercícios do modelo</p>
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
