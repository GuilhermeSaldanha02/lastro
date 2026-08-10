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

export default function Parecer({
  pergunta,
  texto,
  avisoFalhaInterpretativa,
  evidencia,
}: {
  pergunta: string | null;
  texto: string;
  avisoFalhaInterpretativa?: boolean;
  evidencia?: EvidenciaParaTela;
}) {
  const emissao = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const { veredito, corpo } = separarVeredito(texto);

  return (
    <article className="doc">
      <header className="doc__emissao">
        <p className="doc__selo">Análise semanal</p>
        {pergunta && <h2 className="doc__pergunta">{pergunta}</h2>}
        <p className="doc__meta">
          {evidencia
            ? `Semana de ${formatarDataCurta(evidencia.periodo.semana_atual_inicio)} — ${formatarDataCurta(evidencia.periodo.semana_atual_fim)} · Emitido em ${emissao}`
            : `Emitido em ${emissao}`}
        </p>
      </header>

      {avisoFalhaInterpretativa && (
        <p className="aviso-erro" role="alert">
          A interpretação por IA falhou desta vez (duas tentativas
          rejeitadas). O texto abaixo é um resumo determinístico dos seus
          dados, sem prosa gerada — não é o parecer normal.
        </p>
      )}

      {/* Veredito: a PRIMEIRA FRASE, destacada acima do título do
          cabeçalho (DESIGN.md §3.6.2/§3.0) — é o julgamento, não a
          pergunta, que carrega o peso visual da tela. */}
      <p className="doc__veredito">{veredito}</p>

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
            />
          ))}
        </div>
      )}

      {corpo && <p className="doc__prosa">{corpo}</p>}

      {/* Rodapé de método: texto fixo, nunca gerado. Procedência se mostra
          com número e com o que foi excluído da conta, não com adesivo. */}
      <footer className="doc__metodo">
        <h2>Ressalvas do método</h2>
        <ul>
          <li>
            A faixa de referência de volume é uma convenção prática, baseada
            majoritariamente em homens jovens treinados — não tem teto
            validado.
          </li>
          <li>
            &quot;Estagnação&quot; de N semanas é uma convenção de mercado, não
            um critério clínico.
          </li>
          <li>
            e1RM calculado acima do teto de reps não é reportado — a fórmula
            perde precisão nessa faixa.
          </li>
          <li>
            Séries de peso corporal contam para frequência e série difícil,
            mas não entram no volume mostrado acima.
          </li>
        </ul>
      </footer>
    </article>
  );
}
