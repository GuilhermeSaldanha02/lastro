// lastro · SDD.md §10.4 — layout do PDF exportado de um parecer salvo.
//
// DIREÇÃO "PAPEL TIMBRADO", escolhida pelo dono no portão visual de
// 2026-09-03 contra duas alternativas renderizadas (negativo e cabeçalho
// selado) — DECISIONS.md 2026-09-03 (4).
//
// A restrição que decidiu: o sistema do app é ESCURO (tokens.css, Apex
// Pro) e este artefato é impresso. Não há tradução neutra — ou o PDF vira
// uma página preta que ninguém imprime, ou inverte pra papel e a
// identidade passa a ser carregada por Fraunces + fio de ouro + as cores
// de sinal, sem o fundo que a carrega na tela. É a segunda.
//
// @react-pdf/renderer usa um modelo de layout flexbox reduzido, próprio da
// biblioteca — não é o CSS de sistema.css/tokens.css, e não tenta clonar a
// tela pixel a pixel. As CORES, no entanto, saem de tokens.css verbatim; a
// família de papel (PAPEL/TINTA2/FIO) só existe aqui, porque a tela não tem
// superfície clara pra derivar.
import { Document, Page, Text, View, Font, StyleSheet } from "@react-pdf/renderer";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { separarVeredito } from "@/lib/texto/separar-veredito";
import { formatarDataCurta } from "@/lib/tempo";
import { formatarDelta, formatarPeso } from "@/lib/texto/formatar-delta";
import { t } from "@/lib/texto/i18n";
import type { BlocoEvidencia as TipoBlocoEvidencia } from "@/app/api/analise/evidencia";
import { ARCHIVO_FORTE, ARCHIVO_MEDIO, BRICOLAGE_NORMAL, FRAUNCES_VEREDITO } from "./fontes";

// Cortes estáticos das três famílias do app. Registrar o .ttf VARIÁVEL
// direto não funciona: o @react-pdf abre a instância padrão e não
// interpola eixo — no caso da Fraunces, cujo `wght` tem default 900 e
// `opsz` default 9, isso renderiza Black em óptica miúda, nada parecido
// com a tela. Medido no portão visual. Ver scripts/fontes-pdf/instanciar.py.
Font.register({ family: "Fraunces", src: FRAUNCES_VEREDITO });
Font.register({ family: "Bricolage", src: BRICOLAGE_NORMAL });
Font.register({
  family: "Archivo",
  fonts: [
    { src: ARCHIVO_MEDIO, fontWeight: 500 },
    { src: ARCHIVO_FORTE, fontWeight: 600 },
  ],
});

// Hifenização desligada: o padrão do @react-pdf usa dicionário inglês e
// quebra palavra em português em lugar errado. Num documento que cita nome
// de exercício, isso é erro visível.
Font.registerHyphenationCallback((palavra) => [palavra]);

const ROTULO: Record<TipoBlocoEvidencia["sinal"], string> = {
  alta: "Alta",
  plato: "Platô",
  queda: "Queda",
};

// tokens.css, verbatim.
const OURO = "#D4AF37";
const ESMERALDA = "#10B981";
const TINTA = "#0E1218"; // --lastro-sup-1
const TINTA3 = "#7C8DA6"; // --lastro-txt-3

// Só existem no PDF: a tela não tem superfície clara pra derivar.
// PAPEL não é branco puro — branco puro sob tinta obsidiana denuncia
// "exportação de sistema", não documento.
const PAPEL = "#FBFAF7";
const TINTA2 = "#4A5560";
const FIO = "#E2E0D9";
// Âmbar queimado no lugar do vermelho de alerta da tela: sobre papel, um
// vermelho saturado grita mais que o veredito e rouba a hierarquia.
const QUEDA = "#B4532F";

const COR_SINAL: Record<TipoBlocoEvidencia["sinal"], string> = {
  alta: ESMERALDA,
  plato: OURO,
  queda: QUEDA,
};

const L_SINAL = 46;
const L_VOLUME = 78;

const e = StyleSheet.create({
  pagina: {
    backgroundColor: PAPEL,
    paddingHorizontal: 52,
    paddingTop: 48,
    paddingBottom: 62,
    fontFamily: "Bricolage",
  },

  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  marca: { fontFamily: "Fraunces", fontSize: 15, color: TINTA },
  selo: { fontFamily: "Archivo", fontWeight: 500, fontSize: 8, color: TINTA3, letterSpacing: 2, textAlign: "right" },
  procedencia: { fontFamily: "Archivo", fontWeight: 500, fontSize: 8, color: TINTA3, letterSpacing: 0.4, marginTop: 5, textAlign: "right" },
  fioOuro: { height: 2, width: 44, backgroundColor: OURO, marginTop: 24, marginBottom: 22 },

  pergunta: { fontFamily: "Archivo", fontWeight: 500, fontSize: 10, color: TINTA2, letterSpacing: 1.5, marginBottom: 13 },
  veredito: { fontFamily: "Fraunces", fontSize: 27, color: TINTA, lineHeight: 1.22 },
  corpo: { fontSize: 11, color: TINTA2, lineHeight: 1.65, marginTop: 18 },

  aviso: { borderLeftWidth: 2, borderLeftColor: QUEDA, paddingLeft: 10, paddingVertical: 5, marginBottom: 20 },
  avisoTxt: { fontSize: 9, color: QUEDA, lineHeight: 1.5 },

  tituloEv: { fontFamily: "Archivo", fontWeight: 600, fontSize: 8.5, color: TINTA, letterSpacing: 2, marginTop: 34, marginBottom: 5 },
  cab: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: TINTA, paddingBottom: 5 },
  cabTxt: { fontFamily: "Archivo", fontWeight: 500, fontSize: 7.5, color: TINTA3, letterSpacing: 1 },

  linha: { paddingTop: 10, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: FIO },
  linhaTopo: { flexDirection: "row", alignItems: "baseline" },
  sinal: { fontFamily: "Archivo", fontWeight: 600, fontSize: 8, width: L_SINAL, letterSpacing: 1 },
  exerc: { flexGrow: 1, fontSize: 11, color: TINTA },
  volume: { fontFamily: "Archivo", fontWeight: 600, fontSize: 13, color: TINTA, width: L_VOLUME, textAlign: "right" },
  // Linha 2 = procedência. Abre com o DELTA EM TEXTO, que o DESIGN.md
  // §3.6.6 torna obrigatório ("cada sinal traz a palavra e o número que o
  // identificam; dois blocos distinguidos só pela cor reprovam o gate") —
  // e que por isso é verboso: "sem mudança há 4 semanas" não cabe numa
  // coluna estreita. Aqui ele tem a largura inteira. Depois vêm grupo,
  // séries e referência: dado que a evidência SEMPRE carrega (evidencia.ts,
  // Regra da Presença) e que a TELA não mostra — num documento de arquivo é
  // o que responde "de onde saiu esse número?" seis meses depois, e é o que
  // tira a página do vazio sem inventar enfeite.
  detalhe: { flexDirection: "row", marginLeft: L_SINAL, marginTop: 4 },
  delta: { fontFamily: "Archivo", fontWeight: 600, fontSize: 8, letterSpacing: 0.3 },
  // marginLeft, não espaço literal: o @react-pdf come espaço no início de
  // um <Text> irmão, e o separador cola no delta.
  detalheTxt: { fontFamily: "Archivo", fontWeight: 500, fontSize: 8, color: TINTA3, letterSpacing: 0.3, marginLeft: 7 },

  rodape: {
    position: "absolute",
    bottom: 30,
    left: 52,
    right: 52,
    borderTopWidth: 1,
    borderTopColor: FIO,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rodapeTxt: { fontFamily: "Archivo", fontWeight: 500, fontSize: 7.5, color: TINTA3, letterSpacing: 0.4 },
});

/** `criadoEm` é timestamptz completo (não YYYY-MM-DD) — `formatarDataCurta` não serve aqui, mas precisa do mesmo cuidado de timezone e do idioma certo. */
function formatarDataEmissao(iso: string, idioma: ParecerSalvo["idioma"]): string {
  return new Date(iso).toLocaleDateString(idioma, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/** Linha 2 de cada evidência. `semanas_sem_progresso` é opcional por contrato (evidencia.ts) — só entra quando existe. */
function detalhe(bloco: TipoBlocoEvidencia, idioma: ParecerSalvo["idioma"]): string {
  const partes = [
    bloco.grupo_muscular,
    `${bloco.series_valendo} ${t(
      bloco.series_valendo === 1 ? "série valendo" : "séries valendo",
      idioma,
    )}`,
    `${formatarPeso(bloco.peso_referencia, idioma)} kg × ${bloco.reps_referencia}`,
  ];
  if (bloco.semanas_sem_progresso) {
    partes.push(
      `${bloco.semanas_sem_progresso} ${t("semanas sem novo máximo", idioma)}`,
    );
  }
  return partes.join("  ·  ");
}

export default function DocumentoParecer({ parecer }: { parecer: ParecerSalvo }) {
  if (!parecer.texto || !parecer.evidencia) {
    throw new Error(
      "PDF pedido para um parecer sem conteúdo (rascunho não confirmado).",
    );
  }

  // Mesmo corte que components/parecer.tsx faz na tela, pela mesma
  // razão: "primeira frase = veredito" só vale para prosa real do LLM,
  // escrita pra abrir com um julgamento curto. O fallback determinístico
  // é um resumo de dados que às vezes só fecha a primeira frase depois de
  // várias linhas — aplicar o corte nele promovia um parágrafo inteiro a
  // veredito em negrito. A PR #177 corrigiu isso na tela e passou reto
  // aqui; achado em 2026-09-03, mesmo bug, outro renderizador.
  const { veredito, corpo } = parecer.avisoFalhaInterpretativa
    ? { veredito: "", corpo: parecer.texto.trim() }
    : separarVeredito(parecer.texto);
  const { idioma } = parecer;
  const evidencia = parecer.evidencia;

  return (
    <Document>
      <Page size="A4" style={e.pagina}>
        <View style={e.topo}>
          <Text style={e.marca}>lastro</Text>
          <View>
            <Text style={e.selo}>{t("Análise semanal", idioma).toUpperCase()}</Text>
            <Text style={e.procedencia}>
              {t("Semana de", idioma)}{" "}
              {formatarDataCurta(evidencia.periodo.semana_atual_inicio)} —{" "}
              {formatarDataCurta(evidencia.periodo.semana_atual_fim)}
            </Text>
            <Text style={e.procedencia}>
              {t("Emitido em", idioma)} {formatarDataEmissao(parecer.criadoEm, idioma)}
            </Text>
          </View>
        </View>

        <View style={e.fioOuro} />

        <Text style={e.pergunta}>{parecer.perguntaTexto.toUpperCase()}</Text>

        {parecer.avisoFalhaInterpretativa && (
          <View style={e.aviso}>
            <Text style={e.avisoTxt}>
              {t(
                "Não foi possível gerar a interpretação por IA desta vez. O texto abaixo é um resumo determinístico dos seus dados, sem prosa gerada — não é o parecer normal.",
                idioma,
              )}
            </Text>
          </View>
        )}

        {veredito ? <Text style={e.veredito}>{veredito}</Text> : null}
        {/* Sem veredito (fallback determinístico) a prosa é o primeiro
            elemento do corpo e não precisa do respiro que separa ela do
            veredito — senão soma com a margem do aviso e abre um vão. */}
        {corpo ? (
          <Text style={[e.corpo, veredito ? undefined : { marginTop: 0 }]}>{corpo}</Text>
        ) : null}

        {evidencia.blocos.length > 0 && (
          <>
            <Text style={e.tituloEv}>{t("Evidência", idioma).toUpperCase()}</Text>
            <View style={e.cab}>
              <Text style={[e.cabTxt, { width: L_SINAL }]}>
                {t("Sinal", idioma).toUpperCase()}
              </Text>
              <Text style={[e.cabTxt, { flexGrow: 1 }]}>
                {t("Exercício", idioma).toUpperCase()}
              </Text>
              <Text style={[e.cabTxt, { width: L_VOLUME, textAlign: "right" }]}>
                {t("Volume", idioma).toUpperCase()}
              </Text>
            </View>
            {evidencia.blocos.map((bloco) => (
              <View key={bloco.exercicio} style={e.linha} wrap={false}>
                <View style={e.linhaTopo}>
                  <Text style={[e.sinal, { color: COR_SINAL[bloco.sinal] }]}>
                    {t(ROTULO[bloco.sinal], idioma).toUpperCase()}
                  </Text>
                  <Text style={e.exerc}>{bloco.exercicio}</Text>
                  <Text style={e.volume}>{formatarPeso(bloco.volume, idioma)} kg</Text>
                </View>
                <View style={e.detalhe}>
                  <Text style={[e.delta, { color: COR_SINAL[bloco.sinal] }]}>
                    {formatarDelta(bloco, evidencia.periodo.janela_semanas, idioma)}
                  </Text>
                  <Text style={e.detalheTxt}>· {detalhe(bloco, idioma)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={e.rodape} fixed>
          <Text style={e.rodapeTxt}>
            {t(
              "Documento emitido pelo lastro · não substitui acompanhamento profissional",
              idioma,
            )}
          </Text>
          <Text
            style={e.rodapeTxt}
            render={({ pageNumber, totalPages }) =>
              totalPages > 1 ? `${pageNumber}/${totalPages}` : ""
            }
          />
        </View>
      </Page>
    </Document>
  );
}
