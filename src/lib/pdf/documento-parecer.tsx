// lastro · SDD.md §10.4 — layout do PDF exportado de um parecer salvo.
// @react-pdf/renderer usa um modelo de layout flexbox reduzido, próprio
// da biblioteca — não é o CSS de sistema.css/tokens.css. Não tenta clonar
// pixel a pixel a tela (`.doc`/`.evidencias`), que é território de
// HTML/CSS, não do modelo de layout do @react-pdf/renderer; é um
// documento de arquivo, não precisa ser idêntico à tela (SDD.md §10.4).
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { separarVeredito } from "@/lib/texto/separar-veredito";
import { formatarDataCurta } from "@/lib/tempo";
import { formatarDelta, formatarPeso } from "@/lib/texto/formatar-delta";
import { t } from "@/lib/texto/i18n";
import type { BlocoEvidencia as TipoBlocoEvidencia } from "@/app/api/analise/evidencia";

const ROTULO: Record<TipoBlocoEvidencia["sinal"], string> = {
  alta: "Alta",
  plato: "Platô",
  queda: "Queda",
};

const estilos = StyleSheet.create({
  pagina: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  selo: { fontSize: 9, color: "#8a8a8a", marginBottom: 4, textTransform: "uppercase" },
  pergunta: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: "#8a8a8a", marginBottom: 16 },
  veredito: { fontSize: 13, fontWeight: 700, marginBottom: 12 },
  corpo: { fontSize: 11, lineHeight: 1.5, marginBottom: 20 },
  tituloEvidencia: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  linhaEvidencia: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 6,
  },
  colunaRotulo: { width: 50, color: "#666" },
  colunaExercicio: { flexGrow: 1, fontWeight: 700 },
  colunaNumero: { width: 100, textAlign: "right", color: "#444" },
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

export default function DocumentoParecer({ parecer }: { parecer: ParecerSalvo }) {
  const { veredito, corpo } = separarVeredito(parecer.texto);
  const { idioma } = parecer;

  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.selo}>{t("Análise semanal", idioma)} — Lastro</Text>
        <Text style={estilos.pergunta}>{parecer.perguntaTexto}</Text>
        <Text style={estilos.meta}>
          {t("Semana de", idioma)} {formatarDataCurta(parecer.evidencia.periodo.semana_atual_inicio)}{" "}
          — {formatarDataCurta(parecer.evidencia.periodo.semana_atual_fim)} ·{" "}
          {t("Emitido em", idioma)} {formatarDataEmissao(parecer.criadoEm, idioma)}
        </Text>

        <Text style={estilos.veredito}>{veredito}</Text>
        {corpo && <Text style={estilos.corpo}>{corpo}</Text>}

        {parecer.evidencia.blocos.length > 0 && (
          <>
            <Text style={estilos.tituloEvidencia}>Evidência</Text>
            {parecer.evidencia.blocos.map((bloco) => (
              <View key={bloco.exercicio} style={estilos.linhaEvidencia}>
                <Text style={estilos.colunaRotulo}>{t(ROTULO[bloco.sinal], idioma)}</Text>
                <Text style={estilos.colunaExercicio}>{bloco.exercicio}</Text>
                <Text style={estilos.colunaNumero}>{formatarPeso(bloco.volume, idioma)} kg</Text>
                <Text style={estilos.colunaNumero}>
                  {formatarDelta(bloco, parecer.evidencia.periodo.janela_semanas, idioma)}
                </Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
