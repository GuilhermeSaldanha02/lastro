// lastro · PRD §4.5 — catálogo curado de exercícios, consultado no meio do
// treino ("não lembro a execução da remada curvada").
//
// REGRA CONGELADA (FF7): a dica de execução é CURADA POR HUMANO, nunca
// gerada por IA. É assunto de saúde e cai no E3. Onde a dica ainda não foi
// escrita, esta tela diz isso — não inventa, não esconde e não chama o
// modelo. Vazio honesto vence texto plausível.
import { listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";

export default async function PaginaCatalogo() {
  const [exercicios, perfil] = await Promise.all([listarCatalogo(), obterPerfil()]);

  // Agrupa por grupo muscular, preservando a ordem alfabética de nome que
  // veio do banco dentro de cada grupo.
  const grupos: { id: string; nome: string; itens: typeof exercicios }[] = [];
  for (const exercicio of exercicios) {
    const existente = grupos.find((g) => g.id === exercicio.grupoMuscularPrimario);
    if (existente) existente.itens.push(exercicio);
    else
      grupos.push({
        id: exercicio.grupoMuscularPrimario,
        nome: exercicio.grupoMuscularNome,
        itens: [exercicio],
      });
  }
  grupos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const semDica = exercicios.filter((e) => !e.dicaExecucao).length;

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Catálogo</p>
            <h1 className="barra-topo__titulo">Exercícios</h1>
          </div>
          {perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {semDica > 0 && (
          // Comunica a ausência UMA vez, no topo — não card a card (A2,
          // 2026-08-13). Antes de rolar qualquer grupo, quem varre a lista
          // já sabe que "sem dica" é esperado, não bug.
          <p className="nota-metodo">
            {semDica} de {exercicios.length}{" "}
            {exercicios.length === 1 ? "exercício está" : "exercícios estão"} sem
            dica. Elas são escritas e revisadas por pessoa, nunca geradas — por
            isso o campo fica vazio até você preencher.
          </p>
        )}

        {exercicios.length === 0 ? (
          <p className="vazio">O catálogo ainda não foi semeado.</p>
        ) : (
          grupos.map((grupo) => (
            <section className="grupo" key={grupo.id}>
              <div className="grupo__cab">
                <h2 className="grupo__nome">{grupo.nome}</h2>
                <span className="grupo__cont">{grupo.itens.length}</span>
              </div>

              {grupo.itens.map((exercicio) => (
                <article className="ficha" key={exercicio.id}>
                  <h3 className="ficha__nome">
                    {exercicio.nome}
                    {exercicio.unilateral && (
                      <span className="ficha__flag">unilateral</span>
                    )}
                  </h3>

                  {exercicio.dicaExecucao && (
                    <p className="ficha__dica">{exercicio.dicaExecucao}</p>
                  )}
                </article>
              ))}
            </section>
          ))
        )}

        <p className="aviso-saude">
          As dicas deste catálogo não substituem acompanhamento profissional.
          Dor, limitação ou lesão são assunto de fisioterapeuta ou médico.
        </p>
      </div>

      <AbaInferior ativa="catalogo" />
    </main>
  );
}
