"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LIMITE_PERGUNTA } from "@/app/api/coach/prompt";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

type Fala = { de: "dono" | "coach"; texto: string };

/**
 * Sugestões da tela — o TEXTO em si é enviado como pergunta ao clicar
 * (`enviarPergunta(sugestao)`), não é só rótulo. O Coach (`/api/coach`)
 * continua respondendo em PT-BR (fora do escopo desta etapa — feature
 * separada da Análise Semanal, ver DECISIONS.md 2026-08-24 (5)), então
 * fica em PT-BR de propósito aqui: traduzir só o botão criaria um chat
 * onde a pessoa lê a pergunta em inglês no botão e vê ela mesma aparecer
 * em português no balão depois de clicar.
 */
const SUGESTOES = [
  "Como foi meu volume de treino nesta semana?",
  "Qual grupo muscular estou treinando com menor frequência?",
  "Devo aumentar a carga ou as repetições no meu próximo treino?",
];

export default function CoachInterativo({ idioma }: { idioma: Idioma }) {
  const [falas, setFalas] = useState<Fala[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimDaConversa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [falas, carregando]);

  async function enviarPergunta(texto: string) {
    const textoLimpo = texto.trim();
    if (!textoLimpo || carregando) return;

    setFalas((atual) => [...atual, { de: "dono", texto: textoLimpo }]);
    setPergunta("");
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: textoLimpo }),
      });

      if (!resposta.ok) {
        const dados = (await resposta.json().catch(() => null)) as
          | { erro?: string }
          | null;
        setErro(
          resposta.status === 401
            ? t("Sessão expirada. Faça login novamente.", idioma)
            : (dados?.erro ?? t("Falha ao consultar o coach.", idioma)),
        );
        return;
      }

      const dados = (await resposta.json()) as { resposta: string };
      setFalas((atual) => [...atual, { de: "coach", texto: dados.resposta }]);
    } catch {
      setErro(t("Falha de rede. Tente de novo.", idioma));
    } finally {
      setCarregando(false);
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviarPergunta(pergunta);
  }

  return (
    <>
      <div className="corpo corpo--com-nav conversa" aria-live="polite">
        {falas.length === 0 && (
          <div className="coach-boas-vindas">
            <div className="coach-avatar-badge">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="var(--lastro-ouro)">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <h3 className="coach-boas-vindas__titulo">{t("Assistente de Treino 24h", idioma)}</h3>
            <p className="coach-boas-vindas__desc">
              {t("Tire dúvidas sobre periodização, fadiga e progressão com base nas suas métricas reais.", idioma)}
            </p>

            <div className="coach-sugestoes">
              <span className="coach-sugestoes__rotulo">{t("Sugestões de perguntas:", idioma)}</span>
              {SUGESTOES.map((sugestao, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-sugestao"
                  onClick={() => enviarPergunta(sugestao)}
                  disabled={carregando}
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        )}

        {falas.map((fala, indice) => (
          <div
            className={fala.de === "dono" ? "balao balao--minha" : "balao balao--dele"}
            key={indice}
          >
            {fala.de === "coach" && (
              <span className="balao__quem">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--lastro-ouro)" style={{ marginRight: 4 }}>
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                {t("Coach IA", idioma)}
              </span>
            )}
            <p className="balao__texto">{fala.texto}</p>
          </div>
        ))}

        {carregando && (
          <div className="balao balao--dele balao--pensando">
            <span className="balao__quem">{t("Coach IA", idioma)}</span>
            <p>{t("Analisando seus dados…", idioma)}</p>
          </div>
        )}

        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}

        <div ref={fimDaConversa} />
      </div>

      <form className="barra-conversa" onSubmit={aoEnviar}>
        <input
          type="text"
          placeholder={t("Pergunte ao coach…", idioma)}
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          maxLength={LIMITE_PERGUNTA}
          disabled={carregando}
          className="barra-conversa__input"
        />
        <button
          type="submit"
          disabled={carregando || !pergunta.trim()}
          className="barra-conversa__botao"
          aria-label={t("Enviar pergunta", idioma)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </>
  );
}
