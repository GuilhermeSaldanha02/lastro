// lastro · tela própria do parecer aberto — substitui a expansão inline
// dentro de /ajustes/relatorios (achado do dono, 2026-09-02: dois
// back-arrows empilhados quando era expansão na mesma página). Rota
// real: back nativo do navegador e o back-arrow do cabeçalho fazem a
// mesma coisa, sem estado extra pra sincronizar entre header e lista.
import { notFound, redirect } from "next/navigation";
import { buscarParecer } from "@/lib/dados/parecer";
import { obterPerfil } from "@/lib/dados/perfil";
import CabecalhoPro from "@/components/cabecalho-pro";
import AbaInferior from "@/components/aba-inferior";
import Parecer from "@/components/parecer";
import ParecerDetalheAcoes from "@/components/parecer-detalhe-acoes";
import { t } from "@/lib/texto/i18n";

export default async function PaginaParecerDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await obterPerfil();
  if (!perfil) {
    redirect(`/login?proximo=/ajustes/relatorios/parecer/${id}`);
  }

  const idioma = perfil.idioma ?? "pt-BR";
  const parecer = await buscarParecer(id);
  if (!parecer) {
    notFound();
  }
  if (!parecer.texto || !parecer.evidencia) {
    // Só acontece se alguém navegar direto pra um rascunho ainda
    // 'gerando' (sem link real na UI pra isso) — trata como não
    // encontrado em vez de estourar a tela.
    notFound();
  }

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Pareceres salvos", idioma)}
        voltarHref="/ajustes/relatorios"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <Parecer
          pergunta={parecer.perguntaTexto}
          texto={parecer.texto}
          avisoFalhaInterpretativa={parecer.avisoFalhaInterpretativa}
          falhaMotivo={parecer.falhaMotivo}
          evidencia={parecer.evidencia}
          idioma={parecer.idioma}
          emitidoEm={parecer.criadoEm}
        />

        <ParecerDetalheAcoes parecer={parecer} idioma={idioma} />
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
