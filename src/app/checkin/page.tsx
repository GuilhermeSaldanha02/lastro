// lastro · AN-08 A1 — os últimos 7 dias do check-in. Só registro: não cruza
// com desempenho (isso é A2/A3, depois de ~8 semanas de dado) e nunca vai
// para a IA.
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import { obterPerfil } from "@/lib/dados/perfil";
import { cascaDaBarra, exigirCascaDeAluno, exigirOnboarding } from "@/lib/dados/casca";
import { listarCheckinsRecentes } from "@/lib/dados/checkin";
import { janelaDoHistorico } from "@/lib/checkin/historico";
import { CAMPOS_CHECKIN } from "@/lib/checkin/escala";
import { dataLocalBrasil, formatarDataCurta } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";

const NOMES = { sono: "Sono", energia: "Energia", dor_muscular: "Dor", estresse: "Estresse" } as const;

export default async function PaginaCheckin() {
  const hoje = dataLocalBrasil();
  const [perfil, recentes] = await Promise.all([obterPerfil(), listarCheckinsRecentes(14)]);
  if (!perfil) redirect("/login");
  exigirCascaDeAluno(perfil);
  await exigirOnboarding(perfil);
  const idioma = perfil.idioma ?? "pt-BR";
  const dias = janelaDoHistorico(hoje, recentes, 7);
  const valor = (c: NonNullable<(typeof dias)[number]["checkin"]>, campo: (typeof CAMPOS_CHECKIN)[number]) =>
    campo === "dor_muscular" ? c.dorMuscular : c[campo];

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Check-in diário", idioma)}
        destaque={t("7 dias", idioma)}
        voltarHref="/"
        perfil={perfil}
        idioma={idioma}
      />
      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <ul className="pilha checkin-historico">
          {dias.map(({ dia, checkin }) => (
            <li key={dia} className="checkin-cartao">
              <div className="checkin-cartao__cabecalho">
                <h2 className="checkin-cartao__titulo">{dia === hoje ? t("Hoje", idioma) : formatarDataCurta(dia, idioma)}</h2>
              </div>
              {checkin ? (
                <div className="checkin-barras">
                  {CAMPOS_CHECKIN.map((campo) => {
                    const nota = valor(checkin, campo);
                    const nome = t(NOMES[campo], idioma);
                    return (
                      <div key={campo} className="checkin-barra" role="img" aria-label={nota === null ? `${nome}: ${t("sem resposta", idioma)}` : `${nome}: ${t("nota", idioma)} ${nota} ${t("de 5", idioma)}`}>
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
              ) : (
                <p className="campo__nota">{t("Sem check-in neste dia.", idioma)}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
      <AbaInferior ativa="inicio" tipoConta={cascaDaBarra(perfil)} idioma={idioma} />
    </main>
  );
}
