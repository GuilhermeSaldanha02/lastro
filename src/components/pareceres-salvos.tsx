"use client";

// lastro · SDD.md §10.3 — lista de pareceres salvos (opt-in), dentro de
// /ajustes/relatorios. Abre um parecer inline (sem modal novo — reusa
// `Parecer`, o mesmo componente da tela de Análise) em vez de navegar
// pra outra rota.
import { useState, useTransition } from "react";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { confirmarParecer, excluirParecer } from "@/lib/dados/parecer";
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
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  const aberto = listaLocal.find((p) => p.id === abertoId) ?? null;
  const rascunho = listaLocal.find((p) => !p.confirmado) ?? null;
  const confirmados = listaLocal.filter((p) => p.confirmado);
  const [confirmando, setConfirmando] = useState(false);

  function confirmar(id: string) {
    setErro(null);
    setConfirmando(true);
    iniciar(async () => {
      try {
        await confirmarParecer(id);
        setListaLocal((atual) =>
          atual.map((p) => (p.id === id ? { ...p, confirmado: true } : p)),
        );
      } catch {
        setErro(t("Não foi possível salvar. Tente de novo.", idioma));
      } finally {
        setConfirmando(false);
      }
    });
  }

  function confirmarExclusao(id: string) {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirParecer(id);
        setListaLocal((atual) => atual.filter((p) => p.id !== id));
        setExcluindoId(null);
        if (abertoId === id) setAbertoId(null);
      } catch {
        setErro(t("Não foi possível excluir. Tente de novo.", idioma));
      }
    });
  }

  async function baixarPdf(id: string, criadoEm: string) {
    setErro(null);
    setBaixandoPdf(true);
    try {
      const resposta = await fetch(`/api/parecer/${id}/pdf`);
      if (!resposta.ok) throw new Error("falha");
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lastro-analise-${criadoEm.slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro(t("Falha ao baixar o PDF. Tente de novo.", idioma));
    } finally {
      setBaixandoPdf(false);
    }
  }

  if (aberto && aberto.texto && aberto.evidencia) {
    const textoAberto = aberto.texto;
    const evidenciaAberta = aberto.evidencia;
    return (
      <div className="pilha">
        <button type="button" className="botao-textual" onClick={() => setAbertoId(null)}>
          ← {t("Voltar à lista", idioma)}
        </button>

        <Parecer
          pergunta={aberto.perguntaTexto}
          texto={textoAberto}
          avisoFalhaInterpretativa={aberto.avisoFalhaInterpretativa}
          evidencia={evidenciaAberta}
          idioma={aberto.idioma}
          emitidoEm={aberto.criadoEm}
        />

        <button
          type="button"
          className="botao-primario"
          onClick={() => baixarPdf(aberto.id, aberto.criadoEm)}
          disabled={baixandoPdf}
        >
          {baixandoPdf ? t("Baixando…", idioma) : t("Baixar PDF", idioma)}
        </button>

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

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
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {rascunho && rascunho.status === "gerando" && (
        <div className="card-relatorio-item">
          <p className="card-relatorio-item__id-curto">{rascunho.perguntaTexto}</p>
          <p className="vazio">{t("Gerando…", idioma)}</p>
        </div>
      )}

      {rascunho && rascunho.status === "pronto" && rascunho.texto && rascunho.evidencia && (
        <div className="pilha">
          <Parecer
            pergunta={rascunho.perguntaTexto}
            texto={rascunho.texto}
            avisoFalhaInterpretativa={rascunho.avisoFalhaInterpretativa}
            evidencia={rascunho.evidencia}
            idioma={rascunho.idioma}
            emitidoEm={rascunho.criadoEm}
          />
          <div className="confirma__acoes">
            <button
              type="button"
              className="botao-primario"
              onClick={() => confirmar(rascunho.id)}
              disabled={confirmando || pendente}
            >
              {t("Salvar", idioma)}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => confirmarExclusao(rascunho.id)}
              disabled={confirmando || pendente}
            >
              {t("Descartar", idioma)}
            </button>
          </div>
        </div>
      )}

      {confirmados.map((parecer) => (
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
