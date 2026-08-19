"use client";

// lastro · backlog C3 — configurar peso da barra + inventário de anilhas,
// e calcular quanto pôr de cada lado pra um peso alvo. Mínimo viável
// (BACKLOG-PROXIMA-FASE.md C3): só isso, nada de tela de inventário
// grande.
import { useState } from "react";
import { salvarConfigAnilhas, type ConfigAnilhas } from "@/lib/dados/config-anilhas";
import { calcularAnilhas } from "@/lib/anilhas";

function formatarKg(valor: number): string {
  return valor % 1 === 0 ? String(valor) : valor.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export default function AnilhasForm({ configInicial }: { configInicial: ConfigAnilhas }) {
  const [pesoBarra, setPesoBarra] = useState(String(configInicial.pesoBarra));
  const [anilhas, setAnilhas] = useState(
    [...configInicial.anilhasDisponiveis].sort((a, b) => b - a),
  );
  const [novaAnilha, setNovaAnilha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pesoAlvo, setPesoAlvo] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);

  function adicionarAnilha() {
    const peso = Number(novaAnilha.replace(",", "."));
    if (!Number.isFinite(peso) || peso <= 0) {
      setErro("Peso da anilha precisa ser um número positivo.");
      return;
    }
    if (anilhas.includes(peso)) {
      setNovaAnilha("");
      return;
    }
    setErro(null);
    setAnilhas((atual) => [...atual, peso].sort((a, b) => b - a));
    setNovaAnilha("");
  }

  function removerAnilha(peso: number) {
    setAnilhas((atual) => atual.filter((a) => a !== peso));
  }

  async function salvar() {
    setErro(null);
    setSalvo(false);
    const barra = Number(pesoBarra.replace(",", "."));
    if (!Number.isFinite(barra) || barra <= 0) {
      setErro("Peso da barra precisa ser um número positivo.");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigAnilhas(barra, anilhas);
      setSalvo(true);
    } catch {
      setErro("Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  const barraNumero = Number(pesoBarra.replace(",", "."));
  const alvoNumero = Number(pesoAlvo.replace(",", "."));
  const resultado =
    pesoAlvo && Number.isFinite(alvoNumero) && Number.isFinite(barraNumero) && barraNumero > 0
      ? calcularAnilhas(alvoNumero, barraNumero, anilhas)
      : null;

  return (
    <>
      <section className="grupo">
        <h2 className="grupo__nome">Peso da barra</h2>
        <div className="campo">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            value={pesoBarra}
            onChange={(e) => setPesoBarra(e.target.value)}
            aria-label="Peso da barra em kg"
          />
        </div>
      </section>

      <section className="grupo">
        <div className="grupo__cab">
          <h2 className="grupo__nome">Anilhas disponíveis</h2>
          {anilhas.length > 0 && (
            <button
              type="button"
              className="botao-textual"
              onClick={() => setModoEdicao((atual) => !atual)}
            >
              {modoEdicao ? "Concluído" : "Editar"}
            </button>
          )}
        </div>

        {anilhas.length === 0 ? (
          <p className="vazio">Nenhuma anilha configurada ainda.</p>
        ) : (
          // Anilha é DADO, não navegação — nunca leva a lugar nenhum, só se
          // lê e se remove (§6.3, peça 2). `.item`/`.lista` (recipiente com
          // borda) ficam reservados às linhas que navegam; aqui a grade sem
          // cartão é o padrão certo, medido a 360px: 6 anilhas em grade = 3
          // colunas × 2 linhas × 88px, contra 372px das 6 linhas de antes.
          //
          // H2 (D8): a lixeira fica sempre no DOM e `.botao-icone--oculto`
          // some com ela fora do modo de edição. A regra do H2 era
          // `visibility:hidden`, pra célula não encolher e não refluir a
          // grade — REVISTA em 2026-08-17: reservar um alvo de toque
          // inteiro embaixo de cada número deixava os valores boiando
          // ("números soltos", teste no aparelho). Agora o CSS de `.anilha`
          // usa `display:none`; a grade cresce ao ligar o modo de edição,
          // que é resposta a um toque explícito, não espaço morto fixo.
          // Sem confirmação em duas etapas aqui: `removerAnilha` só mexe em
          // estado local, nada persiste até "Salvar configuração".
          <div className="grade-anilhas">
            {anilhas.map((peso) => (
              <div className="anilha" key={peso}>
                <p className="anilha__valor">
                  {formatarKg(peso)}
                  <span className="anilha__un">kg</span>
                </p>
                <button
                  type="button"
                  className={
                    modoEdicao ? "botao-icone" : "botao-icone botao-icone--oculto"
                  }
                  aria-label={`Remover anilha de ${formatarKg(peso)} kg`}
                  aria-hidden={!modoEdicao}
                  tabIndex={modoEdicao ? undefined : -1}
                  onClick={() => removerAnilha(peso)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="dupla">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="nova_anilha">
              Adicionar anilha (kg)
            </label>
            <input
              id="nova_anilha"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.25"
              value={novaAnilha}
              onChange={(e) => setNovaAnilha(e.target.value)}
            />
          </div>
          {/* Ação fantasma (DESIGN.md §6.5, peça 8, M6) — "Adicionar" não
              pode competir em peso visual com "Salvar configuração"
              (`.botao-primario`, abaixo), o desequilíbrio que motivou
              esta peça (ESTUDO-PADRAO-APLICATIVO.md). */}
          <button type="button" className="acao-fantasma" onClick={adicionarAnilha}>
            <span aria-hidden="true">+</span> Adicionar
          </button>
        </div>

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        {/* "Adicionar anilha" (acima) edita a lista; "Salvar configuração"
            persiste a seção inteira. Encostados, liam como dois botões do
            mesmo passo — achado do teste no aparelho, 2026-08-17. */}
        <div className="grupo__confirmacao">
          <button
            type="button"
            className="botao-primario"
            onClick={salvar}
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "Salvar configuração"}
          </button>
          {salvo && (
            <p className="campo__nota" aria-live="polite">
              Configuração salva.
            </p>
          )}
        </div>
      </section>

      <section className="grupo">
        <h2 className="grupo__nome">Calculadora</h2>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="peso_alvo">
            Peso alvo (kg)
          </label>
          <input
            id="peso_alvo"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            value={pesoAlvo}
            onChange={(e) => setPesoAlvo(e.target.value)}
          />
        </div>

        {resultado && (
          <p className="campo__nota" aria-live="polite">
            {resultado.porLado.length === 0 ? (
              "Só a barra, sem anilha de cada lado."
            ) : (
              <>
                De cada lado:{" "}
                {resultado.porLado
                  .map((a) => `${a.quantidade}× ${formatarKg(a.peso)} kg`)
                  .join(" + ")}
                .
              </>
            )}{" "}
            Total: {formatarKg(resultado.pesoTotalAlcancado)} kg
            {!resultado.exato && ` (mais próximo do alvo com as anilhas que você tem)`}.
          </p>
        )}
      </section>
    </>
  );
}
