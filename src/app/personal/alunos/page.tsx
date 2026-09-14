// lastro · A lista de alunos da conta de personal — aba "Alunos" da casca
// escolhida pelo dono no gate visual de 2026-09-11 (direção B).
//
// POR QUE ELA EXISTE COMO TELA, e não como bloco dentro da fila: a fila
// mostra quem PRECISA de atenção nesta semana, que por desenho é pouca
// gente — o teto é de dois alertas por aluno e a supressão cala o que já
// foi dito (§11.4.6). Sem esta tela, o aluno que vai bem some do app do
// personal, e "sumiu porque está tudo certo" é indistinguível de "sumiu
// porque o vínculo caiu".
//
// O que ela NÃO é: painel de gestão. Não há nota, não há mensalidade, não
// há botão de remover aluno — quem encerra o vínculo é o aluno (§11.4.3),
// e o personal não tem esse botão de propósito.
import Link from "next/link";
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import DicaInfo from "@/components/dica-info";
import { obterPerfil } from "@/lib/dados/perfil";
import { listarAlunosVinculados } from "@/lib/dados/personal";
import { exigirCascaDePersonal, precisaCompletarCadastro } from "@/lib/dados/casca";
import { formatarTelefoneBrasil } from "@/lib/texto/whatsapp";

export default async function PaginaAlunosDoPersonal() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  exigirCascaDePersonal(perfil);
  if (precisaCompletarCadastro(perfil)) redirect("/personal/completar");

  const alunos = await listarAlunosVinculados();

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Alunos"
        destaque="Vínculos"
        mostrarLogo={true}
        perfil={perfil}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          {alunos.length === 0 ? (
            <div className="vazio">
              <p className="titulo-com-dica">
                Nenhum aluno vinculado.
                <DicaInfo titulo="Como convidar um aluno">
                  Gere um código de convite e mande para o aluno. Ele aceita no
                  app dele — cadastrar o contato de alguém não concede acesso a
                  nada.
                </DicaInfo>
              </p>
            </div>
          ) : (
            <section className="card-obsidian">
              <div className="titulo-com-dica">
                <span className="card-obsidian__titulo">
                  {alunos.length === 1 ? "1 aluno" : `${alunos.length} alunos`}
                </span>
                <DicaInfo titulo="O que você vê">
                  Você lê treino, série e contato de quem aceitou — só leitura.
                  Quem encerra o vínculo é o aluno, na tela de Ajustes dele.
                </DicaInfo>
              </div>
              <ul className="lista">
                {alunos.map((aluno) => (
                  <li key={aluno.vinculoId}>
                    <p className="alerta-personal__linha">
                      <strong>{aluno.nome}</strong>
                    </p>
                    <p className="campo__nota">
                      {aluno.telefoneWhatsApp
                        ? formatarTelefoneBrasil(aluno.telefoneWhatsApp)
                        : "Sem telefone salvo — a mensagem pronta não aparece até o aluno informar."}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link href="/ajustes/personal" className="botao-secundario fila-personal-rodape">
            Convidar um aluno
          </Link>
        </div>
      </div>

      <AbaInferior ativa="alunos" tipoConta="personal" />
    </main>
  );
}
