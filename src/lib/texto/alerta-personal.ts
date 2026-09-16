/**
 * O texto do alerta e o rascunho da mensagem — PRD §11.4.7 e §11.7.
 *
 * DETERMINÍSTICO, e isso é restrição, não economia. A Gemini não entra
 * aqui por duas razões independentes: a cota é de 20 chamadas/dia
 * compartilhadas com a peça-assinatura (`uso_ia`, migração 0020), e o
 * §11.4.4 exige que o alerta ROTEIE um sinal já calculado em vez de criar
 * julgamento novo. Texto de alerta escrito por LLM seria julgamento novo.
 *
 * Sem emoji e sem emoticon (regra 6 do `CLAUDE.md`) — vale inclusive para
 * a mensagem que vai para o WhatsApp, porque quem a compõe é o app.
 *
 * SEM PRONOME DE PESSOA. O app não sabe o gênero de ninguém — não há
 * campo para isso e não deve haver. "A ficha dele" chamou uma aluna de
 * "dele" na primeira execução real (2026-09-11). Toda linha aqui usa o
 * nome ou construção impessoal; se você precisar de um pronome para a
 * frase fechar, a frase está errada.
 *
 * O QUE ESTE ARQUIVO NÃO FAZ: prescrever. O "o que investigar" é sempre
 * PERGUNTA, nunca instrução de treino. O app analisa; não prescreve
 * (PRD §5), e sob vínculo quem prescreve é o profissional (§11.2).
 */
import { formatarPeso } from "./formatar-delta";
import { formatarGrupoMuscular } from "./grupo-muscular";
import type { AlertaPersonal } from "@/lib/analise/fila-personal";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "./i18n";

/**
 * O alerta na ordem que o P2 pediu, literal: o que aconteceu → há quanto
 * tempo → qual evidência → o que pode estar causando → o que investigar.
 * Cinco campos, e a tela desenha nessa ordem.
 */
export type ConteudoAlerta = {
  /** Uma linha, lida de relance. É o que o personal vê antes de decidir abrir. */
  titulo: string;
  oQueAconteceu: string;
  haQuantoTempo: string;
  evidencia: string;
  possivelCausa: string;
  oQueInvestigar: string;
};

function primeiroNome(nomeCompleto: string, idioma: Idioma): string {
  return (nomeCompleto ?? "").trim().split(/\s+/)[0] || t("aluno", idioma);
}

function plural(n: number, singular: string, plural_: string, idioma: Idioma): string {
  return t(n === 1 ? singular : plural_, idioma);
}

export function conteudoDoAlerta(
  alerta: AlertaPersonal,
  nomeAluno: string,
  idioma: Idioma,
): ConteudoAlerta {
  const nome = primeiroNome(nomeAluno, idioma);

  switch (alerta.evidencia.tipo) {
    case "grupo_sem_estimulo": {
      const { diasSemEstimulo } = alerta.evidencia;
      const grupo = formatarGrupoMuscular(alerta.alvo, idioma);
      return {
        titulo: `${grupo} ${t("sem estímulo", idioma)}`,
        oQueAconteceu: `${nome} ${t("não registra nenhuma série valendo de", idioma)} ${grupo.toLowerCase()}.`,
        haQuantoTempo: `${diasSemEstimulo} ${plural(diasSemEstimulo, "dia", "dias", idioma)}.`,
        // "Já treinou antes" é fato, e é o que separa abandono de escolha
        // de programa: `recencia.ts` só conta grupo que a pessoa já
        // treinou alguma vez.
        evidencia: t("O grupo já apareceu no histórico antes — é ausência recente, não um grupo nunca treinado.", idioma),
        possivelCausa: t(
          "O grupo pode ter saído da ficha, ou o dia em que esse treino cai é justamente o dia em que {nome} tem faltado.",
          idioma,
        ).replace("{nome}", nome),
        oQueInvestigar: `${t("Confirmar com", idioma)} ${nome} ${t("se esse dia de treino continua cabendo na rotina.", idioma)}`,
      };
    }

    case "estagnacao_exercicio": {
      const { semanasSemProgresso, e1rmEstavelEm, volumeEstavelEm } =
        alerta.evidencia;
      // Regra da Presença: campo ausente é informação que não temos —
      // não se inventa um número para preencher a linha de evidência.
      const numero =
        e1rmEstavelEm !== undefined
          ? `${t("carga estimada parada em", idioma)} ${formatarPeso(e1rmEstavelEm, idioma)} kg`
          : volumeEstavelEm !== undefined
            ? `${t("volume parado em", idioma)} ${formatarPeso(volumeEstavelEm, idioma)} kg`
            : undefined;
      return {
        titulo: `${alerta.alvo} ${t("sem progresso", idioma)}`,
        oQueAconteceu: `${alerta.alvo} ${t("não avança no registro de", idioma)} ${nome}.`,
        haQuantoTempo: `${semanasSemProgresso} ${plural(semanasSemProgresso, "semana", "semanas", idioma)}.`,
        evidencia: numero
          ? `${numero}, ${t("com o exercício ainda sendo treinado.", idioma)}`
          : t("O exercício continua sendo treinado, sem melhora medida.", idioma),
        possivelCausa: t("Pode ser carga repetida sem ajuste, execução mudando sem ninguém notar, ou recuperação insuficiente entre as sessões.", idioma),
        oQueInvestigar: `${t("Perguntar a", idioma)} ${nome} ${t("como estão as últimas séries desse exercício e olhar a ficha de treino.", idioma)}`,
      };
    }

    case "queda_volume": {
      const { semanas, volumeInicial, volumeAtual, quedaPct } =
        alerta.evidencia;
      return {
        titulo: t("Volume em queda", idioma),
        oQueAconteceu: `${t("O volume semanal de", idioma)} ${nome} ${t("caiu em todas as semanas seguidas da janela.", idioma)}`,
        haQuantoTempo: `${semanas} ${plural(semanas, "semana", "semanas", idioma)}.`,
        evidencia: `${t("De", idioma)} ${formatarPeso(volumeInicial, idioma)} kg ${t("para", idioma)} ${formatarPeso(volumeAtual, idioma)} kg — ${t("queda de", idioma)} ${Math.round(quedaPct)}%.`,
        possivelCausa: t("Pode ser rotina apertada, treino mais curto, ou sessão sendo encerrada antes do fim.", idioma),
        oQueInvestigar: `${t("Perguntar a", idioma)} ${nome} ${t("se a agenda mudou nas últimas semanas.", idioma)}`,
      };
    }
  }
}

/**
 * O rascunho que o botão do §11.7 leva para o WhatsApp.
 *
 * Escrito para ser ENVIADO COMO ESTÁ e também para ser editado — o
 * personal lê, ajusta se quiser, e envia. É por isso que não cita o
 * lastro nem soa automático: a mensagem é dele, não do app.
 *
 * Não prescreve nada e não promete nada em nome do personal. Termina em
 * pergunta aberta, que é o que abre conversa.
 *
 * CUIDADO AO MEXER: o texto entra numa URL `wa.me?text=`. Quebra de linha
 * é válida (vira `%0A`), emoji é proibido por regra do projeto, e nada
 * aqui deve depender de dado que o personal não tenha autorização para
 * ver — tudo que aparece vem do mesmo vínculo aceito que liberou o alerta.
 */
export function rascunhoWhatsApp(
  alerta: AlertaPersonal,
  nomeAluno: string,
  idioma: Idioma,
): string {
  const nome = primeiroNome(nomeAluno, idioma);

  switch (alerta.evidencia.tipo) {
    case "grupo_sem_estimulo": {
      const grupo = formatarGrupoMuscular(alerta.alvo, idioma).toLowerCase();
      const { diasSemEstimulo } = alerta.evidencia;
      return [
        `${t("Oi,", idioma)} ${nome}! ${t("Tudo bem?", idioma)}`,
        ``,
        `${t("Passei os olhos no seu histórico e vi que o treino de", idioma)} ${grupo} ${t("não aparece há", idioma)} ${diasSemEstimulo} ${plural(diasSemEstimulo, "dia", "dias", idioma)}.`,
        ``,
        t("Aconteceu alguma coisa que atrapalhou esse dia? Me conta que a gente ajusta a semana juntos.", idioma),
      ].join("\n");
    }

    case "estagnacao_exercicio": {
      const { semanasSemProgresso } = alerta.evidencia;
      return [
        `${t("Oi,", idioma)} ${nome}! ${t("Tudo bem?", idioma)}`,
        ``,
        `${t("Olhei seus registros e o", idioma)} ${alerta.alvo} ${t("está no mesmo ponto há", idioma)} ${semanasSemProgresso} ${plural(semanasSemProgresso, "semana", "semanas", idioma)}.`,
        ``,
        t("Isso é normal de acontecer e tem saída. Como você tem se sentido nessas séries? Quero dar uma olhada na sua ficha com esse retorno.", idioma),
      ].join("\n");
    }

    case "queda_volume": {
      const { semanas } = alerta.evidencia;
      return [
        `${t("Oi,", idioma)} ${nome}! ${t("Tudo bem?", idioma)}`,
        ``,
        `${t("Vi que o seu volume de treino vem caindo nas últimas", idioma)} ${semanas} ${plural(semanas, "semana", "semanas", idioma)}.`,
        ``,
        t("A rotina apertou por aí? Se estiver corrido, me fala que a gente adapta o treino ao tempo que você tem.", idioma),
      ].join("\n");
    }
  }
}
