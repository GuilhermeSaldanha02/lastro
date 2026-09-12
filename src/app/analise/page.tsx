// lastro · SDD.md §7.1 — casca de servidor da tela da Análise Semanal.
// Vira Server Component na pendência 4 (PROGRESS.md) pra poder buscar o
// perfil (nome/foto) com `cookies()` antes de renderizar a barra de topo;
// a parte interativa (perguntas, chamada à API) vive em
// `components/analise-interativa.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import { exigirCascaDeAluno } from "@/lib/dados/casca";
import { carregarResumoHome } from "@/lib/dados/resumo-home";
import { carregarDiasSemEstimuloPorGrupo } from "@/lib/dados/recencia-grupos";
import { carregarSinalDeload } from "@/lib/dados/alerta-deload";
import { buscarRascunhoEmAndamento } from "@/lib/dados/parecer";
import { carregarVinculoDoAluno } from "@/lib/dados/personal";
import { paraDataUTC } from "@/lib/analise/semanas";
import { dataLocalBrasil } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import AnaliseInterativa from "@/components/analise-interativa";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";

export default async function PaginaAnalise() {
  const hoje = dataLocalBrasil();
  // O vínculo entra no mesmo `Promise.all` de propósito: ele decide QUAL
  // pergunta fica em destaque (PRD §11.4.2), então buscar em série
  // adiaria a primeira pintura da peça-assinatura por uma consulta.
  const [perfil, resumo, gruposSemEstimulo, sinalDeload, rascunhoInicial, vinculo] =
    await Promise.all([
      obterPerfil(),
      carregarResumoHome(hoje),
      carregarDiasSemEstimuloPorGrupo(hoje),
      carregarSinalDeload(paraDataUTC(hoje)),
      buscarRascunhoEmAndamento(),
      carregarVinculoDoAluno(),
    ]);
  exigirCascaDeAluno(perfil);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Análise Semanal", idioma)}
        destaque={t("Ciclo", idioma)}
        mostrarLogo={true}
        perfil={perfil}
        idioma={idioma}
      />

      <AnaliseInterativa
        semanasFechadasComTreino={resumo.semanasFechadasComTreino}
        gruposSemEstimulo={gruposSemEstimulo}
        sinalDeload={sinalDeload}
        idioma={idioma}
        rascunhoInicial={rascunhoInicial}
        vinculo={
          vinculo
            ? { nomeDoPersonal: vinculo.nomeDoPersonal, aceitoEm: vinculo.aceitoEm }
            : null
        }
      />

      <AbaInferior ativa="analise" idioma={idioma} tipoConta={perfil?.tipoConta} />
    </main>
  );
}
