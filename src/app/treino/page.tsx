// lastro · SDD.md §5.1 — lista os treinos do usuário logado e permite
// iniciar um treino novo. A sessão em si é responsabilidade do
// middleware (tarefa 2.1) — esta página só assume que, se chegou até
// aqui, o usuário está autenticado.
//
// Modo Bancada (DESIGN.md §3.5): poucos elementos, grandes. A ação
// primária fica na metade inferior, ao alcance do polegar (D2).
import { listarTreinos } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { obterMetricasDoTreino } from "@/lib/dados/relatorio-treino";
import { cascaDaBarra, exigirCascaDeAluno } from "@/lib/dados/casca";
import { listarModelos } from "@/lib/dados/modelo-treino";
import { dataLocalBrasil } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import ListaTreinos from "@/components/lista-treinos";
import IniciarTreino from "@/components/iniciar-treino";
import FormIniciarTreino from "@/components/form-iniciar-treino";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";
import Link from "next/link";

export default async function PaginaTreino() {
  const [treinos, perfil, modelos] = await Promise.all([
    listarTreinos(),
    obterPerfil(),
    listarModelos(),
  ]);
  // A tela de registrar treino é a que mais precisa deste guarda: ela é a
  // negação direta de "conta de personal não treina".
  exigirCascaDeAluno(perfil);
  const idioma = perfil?.idioma ?? "pt-BR";
  // Mesma checagem da home (src/app/page.tsx) — sem isto, esta tela sempre
  // oferecia "Iniciar treino de hoje" mesmo com um treino de hoje já em
  // andamento, e clicar de novo criava outro (achado do dono, 2026-08-07;
  // `criarTreino` agora reaproveita, mas o rótulo do botão ficava errado
  // até essa correção).
  // Só o treino EM ABERTO: com o de hoje finalizado, o botão volta a ser
  // "Iniciar" e cria outro treino no mesmo dia (dono, 2026-09-24).
  const hoje = dataLocalBrasil();
  const treinoDeHojeId =
    treinos.find((t) => t.data === hoje && t.finalizadoEm === null)?.id ?? null;

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
            <FormIniciarTreino idioma={idioma} classeBotao="botao-primario botao-primario--heroi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {t("Iniciar treino de hoje", idioma)}
            </FormIniciarTreino>
          )}
        </section>

        {/* UX-02: treino de hoje separado + histórico com calendário e
            relatório por linha — tudo em ListaTreinos (2026-09-28). */}
        <ListaTreinos
          treinos={treinos}
          hojeISO={hoje}
          idioma={idioma}
          obterMetricasAcao={obterMetricasDoTreino}
        />
      </div>

      <AbaInferior ativa="bancada" idioma={idioma} tipoConta={cascaDaBarra(perfil)} />
    </main>
  );
}
