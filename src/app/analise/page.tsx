"use client";

// lastro · SDD.md §7.1 — tela da Análise Semanal: lista as 5 perguntas
// padrão como botões, chama POST /api/analise ao escolher uma, mostra
// carregamento (chamada real à Gemini, pode levar alguns segundos) e então
// o parecer.
//
// FORA desta tarefa (SDD §7.2, §8): gráficos, histórico de pareceres,
// compartilhar/exportar, gate visual, e a regra de liberação semanal do
// botão — o botão fica sempre disponível, sem bloqueio de calendário.
import { useState } from "react";
import { PERGUNTAS, type NumeroPergunta } from "@/app/api/analise/perguntas";
import Parecer from "@/components/parecer";
import AbaInferior from "@/components/aba-inferior";
import GraficoProgressao from "@/components/grafico-progressao";

type Resultado = {
  parecer: string;
  avisoFalhaInterpretativa?: boolean;
};

export default function PaginaAnalise() {
  const [carregando, setCarregando] = useState<NumeroPergunta | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // A pergunta escolhida é o TÍTULO do documento emitido (DESIGN.md
  // §3.6.2). Guardada à parte de `carregando`, que zera ao terminar.
  const [perguntaEmitida, setPerguntaEmitida] = useState<NumeroPergunta | null>(
    null,
  );

  async function perguntar(numero: NumeroPergunta) {
    setCarregando(numero);
    setPerguntaEmitida(numero);
    setErro(null);
    setResultado(null);

    try {
      const resposta = await fetch("/api/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: numero }),
      });

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          setErro(`Falha ao gerar o parecer (erro ${resposta.status}).`);
        }
        return;
      }

      const dados = (await resposta.json()) as Resultado;
      setResultado(dados);
    } catch {
      setErro("Falha de rede ao gerar o parecer. Tente novamente.");
    } finally {
      setCarregando(null);
    }
  }

  return (
    <main className="tela">
      <header className="barra-topo">
        <p className="barra-topo__contexto">Análise semanal</p>
        <h1 className="barra-topo__titulo">Semana fechada</h1>
      </header>

      <div className="corpo corpo--com-nav">
        <GraficoProgressao />

        <h2 className="doc__secao">Escolha a pergunta</h2>
        <ul className="perguntas">
          {(Object.keys(PERGUNTAS) as unknown as NumeroPergunta[]).map((numero) => (
            <li key={numero}>
              <button
                type="button"
                className="pergunta"
                onClick={() => perguntar(Number(numero) as NumeroPergunta)}
                disabled={carregando !== null}
              >
                {PERGUNTAS[Number(numero) as NumeroPergunta]}
              </button>
            </li>
          ))}
        </ul>

        {/* Estado "gerando" (DESIGN.md §3.6.5): esqueleto na altura das
            linhas que virão. Sem reticências pulsantes, sem spinner, sem
            texto letra a letra — qualquer um dos três reprova o gate. */}
        {carregando !== null && (
          <section className="doc" aria-live="polite">
            <header className="doc__emissao">
              <p className="doc__selo">Parecer em emissão</p>
              <h2 className="doc__pergunta">{PERGUNTAS[carregando]}</h2>
            </header>
            <p className="doc__secao">escrevendo a leitura</p>
            <div className="esqueleto" />
            <div className="esqueleto" />
            <div className="esqueleto esqueleto--curto" />
          </section>
        )}

        {/* A prosa é o que falha aqui; nenhum número se perde junto, porque
            a conta é local e não dependia da rede (DESIGN.md §3.6.5). */}
        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        {resultado && (
          <Parecer
            pergunta={perguntaEmitida ? PERGUNTAS[perguntaEmitida] : null}
            texto={resultado.parecer}
            avisoFalhaInterpretativa={resultado.avisoFalhaInterpretativa}
          />
        )}
      </div>

      <AbaInferior ativa="analise" />
    </main>
  );
}
