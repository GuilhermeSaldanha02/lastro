// lastro · SDD.md §9.3 — lista os modelos de treino do usuário. Criar é em
// /ajustes/modelos/novo; editar é FORA de escopo (§9.0) — só criar e excluir.
import Link from "next/link";
import { listarModelos } from "@/lib/dados/modelo-treino";
import ListaModelos from "@/components/lista-modelos";
import AbaInferior from "@/components/aba-inferior";
import TituloTela from "@/components/titulo-tela";
import VoltarFlutuante from "@/components/voltar-flutuante";

export default async function PaginaModelos() {
  const modelos = await listarModelos();

  return (
    <main className="tela">
      <VoltarFlutuante href="/ajustes" rotulo="Ajustes" />
      <TituloTela contexto="Ajustes" titulo="Modelos de treino" comVoltar />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <p className="campo__nota">
          Listas de exercícios pra reaproveitar ao iniciar um treino — sem
          série, peso ou reps. Isso continua sendo preenchido normalmente no
          dia.
        </p>

        <ListaModelos modelos={modelos} />

        {/* Ação fantasma (DESIGN.md §6.5, peça 8, M6) — "criar modelo" é uma
            ação secundária dentro da seção, não deve competir em peso
            visual com nenhuma ação primária de tela. */}
        <Link href="/ajustes/modelos/novo" className="acao-fantasma">
          <span aria-hidden="true">+</span> Criar modelo
        </Link>
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
