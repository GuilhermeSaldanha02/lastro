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
import { criarModelo, type PlanoDoExercicio } from "@/lib/dados/modelo-treino";
import { lerPlanoDoModelo } from "@/lib/dados/limites-modelo";
import SeletorGrupoMuscular, { type OpcaoGrupo } from "./seletor-grupo-muscular";
import DicaInfo from "./dica-info";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function ModeloTreinoForm({
  exercicios,
  naFolha = false,
  idioma,
}: {
  exercicios: ExercicioDoCatalogo[];
  /** H1 — dentro da folha, fechar é `router.back()` (o próprio mecanismo de
   * histórico da folha), não `router.push`: empurrar uma rota nova por cima
   * da entrada da folha deixaria ela presa por baixo — o voltar do
   * navegador cairia de novo nela, num modelo que já foi criado. Fora da
   * folha (rota cheia por URL direta), `push` continua certo: não existe
   * entrada de folha pra fechar. */
  naFolha?: boolean;
  idioma: Idioma;
}) {
  const router = useRouter();
  const [gruposEscolhidos, setGruposEscolhidos] = useState<string[]>([]);
  const [exerciciosEscolhidos, setExerciciosEscolhidos] = useState<string[]>([]);
  /** Plano por exercício, como TEXTO do campo (ver `definirPlano`). */
  const [planos, setPlanos] = useState<
    Record<string, { reps?: string; peso?: string }>
  >({});
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
      .sort((a, b) => a.nome.localeCompare(b.nome, idioma));
  }, [exercicios, idioma]);

  const exerciciosFiltrados = useMemo(
    () => exercicios.filter((e) => gruposEscolhidos.includes(e.grupoMuscularPrimario)),
    [exercicios, gruposEscolhidos],
  );

  function alternarExercicio(id: string) {
    setExerciciosEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((e) => e !== id) : [...atual, id],
    );
  }

  /** Guarda o que foi DIGITADO, como texto, não como número: o campo
   *  precisa poder ficar vazio (= não cadastrado) e aceitar "6" enquanto a
   *  pessoa ainda vai digitar "60". A conversão acontece só no salvar. */
  function definirPlano(id: string, campo: "reps" | "peso", valor: string) {
    setPlanos((atual) => ({
      ...atual,
      [id]: { ...atual[id], [campo]: valor },
    }));
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro(t("Dê um nome ao modelo.", idioma));
      return;
    }
    if (exerciciosEscolhidos.length === 0) {
      setErro(t("Escolha pelo menos um exercício.", idioma));
      return;
    }

    // Os limites de `modelo_treino_exercicio` (achado M4, 2026-09-13): o
    // que passar daqui o banco recusa, e a tela só diria "não foi possível
    // salvar" sem apontar o campo.
    const plano: PlanoDoExercicio[] = [];
    for (const exercicioId of exerciciosEscolhidos) {
      const lido = lerPlanoDoModelo(planos[exercicioId]);
      if (!lido.ok) {
        setErro(t(lido.erro, idioma));
        return;
      }
      plano.push({ exercicioId, reps: lido.reps, peso: lido.peso });
    }

    setEnviando(true);
    try {
      await criarModelo(nome.trim(), plano);
      if (naFolha) {
        router.back();
      } else {
        router.push("/ajustes/modelos");
      }
    } catch {
      setErro(t("Não foi possível salvar. Tente de novo.", idioma));
      setEnviando(false);
    }
  }

  // Passo 1 — o nome.
  if (!nomeConfirmado) {
    return (
      <section className="grupo">
        <div className="grupo__cab">
          <span className="titulo-com-dica">
            <h2 className="grupo__nome">{t("Que treino é esse?", idioma)}</h2>
            <DicaInfo titulo={t("Que treino é esse?", idioma)} idioma={idioma}>
              {t("Dê um nome — os exercícios vêm no passo seguinte.", idioma)}
            </DicaInfo>
          </span>
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="nome_modelo">
            {t("Nome do modelo", idioma)}
          </label>
          <input
            ref={nomeRef}
            id="nome_modelo"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={t("Ex.: Peito e tríceps", idioma)}
          />
        </div>

        <button
          type="button"
          className="botao-primario"
          disabled={!nome.trim()}
          onClick={() => setNomeConfirmado(true)}
        >
          {t("Continuar", idioma)}
        </button>
      </section>
    );
  }

  // Passo 2 — os grupos musculares.
  if (gruposEscolhidos.length === 0) {
    return <SeletorGrupoMuscular opcoes={opcoesGrupo} onConfirmar={setGruposEscolhidos} idioma={idioma} />;
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
          {t("Renomear", idioma)}
        </button>
      </div>

      <div className="grupo__cab">
        <span className="titulo-com-dica">
          <span className="campo__nota">{t("Exercícios do modelo", idioma)}</span>
          <DicaInfo titulo={t("Exercícios do modelo", idioma)} idioma={idioma}>
            {t(
              "Reps e peso são opcionais. Em branco, o app usa a sua última série daquele exercício.",
              idioma,
            )}
          </DicaInfo>
        </span>
        <button type="button" className="botao-textual" onClick={() => setGruposEscolhidos([])}>
          {t("Trocar grupo", idioma)}
        </button>
      </div>

      {/* Marcado o exercício, abrem os campos do plano (ADR-010). Ficam
          escondidos até marcar de propósito: mostrar reps/peso de 24
          exercícios que a pessoa não vai usar viraria um formulário
          gigante. Os dois são OPCIONAIS — vazio grava `null`, e no dia do
          treino o `+` cai no histórico real daquele exercício. */}
      <div className="selecao-grupos" role="group" aria-label={t("Exercícios do modelo", idioma)}>
        {exerciciosFiltrados.map((exercicio) => {
          const escolhido = exerciciosEscolhidos.includes(exercicio.id);
          const plano = planos[exercicio.id];
          return (
            <div key={exercicio.id} className="modelo-item">
              <label className="selecao-grupos__opcao">
                <input
                  type="checkbox"
                  checked={escolhido}
                  onChange={() => alternarExercicio(exercicio.id)}
                />
                {exercicio.nome}
              </label>

              {escolhido && (
                <div className="modelo-item__plano">
                  <div className="campo campo--compacto">
                    <label className="campo__rotulo" htmlFor={`reps_${exercicio.id}`}>
                      {t("Reps", idioma)}
                    </label>
                    <input
                      id={`reps_${exercicio.id}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={100}
                      value={plano?.reps ?? ""}
                      placeholder="—"
                      onChange={(e) => definirPlano(exercicio.id, "reps", e.target.value)}
                    />
                  </div>
                  <div className="campo campo--compacto">
                    <label className="campo__rotulo" htmlFor={`peso_${exercicio.id}`}>
                      {t("Peso (kg)", idioma)}
                    </label>
                    <input
                      id={`peso_${exercicio.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={1000}
                      step="0.5"
                      value={plano?.peso ?? ""}
                      placeholder="—"
                      onChange={(e) => definirPlano(exercicio.id, "peso", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
        {enviando ? t("Salvando…", idioma) : t("Salvar modelo", idioma)}
      </button>
    </section>
  );
}
