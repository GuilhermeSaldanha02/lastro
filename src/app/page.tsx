// lastro · a home é a porta de entrada única do app (2026-08-06): tudo
// parte daqui, inclusive o ícone instalado e o retorno do login.
//
// TODO NÚMERO DESTA TELA É REAL, calculado pelo mesmo agregador da
// Análise Semanal (`carregarResumoHome`). Nenhum valor de exemplo, nenhum
// "Novo PR em Agachamento" fixo — E3 e PRD §7: sem treino, os números
// vêm zerados e a tela diz isso, em vez de parecer cheia mentindo.
//
// O que NÃO existe aqui, de propósito: cartão de "próximo treino
// planejado" com nome e lista de exercícios. O app não prescreve programa
// (PRD §5, escopo negativo) — ele analisa o que foi feito. A ação real é
// "iniciar treino de hoje", que é o que o botão faz.
import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { carregarResumoHome } from "@/lib/dados/resumo-home";
import { criarTreino } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import { dataLocalBrasil, formatarDataCurta } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";

/** "2026-08-06" → "6 ago". Relativo quando é hoje ou ontem. */
function formatarData(iso: string, hojeISO: string): string {
  if (iso === hojeISO) return "hoje";
  const ontem = new Date(`${hojeISO}T00:00:00Z`);
  ontem.setUTCDate(ontem.getUTCDate() - 1);
  if (iso === ontem.toISOString().slice(0, 10)) return "ontem";
  return formatarDataCurta(iso);
}

/**
 * 14250 → { valor: "14,2", unidade: "t" }. Abaixo de 1000 kg, kg cheio.
 * Antes disso o valor saía como "14,2k" + "kg" fixo no template = "14,2k kg",
 * dois indicadores de magnitude na mesma expressão (DECISIONS 2026-08-08).
 */
function formatarVolume(kg: number): { valor: string; unidade: string } {
  if (kg === 0) return { valor: "0", unidade: "kg" };
  if (kg < 1000) return { valor: String(Math.round(kg)), unidade: "kg" };
  return { valor: (kg / 1000).toFixed(1).replace(".", ","), unidade: "t" };
}

export default async function PaginaInicial() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem sessão: a home é só a marca e a porta de entrada.
  if (!user) {
    return (
      <main className="tela tela--entrada">
        <div className="entrada">
          <header className="entrada__marca">
            <h1>lastro</h1>
            <p>Registro de treino e leitura semanal.</p>
          </header>
          <Link href="/login" className="botao-primario">
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  const hoje = dataLocalBrasil();
  const [resumo, perfil] = await Promise.all([
    carregarResumoHome(hoje),
    obterPerfil(),
  ]);

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">lastro</p>
            <h1 className="barra-topo__titulo">Início</h1>
          </div>
          {perfil && (
            <div className="barra-topo__usuario">
              <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />
            </div>
          )}
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {/* Ação principal: continuar o treino de hoje, ou começar um. */}
        <section className="destaque">
          <p className="destaque__rotulo">
            {resumo.treinoDeHojeId ? "Treino de hoje em andamento" : "Pronto para treinar"}
          </p>
          {resumo.treinoDeHojeId ? (
            <Link
              href={`/treino/${resumo.treinoDeHojeId}`}
              className="botao-primario"
            >
              Continuar treino de hoje
            </Link>
          ) : (
            <form action={criarTreino}>
              <button type="submit" className="botao-primario">
                Iniciar treino de hoje
              </button>
            </form>
          )}
        </section>

        {/* Resumo da semana em andamento — número real ou zero honesto. */}
        <h2 className="doc__secao">Esta semana</h2>
        <div className="metricas">
          <div className="metrica">
            <p className="metrica__rotulo">Treinos</p>
            <p className="metrica__valor">{resumo.treinosNaSemana}</p>
          </div>
          <div className="metrica">
            <p className="metrica__rotulo">Volume</p>
            <p className="metrica__valor">
              {formatarVolume(resumo.volumeNaSemana).valor}
              <span className="metrica__un">
                {formatarVolume(resumo.volumeNaSemana).unidade}
              </span>
            </p>
          </div>
          <div className="metrica">
            <p className="metrica__rotulo">Séries valendo</p>
            <p className="metrica__valor">{resumo.seriesValendoNaSemana}</p>
          </div>
        </div>
        <p className="metricas__nota">
          Semana em andamento. Aquecimento não entra em volume nem na
          contagem de séries.
        </p>

        {/* Atalho pra Análise — com o estado REAL de quanto dado existe,
            em vez de um insight de IA fixo (que seria invenção). */}
        <Link href="/analise" className="atalho">
          <span className="atalho__titulo">Análise Semanal</span>
          <span className="atalho__meta">
            {resumo.semanasFechadasComTreino === 0
              ? "Ainda sem semana fechada com treino"
              : `${resumo.semanasFechadasComTreino} ${
                  resumo.semanasFechadasComTreino === 1
                    ? "semana fechada"
                    : "semanas fechadas"
                } com treino`}
          </span>
        </Link>

        <h2 className="doc__secao">Treinos recentes</h2>
        {resumo.recentes.length === 0 ? (
          <p className="vazio">
            Nenhum treino ainda. O primeiro começa aqui em cima.
          </p>
        ) : (
          <ul className="lista">
            {resumo.recentes.map((treino) => (
              <li key={treino.id}>
                <div className="item">
                  <Link href={`/treino/${treino.id}`} className="item__link">
                    <span className="item__data">
                      {formatarData(treino.data, hoje)}
                    </span>
                    <span className="item__meta">
                      {treino.totalSeries}{" "}
                      {treino.totalSeries === 1 ? "série" : "séries"}
                      {treino.volume > 0 &&
                        ` · ${formatarVolume(treino.volume).valor} ${
                          formatarVolume(treino.volume).unidade
                        }`}
                    </span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AbaInferior ativa="inicio" />
    </main>
  );
}
