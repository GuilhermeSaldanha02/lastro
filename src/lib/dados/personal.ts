/**
 * Leitura do módulo Personal — PRD §11.
 *
 * TUDO AQUI RODA COM O JWT DE QUEM CHAMA. Nenhuma função deste arquivo
 * importa `cliente-admin.ts`, e isso é a restrição mais importante do
 * módulo: o atalho óbvio para montar a fila seria ler as séries dos
 * alunos com a chave de serviço, e isso anularia em silêncio toda a RLS
 * da migração 0022 (e a FF5 junto). Se a fila funciona, é porque as
 * policies `treino_visivel_ao_personal` / `serie_visivel_ao_personal`
 * estão corretas — e se elas estiverem erradas, a fila vem VAZIA, que é
 * a falha que se percebe.
 */
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { montarResumoCompacto } from "@/lib/analise/agregar";
import { diasSemEstimuloPorGrupo } from "@/lib/analise/recencia";
import { ehGrupoAcessorio } from "@/lib/analise/grupos-acessorios";
import {
  montarFilaDoAluno,
  type AlertaEmitido,
  type AlertaPersonal,
  type TipoAlerta,
} from "@/lib/analise/fila-personal";
import { SEMANAS_SUPRESSAO_ALERTA } from "@/lib/analise/limiares";
import {
  listarSemanas,
  paraDataUTC,
  paraISO,
  semanaAnaliseAtual,
  somarDias,
} from "@/lib/analise/semanas";
import type { ExercicioBruto, TreinoBruto } from "@/lib/analise/tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { conteudoDoAlerta, rascunhoWhatsApp, type ConteudoAlerta } from "@/lib/texto/alerta-personal";
import { linkWhatsApp } from "@/lib/texto/whatsapp";

type ClienteServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

export type EstadoVinculo = "pendente" | "aceito" | "revogado";

export type ConviteDoPersonal = {
  id: string;
  codigo: string;
  criadoEm: string;
};

export type AlunoVinculado = {
  vinculoId: string;
  alunoId: string;
  nome: string;
  telefoneWhatsApp: string | null;
  aceitoEm: string | null;
};

/** O que a tela do aluno precisa saber sobre o vínculo dele. */
export type VinculoDoAluno = {
  vinculoId: string;
  nomeDoPersonal: string;
  aceitoEm: string | null;
};

/** Um card da fila, pronto para desenhar. */
export type ItemDaFila = {
  alertaId: string;
  aluno: { id: string; nome: string };
  alerta: AlertaPersonal;
  conteudo: ConteudoAlerta;
  /** `null` quando o aluno não tem telefone salvo — a tela precisa dizer isso. */
  linkWhatsApp: string | null;
  acionadoEm: string | null;
};

async function usuarioAtual(supabase: ClienteServidor) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sessão ausente — usuário não autenticado.");
  return user;
}

/**
 * Nomes dos usuários informados. Só volta quem a RLS permite: aluno de
 * vínculo aceito (`usuario_visivel_ao_personal`) ou o personal do próprio
 * aluno (`usuario_personal_visivel_ao_aluno`). Id que não passa pela RLS
 * simplesmente não vem — não é erro.
 */
async function carregarPerfis(
  supabase: ClienteServidor,
  ids: string[],
): Promise<Map<string, { nome: string; telefone: string | null }>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("usuario")
    .select("id, nome, telefone_whatsapp")
    .in("id", ids);
  if (error) throw new Error(`Falha ao carregar perfis: ${error.message}`);
  return new Map(
    (data ?? []).map((u) => [
      u.id as string,
      { nome: (u.nome as string) ?? "", telefone: (u.telefone_whatsapp as string | null) ?? null },
    ]),
  );
}

/** Convites que ninguém aceitou ainda. */
export async function listarConvitesPendentes(): Promise<ConviteDoPersonal[]> {
  const supabase = await criarClienteServidor();
  const user = await usuarioAtual(supabase);
  const { data, error } = await supabase
    .from("vinculo_personal")
    .select("id, codigo, criado_em")
    .eq("personal_id", user.id)
    .eq("estado", "pendente")
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao carregar convites: ${error.message}`);
  return (data ?? []).map((c) => ({
    id: c.id as string,
    codigo: c.codigo as string,
    criadoEm: c.criado_em as string,
  }));
}

/** Os alunos que aceitaram. É isto que faz a conta ser "de personal". */
export async function listarAlunosVinculados(): Promise<AlunoVinculado[]> {
  const supabase = await criarClienteServidor();
  const user = await usuarioAtual(supabase);

  const { data, error } = await supabase
    .from("vinculo_personal")
    .select("id, aluno_id, aceito_em")
    .eq("personal_id", user.id)
    .eq("estado", "aceito")
    .order("aceito_em", { ascending: true });
  if (error) throw new Error(`Falha ao carregar alunos: ${error.message}`);

  const linhas = data ?? [];
  const perfis = await carregarPerfis(
    supabase,
    linhas.map((l) => l.aluno_id as string),
  );

  return linhas.map((l) => {
    const perfil = perfis.get(l.aluno_id as string);
    return {
      vinculoId: l.id as string,
      alunoId: l.aluno_id as string,
      // Nome ausente é possível (RLS recusou, conta apagada no meio) — a
      // tela recebe um rótulo honesto em vez de string vazia.
      nome: perfil?.nome || "Aluno",
      telefoneWhatsApp: perfil?.telefone ?? null,
      aceitoEm: (l.aceito_em as string | null) ?? null,
    };
  });
}

/**
 * O vínculo do aluno logado, se existir. Um aluno tem no máximo um
 * personal aceito ao mesmo tempo (índice `vinculo_aluno_um_personal`).
 */
export async function carregarVinculoDoAluno(): Promise<VinculoDoAluno | null> {
  const supabase = await criarClienteServidor();
  const user = await usuarioAtual(supabase);

  const { data, error } = await supabase
    .from("vinculo_personal")
    .select("id, personal_id, aceito_em")
    .eq("aluno_id", user.id)
    .eq("estado", "aceito")
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar vínculo: ${error.message}`);
  if (!data) return null;

  const perfis = await carregarPerfis(supabase, [data.personal_id as string]);
  return {
    vinculoId: data.id as string,
    nomeDoPersonal: perfis.get(data.personal_id as string)?.nome || "Seu personal",
    aceitoEm: (data.aceito_em as string | null) ?? null,
  };
}

// `contaEPersonal()` morou aqui e foi REMOVIDA em 2026-09-12. Ela nasceu
// contando alunos (quando o vínculo era o papel), foi reescrita para ler
// `tipo_conta` na migração 0024, e nunca teve um chamador: a casca usa
// `obterPerfil().tipoConta`, que já vem no mesmo `select` da barra de topo.
// Duas funções respondendo "esta conta é de personal?" é exatamente onde
// uma delas fica para trás na próxima mudança — a fonte única é o perfil.

// ============================================================
// A fila
// ============================================================

type LinhaSerie = {
  id: string;
  exercicio_id: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  peso_por_lado: boolean;
};

type LinhaTreino = { id: string; data: string; serie: LinhaSerie[] | null };

/**
 * Treinos de UM aluno, sob o JWT do personal. O `.eq("usuario_id", ...)`
 * não é o que protege nada — a policy é. Ele está aqui porque sem filtro
 * a consulta traria os treinos do PERSONAL junto (a policy
 * `treino_proprio` continua valendo para ele), e o resumo sairia
 * misturando duas pessoas.
 */
async function carregarTreinosDoAluno(
  supabase: ClienteServidor,
  alunoId: string,
): Promise<TreinoBruto[]> {
  const { data, error } = await supabase
    .from("treino")
    .select("id, data, serie (id, exercicio_id, tipo, reps, peso, rir, peso_por_lado)")
    .eq("usuario_id", alunoId);
  if (error) throw new Error(`Falha ao carregar treinos do aluno: ${error.message}`);

  return ((data ?? []) as unknown as LinhaTreino[]).map((t) => ({
    id: t.id,
    data: t.data,
    series: (t.serie ?? []).map((s) => ({
      id: s.id,
      exercicioId: s.exercicio_id,
      tipo: s.tipo,
      reps: s.reps,
      peso: Number(s.peso),
      rir: s.rir ?? undefined,
      pesoPorLado: s.peso_por_lado,
    })),
  }));
}

/**
 * Catálogo — dado compartilhado, sem RLS por usuário. Sempre em pt-BR:
 * a fila é a tela de trabalho do personal, e o idioma do ALUNO não deve
 * decidir como o nome do exercício chega ao profissional. (Idioma da
 * interface do personal é assunto separado, não desta fatia.)
 */
async function carregarCatalogo(
  supabase: ClienteServidor,
): Promise<ExercicioBruto[]> {
  const { data, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral, peso_por_lado");
  if (error) throw new Error(`Falha ao carregar catálogo: ${error.message}`);
  return (data ?? []).map((e) => ({
    id: e.id as string,
    nome: e.nome as string,
    grupoMuscularPrimario: e.grupo_muscular_primario as string,
    unilateral: e.unilateral as boolean,
    pesoPorLado: e.peso_por_lado as boolean,
    grupoAcessorio: ehGrupoAcessorio(e.grupo_muscular_primario as string),
  }));
}

/** Alertas já emitidos na janela de supressão, para não repetir o que já foi dito. */
async function carregarAlertasEmitidos(
  supabase: ClienteServidor,
  vinculoIds: string[],
  semanaAtual: string,
): Promise<Map<string, AlertaEmitido[]>> {
  const porVinculo = new Map<string, AlertaEmitido[]>();
  if (vinculoIds.length === 0) return porVinculo;

  // Inclui a própria semana: a fila é regravada a cada abertura da tela e
  // precisa reconhecer as linhas que ela mesma já gravou hoje (o corte da
  // semana 0 é feito dentro de `montarFilaDoAluno`).
  const desde = listarSemanas(semanaAtual, SEMANAS_SUPRESSAO_ALERTA)[0];

  const { data, error } = await supabase
    .from("alerta_personal")
    .select("vinculo_id, tipo, alvo, semana_inicio")
    .in("vinculo_id", vinculoIds)
    .gte("semana_inicio", desde);
  if (error) throw new Error(`Falha ao carregar alertas emitidos: ${error.message}`);

  for (const linha of data ?? []) {
    const id = linha.vinculo_id as string;
    const lista = porVinculo.get(id) ?? [];
    lista.push({
      tipo: linha.tipo as TipoAlerta,
      alvo: linha.alvo as string,
      semanaInicio: linha.semana_inicio as string,
    });
    porVinculo.set(id, lista);
  }
  return porVinculo;
}

/**
 * A FILA DO PERSONAL — o que o §11.4.5 chama de "o alerta espera na fila".
 *
 * Ela é calculada na leitura, não empurrada por notificação: o personal lê
 * no momento em que já está decidindo (a segunda de planejamento), que é o
 * formato que as duas entrevistas descreveram como o único que funciona.
 *
 * A gravação acontece aqui, na leitura, e é idempotente pelo índice único
 * `alerta_unico_por_semana`. Abrir a tela duas vezes na mesma semana não
 * duplica alerta nenhum. Gravar existe por dois motivos: a medida da
 * §11.7 ("o grupo alertado recebeu estímulo na semana seguinte?") e a
 * supressão de repetição entre semanas.
 */
export async function carregarFilaDoPersonal(
  idioma: Idioma,
  agora: Date = new Date(),
): Promise<{
  semanaInicio: string;
  itens: ItemDaFila[];
  alunos: AlunoVinculado[];
}> {
  const supabase = await criarClienteServidor();
  const alunos = await listarAlunosVinculados();
  const semanaInicio = semanaAnaliseAtual(agora);

  if (alunos.length === 0) return { semanaInicio, itens: [], alunos };

  const [catalogo, emitidosPorVinculo] = await Promise.all([
    carregarCatalogo(supabase),
    carregarAlertasEmitidos(
      supabase,
      alunos.map((a) => a.vinculoId),
      semanaInicio,
    ),
  ]);
  const exerciciosPorId = new Map(catalogo.map((e) => [e.id, e]));

  // A data de referência da recência é o FIM da semana analisada, não
  // "hoje": a semana ISO fecha na segunda (`semanaAnaliseAtual`), e medir
  // dias parados contra hoje faria o mesmo alerta mudar de número ao
  // longo da semana sem nada ter acontecido no treino.
  const hojeParaRecencia = paraISO(somarDias(paraDataUTC(semanaInicio), 6));

  const filaPorAluno = await Promise.all(
    alunos.map(async (aluno) => {
      const treinos = await carregarTreinosDoAluno(supabase, aluno.alunoId);

      const resumo = montarResumoCompacto({ treinos, exercicios: catalogo, agora });

      // Mesma derivação de `recencia-grupos.ts`, só que para o aluno: o
      // grupo vem do catálogo, a data vem do treino, e só série VALENDO
      // entra (FF4).
      const seriesParaRecencia = treinos.flatMap((t) =>
        t.series
          .filter((s) => s.tipo === "valendo")
          .map((s) => ({
            grupoMuscular:
              exerciciosPorId.get(s.exercicioId)?.grupoMuscularPrimario ?? "",
            data: t.data,
          })),
      );
      const recencia = diasSemEstimuloPorGrupo(
        seriesParaRecencia,
        hojeParaRecencia,
      );

      const alertas = montarFilaDoAluno({
        resumo,
        recencia,
        semanaInicio,
        alertasEmitidos: emitidosPorVinculo.get(aluno.vinculoId) ?? [],
      });

      return { aluno, alertas };
    }),
  );

  const paraGravar = filaPorAluno.flatMap(({ aluno, alertas }) =>
    alertas.map((a) => ({
      vinculo_id: aluno.vinculoId,
      semana_inicio: semanaInicio,
      tipo: a.tipo,
      alvo: a.alvo,
      prioridade: a.prioridade,
    })),
  );

  if (paraGravar.length > 0) {
    const { error } = await supabase
      .from("alerta_personal")
      .upsert(paraGravar, {
        onConflict: "vinculo_id,semana_inicio,tipo,alvo",
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`Falha ao registrar alertas: ${error.message}`);
  }

  // Relê para pegar o `id` e o `acionado_em` das linhas — inclusive das
  // que já existiam de uma abertura anterior nesta mesma semana.
  const { data: linhas, error: erroLeitura } = await supabase
    .from("alerta_personal")
    .select("id, vinculo_id, tipo, alvo, acionado_em")
    .in(
      "vinculo_id",
      alunos.map((a) => a.vinculoId),
    )
    .eq("semana_inicio", semanaInicio);
  if (erroLeitura) throw new Error(`Falha ao reler alertas: ${erroLeitura.message}`);

  const idPorChave = new Map(
    (linhas ?? []).map((l) => [
      `${l.vinculo_id}|${l.tipo}|${l.alvo}`,
      { id: l.id as string, acionadoEm: (l.acionado_em as string | null) ?? null },
    ]),
  );

  const itens: ItemDaFila[] = [];
  for (const { aluno, alertas } of filaPorAluno) {
    for (const alerta of alertas) {
      const linha = idPorChave.get(`${aluno.vinculoId}|${alerta.tipo}|${alerta.alvo}`);
      // Sem linha não há como registrar o acionamento (§11.7), e um card
      // sem id viraria botão que não mede nada. Pular é melhor que mentir.
      if (!linha) continue;
      itens.push({
        alertaId: linha.id,
        aluno: { id: aluno.alunoId, nome: aluno.nome },
        alerta,
        conteudo: conteudoDoAlerta(alerta, aluno.nome, idioma),
        linkWhatsApp: aluno.telefoneWhatsApp
          ? linkWhatsApp(aluno.telefoneWhatsApp, rascunhoWhatsApp(alerta, aluno.nome, idioma))
          : null,
        acionadoEm: linha.acionadoEm,
      });
    }
  }

  // Ordem entre alunos: o alerta mais urgente primeiro, independente de
  // quem é o aluno. A fila é de TRABALHO, não uma lista de pessoas.
  itens.sort(
    (a, b) =>
      b.alerta.prioridade - a.alerta.prioridade ||
      a.aluno.nome.localeCompare(b.aluno.nome),
  );

  return { semanaInicio, itens, alunos };
}

/** Usado pela tela do aluno para saber se falta telefone. */
export async function telefoneDoUsuarioAtual(): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const user = await usuarioAtual(supabase);
  const { data, error } = await supabase
    .from("usuario")
    .select("telefone_whatsapp")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar telefone: ${error.message}`);
  return (data?.telefone_whatsapp as string | null) ?? null;
}
