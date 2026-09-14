// lastro · A fila do personal — PRD §11.4.5.
//
// A TELA EXISTE NO LUGAR DE UMA NOTIFICAÇÃO, e isso é a decisão central do
// módulo. Os dois personais entrevistados descreveram push genérico como o
// que ignoram ("a chance de eu arrastar pra o lado no meio da correria é de
// 80%"); o que funciona é a fila lida no momento do planejamento. Por isso
// o alerta ESPERA aqui — nada é empurrado para ninguém.
//
// ESTA É A CASA DA CONTA DE PERSONAL (PRD §11, emenda de 2026-09-11).
// O comentário antigo aqui dizia o contrário — "não existe modo personal
// no login; o vínculo É o papel" — e era verdade até o dono decidir que
// existe CONTA de personal, escolhida no cadastro. Ficou escrito o que
// mudou, em vez de apagado, porque o resto do módulo foi desenhado sobre
// a premissa antiga e quem ler isto precisa saber disso.
import Link from "next/link";
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import FilaPersonal from "@/components/fila-personal";
import DicaInfo from "@/components/dica-info";
import { obterPerfil } from "@/lib/dados/perfil";
import { carregarFilaDoPersonal } from "@/lib/dados/personal";
import { exigirCascaDePersonal, precisaCompletarCadastro } from "@/lib/dados/casca";
import { t } from "@/lib/texto/i18n";

export default async function PaginaPersonal() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  const idioma = perfil.idioma ?? "pt-BR";
  exigirCascaDePersonal(perfil);
  // Quem entrou por Google ainda não informou o CREF. A área de trabalho
  // não abre antes disso — a obrigatoriedade é do app, porque no banco
  // ela abortaria o cadastro (ver `casca.ts` e a migração 0024).
  if (precisaCompletarCadastro(perfil)) redirect("/personal/completar");

  const { itens, alunos } = await carregarFilaDoPersonal(idioma);

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Fila", idioma)}
        destaque={t("Alunos", idioma)}
        mostrarLogo={true}
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          {alunos.length === 0 ? (
            // Personal recém-cadastrado, sem nenhum aluno. Até 2026-09-11
            // esta tela REDIRECIONAVA para os ajustes, o que fazia sentido
            // quando o vínculo era o papel: sem aluno, não havia personal.
            // Com conta própria, redirecionar joga a pessoa para fora da
            // casa dela no primeiro acesso — a fila vazia é o estado
            // inicial legítimo, e ela precisa dizer o que fazer.
            <div className="vazio">
              <p className="titulo-com-dica">
                {t("Você ainda não tem alunos.", idioma)}
                <DicaInfo titulo={t("Como convidar um aluno", idioma)} idioma={idioma}>
                  {t("Gere um convite e envie ao aluno. O acesso só começa depois do aceite.", idioma)}
                </DicaInfo>
              </p>
            </div>
          ) : itens.length === 0 ? (
            // SILÊNCIO É RESPOSTA, e precisa ser dito como resposta.
            // "Nenhum alerta" não é o app quebrado nem o app com pouco
            // dado: é o resultado da seletividade funcionando (§11.4.6).
            // Uma tela que não explica isso parece defeito.
            <div className="vazio">
              <p>{t("Nada pede atenção nesta semana.", idioma)}</p>
              <p className="campo__nota">
                {alunos.length === 1
                  ? t("O único aluno com acesso treinou dentro do esperado.", idioma)
                  : `${alunos.length} ${t("alunos com acesso treinaram dentro do esperado.", idioma)}`}{" "}
                {t("O lastro só abre um alerta quando o sinal se mantém por semanas.", idioma)}
              </p>
            </div>
          ) : (
            <FilaPersonal itens={itens} idioma={idioma} />
          )}

          <p className="campo__nota titulo-com-dica">
            {t("Como a fila funciona", idioma)}
            <DicaInfo titulo={t("Como a fila funciona", idioma)} idioma={idioma}>
              {t("A fila cobre a última semana fechada e mostra até dois alertas por aluno.", idioma)}
            </DicaInfo>
          </p>

          <Link
            href="/ajustes/personal"
            className="botao-secundario fila-personal-rodape"
          >
            {alunos.length === 0 ? t("Gerar convite", idioma) : t("Convites e alunos", idioma)}
          </Link>
        </div>
      </div>

      <AbaInferior ativa="fila" tipoConta="personal" idioma={idioma} />
    </main>
  );
}
