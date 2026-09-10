"use client";

// lastro · SDD.md §7.1, §11.4 — tela da Análise Semanal: lista as 5
// perguntas padrão como botões, dispara POST /api/analise ao escolher
// uma. A rota devolve controle em ~1s (202, geração roda em segundo
// plano via after()) — esta tela NUNCA mostra o parecer pronto; ele
// pousa como rascunho em "Pareceres salvos" (/ajustes/relatorios,
// pareceres-salvos.tsx), pra a pessoa confirmar ou descartar.
//
// Extraído de `app/analise/page.tsx` (PROGRESS.md pendência 4): a barra de
// topo agora precisa buscar o perfil no servidor (`cookies()`), e um Client
// Component não pode importar Server Component diretamente — só recebê-lo
// como children/prop do pai. `page.tsx` virou Server Component; esta parte
// interativa (estado de pergunta) continua client.
import { useState } from "react";
import {
  perguntasDoIdioma,
  PERGUNTA_PRIMARIA,
  type NumeroPergunta,
} from "@/app/api/analise/perguntas";
import { MINIMO_SEMANAS_PARECER, MINIMO_SESSOES_TENDENCIA } from "@/lib/analise/limiares";
import type { Idioma } from "@/lib/dados/idioma";
import type { GrupoComRecencia } from "@/lib/analise/recencia";
import type { SinalDeload } from "@/lib/analise/alerta-deload";
import GraficoProgressao from "@/components/grafico-progressao";
import GruposSemEstimulo from "@/components/grupos-sem-estimulo";
import AlertaDeload from "@/components/alerta-deload";
import { t } from "@/lib/texto/i18n";

export default function AnaliseInterativa({
  semanasFechadasComTreino,
  gruposSemEstimulo,
  sinalDeload,
  idioma,
  rascunhoInicial,
}: {
  semanasFechadasComTreino: number;
  gruposSemEstimulo: GrupoComRecencia[];
  sinalDeload: SinalDeload | null;
  idioma: Idioma;
  /** Rascunho já em geração ao carregar a tela — trava o botão mesmo sem
   * clique nesta sessão (SDD.md §11.4: sobrevive a trocar de tela). */
  rascunhoInicial: { id: string; perguntaTexto: string } | null;
}) {
  const PERGUNTAS = perguntasDoIdioma(idioma);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [emAndamento, setEmAndamento] = useState<{ perguntaTexto: string } | null>(
    rascunhoInicial ? { perguntaTexto: rascunhoInicial.perguntaTexto } : null,
  );

  async function perguntar(numero: NumeroPergunta) {
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: numero }),
      });

      if (resposta.status === 401) {
        setErro(t("Sessão expirada. Faça login novamente.", idioma));
        return;
      }
      if (resposta.status === 409) {
        setErro(t("Já existe uma análise em andamento. Aguarde ela terminar.", idioma));
        setEmAndamento({ perguntaTexto: t("Análise em andamento", idioma) });
        return;
      }
      // Teto diário de gerações (`TETO_DIARIO.parecer`, contado na tabela
      // `uso_ia` desde a migration 0020): a
      // cota da Gemini é compartilhada com o Coach 24h, então o limite
      // existe pra uma tarde de curiosidade não derrubar o chat junto.
      // Mensagem específica, não um "erro 429" cru — o dono não fez nada
      // errado, só chegou ao fim da cota do dia.
      if (resposta.status === 429) {
        const corpo = (await resposta.json().catch(() => null)) as
          | { limite?: number }
          | null;
        setErro(
          `${t("Você já gerou", idioma)} ${corpo?.limite ?? ""} ${t(
            "análises hoje — o limite diário existe para não esgotar a cota que o Coach também usa. Amanhã libera.",
            idioma,
          )}`.replace(/\s+/g, " "),
        );
        return;
      }
      if (!resposta.ok) {
        setErro(`${t("Falha ao gerar o parecer (erro", idioma)} ${resposta.status}).`);
        return;
      }

      setEmAndamento({ perguntaTexto: PERGUNTAS[numero] });
    } catch {
      setErro(t("Falha de rede ao gerar o parecer. Tente novamente.", idioma));
    } finally {
      setEnviando(false);
    }
  }

  // null = ainda não sabemos (busca do gráfico em voo). Só usado pra decidir
  // se o aviso de "sem dado" da Análise Semanal se combina com o do
  // gráfico ou fica sozinho — nunca bloqueia nada além do texto do aviso.
  const [graficoTemPainel, setGraficoTemPainel] = useState<boolean | null>(null);

  const dadosSuficientes = semanasFechadasComTreino >= MINIMO_SEMANAS_PARECER;
  const inativo = !dadosSuficientes || enviando || emAndamento !== null;
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

      {/* DOIS requisitos, DUAS frases — e cada uma diz de que coisa fala.
          Até 2026-09-10 os dois vinham grudados num parágrafo só, sob o
          título "Análise semanal": "...pelo menos 2 semanas do mesmo
          exercício... São necessárias 3 para calcular a análise semanal."
          Dois números diferentes, sobre coisas diferentes, lidos como
          contradição — e era a primeira coisa que uma conta nova via aqui
          (achado da varredura j4). Pior: o "2" era de SESSÕES, não de
          semanas, então a frase também errava a unidade. */}
      {!dadosSuficientes && (
        <div className="vazio" aria-live="polite">
          {graficoTemPainel === false && (
            <p>
              {t("O gráfico de progressão precisa de", idioma)}{" "}
              {MINIMO_SESSOES_TENDENCIA}{" "}
              {t("treinos do mesmo exercício.", idioma)}
            </p>
          )}
          <p>
            {t("A análise semanal precisa de", idioma)} {MINIMO_SEMANAS_PARECER}{" "}
            {t("semanas fechadas — você tem", idioma)} {semanasFechadasComTreino}.
          </p>
        </div>
      )}

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

      {/* Estado "gerando" (DESIGN.md §3.6.5): mesmo esqueleto de antes, mas
          agora fica até a pessoa sair da tela — não vira <Parecer> aqui
          (SDD.md §11.4). */}
      {emAndamento && (
        <section className="doc" aria-live="polite">
          <header className="doc__emissao">
            <p className="doc__selo">{t("Parecer em emissão", idioma)}</p>
            <h2 className="doc__pergunta">{emAndamento.perguntaTexto}</h2>
          </header>
          <p className="doc__secao">{t("escrevendo a leitura", idioma)}</p>
          <div className="esqueleto" />
          <div className="esqueleto" />
          <div className="esqueleto esqueleto--curto" />
          <p className="vazio">{t("Confira em Ajustes > Relatórios em instantes.", idioma)}</p>
        </section>
      )}

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
