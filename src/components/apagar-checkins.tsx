"use client";

// lastro · AN-08 A1 — "Apagar meus check-ins": retirar o consentimento do
// check-in sem ter de apagar a conta (LGPD art. 8º §5º). Irreversível, então
// pede uma segunda confirmação.
import { useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { apagarMeusCheckins } from "@/lib/dados/checkin";
import { CHAVE_FOLHA_DISPENSADA, CHAVE_RESPOSTA_DO_DIA } from "@/lib/checkin/abertura";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

export default function ApagarCheckins({ hoje, idioma }: { hoje: string; idioma: Idioma }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function apagar() {
    setApagando(true);
    setErro(null);
    try {
      await apagarMeusCheckins();
      try {
        // Esquece a resposta do aparelho e não pergunta de novo hoje: quem acabou
        // de apagar não quer ser abordado na mesma hora.
        window.localStorage.removeItem(CHAVE_RESPOSTA_DO_DIA);
        window.localStorage.setItem(CHAVE_FOLHA_DISPENSADA, hoje);
      } catch {
        // sem armazenamento: nada a esquecer
      }
      setConfirmando(false);
      router.refresh();
    } catch (falha) {
      unstable_rethrow(falha);
      setErro(t("Não foi possível apagar. Tente de novo.", idioma));
    } finally {
      setApagando(false);
    }
  }

  return (
    <section className="card-obsidian">
      <p className="campo__nota">{t("Apagar remove todos os seus check-ins, para sempre. Seus treinos não mudam.", idioma)}</p>
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
      {confirmando ? (
        <div className="grupo__confirmacao">
          <button type="button" className="botao-destrutivo" onClick={apagar} disabled={apagando} aria-busy={apagando}>
            {apagando ? t("Apagando…", idioma) : t("Sim, apagar tudo", idioma)}
          </button>
          <button type="button" className="botao-textual" onClick={() => setConfirmando(false)} disabled={apagando}>
            {t("Cancelar", idioma)}
          </button>
        </div>
      ) : (
        <button type="button" className="botao-textual-com-icone botao-textual-com-icone--destrutivo" onClick={() => setConfirmando(true)}>
          {t("Apagar meus check-ins", idioma)}
        </button>
      )}
    </section>
  );
}
