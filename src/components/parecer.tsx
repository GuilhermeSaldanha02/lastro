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
// LIMITAÇÃO CONHECIDA: `/api/analise` devolve só prosa (`{ parecer }`).
// Os blocos de evidência de §3.6.3 — exercício, número tabular e linha de
// procedência — existem no sistema (`.evidencia` em sistema.css) mas
// ainda não têm dado: dependem de a rota passar a devolver o resumo
// estruturado junto do texto. Enquanto isso, os números vivem na prosa.
export default function Parecer({
  pergunta,
  texto,
  avisoFalhaInterpretativa,
}: {
  pergunta: string | null;
  texto: string;
  avisoFalhaInterpretativa?: boolean;
}) {
  const emissao = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="doc">
      <header className="doc__emissao">
        <p className="doc__selo">Parecer emitido</p>
        {pergunta && <h2 className="doc__pergunta">{pergunta}</h2>}
        <p className="doc__meta">emitido {emissao}</p>
      </header>

      {avisoFalhaInterpretativa && (
        <p className="aviso-erro" role="alert">
          A interpretação por IA falhou desta vez (duas tentativas
          rejeitadas). O texto abaixo é um resumo determinístico dos seus
          dados, sem prosa gerada — não é o parecer normal.
        </p>
      )}

      <p className="doc__prosa">{texto}</p>

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
