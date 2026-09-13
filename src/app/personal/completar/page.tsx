// lastro · A porta da área de trabalho: CREF e WhatsApp.
//
// Nasceu como "completar cadastro" da conta de personal criada pelo Google
// (decisão de 2026-09-11: "entra, mas completa antes de abrir"). Desde a
// emenda de 2026-09-12 (2) é também o caminho de quem já treina no lastro
// e decide acompanhar alunos — a mesma conta ganha a área de trabalho, sem
// segundo e-mail.
//
// Não tem barra inferior de propósito: a casca de trabalho ainda não
// abriu, e barra aqui ofereceria abas que o guarda devolveria para cá.
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import CompletarCadastroPersonal from "@/components/completar-cadastro-personal";
import { obterPerfil } from "@/lib/dados/perfil";

export default async function PaginaCompletarCadastro() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  // Já tem CREF: esta tela não tem por que existir de novo, e deixá-la
  // acessível seria oferecer um caminho para reescrever o registro. A
  // função do banco recusa isso também (`cref já informado`).
  if (perfil.cref) redirect("/personal");

  const veioComoPersonal = perfil.tipoConta === "personal";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={veioComoPersonal ? "Falta pouco" : "Área de trabalho"}
        destaque={veioComoPersonal ? "Cadastro" : "Personal"}
        perfil={perfil}
      />

      <div className="corpo corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          <section className="card-obsidian">
            <span className="card-obsidian__titulo">
              {veioComoPersonal ? "Conta de personal" : "Acompanhar alunos"}
            </span>
            <p className="campo__nota">
              {veioComoPersonal
                ? "Você entrou com o Google, que não informa registro profissional nem telefone. Os dois são obrigatórios para acompanhar aluno: o registro identifica quem você é, e o WhatsApp é por onde a mensagem pronta sai."
                : "Com o CREF e o WhatsApp, esta mesma conta ganha a fila de alunos. Seu treino, seu histórico e sua análise continuam aqui: você alterna entre os dois modos em Ajustes."}
            </p>
          </section>

          <CompletarCadastroPersonal />
        </div>
      </div>
    </main>
  );
}
