"use client";

// lastro · PU-06 — o "Aceito" no fim do texto. Um toque registra o aceite da
// versão vigente e a pessoa segue para onde ia.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { aceitarTermos } from "@/lib/dados/termos";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function AceiteTermos({ idioma, destino }: { idioma: Idioma; destino: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aceitar() {
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    const resultado = await aceitarTermos();
    if (!resultado.ok) {
      setEnviando(false);
      setErro(resultado.erro);
      return;
    }
    router.replace(destino);
    router.refresh();
  }

  return (
    <div className="pilha">
      <p className="campo__nota">
        {t("Ao tocar em aceitar, você concorda com os Termos de Uso e com a Política de Privacidade acima, inclusive com o tratamento dos seus dados de treino, que podem revelar informações de saúde.", idioma)}
      </p>
      {erro && (
        <p className="aviso-erro" role="alert">
          {t(erro, idioma)}
        </p>
      )}
      <button type="button" className="botao-primario botao-primario--heroi" disabled={enviando} onClick={aceitar}>
        {enviando ? t("Salvando…", idioma) : t("Aceito e continuar", idioma)}
      </button>
    </div>
  );
}
