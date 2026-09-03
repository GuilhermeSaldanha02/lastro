"use client";

// lastro · botões de ação da tela própria do parecer
// (/ajustes/relatorios/parecer/[id]). Rascunho não confirmado: Salvar/
// Descartar. Parecer já confirmado: Baixar PDF/Excluir. As DUAS ações
// destrutivas pedem confirmação inline, nunca window.confirm (C5).
// Depois de Salvar/Descartar/Excluir, volta pra lista via navegação
// real, não estado local.
//
// "Descartar" nasceu sem confirmação (Task 6 do plano da geração
// assíncrona) — decisão deliberada na época, revista em 2026-09-03 por
// decisão do dono. O argumento não é simetria com "Excluir": é custo.
// Um toque errado não perde só um rascunho que expiraria em 24h
// (EXPIRA_RASCUNHO_HORAS) — perde a geração inteira, e uma chamada real
// à Gemini foi medida em ~4min32s (parecer-config.ts). Pedir de novo é
// caro o bastante para valer um segundo toque.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { confirmarParecer, excluirParecer } from "@/lib/dados/parecer";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function ParecerDetalheAcoes({
  parecer,
  idioma,
}: {
  parecer: ParecerSalvo;
  idioma: Idioma;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [excluindo, setExcluindo] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function confirmar() {
    setErro(null);
    iniciar(async () => {
      try {
        await confirmarParecer(parecer.id);
        router.push("/ajustes/relatorios");
      } catch {
        setErro(t("Não foi possível salvar. Tente de novo.", idioma));
      }
    });
  }

  function excluir() {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirParecer(parecer.id);
        router.push("/ajustes/relatorios");
      } catch {
        setErro(t("Não foi possível excluir. Tente de novo.", idioma));
      }
    });
  }

  async function baixarPdf() {
    setErro(null);
    setBaixandoPdf(true);
    try {
      const resposta = await fetch(`/api/parecer/${parecer.id}/pdf`);
      if (!resposta.ok) throw new Error("falha");
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lastro-analise-${parecer.criadoEm.slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro(t("Falha ao baixar o PDF. Tente de novo.", idioma));
    } finally {
      setBaixandoPdf(false);
    }
  }

  return (
    <>
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {!parecer.confirmado ? (
        descartando ? (
          <div className="confirma" role="group" aria-label={t("Descartar rascunho", idioma)}>
            <p className="confirma__texto">
              {t(
                "Descartar apaga este rascunho — não dá para desfazer. Pedir outro parecer exige uma nova geração, que leva alguns minutos.",
                idioma,
              )}
            </p>
            <div className="confirma__acoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setDescartando(false)}
                disabled={pendente}
              >
                {t("Cancelar", idioma)}
              </button>
              <button type="button" className="botao-destrutivo" onClick={excluir} disabled={pendente}>
                {pendente ? t("Descartando…", idioma) : t("Descartar rascunho", idioma)}
              </button>
            </div>
          </div>
        ) : (
          <div className="confirma__acoes">
            <button type="button" className="botao-primario" onClick={confirmar} disabled={pendente}>
              {pendente ? t("Salvando…", idioma) : t("Salvar", idioma)}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => setDescartando(true)}
              disabled={pendente}
            >
              {t("Descartar", idioma)}
            </button>
          </div>
        )
      ) : (
        <>
          <button type="button" className="botao-primario" onClick={baixarPdf} disabled={baixandoPdf}>
            {baixandoPdf ? t("Baixando…", idioma) : t("Baixar PDF", idioma)}
          </button>

          {excluindo ? (
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
                  onClick={() => setExcluindo(false)}
                  disabled={pendente}
                >
                  {t("Cancelar", idioma)}
                </button>
                <button type="button" className="botao-destrutivo" onClick={excluir} disabled={pendente}>
                  {pendente ? t("Excluindo…", idioma) : t("Excluir parecer salvo", idioma)}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="botao-textual-com-icone botao-textual-com-icone--destrutivo"
              onClick={() => setExcluindo(true)}
            >
              {t("Excluir parecer salvo", idioma)}
            </button>
          )}
        </>
      )}
    </>
  );
}
