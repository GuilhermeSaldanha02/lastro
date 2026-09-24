"use client";

// lastro · D6 — a série é gravada local (fila offline) e a lista atualiza
// na hora; a chamada de rede (`criarSerieRemoto`) roda em segundo plano,
// sem o dono esperar. Se a rede caiu no meio do treino (PRD J1, "o
// elevador derruba o sinal"), o registro continua funcionando — a série
// fica na fila até o próximo evento `online`.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ExercicioDoCatalogo, Serie } from "@/lib/dados/treino";
import { historicoDoExercicio } from "@/lib/dados/treino";
import { enfileirar } from "@/lib/offline/outbox";
import { sincronizarPendentes } from "@/lib/offline/sincronizar-pendentes";
import {
  ouvirPedidosDeSincronizacao,
  pedirSincronizacaoEmSegundoPlano,
} from "@/lib/offline/sincronizacao-em-segundo-plano";
import FormularioSerie, { type DadosNovaSerie } from "./formulario-serie";
import EditarSerie, { type DadosEdicaoSerie } from "./editar-serie";
import SeletorGrupoMuscular, { type OpcaoGrupo } from "./seletor-grupo-muscular";
import BotaoFecharCartao, { comportamentoDeRolagem } from "./botao-fechar-cartao";
import TimerTopo from "./timer-topo";
import { useDescansoReal } from "./use-descanso-real";
import RelatorioPosTreino from "./relatorio-pos-treino";
import { assinarMarcos, estaFinalizado, marcarFim, reabrir } from "@/lib/treino/marcos-treino";
import { criarGuardaDeToque, toqueCedoDemais } from "@/lib/treino/toque-duplo";
import {
  calcularMetricasSessao,
  duracaoSessaoSegundos,
  ultimaSerieEm,
} from "@/lib/dados/metricas-treino";
import { gruposConhecidos } from "@/lib/dados/grupos-conhecidos";
import {
  atualizarPlanoDoExercicio,
  type ExercicioDoModelo,
} from "@/lib/dados/modelo-treino";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";
import type { DescansoConcluido } from "@/lib/treino/descanso-real";
import {
  formatarDescansoReal,
  marcadoresDaSerie,
  resumirSeriesValendo,
  unidadeDaCarga,
} from "@/lib/treino/apresentacao-series";

/**
 * `ehRecordePessoal` é só de tela (C4) — nunca persiste no banco, nunca
 * entra em `NovaSerieInput`. É calculado no momento do registro e existe
 * só pra marcar o selo na hora; recarregar a página não precisa lembrar
 * disso (o registro em si não se perde, só o selo).
 */
type SerieUI = Serie & { ehRecordePessoal?: boolean };

/**
 * Agrupa as séries por exercício, preservando a ordem de primeira
 * aparição — é assim que a tela do treino se lê (DESIGN.md §3.5). A
 * contagem exposta é só de séries VALENDO: aquecimento não entra em
 * volume, e1RM nem contagem (PRD A2).
 */
function agruparPorExercicio(series: SerieUI[]) {
  const grupos: { exercicioId: string; nome: string; series: SerieUI[] }[] = [];
  for (const serie of series) {
    const existente = grupos.find((g) => g.exercicioId === serie.exercicioId);
    if (existente) {
      existente.series.push(serie);
    } else {
      grupos.push({
        exercicioId: serie.exercicioId,
        nome: serie.exercicioNome,
        series: [serie],
      });
    }
  }
  return grupos;
}

/**
 * Lê **puro**, sem escrever nada — mesmo motivo do `calcularSegundosTreino`
 * de `timer-topo.tsx`: é o `getSnapshot` de um `useSyncExternalStore`, e
 * roda DURANTE o render, onde `setState` é proibido. Devolve `false` no
 * servidor, onde `localStorage` não existe.
 *
 * Antes disso era `useState(() => localStorage...)` — o inicializador só
 * roda no cliente com o valor real, então reabrir um treino já finalizado
 * (numa sessão anterior) fazia o servidor renderizar "Finalizar Treino" e
 * o cliente hidratar direto pra "Ver Relatório do Treino": erro de
 * hidratação real, achado numa auditoria de QA revisitando um treino de
 * teste concluído (2026-08-28). `useSyncExternalStore` resolve isso do
 * mesmo jeito que já resolvia pro cronômetro — o servidor e a PRIMEIRA
 * pintura do cliente concordam (`false` nos dois), e o valor real aparece
 * no próximo render depois disso, sem inicializador divergente.
 */
function treinoFoiFinalizado(treinoId: string): boolean {
  return estaFinalizado(treinoId);
}

export default function TreinoDetalhe({
  treinoId,
  iniciadoEm,
  seriesIniciais,
  exercicios,
  exerciciosPreSelecionados,
  modeloId,
  idioma,
  usuarioId,
}: {
  /** Conta logada — dona de cada item que esta tela põe na fila (achado M1). */
  usuarioId?: string;
  treinoId: string;
  /** `treino.iniciado_em` — âncora de tempo comum ao cronômetro e aos dois relatórios. */
  iniciadoEm: string;
  seriesIniciais: Serie[];
  exercicios: ExercicioDoCatalogo[];
  /** Vem de um modelo escolhido ao iniciar o treino (SDD §9.3) — exercícios
   * sem nenhuma série ainda. `agruparPorExercicio` não consegue expressar
   * isso (só cria grupo a partir de série existente), por isso é uma prop
   * separada, renderizada ao lado, nunca dentro dela. */
  exerciciosPreSelecionados?: ExercicioDoModelo[];
  /** Modelo de origem, quando o treino veio de um. `undefined` num treino
   *  novo — e é o que faz o `+` com plano NÃO aparecer ali (ADR-010). */
  modeloId?: string;
  idioma: Idioma;
}) {
  const [series, setSeries] = useState<SerieUI[]>(seriesIniciais);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  // D7 — reflete a fila de verdade: só vira "sincronizado" quando uma
  // drenagem termina sem falha. Nunca é apresentado como erro.
  // Revisto a pedido do dono (2026-09-23, DECISIONS): o aviso só aparece na
  // tela enquanto há série esperando a rede; com tudo no servidor ele sai da
  // vista e fica só para leitor de tela. Começa `true` porque, antes da
  // primeira drenagem, não há nada a avisar — a drenagem da montagem corrige.
  const [sincronizado, setSincronizado] = useState(true);
  // Série recém-gravada que a tela deve trazer para a vista (pedido do dono,
  // 2026-09-23): o formulário fecha e a série nova ficava cortada atrás da
  // faixa de ações.
  const [rolarParaSerie, setRolarParaSerie] = useState<string | null>(null);
  const [confirmacaoDescanso, setConfirmacaoDescanso] = useState<string | null>(null);
  // Grupo(s) musculares do dia (pedido do dono, 2026-08-07) — filtra o
  // exercício mostrado no formulário. Vive só nesta sessão de treino, não
  // é persistido: o app não prescreve programa (PRD §5, escopo negativo),
  // isto é conveniência de tela, não um plano salvo.
  //
  // Começa PREENCHIDO sempre que o treino já diz quais exercícios são
  // (achado do dono, 2026-08-26): perguntar "qual grupo muscular?" logo
  // abaixo de uma lista dos exercícios do próprio modelo é pedir uma
  // informação que a tela acabou de exibir. Duas fontes, ambas já
  // conhecidas sem perguntar nada:
  //   1. o modelo escolhido ao iniciar o treino (SDD §9.3);
  //   2. as séries já registradas — cobre o recarregar no meio do treino,
  //      quando o modelo já saiu de cena (`series.length > 0` zera
  //      `exerciciosPreSelecionados` em `treino/[id]/page.tsx`).
  // Sem nenhuma das duas (o "Treino novo" puro, sem série ainda), continua
  // vazio e o seletor aparece — ali a pergunta é legítima, nada é sabido.
  const [gruposEscolhidos, setGruposEscolhidos] = useState<string[]>(() =>
    gruposConhecidos(exercicios, seriesIniciais, exerciciosPreSelecionados),
  );
  /** Valores com que o formulário abre quando veio do `+` do modelo.
   *  `null` = formulário normal, em branco. */
  const [preenchimento, setPreenchimento] = useState<{
    exercicioId: string;
    reps: number;
    peso: number;
  } | null>(null);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  // Confirmação inline de "Finalizar Treino". Nasceu de relato de uso real
  // (2026-09-03): o dono encostou no botão sem querer, o cronômetro
  // congelou e não havia volta. O custo é real — mesma lógica do PRD §4.1
  // ("toda exclusão pede confirmação inline") e do "Descartar" rascunho da
  // PR #181, que também não era só simetria.
  const [confirmandoFim, setConfirmandoFim] = useState(false);
  // TR-11 e TR-13 (QA.md, 2026-09-23): o 2º toque de um toque duplo gravava
  // outra série em "Repetir série" e caía no "Finalizar" da confirmação, que
  // nasce sob o dedo. Ver `toque-duplo.ts`.
  const [guardaRepetir] = useState(() => criarGuardaDeToque());
  const confirmacaoAbertaEm = useRef<number | null>(null);
  // Assinatura de VERDADE agora (`assinarMarcos`): `marcarFim` e `reabrir`
  // notificam, então a releitura é consequência da escrita. Antes era uma
  // assinatura vazia que dependia de algum outro setState do mesmo handler
  // forçar o render — funcionava por sorte, e "reabrir" não teria essa
  // sorte, porque o clique dele mexe só no localStorage.
  const lerConcluido = useCallback(() => treinoFoiFinalizado(treinoId), [treinoId]);
  const treinoConcluido = useSyncExternalStore(
    assinarMarcos,
    lerConcluido,
    () => false,
  );
  const grupos = useMemo(() => agruparPorExercicio(series), [series]);
  const ultima = series[series.length - 1];

  // Filtra os já pré-selecionados que já viraram grupo de verdade (primeira
  // série registrada) — evita seção duplicada.
  const pendentesDoModelo = useMemo(() => {
    if (!exerciciosPreSelecionados) return [];
    const jaTemGrupo = new Set(grupos.map((g) => g.exercicioId));
    return exerciciosPreSelecionados.filter((e) => !jaTemGrupo.has(e.exercicioId));
  }, [exerciciosPreSelecionados, grupos]);

  const opcoesGrupo = useMemo<OpcaoGrupo[]>(() => {
    const porId = new Map<string, string>();
    for (const e of exercicios) porId.set(e.grupoMuscularPrimario, e.grupoMuscularNome);
    return Array.from(porId.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, idioma));
  }, [exercicios, idioma]);

  const exerciciosFiltrados = useMemo(
    () => exercicios.filter((e) => gruposEscolhidos.includes(e.grupoMuscularPrimario)),
    [exercicios, gruposEscolhidos],
  );

  /** Drena a fila e reflete o resultado no indicador de sync (D7). */
  const drenar = useCallback(async () => {
    const resultado = await sincronizarPendentes();
    setSincronizado(!resultado.falhou);
    return resultado;
  }, []);

  const registrarDescansoConcluido = useCallback(
    async ({ serieId, descansoRealSegundos }: DescansoConcluido) => {
      setSeries((atuais) =>
        atuais.map((serie) =>
          serie.id === serieId ? { ...serie, descansoRealSegundos } : serie,
        ),
      );
      await enfileirar(
        "atualizar_descanso_serie",
        { id: serieId, descansoRealSegundos },
        usuarioId,
      );
      // Tenta subir na hora: com rede, o aviso nem aparece; sem rede, a
      // drenagem falha e o "salvo no aparelho" entra na tela.
      void drenar();
      setConfirmacaoDescanso(
        t("Descanso registrado: {tempo}", idioma).replace(
          "{tempo}",
          formatarDescansoReal(descansoRealSegundos),
        ),
      );
    },
    [drenar, idioma, usuarioId],
  );

  const descanso = useDescansoReal({
    treinoId,
    ultimaSerieId: ultima?.id,
    ultimaSerieJaTemDescanso:
      ultima !== undefined && ultima.descansoRealSegundos !== null,
    aoConcluir: registrarDescansoConcluido,
  });

  useEffect(() => {
    // O dreno da montagem agora ALIMENTA o indicador: como ele só aparece
    // quando há série esperando a rede (D7 revisto, 2026-09-23), abrir o
    // treino sem rede e com fila pendente precisa mostrar o aviso. O estado
    // muda no `.then`, não no corpo do efeito (react-hooks/set-state-in-effect).
    void sincronizarPendentes().then((resultado) => {
      if (resultado.falhou) setSincronizado(false);
    });

    const aoVoltarARede = () => {
      void drenar();
    };
    window.addEventListener("online", aoVoltarARede);
    // Tarefa 2.3 — além do `online` (só funciona com a aba em primeiro
    // plano), o SW pode acordar via Background Sync e avisar por mensagem.
    const pararDeOuvir = ouvirPedidosDeSincronizacao(() => {
      void drenar();
    });
    return () => {
      window.removeEventListener("online", aoVoltarARede);
      pararDeOuvir();
    };
  }, [drenar]);

  useEffect(() => {
    if (!confirmacaoDescanso) return;
    const id = window.setTimeout(() => setConfirmacaoDescanso(null), 4_000);
    return () => window.clearTimeout(id);
  }, [confirmacaoDescanso]);

  /**
   * D3 (PRD §4.1) — "repetir a última série" é a ação mais frequente do
   * app: reaproveita exercício/tipo/reps/peso/RIR da última série e
   * registra de novo, sem passar pelo formulário.
   */
  async function repetirUltimaSerie(): Promise<void> {
    if (!ultima || !guardaRepetir.aceitar(performance.now())) return;
    await registrarSerie({
      exercicioId: ultima.exercicioId,
      tipo: ultima.tipo,
      reps: ultima.reps,
      peso: ultima.peso,
      rir: ultima.rir,
      pesoPorLado: ultima.pesoPorLado,
      // Repetir a série exata que já foi feita não pode superá-la — nunca é PR.
      ehRecordePessoal: false,
    });
  }

  async function registrarSerie(dados: DadosNovaSerie): Promise<void> {
    await descanso.concluir();
    const exercicio = exercicios.find((e) => e.id === dados.exercicioId);
    if (!exercicio) throw new Error("Exercício não encontrado no catálogo.");

    const novaSerie: SerieUI = {
      id: crypto.randomUUID(),
      exercicioId: dados.exercicioId,
      exercicioNome: exercicio.nome,
      exercicioUnilateral: exercicio.unilateral,
      exercicioPesoPorLado: exercicio.pesoPorLado,
      exercicioGrupoMuscular: exercicio.grupoMuscularPrimario,
      tipo: dados.tipo,
      reps: dados.reps,
      peso: dados.peso,
      rir: dados.rir,
      pesoPorLado: dados.pesoPorLado,
      descansoRealSegundos: null,
      ehRecordePessoal: dados.ehRecordePessoal,
      criadoEm: new Date().toISOString(),
    };
    const ordem = series.length + 1;

    // A UI confirma AQUI, antes de qualquer chamada de rede (D6).
    setSeries((atual) => [...atual, novaSerie]);
    setRolarParaSerie(novaSerie.id);

    await enfileirar("criar_serie", {
      id: novaSerie.id,
      treinoId,
      exercicioId: novaSerie.exercicioId,
      ordem,
      tipo: novaSerie.tipo,
      reps: novaSerie.reps,
      peso: novaSerie.peso,
      rir: novaSerie.rir,
      pesoPorLado: novaSerie.pesoPorLado,
    }, usuarioId);

    // Melhor esforço — se não houver rede, a série já está na fila.
    // Pede ao navegador (Background Sync) para tentar de novo quando a
    // rede voltar, mesmo se a aba ficar em segundo plano; o listener
    // `online` acima segue como fallback nos navegadores sem suporte.
    void drenar().then((resultado) => {
      if (resultado.falhou) void pedirSincronizacaoEmSegundoPlano();
    });
  }

  async function registrarPeloFormulario(dados: DadosNovaSerie): Promise<void> {
    await registrarSerie(dados);
    setFormularioAberto(false);

    // Write-back do plano (ADR-010, limites 3 e 4). Só acontece pelo
    // caminho do `+` — `preenchimento` é o que marca esse caminho —, e
    // NUNCA espera nem quebra: a série já foi registrada acima, offline
    // ou não. `atualizarPlanoDoExercicio` não lança, por desenho.
    if (modeloId && preenchimento && dados.exercicioId === preenchimento.exercicioId) {
      void atualizarPlanoDoExercicio(
        modeloId,
        dados.exercicioId,
        dados.reps,
        dados.peso,
      );
    }
    setPreenchimento(null);
  }

  /**
   * Abre o formulário com o exercício do modelo já preenchido.
   *
   * O plano do modelo tem prioridade; quando ele é `null` (modelo antigo,
   * ou campo deixado em branco no cadastro), cai na ÚLTIMA SÉRIE REAL
   * daquele exercício — que é o fallback que a ADR-010 promete, e o que
   * mantém os modelos criados antes desta mudança funcionando.
   *
   * Buscar o histórico pode falhar sem rede; aí abre com o exercício
   * escolhido e os campos vazios, que ainda é melhor que não abrir.
   */
  async function abrirComPlano(exercicio: ExercicioDoModelo): Promise<void> {
    let reps = exercicio.reps;
    let peso = exercicio.peso;

    if (reps === null || peso === null) {
      try {
        const historico = await historicoDoExercicio(exercicio.exercicioId);
        const ultimaReal = historico[0];
        if (ultimaReal) {
          reps = reps ?? ultimaReal.reps;
          peso = peso ?? ultimaReal.peso;
        }
      } catch {
        // Sem rede: segue com o que tiver. D6 — nada aqui pode travar.
      }
    }

    setPreenchimento(
      reps !== null && peso !== null
        ? { exercicioId: exercicio.exercicioId, reps, peso }
        : { exercicioId: exercicio.exercicioId, reps: 0, peso: 0 },
    );
    setFormularioAberto(true);
  }

  /**
   * Corrige uma série já registrada — mesma cena de D6 (errar o peso no
   * meio do treino, sem sinal, e querer arrumar na hora), por isso a
   * mesma fila offline da criação, não uma chamada direta.
   */
  async function editarSerie(id: string, dados: DadosEdicaoSerie): Promise<void> {
    setSeries((atual) =>
      atual.map((serie) => (serie.id === id ? { ...serie, ...dados } : serie)),
    );

    await enfileirar("atualizar_serie", {
      id,
      tipo: dados.tipo,
      reps: dados.reps,
      peso: dados.peso,
      rir: dados.rir,
      pesoPorLado: dados.pesoPorLado,
    }, usuarioId);

    const resultado = await drenar();
    if (resultado.falhou) {
      void pedirSincronizacaoEmSegundoPlano();
    }
    setEditandoId(null);
  }

  /**
   * Exclui uma série. Otimista, como o registro: some da lista na hora,
   * a fila sobe quando a rede permitir. Não desfaz visualmente se a
   * sincronização falhar — o item já saiu da tela porque foi essa a
   * intenção do dono, e a fila garante que o servidor alcança essa
   * intenção assim que possível.
   */
  async function excluirSerie(id: string): Promise<void> {
    descanso.cancelarSePertence(id);
    setSeries((atual) => atual.filter((serie) => serie.id !== id));
    setExcluindoId(null);

    await enfileirar("excluir_serie", { id }, usuarioId);

    const resultado = await drenar();
    if (resultado.falhou) {
      void pedirSincronizacaoEmSegundoPlano();
    }
  }

  /**
   * H2 (D8) — estado é de TELA, não de grupo: `grupos.map` gera um
   * `.grupo__cab` por exercício, então o toggle não pode viver ali dentro
   * (N cabeçalhos duplicando um único estado). Fica uma vez só, acima de
   * todos os grupos. Desligar no meio de uma confirmação cancela ela —
   * mesmo comportamento já garantido em ListaModelos/ListaTreinos, só que
   * lá vinha de graça (desmontar o componente); aqui a lixeira nunca
   * desmonta (só fica `visibility:hidden`), então a limpeza de
   * `excluindoId` precisa ser explícita.
   */
  function alternarModoEdicao() {
    setModoEdicao((atual) => {
      if (atual) setExcluindoId(null);
      return !atual;
    });
  }

  // UX-01 (docs/BACKLOG-CANONICO.md) — "Repetir série"/"Adicionar
  // exercício"/"Finalizar Treino" viviam no FLUXO, então rolavam junto com
  // a lista de séries; o pedido do dono é casca fixa (topo + ações) com só
  // o miolo rolável. A altura desta área varia MUITO por estado (uma
  // pílula, duas lado a lado, ou o texto de confirmação de "Finalizar") —
  // mesma classe de problema que `.timer-topo-container` já resolveu
  // (achado VS-03, QA.md 2026-08-28): publica a altura real como variável
  // CSS via `ResizeObserver` em vez de reservar um número fixo, que
  // ficaria errado em algum dos estados.
  const acaoAreaRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const elemento = acaoAreaRef.current;
    if (!elemento) return;

    function publicarAltura(altura: number) {
      document.documentElement.style.setProperty(
        "--lastro-acao-area-altura",
        `${Math.ceil(altura)}px`,
      );
    }
    publicarAltura(elemento.getBoundingClientRect().height);

    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) publicarAltura(entrada.target.getBoundingClientRect().height);
    });
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      document.documentElement.style.removeProperty("--lastro-acao-area-altura");
    };
  }, []);

  // TR-12 (QA.md, 2026-09-23) — com a casca fixa, o formulário de série
  // abria abaixo da dobra: "Outra série" com o grupo já escolhido não passa
  // pelo seletor (o único que movia o foco), então nada rolava e o
  // "Registrar série" ficava em y=1031 numa tela de 812. E mesmo rolado ele
  // não cabia: com Repetir + Finalizar fixos sobravam 448px para ~500px de
  // formulário. Enquanto a pessoa preenche (formulário aberto ou série em
  // edição), a área de ações sai de cena — "Fechar" vai para o cabeçalho do
  // cartão — e a tela rola até o que acabou de abrir.
  const preenchendo = formularioAberto || editandoId !== null;
  const tituloFormularioRef = useRef<HTMLSpanElement>(null);
  const formularioVisivel = formularioAberto && gruposEscolhidos.length > 0;
  useEffect(() => {
    if (!formularioVisivel) return;
    // Um quadro de espera: a área de ações acabou de sumir e o
    // `ResizeObserver` acima ainda precisa publicar a altura nova, senão o
    // `padding-bottom` antigo limita até onde dá para rolar.
    const quadro = requestAnimationFrame(() => {
      const titulo = tituloFormularioRef.current;
      if (!titulo) return;
      titulo.focus({ preventScroll: true });
      titulo.scrollIntoView({ block: "start", behavior: comportamentoDeRolagem() });
    });
    return () => cancelAnimationFrame(quadro);
  }, [formularioVisivel]);

  // Depois de gravar, traz a série nova para a vista, acima da faixa de
  // ações (o `scroll-margin-bottom` de `.corpo--treino-detalhe *` desconta a
  // faixa). Dois quadros: o formulário acabou de fechar e a faixa voltou, e o
  // `ResizeObserver` precisa publicar a altura dela antes de medir.
  useEffect(() => {
    if (!rolarParaSerie) return;
    let quadroInterno = 0;
    const quadro = requestAnimationFrame(() => {
      quadroInterno = requestAnimationFrame(() => {
        const linha = document.querySelector(`[data-serie-id="${rolarParaSerie}"]`);
        (linha?.closest("section") ?? linha)?.scrollIntoView({
          block: "nearest",
          behavior: comportamentoDeRolagem(),
        });
        setRolarParaSerie(null);
      });
    });
    return () => {
      cancelAnimationFrame(quadro);
      cancelAnimationFrame(quadroInterno);
    };
  }, [rolarParaSerie]);

  useEffect(() => {
    if (!editandoId) return;
    const quadro = requestAnimationFrame(() => {
      document
        .getElementById(`tipo-${editandoId}`)
        ?.closest("form")
        ?.scrollIntoView({ block: "nearest", behavior: comportamentoDeRolagem() });
    });
    return () => cancelAnimationFrame(quadro);
  }, [editandoId]);

  async function finalizarTreino(): Promise<void> {
    await descanso.concluir();
    marcarFim(treinoId);
    setConfirmandoFim(false);
    setMostrarRelatorio(true);
    void drenar().then((resultado) => {
      if (resultado.falhou) void pedirSincronizacaoEmSegundoPlano();
    });
  }

  return (
    <>
      {/* Barra de Status Sticky no Topo: Tempo de Treino Decorrido + Timer de Descanso */}
      <TimerTopo
        treinoId={treinoId}
        idioma={idioma}
        /* Sem marca local, o cronômetro mostra ISTO, parado — em vez de
           contar do zero ao vivo num treino que não está acontecendo aqui. */
        duracaoReconstruidaSegundos={duracaoSessaoSegundos(
          iniciadoEm,
          ultimaSerieEm(series),
        )}
        /* Treino recém-criado (nenhuma série ainda): a sessão começa aqui e
           é a única situação em que gravar a marca de início é honesto. */
        sessaoComecaAqui={seriesIniciais.length === 0}
        treinoFinalizado={treinoConcluido || mostrarRelatorio}
        descanso={descanso}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo corpo--treino-detalhe">
        {series.length > 0 && (
          <div className="grupo__cab">
            <h2 className="grupo__nome">{t("Séries", idioma)}</h2>
            <button type="button" className="botao-textual" onClick={alternarModoEdicao}>
              {t(modoEdicao ? "Concluído" : "Editar", idioma)}
            </button>
          </div>
        )}

        {/* Exercícios do modelo escolhido, ainda sem nenhuma série (SDD
            §9.3) — mesmo cabeçalho visual dos grupos de verdade, só sem
            linhas de série dentro. Sempre ANTES dos grupos de série real. */}
        {pendentesDoModelo.map((exercicio) => {
          const temPlano = exercicio.reps !== null && exercicio.peso !== null;
          return (
            <section className="grupo" key={exercicio.exercicioId}>
              <div className="grupo__cab">
                <h2 className="grupo__nome">{exercicio.nome}</h2>
                {/* O `+` abre o formulário JÁ preenchido (ADR-010). Só
                    existe em treino vindo de modelo — `modeloId` é
                    `undefined` no treino novo, e ali a pessoa tem
                    liberdade total, como o dono pediu. */}
                {modeloId ? (
                  <button
                    type="button"
                    className="botao-plano"
                    onClick={() => abrirComPlano(exercicio)}
                    aria-label={`${t("Registrar série", idioma)}: ${exercicio.nome}`}
                  >
                    {temPlano && (
                      <span className="botao-plano__valor">
                        {exercicio.reps} × {exercicio.peso} kg
                      </span>
                    )}
                    <span aria-hidden="true">+</span>
                  </button>
                ) : (
                  <span className="grupo__cont">0 {t("valendo", idioma)}</span>
                )}
              </div>
            </section>
          );
        })}

        {series.length === 0 && pendentesDoModelo.length === 0 ? (
          <p className="vazio">
            {t("Nenhuma série registrada ainda. Comece pela primeira aqui embaixo.", idioma)}
          </p>
        ) : (
          grupos.map((grupo) => {
            const resumo = resumirSeriesValendo(grupo.series, idioma);
            return (
              <section className="card-obsidian grade-exercicio" key={grupo.exercicioId}>
                <div className="card-obsidian__header">
                  <div className="grade-exercicio__identidade">
                    <h2 className="grade-exercicio__nome">{grupo.nome}</h2>
                    <span className="grade-exercicio__resumo">{resumo}</span>
                  </div>
                </div>

                <div className="grade-series" role="table" aria-label={grupo.nome}>
                  <div className="grade-series__cabecalho" role="row">
                    <span role="columnheader">{t("Série", idioma)}</span>
                    <span role="columnheader">{t("Carga", idioma)}</span>
                    <span role="columnheader">{t("Repetições", idioma)}</span>
                    <span role="columnheader">{t("Descanso real", idioma)}</span>
                  </div>
                  {grupo.series.map((serie, indice) => {
                    if (editandoId === serie.id) {
                      return (
                        <EditarSerie
                          key={serie.id}
                          serie={serie}
                          onSalvar={(dados) => editarSerie(serie.id, dados)}
                          onCancelar={() => setEditandoId(null)}
                          idioma={idioma}
                        />
                      );
                    }

                    if (excluindoId === serie.id) {
                      return (
                        <div className="confirma" key={serie.id}>
                          <p className="confirma__texto">
                            {t("Excluir a série", idioma)} {indice + 1} {t("de", idioma)} {grupo.nome} —{" "}
                            {serie.reps} × {serie.peso} kg? {t("Não dá para desfazer.", idioma)}
                          </p>
                          <div className="confirma__acoes">
                            <button
                              type="button"
                              className="botao-secundario"
                              onClick={() => setExcluindoId(null)}
                            >
                              {t("Cancelar", idioma)}
                            </button>
                            <button
                              type="button"
                              className="botao-destrutivo"
                              onClick={() => void excluirSerie(serie.id)}
                            >
                              {t("Excluir", idioma)}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const marcadores = marcadoresDaSerie(
                      serie.tipo,
                      Boolean(serie.ehRecordePessoal),
                      idioma,
                    );
                    const descansoDaLinha =
                      descanso.ativo && descanso.serieId === serie.id
                        ? t("Em andamento", idioma)
                        : formatarDescansoReal(serie.descansoRealSegundos);

                    return (
                      <div
                        className={
                          descanso.ativo && descanso.serieId === serie.id
                            ? "grade-series__linha grade-series__linha--descanso-ativo"
                            : "grade-series__linha"
                        }
                        role="row"
                        tabIndex={0}
                        key={serie.id}
                        data-serie-id={serie.id}
                        onClick={() => setEditandoId(serie.id)}
                        onKeyDown={(evento) => {
                          if (evento.key === "Enter" || evento.key === " ") {
                            evento.preventDefault();
                            setEditandoId(serie.id);
                          }
                        }}
                      >
                        <span className="grade-series__serie" role="cell">
                          <b>{indice + 1}</b>
                          <span className="grade-series__marcadores">
                            {marcadores.map((marcador) => (
                              <span
                                className={`marcador-serie marcador-serie--${marcador.tipo}`}
                                title={marcador.completo}
                                aria-label={marcador.completo}
                                key={marcador.tipo}
                              >
                                {marcador.curto}
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="grade-series__numero" role="cell">
                          {serie.peso} <small>{unidadeDaCarga(serie.pesoPorLado, idioma)}</small>
                        </span>
                        <span className="grade-series__numero" role="cell">{serie.reps}</span>
                        <span className="grade-series__descanso" role="cell">
                          {modoEdicao ? (
                            <button
                              type="button"
                              className="botao-icone"
                              aria-label={`${t("Excluir série", idioma)} ${indice + 1} ${t("de", idioma)} ${grupo.nome}`}
                              onClick={(evento) => {
                                evento.stopPropagation();
                                setExcluindoId(serie.id);
                              }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                              </svg>
                            </button>
                          ) : descansoDaLinha}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {formularioAberto && gruposEscolhidos.length === 0 && (
          <SeletorGrupoMuscular
            opcoes={opcoesGrupo}
            onConfirmar={setGruposEscolhidos}
            onFechar={() => setFormularioAberto(false)}
            idioma={idioma}
          />
        )}

        {formularioVisivel && (
          <section className="card-obsidian" style={{ marginBottom: "var(--lastro-e-4)" }}>
            <div className="card-obsidian__header">
              <div>
                <span className="card-obsidian__titulo" tabIndex={-1} ref={tituloFormularioRef}>
                  {t("Registrar Série", idioma)}
                </span>
                <p style={{ fontSize: "var(--lastro-papel-rotulo)", color: "var(--lastro-txt-3)", margin: 0 }}>
                  {t("Preencha a carga e repetições executadas", idioma)}
                </p>
              </div>
              <div className="card-obsidian__acoes">
                <button
                  type="button"
                  className="botao-textual"
                  onClick={() => setGruposEscolhidos([])}
                >
                  {t("Trocar grupo", idioma)}
                </button>
                <BotaoFecharCartao onClick={() => setFormularioAberto(false)} idioma={idioma} />
              </div>
            </div>
            <FormularioSerie
              /* `key` remonta o formulário quando o `+` traz outro
                 exercício — é o que faz `defaultValue` pegar sem
                 `setState` dentro de efeito. */
              key={preenchimento?.exercicioId ?? "vazio"}
              exercicios={exerciciosFiltrados}
              onRegistrar={registrarPeloFormulario}
              preenchimento={preenchimento}
              idioma={idioma}
            />
          </section>
        )}
      </div>

      {/* Área de Ações do Treino Refinada: Pílulas Compactas Lado a Lado + Finalizar Treino.
          `ref` mede a altura real (ver hook acima) — ela muda de estado
          pra estado e é o que a casca fixa (`sistema.css`) reserva no
          miolo rolável. */}
      <div className="acao-area" ref={acaoAreaRef} hidden={preenchendo}>
        {/* Treino concluído fecha o registro. Antes nada aqui olhava
            `treinoConcluido` — só o rótulo do botão de baixo mudava —, então
            dava pra seguir registrando série num treino "finalizado" com o
            cronômetro congelado. O app dizia uma coisa e fazia outra
            (relato de uso real, 2026-09-03). Pra voltar a registrar existe
            "Reabrir treino", que é explícito. */}
        {!treinoConcluido &&
          (ultima ? (
            <div className="acao-area-grid">
              <button
                type="button"
                className="botao-primario botao-acao-duplo"
                onClick={repetirUltimaSerie}
              >
                {t("Repetir série", idioma)}
              </button>

              <button
                type="button"
                className="botao-secundario botao-acao-duplo"
                aria-expanded={formularioAberto}
                onClick={() => setFormularioAberto((aberto) => !aberto)}
              >
                {t(formularioAberto ? "Fechar" : "Outra série", idioma)}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="botao-secundario botao-acao-duplo"
              aria-expanded={formularioAberto}
              onClick={() => setFormularioAberto((aberto) => !aberto)}
            >
              {t(formularioAberto ? "Fechar" : "Adicionar exercício", idioma)}
            </button>
          ))}

        {series.length > 0 && treinoConcluido && (
          <div className="acao-area-grid">
            <button
              type="button"
              className="botao-finalizar-treino"
              onClick={() => setMostrarRelatorio(true)}
            >
              <span>{t("Ver relatório", idioma)}</span>
            </button>

            {/* A saída que não existia. Reabrir devolve o registro E
                destrava o cronômetro preservando o decorrido — sem isso,
                um treino de 1h reaberto 4h depois marcaria 5h
                (`inicioAoReabrir`, marcos-treino.ts). */}
            <button
              type="button"
              className="botao-secundario botao-acao-duplo"
              onClick={() => {
                reabrir(treinoId);
                setMostrarRelatorio(false);
              }}
            >
              {t("Reabrir treino", idioma)}
            </button>
          </div>
        )}

        {series.length > 0 && !treinoConcluido && !confirmandoFim && (
          <button
            type="button"
            className="botao-finalizar-treino"
            onClick={() => {
              confirmacaoAbertaEm.current = performance.now();
              setConfirmandoFim(true);
            }}
          >
            <span>{t("Finalizar Treino", idioma)}</span>
          </button>
        )}

        {series.length > 0 && !treinoConcluido && confirmandoFim && (
          <div className="confirma">
            <p className="confirma__texto">
              {t(
                "Finalizar o treino? O cronômetro para e o registro fecha — dá para reabrir depois.",
                idioma,
              )}
            </p>
            <div className="confirma__acoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setConfirmandoFim(false)}
              >
                {t("Cancelar", idioma)}
              </button>
              <button
                type="button"
                className="botao-finalizar-treino"
                onClick={() => {
                  // O 2º toque do mesmo gesto não confirma: a pessoa ainda não leu a pergunta.
                  if (toqueCedoDemais(confirmacaoAbertaEm.current, performance.now())) return;
                  void finalizarTreino();
                }}
              >
                {t("Finalizar Treino", idioma)}
              </button>
            </div>
          </div>
        )}

        {confirmacaoDescanso && (
          <p className="confirmacao-descanso" aria-live="polite">
            {confirmacaoDescanso}
          </p>
        )}

        {/* D7 revisto (2026-09-23): na tela só enquanto há série esperando a
            rede; sincronizado, fica só para leitor de tela. Nunca alarmante. */}
        <div className={sincronizado ? "sync--area so-leitor-de-tela" : "sync--area"}>
          <p className="sync">
            <span className="sync__ponto" />
            {t(sincronizado ? "sincronizado" : "salvo no aparelho", idioma)}
          </p>
        </div>
      </div>

      {/* Relatório Pós-Treino Imediato (Sticker Story Minimalista Premium) */}
      {mostrarRelatorio && (
        <RelatorioPosTreino
          /* Duração pela DEFINIÇÃO ÚNICA, não pelo cronômetro ao vivo: é o
               que faz este relatório e o de /ajustes/relatorios darem o MESMO
               número para o mesmo treino (relato de uso real, 2026-09-04). O
               cronômetro do topo segue sendo um relógio de sessão — ele não é
               a métrica do documento. */
            metricas={calcularMetricasSessao(series, duracaoSessaoSegundos(iniciadoEm, ultimaSerieEm(series)), undefined, {
            identificadorTreino: treinoId ? `TREINO ${treinoId.slice(-4).toUpperCase()}` : "TREINO 404B",
          })}
          idioma={idioma}
          onFechar={() => setMostrarRelatorio(false)}
        />
      )}
    </>
  );
}
