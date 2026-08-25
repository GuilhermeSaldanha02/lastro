// lastro · SDD.md §5.1 — lista os treinos do usuário logado e permite
// iniciar um treino novo. A sessão em si é responsabilidade do
// middleware (tarefa 2.1) — esta página só assume que, se chegou até
// aqui, o usuário está autenticado.
//
// Modo Bancada (DESIGN.md §3.5): poucos elementos, grandes. A ação
// primária fica na metade inferior, ao alcance do polegar (D2).
import Link from "next/link";
import { listarTreinos, criarTreino } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { listarModelos } from "@/lib/dados/modelo-treino";
import { dataLocalBrasil } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import ListaTreinos from "@/components/lista-treinos";
import IniciarTreino from "@/components/iniciar-treino";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

const MESES_POR_IDIOMA: Record<Idioma, string[]> = {
  "pt-BR": ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
};

/** "2026-08-06" → "6 ago". A data já vem local; não há fuso a converter. */
function formatarData(iso: string, idioma: Idioma): string {
  const meses = MESES_POR_IDIOMA[idioma];
  const [, mes, dia] = iso.split("-");
  const indice = Number(mes) - 1;
  if (!meses[indice] || !dia) return iso;
  return `${Number(dia)} ${meses[indice]}`;
}

export default async function PaginaTreino() {
  const [treinos, perfil, modelos] = await Promise.all([
    listarTreinos(),
    obterPerfil(),
    listarModelos(),
  ]);
  const idioma = perfil?.idioma ?? "pt-BR";
  // Mesma checagem da home (src/app/page.tsx) — sem isto, esta tela sempre
  // oferecia "Iniciar treino de hoje" mesmo com um treino de hoje já em
  // andamento, e clicar de novo criava outro (achado do dono, 2026-08-07;
  // `criarTreino` agora reaproveita, mas o rótulo do botão ficava errado
  // até essa correção).
  const treinoDeHojeId = treinos.find((t) => t.data === dataLocalBrasil())?.id ?? null;

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Treinos", idioma)}
        destaque={t("Histórico", idioma)}
        mostrarLogo={true}
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav transicao-pilula">
        {/* Ação Hero Principal */}
        <section className="destaque-pro">
          {treinoDeHojeId ? (
            <Link href={`/treino/${treinoDeHojeId}`} className="botao-primario botao-primario--heroi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {t("Continuar treino de hoje", idioma)}
            </Link>
          ) : modelos.length > 0 ? (
            <IniciarTreino modelos={modelos} idioma={idioma} />
          ) : (
            <form action={criarTreino}>
              <button type="submit" className="botao-primario botao-primario--heroi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {t("Iniciar treino de hoje", idioma)}
              </button>
            </form>
          )}
        </section>

        <ListaTreinos
          treinos={treinos.map((treino) => ({
            id: treino.id,
            dataFormatada: formatarData(treino.data, idioma),
            totalSeries: treino.totalSeries,
            gruposMusculares: treino.gruposMusculares,
            volumeKg: treino.volumeKg,
          }))}
          idioma={idioma}
        />
      </div>

      <AbaInferior ativa="bancada" idioma={idioma} />
    </main>
  );
}
