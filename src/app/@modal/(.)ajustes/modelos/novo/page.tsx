// lastro · H1 — intercepta `<Link href="/ajustes/modelos/novo">` (soft nav,
// a partir de `/ajustes/modelos`) e renderiza como folha, mesmo mecanismo de
// `(.)perfil`/`(.)ajustes/anilhas`. `(.)ajustes/modelos/novo` segue o mesmo
// marcador relativo à raiz de `app/` (não conta `@modal` como segmento).
// Acesso direto por URL/refresh continua caindo em
// `src/app/ajustes/modelos/novo/page.tsx`, a rota completa, intocada.
//
// Os "2 passos" do formulário (grupo → exercícios) NÃO empilham hierarquia
// dentro da folha — são estado de cliente (`gruposEscolhidos`) trocando o
// que renderiza, sem rota nova nem entrada de histórico própria, o mesmo
// "Trocar grupo" que já existia antes desta conversão. O HIG proíbe
// apresentar OUTRA rota/nível de navegação dentro da folha, não isso.
import { listarCatalogo } from "@/lib/dados/treino";
import ModeloTreinoForm from "@/components/modelo-treino-form";
import Folha from "@/components/folha";

export default async function NovoModeloInterceptado() {
  const exercicios = await listarCatalogo();

  return (
    <Folha titulo="Novo modelo">
      <ModeloTreinoForm exercicios={exercicios} naFolha />
    </Folha>
  );
}
