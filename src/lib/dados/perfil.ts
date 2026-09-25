// lastro · PROGRESS.md pendência 4 — perfil do usuário (nome, foto).
// A criação da linha em `usuario` é responsabilidade do trigger da
// migração 0004 (dispara no INSERT em auth.users); este arquivo só lê o
// perfil já existente e, no caso do Google, baixa o avatar pra Storage.
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Idioma } from "@/lib/dados/idioma";

export type Perfil = {
  nome: string;
  avatarUrl: string | null;
  /** null = dono nunca definiu (T4) — Home não mostra fração nem barra. */
  metaTreinosSemana: number | null;
  /**
   * `usuario.idioma` cru (migração 0012) — pode ser `null` até a pessoa
   * escolher em /ajustes. Quem consome isto pra decidir o que EXIBIR
   * (não pra decidir o que gravar) resolve o `null` para `"pt-BR"` no
   * ponto de uso, igual `obterIdioma()` faz — não aqui, porque este tipo
   * também alimenta a tela de ajustes, que precisa saber a diferença
   * entre "nunca escolheu" e "escolheu pt-BR".
   */
  idioma: Idioma | null;
  /**
   * `aluno` ou `personal` (migração 0024). Fica no perfil, e não numa
   * consulta própria, porque TODA tela já chama `obterPerfil()` para a
   * barra de topo — a casca do personal precisa deste valor em toda tela,
   * e uma função separada custaria uma consulta a mais por página para
   * responder algo que já veio no mesmo `select`.
   */
  tipoConta: "aluno" | "personal";
  /** Registro informado, NUNCA verificado (`texto/cref.ts`). `null` é estado legítimo. */
  cref: string | null;
  /**
   * A casca que o app renderiza (migração 0025, PRD §11 emenda
   * 2026-09-12 (2)). Desde então `tipoConta = "personal"` quer dizer "tem
   * área de trabalho", não "não treina": a mesma conta alterna entre os
   * dois modos, e é ESTE campo que os guardas de rota leem.
   */
  modo: "treino" | "trabalho";
  /**
   * `false` só na conta recém-criada pelo Google, que ainda não escolheu
   * entre usuário e personal (migração 0026). Enquanto for `false`, os
   * guardas mandam para `/boas-vindas`.
   */
  tipoEscolhido: boolean;
  /** `false` na conta nova que ainda não passou nem pulou o onboarding (PU-08). */
  onboardingConcluido: boolean;
  /**
   * Id da conta (`auth.users.id`). Vem da sessão do SERVIDOR, no render: é
   * o que marca de quem é cada item da fila offline (achado M1), e segue
   * valendo mesmo que o token do navegador expire no meio do treino.
   */
  id: string;
};

export async function obterPerfil(): Promise<Perfil | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuario")
    .select("nome, avatar_url, meta_treinos_semana, idioma, tipo_conta, cref, modo_ativo, tipo_escolhido, onboarding_concluido_em")
    .eq("id", user.id)
    .maybeSingle();

  // O trigger da 0004 garante que a linha existe pra toda conta nova;
  // null aqui só acontece se o backfill ainda não rodou nesta base.
  if (!data) return null;
  return {
    nome: data.nome,
    avatarUrl: data.avatar_url,
    metaTreinosSemana: data.meta_treinos_semana,
    idioma: data.idioma as Idioma | null,
    // Falha FECHADA, como o trigger: qualquer coisa que não seja
    // exatamente 'personal' é aluno. A casca de trabalho não se abre por
    // valor inesperado vindo do banco.
    tipoConta: data.tipo_conta === "personal" ? "personal" : "aluno",
    cref: (data.cref as string | null) ?? null,
    // Mesma falha fechada: trabalho só com as DUAS condições. O banco já
    // garante isso por check; repetir aqui impede que um valor inesperado
    // abra a fila para quem não tem área de trabalho.
    modo:
      data.tipo_conta === "personal" && data.modo_ativo === "trabalho"
        ? "trabalho"
        : "treino",
    // Só `false` explícito é pendente. Valor inesperado conta como já
    // escolhido: a conta segue usuário, e ninguém fica preso na escolha.
    tipoEscolhido: data.tipo_escolhido !== false,
    // Só vazio explícito é pendente; falha de leitura não pode prender ninguém no passo a passo.
    onboardingConcluido: data.onboarding_concluido_em !== null,
    id: user.id,
  };
}

const CAMINHO_BUCKET = "avatares";

/**
 * Baixa a foto do Google pro Storage do projeto e grava a URL pública em
 * `usuario.avatar_url`. Chamada só depois de login com sessão real — nunca
 * bloqueia o fluxo de auth: quem chama envolve isto em try/catch e ignora
 * falha (DECISIONS.md 2026-08-07 — o Google pode mudar a URL ou dar 404 a
 * qualquer momento, e isso não pode derrubar o login).
 */
export async function sincronizarAvatarGoogle(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const avatarGoogle = user.user_metadata?.avatar_url as string | undefined;
  if (!avatarGoogle) return;

  const { data: perfil } = await supabase
    .from("usuario")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  // Já baixado nesta conta — não repetir a cada login (o `?` acima cobre
  // a linha não existir ainda, embora o trigger já devesse ter criado).
  if (!perfil || perfil.avatar_url) return;

  const resposta = await fetch(avatarGoogle);
  if (!resposta.ok) return;

  const bytes = await resposta.arrayBuffer();
  const tipo = resposta.headers.get("content-type") ?? "image/jpeg";
  const extensao = tipo.includes("png") ? "png" : "jpg";
  const caminho = `${user.id}/avatar.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(CAMINHO_BUCKET)
    .upload(caminho, bytes, { contentType: tipo, upsert: true });
  if (erroUpload) return;

  const {
    data: { publicUrl },
  } = supabase.storage.from(CAMINHO_BUCKET).getPublicUrl(caminho);

  await supabase.from("usuario").update({ avatar_url: publicUrl }).eq("id", user.id);
}
