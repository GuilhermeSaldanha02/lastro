// lastro · Convites, aceite e revogação — PRD §11.4.3.
//
// UMA TELA, OS DOIS LADOS. Quem chega aqui pode estar no papel de aluno
// (aceitar um convite, ver quem é o seu personal, revogar) ou de personal
// (gerar código, ver alunos). Não existe escolha de modo no login e não
// existe conta "de personal": o vínculo é o papel, e a mesma pessoa pode
// ocupar os dois — tem personal e treina alunos.
//
// O CÓDIGO CHEGA PELO LINK, e o link chega pelo WhatsApp. Quem abre vindo
// de lá normalmente está sem sessão no navegador do WhatsApp: o `proxy.ts`
// manda para o login carregando o caminho COM a query, e o código volta
// preenchido aqui.
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import VoltarFlutuante from "@/components/voltar-flutuante";
import VinculoAluno from "@/components/vinculo-aluno";
import ConvitesPersonal from "@/components/convites-personal";
import { obterPerfil } from "@/lib/dados/perfil";
import { cascaDaBarra } from "@/lib/dados/casca";
import {
  carregarVinculoDoAluno,
  listarAlunosVinculados,
  listarConvitesPendentes,
  telefoneDoUsuarioAtual,
} from "@/lib/dados/personal";

/** Só o formato; validade é assunto do banco (`aceitar_convite_personal`). */
function codigoDaQuery(bruto: string | string[] | undefined): string {
  const valor = Array.isArray(bruto) ? bruto[0] : bruto;
  const limpo = (valor ?? "").trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{10}$/.test(limpo) ? limpo : "";
}

export default async function PaginaPersonalAjustes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");

  // O lado exibido segue o MODO, não o tipo da conta (emenda 2026-09-12
  // (2)): em modo treino, quem tem área de trabalho é aluno como qualquer
  // outro — pode ter o próprio personal.
  const ehPersonal = perfil.modo === "trabalho";

  const [{ codigo }, vinculo, convites, alunos, telefone, cabecalhos] =
    await Promise.all([
      searchParams.then((p) => ({ codigo: codigoDaQuery(p.codigo) })),
      carregarVinculoDoAluno(),
      listarConvitesPendentes(),
      listarAlunosVinculados(),
      telefoneDoUsuarioAtual(),
      headers(),
    ]);

  // Mesma razão documentada em `auth/callback`: atrás do balanceador da
  // Vercel o host interno não é o domínio público, e um link de convite
  // com host errado não abre para ninguém.
  const hostEncaminhado = cabecalhos.get("x-forwarded-host");
  const host = hostEncaminhado ?? cabecalhos.get("host") ?? "";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  const origem = host ? `${protocolo}://${host}` : "";

  return (
    <main className="tela">
      <CabecalhoPro titulo="Personal" destaque="Vínculo" perfil={perfil} />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          {/* UMA TELA, DOIS LADOS — e a partir de 2026-09-11 cada conta vê
              só o seu. Antes da conta de personal existir, mostrar os dois
              era a única opção: qualquer pessoa podia convidar e qualquer
              pessoa podia aceitar. Com a escolha no cadastro, o aluno que
              visse "gerar código de convite" veria uma porta que a policy
              do banco fecharia na cara dele (migração 0024), e o personal
              que visse "colar código" veria um caminho que a função de
              aceite recusa. */}
          {ehPersonal ? (
            <>
              <Link href="/personal" className="botao-primario">
                Abrir a fila da semana
              </Link>
              <ConvitesPersonal
                convites={convites}
                alunos={alunos}
                origem={origem}
              />
            </>
          ) : (
            <VinculoAluno
              vinculo={vinculo}
              telefoneAtual={telefone}
              codigoDoLink={codigo}
            />
          )}

          <p className="campo__nota">
            Nenhuma conta conversa com outra dentro do lastro. O vínculo dá ao
            personal LEITURA dos seus treinos e do seu contato — nunca
            permissão de escrever no seu histórico, e nunca um canal de
            mensagem aqui dentro.
          </p>
        </div>
      </div>

      <VoltarFlutuante href="/ajustes" rotulo="Ajustes" />
      <AbaInferior ativa="ajustes" tipoConta={cascaDaBarra(perfil)} />
    </main>
  );
}
