// lastro · SDD.md §7.1 — renderiza o parecer da Análise Semanal.
//
// As ressalvas abaixo são parte do produto, não rodapé decorativo: ficam
// sempre visíveis junto do parecer, nunca atrás de accordion ou letra
// miúda (SDD §7.1). É o que separa este app de conselho genérico inventado.
export default function Parecer({
  texto,
  avisoFalhaInterpretativa,
}: {
  texto: string;
  avisoFalhaInterpretativa?: boolean;
}) {
  return (
    <div>
      {avisoFalhaInterpretativa && (
        <p>
          <strong>
            A interpretação por IA falhou desta vez (duas tentativas
            rejeitadas). O texto abaixo é um resumo determinístico dos seus
            dados, sem prosa gerada — não é o parecer normal.
          </strong>
        </p>
      )}

      <p style={{ whiteSpace: "pre-wrap" }}>{texto}</p>

      <h3>Ressalvas</h3>
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
    </div>
  );
}
