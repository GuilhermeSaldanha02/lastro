"use client";

// lastro · SDD.md §7.1 — tela da Análise Semanal: lista as 5 perguntas
// padrão como botões, chama POST /api/analise ao escolher uma, mostra
// carregamento (chamada real à Gemini, pode levar alguns segundos) e então
// o parecer.
//
// Extraído de `app/analise/page.tsx` (PROGRESS.md pendência 4): a barra de
// topo agora precisa buscar o perfil no servidor (`cookies()`), e um Client
// Component não pode importar Server Component diretamente — só recebê-lo
// como children/prop do pai. `page.tsx` virou Server Component; esta parte
// interativa (estado de pergunta/resultado) continua client.
//
// FORA desta tarefa (SDD §7.2, §8): gráficos, histórico de pareceres,
// compartilhar/exportar, gate visual, e a regra de liberação semanal do
// botão — o botão fica sempre disponível, sem bloqueio de calendário.
import { useState } from "react";
import {
  perguntasDoIdioma,
  PERGUNTA_PRIMARIA,
  type NumeroPergunta,
} from "@/app/api/analise/perguntas";
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";
import { MINIMO_SEMANAS_PARECER } from "@/lib/analise/limiares";
import type { Idioma } from "@/lib/dados/idioma";
import type { GrupoComRecencia } from "@/lib/analise/recencia";
import type { SinalDeload } from "@/lib/analise/alerta-deload";
import Parecer from "@/components/parecer";
import GraficoProgressao from "@/components/grafico-progressao";
import GruposSemEstimulo from "@/components/grupos-sem-estimulo";
import AlertaDeload from "@/components/alerta-deload";
import { t } from "@/lib/texto/i18n";
import { salvarParecer } from "@/lib/dados/parecer";

type Resultado = {
  parecer: string;
  avisoFalhaInterpretativa?: boolean;
  evidencia: EvidenciaParaTela;
};

export default function AnaliseInterativa({
  semanasFechadasComTreino,
  gruposSemEstimulo,
  sinalDeload,
  idioma,
}: {
  semanasFechadasComTreino: number;
  gruposSemEstimulo: GrupoComRecencia[];
  sinalDeload: SinalDeload | null;
  idioma: Idioma;
}) {
  const PERGUNTAS = perguntasDoIdioma(idioma);
  const [carregando, setCarregando] = useState<NumeroPergunta | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // A pergunta escolhida é o TÍTULO do documento emitido (DESIGN.md
  // §3.6.2). Guardada à parte de `carregando`, que zera ao terminar.
  const [perguntaEmitida, setPerguntaEmitida] = useState<NumeroPergunta | null>(
    null,
  );

  const [statusSalvar, setStatusSalvar] = useState<
    "ocioso" | "salvando" | "salvo" | "erro"
  >("ocioso");

  async function salvar() {
    if (!resultado || perguntaEmitida === null) return;
    if (statusSalvar === "salvando" || statusSalvar === "salvo") return;
    setStatusSalvar("salvando");
    try {
      await salvarParecer({
        pergunta: perguntaEmitida,
        perguntaTexto: PERGUNTAS[perguntaEmitida],
        texto: resultado.parecer,
        avisoFalhaInterpretativa: resultado.avisoFalhaInterpretativa ?? false,
        evidencia: resultado.evidencia,
        idioma,
      });
      setStatusSalvar("salvo");
    } catch {
      setStatusSalvar("erro");
    }
  }

  async function perguntar(numero: NumeroPergunta) {
    setCarregando(numero);
    setPerguntaEmitida(numero);
    setErro(null);
    setResultado(null);
    setStatusSalvar("ocioso");

    try {
      const resposta = await fetch("/api/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: numero }),
      });

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setErro(t("Sessão expirada. Faça login novamente.", idioma));
        } else {
          setErro(`${t("Falha ao gerar o parecer (erro", idioma)} ${resposta.status}).`);
        }
        return;
      }

      const dados = (await resposta.json()) as Resultado;
      setResultado(dados);
    } catch {
      setErro(t("Falha de rede ao gerar o parecer. Tente novamente.", idioma));
    } finally {
      setCarregando(null);
    }
  }

  // null = ainda não sabemos (busca do gráfico em voo). Só usado pra decidir
  // se o aviso de "sem dado" da Análise Semanal se combina com o do
  // gráfico ou fica sozinho — nunca bloqueia nada além do texto do aviso.
  const [graficoTemPainel, setGraficoTemPainel] = useState<boolean | null>(null);

  const dadosSuficientes = semanasFechadasComTreino >= MINIMO_SEMANAS_PARECER;
  // Inativo cobre as duas regras — dados insuficientes (B1) e uma pergunta
  // já em voo — sem confundir uma com a outra (nota 3 de B1: isto não
  // reabre a tarefa 1.0d, que é sobre cadência semanal, não sobre
  // suficiência de dados).
  const inativo = !dadosSuficientes || carregando !== null;
  const secundarias = (Object.keys(PERGUNTAS) as unknown as NumeroPergunta[])
    .map(Number)
    .filter((numero) => numero !== PERGUNTA_PRIMARIA) as NumeroPergunta[];

  function perguntarSeAtivo(numero: NumeroPergunta) {
    if (inativo) return;
    perguntar(numero);
  }

  return (
    <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
      <AlertaDeload sinal={sinalDeload} idioma={idioma} />

      <GruposSemEstimulo grupos={gruposSemEstimulo} idioma={idioma} />

      <GraficoProgressao
        onStatus={(temPainel) => setGraficoTemPainel(temPainel)}
        ocultarQuandoVazio={!dadosSuficientes}
        idioma={idioma}
      />

      <h2 className="doc__secao">{t("Análise semanal", idioma)}</h2>

      {!dadosSuficientes && (
        // Estado "sem dados suficientes" (DESIGN.md §3.6.5): diz o que
        // falta e QUANTO falta, em número — nunca deixa o LLM ser quem
        // avisa isso. Neutro (--lastro-txt-2), nunca --lastro-erro: não
        // é erro, é começo.
        //
        // Combinado com o aviso do gráfico quando os dois estão vazios
        // (achado do dono, 2026-08-14: dois avisos de "ainda não há dado"
        // empilhados liam repetitivo) — um parágrafo só, não dois.
        <p className="vazio" aria-live="polite">
          {graficoTemPainel === false && (
            <>
              {t("Ainda não há pelo menos 2 semanas do mesmo exercício pra desenhar progressão.", idioma)}{" "}
            </>
          )}
          {t("Você tem", idioma)} {semanasFechadasComTreino}{" "}
          {t(semanasFechadasComTreino === 1 ? "semana fechada" : "semanas fechadas", idioma)}.{" "}
          {t("São necessárias", idioma)} {MINIMO_SEMANAS_PARECER} {t("para calcular a análise semanal.", idioma)}
        </p>
      )}

      {/* Botão + 5 cards de pergunta convivem sempre visíveis, mesma regra
          de disponibilidade nos dois (B1, 2026-08-13): inativos por
          aria-disabled — nunca `disabled` puro, senão some da ordem de
          tabulação — até 3 semanas fecharem. O botão dispara a mesma
          pergunta que o card primário: um só handler, duas entradas. */}
      <button
        type="button"
        className="botao-primario botao-solicitar-analise"
        aria-disabled={inativo}
        onClick={() => perguntarSeAtivo(PERGUNTA_PRIMARIA)}
      >
        {t("Solicitar Análise", idioma)}
      </button>

      <ul className="perguntas">
        <li>
          <button
            type="button"
            className="pergunta pergunta--primaria"
            aria-disabled={inativo}
            onClick={() => perguntarSeAtivo(PERGUNTA_PRIMARIA)}
          >
            <span>{PERGUNTAS[PERGUNTA_PRIMARIA]}</span>
            <span style={{ color: "var(--lastro-ouro)", fontWeight: "bold" }}>•</span>
          </button>
        </li>
        {secundarias.map((numero) => (
          <li key={numero}>
            <button
              type="button"
              className="pergunta pergunta--secundaria"
              aria-disabled={inativo}
              onClick={() => perguntarSeAtivo(numero)}
            >
              <span>{PERGUNTAS[numero]}</span>
              <span style={{ color: "var(--lastro-txt-3)" }}>›</span>
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
            <p className="doc__selo">{t("Parecer em emissão", idioma)}</p>
            <h2 className="doc__pergunta">{PERGUNTAS[carregando]}</h2>
          </header>
          <p className="doc__secao">{t("escrevendo a leitura", idioma)}</p>
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
        <>
          <Parecer
            pergunta={perguntaEmitida ? PERGUNTAS[perguntaEmitida] : null}
            texto={resultado.parecer}
            avisoFalhaInterpretativa={resultado.avisoFalhaInterpretativa}
            evidencia={resultado.evidencia}
            idioma={idioma}
          />
          <button
            type="button"
            className="botao-secundario"
            onClick={salvar}
            aria-disabled={statusSalvar === "salvando" || statusSalvar === "salvo"}
          >
            {statusSalvar === "salvando" && t("Salvando…", idioma)}
            {statusSalvar === "salvo" && `${t("Salvo", idioma)} ✓`}
            {(statusSalvar === "ocioso" || statusSalvar === "erro") &&
              t("Salvar este parecer", idioma)}
          </button>
          {statusSalvar === "erro" && (
            <p className="aviso-erro" role="alert">
              {t("Não foi possível salvar. Tente de novo.", idioma)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
