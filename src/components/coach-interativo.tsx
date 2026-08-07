"use client";

// lastro · PRD §4.4 — o coach 24h.
//
// ESTA É A ÚNICA TELA DO APP ONDE SE CONVERSA, e por isso é a única onde
// balão, rabicho, alternância de lado e caixa de digitação são CORRETOS
// (DESIGN.md §5). O oposto vale no parecer: lá, qualquer um desses
// elementos reprova o gate. A separação entre as duas telas é proposital —
// é o que impede o produto de virar "chatbot com gráfico colado".
//
// O histórico vive só nesta sessão: não há persistência de conversa no
// escopo (PRD §5). Recarregar limpa, e isso é intencional.
//
// Extraído de `app/coach/page.tsx` (PROGRESS.md pendência 4) pelo mesmo
// motivo do `analise-interativa.tsx`: a barra de topo precisa do perfil
// buscado no servidor, e Client Component não importa Server Component
// diretamente.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LIMITE_PERGUNTA } from "@/app/api/coach/prompt";

type Fala = { de: "dono" | "coach"; texto: string };

export default function CoachInterativo() {
  const [falas, setFalas] = useState<Fala[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimDaConversa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [falas, carregando]);

  async function perguntar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const texto = pergunta.trim();
    if (!texto || carregando) return;

    setFalas((atual) => [...atual, { de: "dono", texto }]);
    setPergunta("");
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto }),
      });

      if (!resposta.ok) {
        const dados = (await resposta.json().catch(() => null)) as
          | { erro?: string }
          | null;
        setErro(
          resposta.status === 401
            ? "Sessão expirada. Faça login novamente."
            : (dados?.erro ?? "Falha ao consultar o coach."),
        );
        return;
      }

      const dados = (await resposta.json()) as { resposta: string };
      setFalas((atual) => [...atual, { de: "coach", texto: dados.resposta }]);
    } catch {
      setErro("Falha de rede. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <div className="corpo corpo--com-nav conversa" aria-live="polite">
        {falas.length === 0 && (
          <p className="vazio">
            Pergunte o que quiser sobre treino. Execução de exercício fica no
            catálogo — é escrita por pessoa, não por IA.
          </p>
        )}

        {falas.map((fala, indice) => (
          <div
            className={fala.de === "dono" ? "balao balao--minha" : "balao balao--dele"}
            key={indice}
          >
            {fala.de === "coach" && <span className="balao__quem">Coach</span>}
            {fala.texto}
          </div>
        ))}

        {/* Sem reticências pulsantes: um rótulo em estado, como no resto do app. */}
        {carregando && (
          <p className="balao balao--dele balao--pensando">escrevendo…</p>
        )}

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        <div ref={fimDaConversa} />
      </div>

      <form className="campo-conversa" onSubmit={perguntar}>
        <label className="so-leitor-de-tela" htmlFor="pergunta">
          Perguntar ao coach
        </label>
        <input
          id="pergunta"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Perguntar…"
          maxLength={LIMITE_PERGUNTA}
          autoComplete="off"
        />
        <button
          type="submit"
          className="enviar"
          disabled={carregando || pergunta.trim().length === 0}
          aria-label="Enviar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </>
  );
}
