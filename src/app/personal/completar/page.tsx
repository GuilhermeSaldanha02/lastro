// lastro · Completar cadastro de conta de personal criada pelo Google.
//
// Decisão do dono (2026-09-11): "entra, mas completa antes de abrir". O
// Google não entrega CREF nem telefone, e exigir os dois no schema
// abortaria o cadastro dentro do insert em `auth.users` — então a conta
// nasce válida e incompleta, e é ESTA tela que fecha a obrigatoriedade.
//
// Não tem barra inferior de propósito: enquanto o cadastro não estiver
// completo, a casca de trabalho não abriu. Barra aqui ofereceria abas que
// o guarda de rota devolveria para cá no primeiro toque.
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import CompletarCadastroPersonal from "@/components/completar-cadastro-personal";
import { obterPerfil } from "@/lib/dados/perfil";
import { exigirCascaDePersonal, precisaCompletarCadastro } from "@/lib/dados/casca";

export default async function PaginaCompletarCadastro() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  exigirCascaDePersonal(perfil);
  // Já completou: esta tela não tem por que existir de novo, e deixá-la
  // acessível seria oferecer um caminho para reescrever o registro sem
  // motivo nenhum.
  if (!precisaCompletarCadastro(perfil)) redirect("/personal");

  return (
    <main className="tela">
      <CabecalhoPro titulo="Falta pouco" destaque="Cadastro" perfil={perfil} />

      <div className="corpo corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          <section className="card-obsidian">
            <span className="card-obsidian__titulo">Conta de personal</span>
            <p className="campo__nota">
              Você entrou com o Google, que não informa registro profissional
              nem telefone. Os dois são obrigatórios para acompanhar aluno: o
              registro identifica quem você é, e o WhatsApp é por onde a
              mensagem pronta sai.
            </p>
          </section>

          <CompletarCadastroPersonal />
        </div>
      </div>
    </main>
  );
}
