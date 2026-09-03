// lastro · SDD.md §7.1 — renderiza o parecer da Análise Semanal.
//
// DESIGN.md §3.6 — o parecer se apresenta como DOCUMENTO EMITIDO, nunca
// como mensagem recebida. O risco declarado no PRD §3 é único: se ele
// parecer um balão de chat, o produto vira "chatbot com gráfico colado"
// e a tese morre. Por isso, e cada um reprova o gate se aparecer aqui:
// sem balão com rabicho, sem avatar, sem alternância de lado, sem caixa
// de digitação, sem texto letra a letra, sem selo de "gerado por IA".
// Perguntar é outra tela — o coach 24h (PRD §4.4).
//
// As ressalvas são parte do produto, não rodapé decorativo: ficam sempre
// visíveis junto do parecer, nunca atrás de accordion ou letra miúda
// (SDD §7.1). É o que separa este app de conselho genérico inventado.
//
import BlocoEvidencia from "@/components/bloco-evidencia";
import { formatarDataCurta } from "@/lib/tempo";
import { separarVeredito } from "@/lib/texto/separar-veredito";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function Parecer({
  pergunta,
  texto,
  avisoFalhaInterpretativa,
  evidencia,
  idioma,
  emitidoEm,
}: {
  pergunta: string | null;
  texto: string;
  avisoFalhaInterpretativa?: boolean;
  evidencia?: EvidenciaParaTela;
  idioma: Idioma;
  /** ISO (timestamptz) de quando o parecer foi realmente emitido/salvo —
   * ausente = parecer recém-gerado, usa a data de agora (comportamento
   * original, achado ao escrever SDD.md §10: sem isto, reabrir um parecer
   * salvo mostraria a data de HOJE, não a data real do save). */
  emitidoEm?: string;
}) {
  const dataEmissao = emitidoEm ? new Date(emitidoEm) : new Date();
  const emissao = dataEmissao.toLocaleDateString(idioma, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  // O corte de "primeira frase = veredito" (DESIGN.md §3.6.2) assume
  // prosa real do LLM, escrita pra abrir com uma frase de julgamento
  // curta (prompt.ts). O fallback determinístico (quando a IA falha,
  // route.ts) é outra coisa — um resumo de dados que às vezes só fecha
  // a primeira frase depois de várias linhas. Aplicar o corte nele
  // produzia um "veredito" gigante (Número herói, 48px) com um parágrafo
  // inteiro dentro — achado do dono ao vivo, 2026-09-02. Sem prosa real,
  // não há veredito: o texto inteiro vira corpo normal.
  const { veredito, corpo } = avisoFalhaInterpretativa
    ? { veredito: "", corpo: texto.trim() }
    : separarVeredito(texto);

  return (
    <article className="doc">
      <header className="doc__emissao">
        <p className="doc__selo">{t("Análise semanal", idioma)}</p>
        {pergunta && <h2 className="doc__pergunta">{pergunta}</h2>}
        <p className="doc__meta">
          {evidencia
            ? `${t("Semana de", idioma)} ${formatarDataCurta(evidencia.periodo.semana_atual_inicio)} — ${formatarDataCurta(evidencia.periodo.semana_atual_fim)} · ${t("Emitido em", idioma)} ${emissao}`
            : `${t("Emitido em", idioma)} ${emissao}`}
        </p>
      </header>

      {avisoFalhaInterpretativa && (
        <p className="aviso-erro" role="alert">
          {t(
            "A interpretação por IA falhou desta vez (duas tentativas rejeitadas). O texto abaixo é um resumo determinístico dos seus dados, sem prosa gerada — não é o parecer normal.",
            idioma,
          )}
        </p>
      )}

      {/* Veredito: a PRIMEIRA FRASE, destacada acima do título do
          cabeçalho (DESIGN.md §3.6.2/§3.0) — é o julgamento, não a
          pergunta, que carrega o peso visual da tela. Ausente no
          fallback determinístico (acima) — não existe julgamento pra
          destacar quando a prosa real falhou. */}
      {veredito && <p className="doc__veredito">{veredito}</p>}

      {/* Blocos de evidência (§3.6.3) — ANTES da prosa. A ordem conta a
          arquitetura: o agregador já tinha os números prontos antes de o
          LLM escrever uma palavra (§3.6.4 item 2). */}
      {evidencia && evidencia.blocos.length > 0 && (
        <div className="evidencias">
          {evidencia.blocos.map((bloco) => (
            <BlocoEvidencia
              key={bloco.exercicio}
              bloco={bloco}
              janelaSemanas={evidencia.periodo.janela_semanas}
              idioma={idioma}
            />
          ))}
        </div>
      )}

      {/* Prosa real e resumo determinístico são dois GÊNEROS de texto, e
          tipografá-los igual era o defeito: o fallback (route.ts, quando
          a Gemini falha) é uma lista de medidas — "Volume total em
          2026-08-10: 42262." vinte vezes — e sair em `.doc__prosa`
          (18px, entrelinha de leitura, `pre-wrap`) fazia dela um muro de
          texto corrido que ninguém varre. Achado do dono, 2026-09-02: é
          exatamente a tela que ele tinha, porque a Gemini deu 503 o dia
          inteiro. Como lista de dados, na família de número, cada medida
          vira uma linha que se acha com o olho. */}
      {corpo &&
        (avisoFalhaInterpretativa ? (
          <ul className="doc__dados">
            {corpo
              .split("\n")
              .map((linha) => linha.trim())
              .filter(Boolean)
              .map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
          </ul>
        ) : (
          <p className="doc__prosa">{corpo}</p>
        ))}

      {/* Rodapé de método: texto fixo, nunca gerado. Procedência se mostra
          com número e com o que foi excluído da conta, não com adesivo. */}
      <footer className="doc__metodo">
        <h2>{t("Ressalvas do método", idioma)}</h2>
        <ul>
          <li>
            {t(
              "A faixa de referência de volume é uma convenção prática, baseada majoritariamente em homens jovens treinados — não tem teto validado.",
              idioma,
            )}
          </li>
          <li>
            {t('"Estagnação" de N semanas é uma convenção de mercado, não um critério clínico.', idioma)}
          </li>
          <li>
            {t("e1RM calculado acima do teto de reps não é reportado — a fórmula perde precisão nessa faixa.", idioma)}
          </li>
        </ul>
      </footer>
    </article>
  );
}
