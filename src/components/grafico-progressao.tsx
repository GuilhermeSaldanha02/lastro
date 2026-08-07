// lastro · DESIGN.md §3.7 — gráfico de progressão, companhia visual da
// Análise Semanal. A pergunta que ele responde não é "quanto?", é "está
// subindo?" — o eixo é recurso de conferência, nunca via principal.
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import type { DadosProgressao } from "@/lib/dados/progressao";

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

/** Ponto interativo: alvo de toque/foco de --lastro-alvo-min mesmo com marcador pequeno (§3.7 item 5). */
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

function GraficoConteudo({ dados }: { dados: DadosProgressao }) {
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);

  const comDado = dados.pontos.filter((p) => p.e1rm !== undefined);
  const suficiente = comDado.length >= 2;

  if (!suficiente) {
    return (
      <p className="grafico-progressao__vazio">
        Ainda não há pelo menos 2 semanas com sessão de {dados.exercicio.nome}{" "}
        elegível para e1RM — a progressão aparece a partir da 2ª.
      </p>
    );
  }

  const primeiro = comDado[0];
  const ultimo = comDado[comDado.length - 1];
  const deltaPct = ((ultimo.e1rm! - primeiro.e1rm!) / primeiro.e1rm!) * 100;
  const subindo = deltaPct > 0;
  const melhorMarca = Math.max(...comDado.map((p) => p.e1rm!));

  const indicePrimeiro = dados.pontos.indexOf(primeiro);
  const indiceUltimo = dados.pontos.indexOf(ultimo);

  const inicioPlato = dados.plato
    ? dados.pontos.findIndex((p) => p.semanaInicio === dados.plato!.semanaInicio)
    : -1;

  const serie: PontoGrafico[] = dados.pontos.map((p, i) => {
    const noPlato = inicioPlato >= 0 && i >= inicioPlato;
    const naJuncao = inicioPlato >= 0 && i === inicioPlato;
    return {
      semanaInicio: p.semanaInicio,
      valorProgressao: !noPlato || naJuncao ? p.e1rm : undefined,
      valorPlato: noPlato ? p.e1rm : undefined,
    };
  });

  const rotularExtremos = (indiceAlvo: number) =>
    function RotuloExtremo(props: {
      x?: number | string;
      y?: number | string;
      index?: number;
      value?: unknown;
    }) {
      if (props.index !== indiceAlvo || typeof props.value !== "number") return null;
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
    };

  return (
    <>
      <p className="grafico-progressao__conclusao">
        {dados.exercicio.nome}: e1RM {subindo ? "subiu" : deltaPct < 0 ? "caiu" : "ficou estável"}{" "}
        <strong>{Math.abs(deltaPct).toFixed(1)}%</strong> entre {formatarSemana(primeiro.semanaInicio)} e{" "}
        {formatarSemana(ultimo.semanaInicio)}.
        {dados.plato && (
          <span className="grafico-progressao__plato-nota">
            {" "}
            Platô há {dados.plato.semanas} semanas.
          </span>
        )}
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={serie} margin={{ top: 24, right: 12, bottom: 4, left: 12 }}>
          <XAxis
            dataKey="semanaInicio"
            tickFormatter={formatarSemana}
            tick={{ fill: "var(--lastro-txt-3)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--lastro-linha)" }}
            interval="preserveStartEnd"
          />
          <ReferenceLine
            y={melhorMarca}
            stroke="var(--lastro-linha)"
            strokeDasharray="2 3"
            label={{
              value: `melhor marca: ${formatarKg(melhorMarca)}`,
              position: "insideTopRight",
              fill: "var(--lastro-txt-3)",
              fontSize: 11,
            }}
          />
          <Line
            dataKey="valorProgressao"
            stroke="var(--lastro-alta)"
            strokeWidth={2}
            connectNulls={false}
            dot={pontoInterativo("var(--lastro-alta)", false, setIndiceAtivo)}
            isAnimationActive={false}
            label={rotularExtremos(indicePrimeiro)}
          />
          <Line
            dataKey="valorPlato"
            stroke="var(--lastro-plato)"
            strokeWidth={2}
            strokeDasharray="6 5"
            connectNulls={false}
            dot={pontoInterativo("var(--lastro-plato)", false, setIndiceAtivo)}
            isAnimationActive={false}
            label={rotularExtremos(indiceUltimo)}
          />
        </LineChart>
      </ResponsiveContainer>

      {indiceAtivo !== null && dados.pontos[indiceAtivo]?.e1rm !== undefined && (
        <p aria-live="polite" className="grafico-progressao__leitura-ativa">
          Semana de {formatarSemana(dados.pontos[indiceAtivo].semanaInicio)}:{" "}
          {formatarKg(dados.pontos[indiceAtivo].e1rm!)}
        </p>
      )}

      <ul className="so-leitor-de-tela">
        {comDado.map((p) => (
          <li key={p.semanaInicio}>
            Semana de {formatarSemana(p.semanaInicio)}: e1RM {formatarKg(p.e1rm!)}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function GraficoProgressao() {
  const [dados, setDados] = useState<DadosProgressao | null | undefined>(undefined);
  const [erro, setErro] = useState(false);

  const carregar = useCallback((exercicioId?: string) => {
    const url = exercicioId
      ? `/api/progressao?exercicioId=${encodeURIComponent(exercicioId)}`
      : "/api/progressao";
    fetch(url)
      .then((resposta) => {
        if (!resposta.ok) throw new Error("falha");
        return resposta.json();
      })
      .then((json) => {
        setDados(json as DadosProgressao | null);
        setErro(false);
      })
      .catch(() => setErro(true));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) {
    return (
      <p className="grafico-progressao__vazio">
        Não foi possível carregar o gráfico de progressão agora.
      </p>
    );
  }

  if (dados === undefined) {
    return <div className="esqueleto" style={{ height: 200 }} />;
  }

  return (
    <section className="grafico-progressao" aria-label="Gráfico de progressão">
      <div className="grafico-progressao__cabecalho">
        <h2 className="doc__secao">Progressão</h2>
        {dados && dados.opcoes.length > 1 && (
          <select
            className="grafico-progressao__seletor"
            value={dados.exercicio.id}
            onChange={(evento) => carregar(evento.target.value)}
            aria-label="Exercício do gráfico"
          >
            {dados.opcoes.map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {dados === null ? (
        <p className="grafico-progressao__vazio">
          Ainda não há sessões suficientes de nenhum exercício pra desenhar progressão —
          registre pelo menos 2 treinos com o mesmo exercício.
        </p>
      ) : (
        <GraficoConteudo dados={dados} />
      )}
    </section>
  );
}
