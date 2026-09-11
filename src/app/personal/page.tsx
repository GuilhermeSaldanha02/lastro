// lastro · A fila do personal — PRD §11.4.5.
//
// A TELA EXISTE NO LUGAR DE UMA NOTIFICAÇÃO, e isso é a decisão central do
// módulo. Os dois personais entrevistados descreveram push genérico como o
// que ignoram ("a chance de eu arrastar pra o lado no meio da correria é de
// 80%"); o que funciona é a fila lida no momento do planejamento. Por isso
// o alerta ESPERA aqui — nada é empurrado para ninguém.
//
// Não existe "modo personal" no login, e isso também é desenho: a conta que
// tem pelo menos um vínculo aceito alcança esta tela, e mais nada muda. O
// vínculo É o papel.
import Link from "next/link";
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import FilaPersonal from "@/components/fila-personal";
import { obterPerfil } from "@/lib/dados/perfil";
import { carregarFilaDoPersonal } from "@/lib/dados/personal";

export default async function PaginaPersonal() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");

  const { itens, alunos } = await carregarFilaDoPersonal();

  // Conta sem aluno nenhum não tem fila — e não deve ficar olhando uma
  // tela vazia sem saber o que fazer. Manda para onde se convida.
  if (alunos.length === 0) redirect("/ajustes/personal");

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Fila"
        destaque="Alunos"
        mostrarLogo={true}
        perfil={perfil}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          {itens.length === 0 ? (
            // SILÊNCIO É RESPOSTA, e precisa ser dito como resposta.
            // "Nenhum alerta" não é o app quebrado nem o app com pouco
            // dado: é o resultado da seletividade funcionando (§11.4.6).
            // Uma tela que não explica isso parece defeito.
            <div className="vazio">
              <p>Nada pede atenção nesta semana.</p>
              <p className="campo__nota">
                {alunos.length === 1
                  ? "O único aluno vinculado treinou dentro do esperado."
                  : `Os ${alunos.length} alunos vinculados treinaram dentro do esperado.`}{" "}
                O lastro só abre um alerta quando o sinal se mantém por
                semanas — nunca por uma sessão ruim.
              </p>
            </div>
          ) : (
            <FilaPersonal itens={itens} />
          )}

          <p className="campo__nota">
            A fila cobre a última semana fechada e mostra no máximo dois
            alertas por aluno, priorizados. O que não apareceu aqui ou não é
            tendência ainda, ou já foi dito nas últimas semanas.
          </p>

          <Link
            href="/ajustes/personal"
            className="botao-secundario fila-personal-rodape"
          >
            Convites e alunos
          </Link>
        </div>
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
