// lastro · Completar o cadastro da conta de personal: CREF e WhatsApp.
//
// Serve só a quem NASCEU personal e ficou sem CREF — o trigger de cadastro
// anula CREF fora da régua, e essa conta precisa de uma porta para
// informar o registro (decisão de 2026-09-11: "entra, mas completa antes
// de abrir").
//
// Entre 2026-09-12 e 2026-09-13 esta tela também abria para conta de
// usuário, que virava personal por aqui. O dono corrigiu a regra: usuário
// não vira personal (PRD §11, emenda 2026-09-13). O guarda abaixo manda o
// usuário para a Home; a trava de verdade é a migração 0026.
//
// Não tem barra inferior de propósito: a casca de trabalho ainda não
// abriu, e barra aqui ofereceria abas que o guarda devolveria para cá.
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import CompletarCadastroPersonal from "@/components/completar-cadastro-personal";
import DicaInfo from "@/components/dica-info";
import { obterPerfil } from "@/lib/dados/perfil";
import { t } from "@/lib/texto/i18n";

export default async function PaginaCompletarCadastro() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  const idioma = perfil.idioma ?? "pt-BR";
  if (perfil.tipoConta !== "personal") redirect("/");
  // Já tem CREF: esta tela não tem por que existir de novo, e deixá-la
  // acessível seria oferecer um caminho para reescrever o registro. A
  // função do banco recusa isso também (`cref já informado`).
  if (perfil.cref) redirect("/personal");

  return (
    <main className="tela">
      <CabecalhoPro titulo={t("Falta pouco", idioma)} destaque={t("Cadastro", idioma)} perfil={perfil} idioma={idioma} />

      <div className="corpo corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          <section className="card-obsidian">
            <div className="titulo-com-dica">
              <span className="card-obsidian__titulo">{t("Conta de personal", idioma)}</span>
              <DicaInfo titulo={t("Por que o CREF e o WhatsApp", idioma)} idioma={idioma}>
                {t("O registro profissional e o telefone são obrigatórios para acompanhar alunos.", idioma)}
              </DicaInfo>
            </div>
          </section>

          <CompletarCadastroPersonal idioma={idioma} />
        </div>
      </div>
    </main>
  );
}
