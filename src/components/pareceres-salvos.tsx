"use client";

// lastro · SDD.md §10.3 — lista de pareceres salvos (opt-in), dentro de
// /ajustes/relatorios. Abre um parecer inline (sem modal novo — reusa
// `Parecer`, o mesmo componente da tela de Análise) em vez de navegar
// pra outra rota.
import { useState, useTransition } from "react";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { excluirParecer } from "@/lib/dados/parecer";
import Parecer from "@/components/parecer";
import { formatarDataCurta } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function PareceresSalvos({
  pareceres,
  idioma,
}: {
  pareceres: ParecerSalvo[];
  idioma: Idioma;
}) {
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [listaLocal, setListaLocal] = useState(pareceres);

  const aberto = listaLocal.find((p) => p.id === abertoId) ?? null;

  function confirmarExclusao(id: string) {
    iniciar(async () => {
      await excluirParecer(id);
      setListaLocal((atual) => atual.filter((p) => p.id !== id));
      setExcluindoId(null);
      if (abertoId === id) setAbertoId(null);
    });
  }

  if (aberto) {
    return (
      <div className="pilha">
        <button type="button" className="botao-textual" onClick={() => setAbertoId(null)}>
          ← {t("Voltar à lista", idioma)}
        </button>

        <Parecer
          pergunta={aberto.perguntaTexto}
          texto={aberto.texto}
          avisoFalhaInterpretativa={aberto.avisoFalhaInterpretativa}
          evidencia={aberto.evidencia}
          idioma={aberto.idioma}
          emitidoEm={aberto.criadoEm}
        />

        <a
          href={`/api/parecer/${aberto.id}/pdf`}
          download
          className="botao-primario"
        >
          {t("Baixar PDF", idioma)}
        </a>

        {excluindoId === aberto.id ? (
          <div className="confirma" role="group" aria-label={t("Excluir parecer salvo", idioma)}>
            <p className="confirma__texto">
              {t(
                "Excluir este parecer apaga o registro salvo — não afeta seus treinos nem séries. Não dá para desfazer.",
                idioma,
              )}
            </p>
            <div className="confirma__acoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setExcluindoId(null)}
                disabled={pendente}
              >
                {t("Cancelar", idioma)}
              </button>
              <button
                type="button"
                className="botao-destrutivo"
                onClick={() => confirmarExclusao(aberto.id)}
                disabled={pendente}
              >
                {pendente ? t("Excluindo…", idioma) : t("Excluir parecer salvo", idioma)}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="botao-textual-com-icone botao-textual-com-icone--destrutivo"
            onClick={() => setExcluindoId(aberto.id)}
          >
            {t("Excluir parecer salvo", idioma)}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pilha">
      {listaLocal.map((parecer) => (
        <div key={parecer.id} className="card-relatorio-item">
          <div className="card-relatorio-item__cabecalho">
            <div className="card-relatorio-item__data-bloco">
              <span className="card-relatorio-item__data-rotulo">
                {formatarDataCurta(parecer.criadoEm.slice(0, 10)).toUpperCase()}
              </span>
            </div>
          </div>
          <p className="card-relatorio-item__id-curto">{parecer.perguntaTexto}</p>
          <button
            type="button"
            className="botao-acao-relatorio"
            onClick={() => setAbertoId(parecer.id)}
          >
            {t("Ver parecer", idioma)}
          </button>
        </div>
      ))}
    </div>
  );
}
