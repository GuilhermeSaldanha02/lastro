"use client";

// lastro · H2 (D8) — segundo consumidor do modo de edição, depois de
// `/ajustes/modelos` (ver `lista-modelos.tsx`). Diferente daquele: aqui a
// linha tem DOIS alvos de toque — `.item__link` (navega pro detalhe do
// treino) e a lixeira. O modo de edição só decide se a lixeira renderiza;
// a navegação da linha nunca muda de comportamento, ligada ou não.
import { useState } from "react";
import Link from "next/link";
import ExcluirTreino from "@/components/excluir-treino";
import SetaNavegacao from "@/components/seta-navegacao";

export default function ListaTreinos({
  treinos,
}: {
  treinos: { id: string; dataFormatada: string; totalSeries: number }[];
}) {
  const [modoEdicao, setModoEdicao] = useState(false);

  return (
    <>
      <div className="grupo__cab">
        <h2 className="doc__secao">Histórico</h2>
        {treinos.length > 0 && (
          <button
            type="button"
            className="botao-textual"
            onClick={() => setModoEdicao((atual) => !atual)}
          >
            {modoEdicao ? "Concluído" : "Editar"}
          </button>
        )}
      </div>

      {treinos.length === 0 ? (
        <p className="vazio">
          Nenhum treino registrado ainda. O primeiro começa aqui embaixo.
        </p>
      ) : (
        <ul className="lista">
          {treinos.map((treino) => (
            <li key={treino.id}>
              <div className="item">
                <Link href={`/treino/${treino.id}`} className="item__link">
                  <span className="item__conteudo">
                    <span className="item__data">{treino.dataFormatada}</span>
                    <span className="item__meta">
                      {treino.totalSeries}{" "}
                      {treino.totalSeries === 1 ? "série" : "séries"}
                    </span>
                  </span>
                  <SetaNavegacao />
                </Link>
                {modoEdicao && (
                  <ExcluirTreino
                    id={treino.id}
                    data={treino.dataFormatada}
                    series={treino.totalSeries}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
