import type { ReactNode } from "react";

// lastro · DECISIONS.md 2026-08-15, D5 (M9) — substitui `.barra-topo` fixa:
// o título vira conteúdo comum, rola junto com o resto da tela em vez de
// ficar preso no topo.
export default function TituloTela({
  contexto,
  titulo,
  acessorio,
  comVoltar,
}: {
  contexto: string;
  titulo: string;
  acessorio?: ReactNode;
  /** Tela também renderiza `<VoltarFlutuante>` — reserva espaço acima do
   *  título pra não nascer atrás do círculo de voltar. */
  comVoltar?: boolean;
}) {
  return (
    <div className={`titulo-tela${comVoltar ? " titulo-tela--com-voltar" : ""}`}>
      <div className="titulo-tela__info">
        <p className="titulo-tela__contexto">{contexto}</p>
        <h1 className="titulo-tela__titulo">{titulo}</h1>
      </div>
      {acessorio}
    </div>
  );
}
