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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--lastro-e-4)" }}>
      <section className="card-obsidian">
        <span className="card-obsidian__titulo">Peso da barra (kg)</span>
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

      <section className="card-obsidian">
        <div className="card-obsidian__header">
          <span className="card-obsidian__titulo">Anilhas disponíveis</span>
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
          <button type="button" className="acao-fantasma" onClick={adicionarAnilha}>
            <span aria-hidden="true">+</span> Adicionar
          </button>
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
            {salvando ? "Salvando…" : "Salvar configuração"}
          </button>
          {salvo && (
            <p className="campo__nota" aria-live="polite">
              Configuração salva.
            </p>
          )}
        </div>
      </section>

      <section className="card-obsidian">
        <span className="card-obsidian__titulo">Calculadora de Carga</span>
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
          <div style={{ background: "var(--lastro-sup-2)", borderLeft: "3px solid var(--lastro-ouro)", borderRadius: "var(--lastro-raio-2)", padding: "12px 14px", marginTop: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--lastro-txt-3)", textTransform: "uppercase", fontWeight: "var(--lastro-peso-max)" }}>
              De cada lado da barra:
            </span>
            <p style={{ fontFamily: "var(--lastro-fonte-num)", fontSize: "var(--lastro-papel-secao)", fontWeight: "var(--lastro-peso-max)", color: "var(--lastro-ouro-claro)", margin: "2px 0" }}>
              {resultado.porLado.length === 0 ? "0 kg / lado" : `${resultado.porLado.reduce((acc, a) => acc + a.peso * a.quantidade, 0)} kg / lado`}
            </p>
            <p style={{ fontSize: "var(--lastro-papel-rotulo)", color: "var(--lastro-txt-2)" }}>
              {resultado.porLado.length === 0
                ? "Só a barra, sem anilha de cada lado."
                : `${resultado.porLado.map((a) => `${a.quantidade}× ${formatarKg(a.peso)} kg`).join(" + ")}. Total: ${formatarKg(resultado.pesoTotalAlcancado)} kg${!resultado.exato ? " (mais próximo do alvo)" : " (exato)"}.`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
