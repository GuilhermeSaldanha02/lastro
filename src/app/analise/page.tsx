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

type Resultado = {
  parecer: string;
  avisoFalhaInterpretativa?: boolean;
};

export default function PaginaAnalise() {
  const [carregando, setCarregando] = useState<NumeroPergunta | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function perguntar(numero: NumeroPergunta) {
    setCarregando(numero);
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
    <main>
      <h1>Análise Semanal</h1>

      <ul>
        {(Object.keys(PERGUNTAS) as unknown as NumeroPergunta[]).map((numero) => (
          <li key={numero}>
            <button
              type="button"
              onClick={() => perguntar(Number(numero) as NumeroPergunta)}
              disabled={carregando !== null}
            >
              {PERGUNTAS[Number(numero) as NumeroPergunta]}
            </button>
          </li>
        ))}
      </ul>

      {carregando !== null && <p>Gerando parecer, pode levar alguns segundos…</p>}

      {erro && <p role="alert">{erro}</p>}

      {resultado && (
        <Parecer
          texto={resultado.parecer}
          avisoFalhaInterpretativa={resultado.avisoFalhaInterpretativa}
        />
      )}
    </main>
  );
}
