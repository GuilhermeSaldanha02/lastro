// lastro · DESIGN.md §3.7 — gráfico de progressão, companhia visual da
// Análise Semanal. A pergunta que ele responde não é "quanto?", é "está
// subindo?" — o eixo é recurso de conferência, nunca via principal.
//
// Redesenho 2026-08-14: pequenos múltiplos — até 4 painéis (um por
// exercício), sem seletor. O servidor já filtra e rankeia
// (carregarProgressao); este componente só desenha o que chega.
"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import type { PainelProgressao } from "@/lib/dados/progressao";

type PontoGrafico = {
  semanaInicio: string;
  valorProgressao?: number;
  valorPlato?: number;
};

function formatarSemana(semanaInicioISO: string): string {
  const [, mes, dia] = semanaInicioISO.split("-");
  return `${dia}/${mes}`;
}

function formatarKg(valor: number): string {
  return `${valor.toFixed(1)} kg`;
}

/** Ponto interativo: alvo de toque/foco de --lastro-alvo-min mesmo com marcador pequeno (§3.7.4 item 5). */
function pontoInterativo(cor: string, ativo: boolean, aoAtivar: (indice: number | null) => void) {
  return function PontoInterativo(props: {
    cx?: number;
    cy?: number;
    index?: number;
    value?: number;
    payload?: PontoGrafico;
  }) {
    const { cx, cy, index, value, payload } = props;
    if (cx === undefined || cy === undefined || value === undefined || index === undefined || !payload) {
      return null;
    }
    const rotulo = `Semana de ${formatarSemana(payload.semanaInicio)}: ${formatarKg(value)}`;
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill={cor} />
        <circle
          cx={cx}
          cy={cy}
          r={24}
          fill="transparent"
          tabIndex={0}
          role="img"
          aria-label={rotulo}
          style={{
            cursor: "pointer",
            outline: ativo ? "var(--lastro-foco-espessura) solid var(--lastro-foco)" : "none",
            outlineOffset: "var(--lastro-foco-afast)",
          }}
          onFocus={() => aoAtivar(index)}
          onBlur={() => aoAtivar(null)}
          onMouseEnter={() => aoAtivar(index)}
          onMouseLeave={() => aoAtivar(null)}
        />
      </g>
    );
  };
}

/**
 * Um painel — um exercício. O servidor só entrega painéis com pelo menos
 * 2 semanas elegíveis para e1RM (T-E6), então este componente não repete
 * essa checagem: se chegou até aqui, tem dado suficiente pra desenhar.
 */
function PainelConteudo({ painel }: { painel: PainelProgressao }) {
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);

  // A janela do servidor tem 12 semanas fixas; exercício começado há pouco
  // só tem dado nas últimas. Desenhar as 12 espreme a linha inteira no
  // canto direito, e aí o gráfico deixa de responder "está subindo?" —
  // a única pergunta que ele existe pra responder (§3.7). Foi assim que o
  // dono viu no aparelho (2026-08-17). Recorta a janela vazia das PONTAS;
  // buraco no meio segue desenhado, porque ali a ausência é informação
  // (semana em que aquele exercício não foi treinado).
  const iInicio = painel.pontos.findIndex((p) => p.e1rm !== undefined);
  const iFim =
    painel.pontos.length -
    1 -
    [...painel.pontos].reverse().findIndex((p) => p.e1rm !== undefined);
  const pontos = painel.pontos.slice(iInicio, iFim + 1);

  const comDado = pontos.filter((p) => p.e1rm !== undefined);
  const primeiro = comDado[0];
  const ultimo = comDado[comDado.length - 1];
  // primeiro.e1rm pode ser 0 (ex.: assistida registrada sem carga externa)
  // — % contra uma base 0 não tem significado (Infinity), então a
  // conclusão vira delta absoluto em kg nesse caso.
  const baseValida = primeiro.e1rm! > 0;
  const deltaPct = baseValida ? ((ultimo.e1rm! - primeiro.e1rm!) / primeiro.e1rm!) * 100 : 0;
  const deltaKg = ultimo.e1rm! - primeiro.e1rm!;
  const subindo = baseValida ? deltaPct > 0 : deltaKg > 0;
  const caindo = baseValida ? deltaPct < 0 : deltaKg < 0;
  const melhorMarca = Math.max(...comDado.map((p) => p.e1rm!));
  // A linha de referência só soma informação nova quando o pico não é o
  // primeiro nem o último ponto — nesses dois casos o rótulo de extremo
  // (RotuloExtremos) já mostra o mesmo número bem ali, e a etiqueta da
  // linha de referência (fixa no canto superior direito) colide com ele
  // visualmente em telas estreitas, sobretudo quando a tendência é de
  // subida (o extremo mais alto cai perto do topo do gráfico).
  const melhorMarcaEhExtremo = melhorMarca === primeiro.e1rm || melhorMarca === ultimo.e1rm;

  const indicePrimeiro = pontos.indexOf(primeiro);
  const indiceUltimo = pontos.indexOf(ultimo);

  const inicioPlato = painel.plato
    ? pontos.findIndex((p) => p.semanaInicio === painel.plato!.semanaInicio)
    : -1;

  const serie: PontoGrafico[] = pontos.map((p, i) => {
    const noPlato = inicioPlato >= 0 && i >= inicioPlato;
    const naJuncao = inicioPlato >= 0 && i === inicioPlato;
    return {
      semanaInicio: p.semanaInicio,
      valorProgressao: !noPlato || naJuncao ? p.e1rm : undefined,
      valorPlato: noPlato ? p.e1rm : undefined,
    };
  });

  // Primeiro/último ponto podem cair em QUALQUER uma das duas linhas —
  // a de platô só tem dado quando há platô, e o último ponto está nela
  // sempre que há (senão o rótulo do ponto mais recente nunca aparece,
  // que é o caso comum sem platô). Por isso a MESMA função de rótulo vai
  // nas duas <Line>: ela só desenha algo quando o índice bate E a linha em
  // questão tem valor ali — não desenha duas vezes porque só uma linha tem
  // valor definido em cada índice, exceto o ponto de junção do platô, onde
  // desenhar duas vezes é inofensivo (mesmo texto, mesma posição).
  function RotuloExtremos(props: {
    x?: number | string;
    y?: number | string;
    index?: number;
    value?: unknown;
  }) {
    if (
      (props.index !== indicePrimeiro && props.index !== indiceUltimo) ||
      typeof props.value !== "number"
    ) {
      return null;
    }
    return (
      <text
        x={props.x}
        y={Number(props.y ?? 0) - 14}
        textAnchor="middle"
        className="grafico-progressao__rotulo"
      >
        {formatarKg(props.value)}
      </text>
    );
  }

  return (
    <>
      <p className="grafico-progressao__conclusao">
        e1RM {subindo ? "subiu" : caindo ? "caiu" : "ficou estável"}{" "}
        <strong>
          {baseValida
            ? `${Math.abs(deltaPct).toFixed(1)}%`
            : `${Math.abs(deltaKg).toFixed(1)} kg`}
        </strong>{" "}
        entre {formatarSemana(primeiro.semanaInicio)} e {formatarSemana(ultimo.semanaInicio)}.
        {painel.plato && (
          <span className="grafico-progressao__plato-nota">
            {" "}
            Platô há {painel.plato.semanas} semanas.
          </span>
        )}
      </p>

      {/* `RotuloExtremos` centraliza o valor em kg na coordenada do ponto,
          então metade do texto cai FORA nos extremos — com margem de 12 o
          rótulo do último ponto era cortado no meio ("66.7 k" no print do
          dono, 2026-08-17). 40 comporta o rótulo mais largo previsto
          ("999.9 kg") na fonte de rótulo. Altura vem do CSS (100% da
          `__area`), pra não repetir a medida em JS. */}
      <div className="grafico-progressao__area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie} margin={{ top: 24, right: 40, bottom: 4, left: 40 }}>
          <XAxis
            dataKey="semanaInicio"
            tickFormatter={formatarSemana}
            tick={{ fill: "var(--lastro-txt-3)", fontSize: "var(--lastro-papel-rotulo)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--lastro-linha)" }}
            interval="preserveStartEnd"
          />
          {!melhorMarcaEhExtremo && (
            <ReferenceLine
              y={melhorMarca}
              stroke="var(--lastro-linha)"
              strokeDasharray="2 3"
              label={{
                value: `melhor marca: ${formatarKg(melhorMarca)}`,
                position: "insideTopRight",
                fill: "var(--lastro-txt-3)",
                fontSize: "var(--lastro-papel-rotulo)",
              }}
            />
          )}
          <Line
            dataKey="valorProgressao"
            stroke="var(--lastro-alta)"
            strokeWidth={2}
            connectNulls={false}
            dot={pontoInterativo("var(--lastro-alta)", false, setIndiceAtivo)}
            isAnimationActive={false}
            label={RotuloExtremos}
          />
          <Line
            dataKey="valorPlato"
            stroke="var(--lastro-plato)"
            strokeWidth={2}
            strokeDasharray="6 5"
            connectNulls={false}
            dot={pontoInterativo("var(--lastro-plato)", false, setIndiceAtivo)}
            isAnimationActive={false}
            label={RotuloExtremos}
          />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {indiceAtivo !== null && pontos[indiceAtivo]?.e1rm !== undefined && (
        <p aria-live="polite" className="grafico-progressao__leitura-ativa">
          Semana de {formatarSemana(pontos[indiceAtivo].semanaInicio)}:{" "}
          {formatarKg(pontos[indiceAtivo].e1rm!)}
        </p>
      )}

      <ul className="so-leitor-de-tela">
        {comDado.map((p) => (
          <li key={p.semanaInicio}>
            {painel.exercicio.nome} — semana de {formatarSemana(p.semanaInicio)}: e1RM{" "}
            {formatarKg(p.e1rm!)}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function GraficoProgressao({
  onStatus,
  ocultarQuandoVazio,
}: {
  /** Avisa o pai se há painel pra mostrar, assim que a busca resolve —
   * usado pra combinar o aviso "sem dado" com o da Análise Semanal
   * (evita dois avisos empilhados dizendo a mesma coisa, achado do dono
   * 2026-08-14). */
  onStatus?: (temPainel: boolean) => void;
  /** Quando true e não há painel, não renderiza o próprio texto de vazio
   * — o pai já está mostrando um aviso combinado. */
  ocultarQuandoVazio?: boolean;
}) {
  const [paineis, setPaineis] = useState<PainelProgressao[] | undefined>(undefined);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    fetch("/api/progressao")
      .then((resposta) => {
        if (!resposta.ok) throw new Error("falha");
        return resposta.json();
      })
      .then((json) => {
        const dados = json as PainelProgressao[];
        setPaineis(dados);
        setErro(false);
        onStatus?.(dados.length > 0);
      })
      .catch(() => setErro(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (erro) {
    return (
      <p className="grafico-progressao__vazio">
        Não foi possível carregar o gráfico de progressão agora.
      </p>
    );
  }

  // Esqueleto com a FORMA do que está vindo — título de seção real, card
  // real, e a área do desenho na mesma altura do gráfico pronto. O bloco
  // chapado de antes lia como caixa vazia/quebrada, não como carregando
  // (achado do teste no aparelho, 2026-08-17: "abre com uma aba em branco
  // e logo depois entra a tela preenchida").
  if (paineis === undefined) {
    return (
      <div>
        <h2 className="doc__secao">Progressão</h2>
        <section
          className="grafico-progressao"
          aria-busy="true"
          aria-label="Carregando progressão"
        >
          <div className="esqueleto esqueleto--curto" />
          <div className="grafico-progressao__area grafico-progressao__area--esqueleto" />
        </section>
      </div>
    );
  }

  if (paineis.length === 0) {
    if (ocultarQuandoVazio) return null;
    return (
      <p className="grafico-progressao__vazio">
        Ainda não há sessões suficientes de nenhum exercício pra desenhar progressão —
        registre pelo menos 2 treinos com o mesmo exercício.
      </p>
    );
  }

  return (
    <div>
      <h2 className="doc__secao">Progressão</h2>
      {paineis.map((painel) => (
        <section
          className="grafico-progressao"
          key={painel.exercicio.id}
          aria-label={`Progressão de ${painel.exercicio.nome}`}
        >
          <h3 className="grupo__nome">{painel.exercicio.nome}</h3>
          <PainelConteudo painel={painel} />
        </section>
      ))}
    </div>
  );
}
