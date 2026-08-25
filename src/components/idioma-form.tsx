"use client";

// lastro · módulo de idiomas (2026-08-24). Mesmo padrão de
// MetaSemanalForm/AnilhasForm: estado local, salva só ao clicar,
// feedback de erro/sucesso inline. Diferente deles: aqui não há "em
// branco" — sempre um dos três idiomas selecionado, porque a leitura
// (`obterIdioma()`) já resolve `null` para `"pt-BR"` antes de chegar
// aqui (não há estado "sem idioma" pra representar no formulário).
import { useState } from "react";
import { definirIdioma, type Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

const OPCOES: { valor: Idioma; rotulo: string }[] = [
  { valor: "pt-BR", rotulo: "Português" },
  { valor: "en", rotulo: "English" },
  { valor: "es", rotulo: "Español" },
];

export default function IdiomaForm({ idiomaInicial }: { idiomaInicial: Idioma }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  async function salvar(novo: Idioma) {
    setIdioma(novo);
    setErro(null);
    setSalvo(false);
    setSalvando(true);
    const resultado = await definirIdioma(novo);
    setSalvando(false);
    if (!resultado.ok) return setErro(resultado.erro);
    setSalvo(true);
  }

  return (
    <section className="card-obsidian">
      <span className="card-obsidian__titulo">{t("Idioma", idioma)}</span>
      <p className="campo__nota">
        {t("Catálogo de exercícios e textos do app neste idioma.", idioma)}
      </p>

      <div className="segmentado" role="radiogroup" aria-label={t("Idioma", idioma)}>
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={idioma === opcao.valor}
            className={`segmentado__opcao${idioma === opcao.valor ? " segmentado__opcao--ativa" : ""}`}
            disabled={salvando}
            onClick={() => salvar(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {salvo && !erro && (
        <p className="campo__nota" aria-live="polite">
          {t("Idioma salvo.", idioma)}
        </p>
      )}
    </section>
  );
}
