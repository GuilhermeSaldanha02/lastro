"use client";

// lastro · AN-08 A1 — o check-in diário na Home: um cartão compacto e a folha
// com as quatro notas (direção C do portão visual de 2026-10-01).
//
// Decisão do dono: a folha SOBE SOZINHA assim que a pessoa abre o app e ainda
// não respondeu o do dia. Respondeu, fechou o app e abriu de novo no mesmo dia:
// não aparece mais (`lib/checkin/abertura.ts`, com os testes).
//
// Tudo é opcional (a Política manda dado de saúde ser opcional): "Agora não"
// fecha sem gravar, e a folha volta na próxima abertura do app enquanto o dia
// não tiver resposta. Gravar vai pela fila offline, como a série: nada espera
// rede, e o servidor faz upsert por (conta, dia).
//
// Este dado NUNCA vai para a IA (`lib/checkin/nao-vai-para-ia.test.ts`).
import { useEffect, useState } from "react";
import Link from "next/link";
import Folha from "./folha";
import { registrarCheckinNaFila } from "@/lib/offline/checkin";
import { CAMPOS_CHECKIN, type CampoCheckin, type NotaCheckin } from "@/lib/checkin/escala";
import { descreverNotaCheckin } from "@/lib/checkin/resumo";
import { compararComMedia, type ComparacaoComMedia } from "@/lib/checkin/media";
import {
  CHAVES_ANTIGAS_GLOBAIS,
  chaveFolhaDispensada,
  chaveFolhaVista,
  chaveRespostaDoDia,
  deveAbrirSozinha,
  lerRespostaGuardada,
  type RespostaGuardada,
} from "@/lib/checkin/abertura";
import type { CheckinDoDia } from "@/lib/dados/checkin";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type Notas = Record<CampoCheckin, NotaCheckin | null>;

const NOTAS: NotaCheckin[] = [1, 2, 3, 4, 5];

/** A2: só o fato, sem juízo (dor "acima" é mais dor; sono "acima" é mais sono). */
const TEXTO_COMPARACAO: Record<ComparacaoComMedia, string> = {
  acima: "acima da sua média",
  abaixo: "abaixo da sua média",
  "na-media": "na sua média",
};

/** Rótulo do campo e as duas pontas da escala (chaves em português; `t()` traduz). */
const CAMPOS: Record<CampoCheckin, { nome: string; baixo: string; alto: string }> = {
  sono: { nome: "Sono", baixo: "Péssimo", alto: "Ótimo" },
  energia: { nome: "Energia", baixo: "Nenhuma", alto: "Muita" },
  dor_muscular: { nome: "Dor muscular", baixo: "Nenhuma", alto: "Muita" },
  estresse: { nome: "Estresse", baixo: "Baixo", alto: "Alto" },
};

function IconeCheckin({ campo }: { campo: CampoCheckin }) {
  return (
    <svg className="checkin-resumo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {campo === "sono" && <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />}
      {campo === "energia" && <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />}
      {campo === "dor_muscular" && <path d="M7 13 5 7l2-3h4l1 3-3 1 2 5c2-3 5-3 7-1 2 2 2 5 0 7-3 3-9 2-13 0l-2-5m8-1 2 2" />}
      {campo === "estresse" && <path d="M9 21v-4H6v-4H3l3-5a7 7 0 0 1 14 1c0 3-2 5-3 7v5M10 8h5m-3-3v6" />}
    </svg>
  );
}

function notasDe(inicial: CheckinDoDia | RespostaGuardada | null): Notas {
  const vazio: Notas = { sono: null, energia: null, dor_muscular: null, estresse: null };
  if (!inicial) return vazio;
  const dor = "dorMuscular" in inicial ? inicial.dorMuscular : inicial.dor_muscular;
  const nota = (v: number | null): NotaCheckin | null => (v === null ? null : (v as NotaCheckin));
  return { sono: nota(inicial.sono), energia: nota(inicial.energia), dor_muscular: nota(dor), estresse: nota(inicial.estresse) };
}

export default function CartaoCheckin({
  hoje,
  usuarioId,
  checkinInicial,
  anteriores = [],
  idioma,
  embutido = false,
}: {
  /** O dia local da pessoa (AAAA-MM-DD), calculado no servidor. */
  hoje: string;
  usuarioId: string;
  /** O check-in de hoje que o servidor já tem, ou `null`. */
  checkinInicial: CheckinDoDia | null;
  /** Check-ins dos dias ANTERIORES a hoje, do mais novo ao mais antigo (A2). */
  anteriores?: CheckinDoDia[];
  idioma: Idioma;
  /** Integra o conteúdo à superfície da aba, sem outro cartão ao redor. */
  embutido?: boolean;
}) {
  const [notas, setNotas] = useState<Notas>(() => notasDe(checkinInicial));
  const [respondido, setRespondido] = useState(checkinInicial !== null);
  const [aberta, setAberta] = useState(false);
  const [pendente, setPendente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Roda uma vez, depois da hidratação: só o navegador sabe o que este aparelho
  // guardou. O estado muda num `.then` (e não no corpo do efeito), como o resto
  // do app faz (`treino-detalhe.tsx`, regra `react-hooks/set-state-in-effect`).
  useEffect(() => {
    try {
      for (const antiga of CHAVES_ANTIGAS_GLOBAIS) window.localStorage.removeItem(antiga);
    } catch {
      // sem armazenamento: nada a limpar
    }
    let guardada: RespostaGuardada | null = null;
    let folhaVistaNoDia: string | null = null;
    let dispensadoNoDia: string | null = null;
    try {
      guardada = lerRespostaGuardada(window.localStorage.getItem(chaveRespostaDoDia(usuarioId)));
      folhaVistaNoDia = window.sessionStorage.getItem(chaveFolhaVista(usuarioId));
      dispensadoNoDia = window.localStorage.getItem(chaveFolhaDispensada(usuarioId));
    } catch {
      // Armazenamento bloqueado (aba privada): sem memória, segue só pelo servidor.
    }
    const noAparelhoHoje = guardada?.dia === hoje ? guardada : null;
    const abrir = deveAbrirSozinha({ hoje, respondidoNoServidor: checkinInicial !== null, guardada, folhaVistaNoDia, dispensadoNoDia });
    if (abrir) {
      try {
        window.sessionStorage.setItem(chaveFolhaVista(usuarioId), hoje);
      } catch {
        // Sem sessionStorage a folha pode subir mais de uma vez; é o custo aceitável.
      }
    }
    void Promise.resolve().then(() => {
      if (checkinInicial === null && noAparelhoHoje) {
        setNotas(notasDe(noAparelhoHoje));
        setRespondido(true);
      }
      if (abrir) setAberta(true);
    });
  }, [hoje, usuarioId, checkinInicial]);

  const respondidas = CAMPOS_CHECKIN.filter((c) => notas[c] !== null).length;

  function escolher(campo: CampoCheckin, nota: NotaCheckin) {
    setNotas((atual) => ({ ...atual, [campo]: atual[campo] === nota ? null : nota }));
  }

  // "Agora não", ✕, Esc e toque fora: um só encerra a subida automática do dia.
  function fechar() {
    setAberta(false);
    setErro(null);
    try {
      window.localStorage.setItem(chaveFolhaDispensada(usuarioId), hoje);
    } catch {
      // sem localStorage a dispensa vale só enquanto a aba durar (sessionStorage)
    }
  }

  async function salvar() {
    if (respondidas === 0 || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const { pendente: ficouNaFila } = await registrarCheckinNaFila({ dia: hoje, ...notas }, usuarioId);
      try {
        window.localStorage.setItem(chaveRespostaDoDia(usuarioId), JSON.stringify({ dia: hoje, ...notas }));
      } catch {
        // Sem localStorage a fila já guarda a resposta; só não lembramos dela na Home.
      }
      setPendente(ficouNaFila);
      setRespondido(true);
      setAberta(false);
    } catch {
      setErro(t("Não foi possível salvar. Tente de novo.", idioma));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className={`checkin-cartao${respondido ? "" : " checkin-cartao--pendente"}${embutido ? " checkin-cartao--embutido" : ""}`} aria-label={t("Check-in de hoje", idioma)}>
        {respondido ? (
          <>
            <div className="checkin-cartao__cabecalho">
              <h2 className="checkin-cartao__titulo">{t("Check-in de hoje", idioma)}</h2>
              <button type="button" className="botao-textual" onClick={() => setAberta(true)}>
                {t("Editar", idioma)}
              </button>
            </div>
            <dl className="checkin-resumo">
              {CAMPOS_CHECKIN.map((campo) => {
                const nota = notas[campo];
                const comparacao = compararComMedia(nota, anteriores.map((d) => (campo === "dor_muscular" ? d.dorMuscular : d[campo])));
                return (
                  <div key={campo} className="checkin-resumo__linha">
                    <dt className="checkin-resumo__campo">
                      <IconeCheckin campo={campo} />
                      <span>{t(CAMPOS[campo].nome, idioma)}</span>
                    </dt>
                    <dd className="checkin-resumo__valor" title={nota === null ? undefined : `${t("nota", idioma)} ${nota} ${t("de 5", idioma)}`}>
                      {t(descreverNotaCheckin(campo, nota), idioma)}
                      {comparacao && <span className="checkin-resumo__media">{t(TEXTO_COMPARACAO[comparacao], idioma)}</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <Link href="/checkin" className="botao-textual">
              {t("Ver últimos 7 dias", idioma)}
            </Link>
            {pendente && <p className="campo__nota">{t("Salvo no aparelho. Sobe quando houver sinal.", idioma)}</p>}
          </>
        ) : (
          <div className="checkin-cartao__convite">
            <div className="checkin-cartao__texto">
              <h2 className="checkin-cartao__titulo">{t("Check-in de hoje", idioma)}</h2>
              <p className="campo__nota">{t("Sono, energia, dor e estresse. Leva uns 20 segundos.", idioma)}</p>
            </div>
            <button type="button" className="checkin-cartao__botao" onClick={() => setAberta(true)}>
              {t("Responder", idioma)}
            </button>
          </div>
        )}
      </section>

      {aberta && (
        <Folha titulo={t("Como você está hoje?", idioma)} idioma={idioma} onFechar={fechar} focarAoAbrir>
          <div className="checkin-folha">
            <p className="campo__nota checkin-folha__contagem">
              {respondidas} {t("de 4", idioma)}
            </p>

            {CAMPOS_CHECKIN.map((campo) => (
              <div key={campo} className="checkin-linha" role="group" aria-label={t(CAMPOS[campo].nome, idioma)}>
                <div className="checkin-linha__topo">
                  <span className="checkin-linha__nome">{t(CAMPOS[campo].nome, idioma)}</span>
                  <span className="checkin-linha__pontas">
                    {t(CAMPOS[campo].baixo, idioma)} · {t(CAMPOS[campo].alto, idioma)}
                  </span>
                </div>
                <div className="checkin-notas">
                  {NOTAS.map((nota) => {
                    const ativa = notas[campo] === nota;
                    return (
                      <button
                        key={nota}
                        type="button"
                        className={ativa ? "checkin-nota checkin-nota--ativa" : "checkin-nota"}
                        aria-pressed={ativa}
                        aria-label={`${t(CAMPOS[campo].nome, idioma)}, ${t("nota", idioma)} ${nota} ${t("de 5", idioma)}`}
                        onClick={() => escolher(campo, nota)}
                      >
                        {nota}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="campo__nota">{t("Todas são opcionais. Só você vê, e o seu personal se você compartilhar.", idioma)}</p>

            {erro && (
              <p className="aviso-erro" role="alert">
                {erro}
              </p>
            )}

            <div className="checkin-folha__acoes">
              <button type="button" className="botao-secundario" onClick={fechar} disabled={enviando}>
                {t("Agora não", idioma)}
              </button>
              <button type="button" className="botao-primario" onClick={salvar} disabled={respondidas === 0 || enviando} aria-busy={enviando}>
                {t("Salvar", idioma)}
              </button>
            </div>
          </div>
        </Folha>
      )}
    </>
  );
}
