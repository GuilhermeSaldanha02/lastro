// lastro · a home é a porta de entrada única do app (2026-08-06): tudo
// parte daqui, inclusive o ícone instalado e o retorno do login.
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { carregarResumoHome } from "@/lib/dados/resumo-home";
import { criarTreino } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { listarModelos } from "@/lib/dados/modelo-treino";
import { dataLocalBrasil, formatarDataCurta } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import IniciarTreino from "@/components/iniciar-treino";
import SetaNavegacao from "@/components/seta-navegacao";
import RastreadorDisciplina from "@/components/rastreador-disciplina";
import SeletorMetricasHome from "@/components/seletor-metricas-home";

function formatarData(iso: string, hojeISO: string): string {
  if (iso === hojeISO) return "hoje";
  const ontem = new Date(`${hojeISO}T00:00:00Z`);
  ontem.setUTCDate(ontem.getUTCDate() - 1);
  if (iso === ontem.toISOString().slice(0, 10)) return "ontem";
  return formatarDataCurta(iso);
}

function formatarVolume(kg: number): { valor: string; unidade: string } {
  if (kg === 0) return { valor: "0", unidade: "kg" };
  if (kg < 1000) return { valor: String(Math.round(kg)), unidade: "kg" };
  return { valor: (kg / 1000).toFixed(1).replace(".", ","), unidade: "t" };
}

function formatarCabecalhoData(hojeISO: string): { dataTexto: string; semanaTexto: string } {
  const d = new Date(`${hojeISO}T00:00:00Z`);
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const diaSemana = dias[d.getUTCDay()];
  const diaMes = d.getUTCDate();
  const mes = meses[d.getUTCMonth()];

  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const semanaNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  return {
    dataTexto: `${diaSemana}, ${diaMes} ${mes}`,
    semanaTexto: `Semana ${semanaNum}`,
  };
}

export default async function PaginaInicial() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = dataLocalBrasil();
  const [resumo, perfil, modelos] = await Promise.all([
    carregarResumoHome(hoje),
    obterPerfil(),
    listarModelos(),
  ]);

  const { dataTexto, semanaTexto } = formatarCabecalhoData(hoje);
  const volumeFormatado = formatarVolume(resumo.volumeNaSemana);

  return (
    <main className="tela">
      {/* Topo com Logo Spartan, Data Flutuante e Avatar */}
      <header className="topo-pro">
        <div className="topo-pro__esquerda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-lastro.png" alt="LASTRO" className="topo-pro__logo" width={38} height={38} />
          <div className="topo-pro__data-pill">
            {dataTexto} · <span>{semanaTexto}</span>
          </div>
        </div>
        <Link href="/perfil" className="topo-pro__avatar-link" aria-label="Perfil do usuário">
          {perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
        </Link>
      </header>

      <div className="corpo corpo--com-nav transicao-pilula">
        {/* Ação Hero Principal */}
        <section className="destaque-pro">
          {resumo.treinoDeHojeId ? (
            <Link
              href={`/treino/${resumo.treinoDeHojeId}`}
              className="botao-primario botao-primario--heroi"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Continuar Treino de Hoje
            </Link>
          ) : modelos.length > 0 ? (
            <IniciarTreino modelos={modelos} />
          ) : (
            <form action={criarTreino} style={{ width: "100%" }}>
              <button type="submit" className="botao-primario botao-primario--heroi">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Iniciar Treino de Hoje
              </button>
            </form>
          )}
        </section>

        {/* Rastreador de Disciplina Semanal (7 dias) */}
        <RastreadorDisciplina
          hojeISO={hoje}
          diasComTreino={resumo.diasComTreinoNaSemana}
          streakDias={resumo.sequenciaAtual}
        />

        {/* Seletor de Métricas com Gráfico de Onda (Volume / Cargas / Séries) */}
        <SeletorMetricasHome
          volumeFormatado={volumeFormatado}
          seriesValendo={resumo.seriesValendoNaSemana}
          treinosNaSemana={resumo.treinosNaSemana}
          historicoBarras={resumo.historicoBarras}
          seriesPorGrupo={resumo.seriesPorGrupo}
        />

        {/* Card Análise Semanal (AI Coach) */}
        <section className="ai-coach-card">
          <div className="ai-coach-card__header">
            <div className="ai-coach-card__badge">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--lastro-ouro)">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              <span>Análise Semanal (AI Coach)</span>
            </div>
            {/* Curto de propósito: o cartão já se chama "Análise Semanal",
                então "nesta semana" no rótulo era redundante — e a 360px
                a frase longa quebrava o cabeçalho em duas linhas. */}
            <span className="ai-coach-card__meta">
              {resumo.treinosNaSemana}{" "}
              {resumo.treinosNaSemana === 1 ? "treino" : "treinos"}
              {/* T4: a fração só aparece depois que o dono define a meta
                  em /ajustes — nunca um denominador inventado (achado
                  A13). Sem meta definida, a contagem sozinha já basta. */}
              {perfil?.metaTreinosSemana != null && (
                <> / {perfil.metaTreinosSemana}</>
              )}
            </span>
          </div>

          {perfil?.metaTreinosSemana != null && (
            <div className="ai-coach-card__barra">
              <div
                className="ai-coach-card__progresso"
                style={{
                  width: `${Math.min(100, Math.round((resumo.treinosNaSemana / perfil.metaTreinosSemana) * 100))}%`,
                }}
              />
            </div>
          )}

          <Link href="/analise" className="ai-coach-card__citacao">
            <p>
              {resumo.treinosNaSemana > 0
                ? "Toque para ver a leitura da sua semana."
                : "Ainda sem treinos nesta semana. Inicie uma sessão para gerar o parecer inteligente."}
            </p>
          </Link>
        </section>

        {/* Feed de Treinos Recentes */}
        <div className="secao-header">
          <h2 className="secao-header__titulo">Treinos Recentes</h2>
          <Link href="/treino" className="secao-header__link">Ver Todos</Link>
        </div>

        {resumo.recentes.length === 0 ? (
          <p className="vazio">Nenhum treino registrado ainda. O primeiro começa no botão acima.</p>
        ) : (
          <div className="feed-treinos">
            {resumo.recentes.map((treino) => (
              <Link key={treino.id} href={`/treino/${treino.id}`} className="cartao-treino-item">
                <div className="cartao-treino-item__esquerda">
                  <div className="cartao-treino-item__grupos">
                    {treino.gruposMusculares.length > 0 ? (
                      treino.gruposMusculares.map((grupo, idx) => (
                        <span key={idx} className="tag-grupo">
                          {grupo.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="tag-grupo">SESSÃO</span>
                    )}
                  </div>
                  <span className="cartao-treino-item__data">{formatarData(treino.data, hoje)}</span>
                </div>

                <div className="cartao-treino-item__direita">
                  <div className="cartao-treino-item__metricas">
                    <span className="cartao-treino-item__vol">
                      {formatarVolume(treino.volume).valor} {formatarVolume(treino.volume).unidade}
                    </span>
                    <span className="cartao-treino-item__series">
                      {treino.totalSeries} {treino.totalSeries === 1 ? "série" : "séries"}
                    </span>
                  </div>
                  <SetaNavegacao />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AbaInferior ativa="inicio" />
    </main>
  );
}
