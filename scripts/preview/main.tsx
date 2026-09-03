// lastro · BANCADA VISUAL — renderiza peças reais do app fora do Next,
// sem servidor, sem banco e sem .env.local. Serve ao gate visual do
// DESIGN.md ("direções renderizadas antes do pixel") e a qualquer
// verificação de layout que hoje exigiria subir o app inteiro.
//
// Fidelidade: importa os componentes REAIS e o globals.css real (que
// puxa tokens.css e sistema.css). As três famílias vêm do Google Fonts
// com os mesmos nomes que next/font resolve. O que a bancada NÃO tem é
// o CabecalhoPro e a AbaInferior — nenhum dos dois altera a largura do
// conteúdo (`.tela` não tem padding), então a medida de `.evidencia`
// aqui é a medida do app.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Parecer from "@/components/parecer";
import ParecerDetalheAcoes from "@/components/parecer-detalhe-acoes";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { evidenciaReal, textoFallbackReal, textoProsaExemplo } from "./dados";
import "@/app/globals.css";
import "./bancada.css";

const COMUM = {
  pergunta: "O que mudar na próxima semana?",
  evidencia: evidenciaReal,
  idioma: "pt-BR" as const,
  emitidoEm: "2026-09-02T14:36:38.477Z",
};

const RASCUNHO: ParecerSalvo = {
  id: "bancada-rascunho",
  pergunta: 5,
  perguntaTexto: COMUM.pergunta,
  texto: textoProsaExemplo,
  avisoFalhaInterpretativa: false,
  evidencia: evidenciaReal,
  idioma: "pt-BR",
  criadoEm: COMUM.emitidoEm,
  status: "pronto",
  confirmado: false,
};

function Cena({ id, rotulo, nota, children }: { id: string; rotulo: string; nota: string; children: React.ReactNode }) {
  return (
    <section data-cena={id}>
      <p className="bancada-rotulo">
        {rotulo}
        <span>{nota}</span>
      </p>
      <main className="tela">
        <div className="corpo corpo--com-nav corpo--titulo-conteudo">{children}</div>
      </main>
    </section>
  );
}

const CENAS = {
  "parecer-prosa": (
    <Cena id="parecer-prosa" rotulo="Parecer — prosa normal" nota="Números reais; a PROSA é sintética (não há prosa real desta semana no banco).">
      <Parecer {...COMUM} texto={textoProsaExemplo} />
    </Cena>
  ),
  "parecer-fallback": (
    <Cena id="parecer-fallback" rotulo="Parecer — fallback determinístico" nota="100% real: é o parecer que está na conta do dono hoje (Gemini deu 503).">
      <Parecer {...COMUM} texto={textoFallbackReal} avisoFalhaInterpretativa />
    </Cena>
  ),
  "acoes-rascunho": (
    <Cena id="acoes-rascunho" rotulo="Ações do rascunho" nota="Interativo: Salvar/Descartar. As ações são stub — não tocam o banco.">
      <ParecerDetalheAcoes parecer={RASCUNHO} idioma="pt-BR" />
    </Cena>
  ),
  "acoes-salvo": (
    <Cena id="acoes-salvo" rotulo="Ações do parecer salvo" nota="Interativo: Baixar PDF/Excluir — a confirmação que já existia.">
      <ParecerDetalheAcoes parecer={{ ...RASCUNHO, confirmado: true }} idioma="pt-BR" />
    </Cena>
  ),
} as const;

const pedida = new URLSearchParams(location.search).get("cena") as keyof typeof CENAS | null;
const conteudo = pedida && pedida in CENAS ? CENAS[pedida] : Object.values(CENAS);

createRoot(document.getElementById("raiz")!).render(<StrictMode>{conteudo}</StrictMode>);
