"use client";

// lastro · SDD.md §10.3 — lista de pareceres salvos (opt-in), dentro de
// /ajustes/relatorios. Abre um parecer inline (sem modal novo — reusa
// `Parecer`, o mesmo componente da tela de Análise) em vez de navegar
// pra outra rota.
//
// Qual parecer está aberto vive na URL (?parecer=<id>), não em useState
// local — o cabeçalho da página (Server Component) lê o mesmo parâmetro
// pra decidir se mostra o back-arrow pra /ajustes ou some, deixando só
// "← Voltar à lista" abaixo como único controle de voltar enquanto um
// parecer está aberto (achado do dono, 2026-09-02: dois back-arrows
// empilhados). Bônus: o botão/gesto nativo de voltar do navegador fecha
// o parecer de graça, sem código extra.
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const abertoId = searchParams.get("parecer");

  function abrir(id: string) {
    router.push(`${pathname}?parecer=${id}`);
  }
  function fecharDetalhe() {
    router.push(pathname);
  }

  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [listaLocal, setListaLocal] = useState(pareceres);
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  const aberto = listaLocal.find((p) => p.id === abertoId) ?? null;
  const rascunho = listaLocal.find((p) => !p.confirmado) ?? null;
  const confirmados = listaLocal.filter((p) => p.confirmado);

  function confirmar(id: string) {
    setErro(null);
    iniciar(async () => {
      try {
        await confirmarParecer(id);
        setListaLocal((atual) =>
          atual.map((p) => (p.id === id ? { ...p, confirmado: true } : p)),
        );
      } catch {
        setErro(t("Não foi possível salvar. Tente de novo.", idioma));
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
        if (abertoId === id) fecharDetalhe();
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
        <button type="button" className="botao-textual" onClick={fecharDetalhe}>
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

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        {!aberto.confirmado ? (
          // Rascunho pronto, ainda não confirmado (SDD.md §11.4): decidir
          // aqui mesmo, sem download/exclusão-com-confirmação — essas ações
          // só fazem sentido pra um parecer já permanente.
          <div className="confirma__acoes">
            <button
              type="button"
              className="botao-primario"
              onClick={() => confirmar(aberto.id)}
              disabled={pendente}
            >
              {pendente ? t("Salvando…", idioma) : t("Salvar", idioma)}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => confirmarExclusao(aberto.id)}
              disabled={pendente}
            >
              {t("Descartar", idioma)}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="botao-primario"
              onClick={() => baixarPdf(aberto.id, aberto.criadoEm)}
              disabled={baixandoPdf}
            >
              {baixandoPdf ? t("Baixando…", idioma) : t("Baixar PDF", idioma)}
            </button>

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
          </>
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
        // Compacto, mesmo padrão dos pareceres já confirmados abaixo — não
        // despeja o parecer inteiro na lista (achado do dono: com vários
        // treinos no histórico, o rascunho sumia rolando a tela pra baixo
        // dentro de um bloco de texto grande demais).
        <div className="card-relatorio-item">
          <div className="card-relatorio-item__cabecalho">
            <div className="card-relatorio-item__data-bloco">
              <span
                className="card-relatorio-item__data-rotulo"
                style={{ color: "var(--lastro-ouro)" }}
              >
                {t("Rascunho", idioma)}
              </span>
            </div>
          </div>
          <p className="card-relatorio-item__id-curto">{rascunho.perguntaTexto}</p>
          <button
            type="button"
            className="botao-acao-relatorio"
            onClick={() => abrir(rascunho.id)}
          >
            {t("Revisar e salvar", idioma)}
          </button>
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
            onClick={() => abrir(parecer.id)}
          >
            {t("Ver parecer", idioma)}
          </button>
        </div>
      ))}
    </div>
  );
}
