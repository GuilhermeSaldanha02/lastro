"use client";

// lastro · T4 — meta semanal de treinos configurável. Padrão de
// componente igual ao AnilhasForm: estado local em string, valida e
// converte só no salvar, feedback de erro/sucesso inline.
import { useState } from "react";
import { definirMetaTreinosSemana } from "@/lib/dados/meta-semanal";
import { t } from "@/lib/texto/i18n";
import DicaInfo from "./dica-info";
import type { Idioma } from "@/lib/dados/idioma";

export default function MetaSemanalForm({
  metaInicial,
  idioma,
}: {
  metaInicial: number | null;
  idioma: Idioma;
}) {
  const [valor, setValor] = useState(metaInicial === null ? "" : String(metaInicial));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setErro(null);
    setSalvo(false);

    const meta = valor.trim() === "" ? null : Number(valor);
    if (meta !== null && (!Number.isInteger(meta) || meta < 1 || meta > 7)) {
      setErro(t("A meta precisa ser um número inteiro entre 1 e 7.", idioma));
      return;
    }

    setSalvando(true);
    try {
      const resultado = await definirMetaTreinosSemana(meta);
      if (!resultado.ok) {
        setErro(
          resultado.sessaoExpirada
            ? t("Sessão expirada. Entre novamente.", idioma)
            : resultado.erro,
        );
        return;
      }
      setSalvo(true);
    } catch {
      // Um Server Action pode ter a resposta interrompida quando o cookie
      // de sessão some entre o clique e a requisição. A tela não pode ficar
      // presa em "Salvando…" nem sugerir que a meta foi gravada.
      setErro(t("Não foi possível salvar. Tente de novo.", idioma));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="card-obsidian">
      <div className="titulo-com-dica">
        <span className="card-obsidian__titulo">{t("Meta Semanal de Treinos", idioma)}</span>
        <DicaInfo titulo={t("Meta Semanal de Treinos", idioma)} idioma={idioma}>
          {t("Quantos treinos por semana é a sua meta. Deixe em branco para não mostrar meta nenhuma na Home.", idioma)}
        </DicaInfo>
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="meta_treinos">
          {t("Treinos por semana (1 a 7)", idioma)}
        </label>
        <input
          id="meta_treinos"
          type="number"
          inputMode="numeric"
          min={1}
          max={7}
          step={1}
          placeholder={t("Sem meta", idioma)}
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
          {salvando ? t("Salvando…", idioma) : t("Salvar meta", idioma)}
        </button>
        {salvo && (
          <p className="campo__nota" aria-live="polite">
            {t(valor.trim() === "" ? "Meta removida." : "Meta salva.", idioma)}
          </p>
        )}
      </div>
    </section>
  );
}
