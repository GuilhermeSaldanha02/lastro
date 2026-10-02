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
import Folha from "./folha";
import { registrarCheckinNaFila } from "@/lib/offline/checkin";
import { CAMPOS_CHECKIN, type CampoCheckin, type NotaCheckin } from "@/lib/checkin/escala";
import {
  CHAVE_FOLHA_VISTA,
  CHAVE_RESPOSTA_DO_DIA,
  deveAbrirSozinha,
  lerRespostaGuardada,
  type RespostaGuardada,
} from "@/lib/checkin/abertura";
import type { CheckinDoDia } from "@/lib/dados/checkin";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type Notas = Record<CampoCheckin, NotaCheckin | null>;

const NOTAS: NotaCheckin[] = [1, 2, 3, 4, 5];

/** Rótulo do campo e as duas pontas da escala (chaves em português; `t()` traduz). */
const CAMPOS: Record<CampoCheckin, { nome: string; curto: string; baixo: string; alto: string }> = {
  sono: { nome: "Sono", curto: "Sono", baixo: "Péssimo", alto: "Ótimo" },
  energia: { nome: "Energia", curto: "Energia", baixo: "Nenhuma", alto: "Muita" },
  dor_muscular: { nome: "Dor muscular", curto: "Dor", baixo: "Nenhuma", alto: "Muita" },
  estresse: { nome: "Estresse", curto: "Estresse", baixo: "Baixo", alto: "Alto" },
};

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
  idioma,
}: {
  /** O dia local da pessoa (AAAA-MM-DD), calculado no servidor. */
  hoje: string;
  usuarioId: string;
  /** O check-in de hoje que o servidor já tem, ou `null`. */
  checkinInicial: CheckinDoDia | null;
  idioma: Idioma;
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
    let guardada: RespostaGuardada | null = null;
    let folhaVistaNoDia: string | null = null;
    try {
      guardada = lerRespostaGuardada(window.localStorage.getItem(CHAVE_RESPOSTA_DO_DIA));
      folhaVistaNoDia = window.sessionStorage.getItem(CHAVE_FOLHA_VISTA);
    } catch {
      // Armazenamento bloqueado (aba privada): sem memória, segue só pelo servidor.
    }
    const noAparelhoHoje = guardada?.dia === hoje ? guardada : null;
    const abrir = deveAbrirSozinha({ hoje, respondidoNoServidor: checkinInicial !== null, guardada, folhaVistaNoDia });
    if (abrir) {
      try {
        window.sessionStorage.setItem(CHAVE_FOLHA_VISTA, hoje);
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
  }, [hoje, checkinInicial]);

  const respondidas = CAMPOS_CHECKIN.filter((c) => notas[c] !== null).length;

  function escolher(campo: CampoCheckin, nota: NotaCheckin) {
    setNotas((atual) => ({ ...atual, [campo]: atual[campo] === nota ? null : nota }));
  }

  function fechar() {
    setAberta(false);
    setErro(null);
  }

  async function salvar() {
    if (respondidas === 0 || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const { pendente: ficouNaFila } = await registrarCheckinNaFila({ dia: hoje, ...notas }, usuarioId);
      try {
        window.localStorage.setItem(CHAVE_RESPOSTA_DO_DIA, JSON.stringify({ dia: hoje, ...notas }));
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
      <section className={respondido ? "checkin-cartao" : "checkin-cartao checkin-cartao--pendente"} aria-label={t("Check-in de hoje", idioma)}>
        {respondido ? (
          <>
            <div className="checkin-cartao__cabecalho">
              <h2 className="checkin-cartao__titulo">{t("Check-in de hoje", idioma)}</h2>
              <button type="button" className="botao-textual" onClick={() => setAberta(true)}>
                {t("Editar", idioma)}
              </button>
            </div>
            <div className="checkin-barras">
              {CAMPOS_CHECKIN.map((campo) => {
                const nota = notas[campo];
                const nome = t(CAMPOS[campo].curto, idioma);
                return (
                  <div
                    key={campo}
                    className="checkin-barra"
                    role="img"
                    aria-label={nota === null ? `${nome}: ${t("sem resposta", idioma)}` : `${nome}: ${t("nota", idioma)} ${nota} ${t("de 5", idioma)}`}
                  >
                    <div className="checkin-barra__segmentos" aria-hidden="true">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <span key={n} className={nota !== null && n <= nota ? "checkin-barra__segmento checkin-barra__segmento--cheio" : "checkin-barra__segmento"} />
                      ))}
                    </div>
                    <span className="checkin-barra__nome">{nome}</span>
                  </div>
                );
              })}
            </div>
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
