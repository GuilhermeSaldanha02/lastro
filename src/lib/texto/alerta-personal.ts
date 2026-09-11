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
 * O QUE ESTE ARQUIVO NÃO FAZ: prescrever. O "o que investigar" é sempre
 * PERGUNTA, nunca instrução de treino. O app analisa; não prescreve
 * (PRD §5), e sob vínculo quem prescreve é o profissional (§11.2).
 */
import { formatarPeso } from "./formatar-delta";
import { formatarGrupoMuscular } from "./grupo-muscular";
import type { AlertaPersonal } from "@/lib/analise/fila-personal";

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

function primeiroNome(nomeCompleto: string): string {
  return (nomeCompleto ?? "").trim().split(/\s+/)[0] || "aluno";
}

function plural(n: number, singular: string, plural_: string): string {
  return n === 1 ? singular : plural_;
}

export function conteudoDoAlerta(
  alerta: AlertaPersonal,
  nomeAluno: string,
): ConteudoAlerta {
  const nome = primeiroNome(nomeAluno);

  switch (alerta.evidencia.tipo) {
    case "grupo_sem_estimulo": {
      const { diasSemEstimulo } = alerta.evidencia;
      const grupo = formatarGrupoMuscular(alerta.alvo);
      return {
        titulo: `${grupo} sem estímulo`,
        oQueAconteceu: `${nome} não registra nenhuma série valendo de ${grupo.toLowerCase()}.`,
        haQuantoTempo: `${diasSemEstimulo} ${plural(diasSemEstimulo, "dia", "dias")}.`,
        // "Já treinou antes" é fato, e é o que separa abandono de escolha
        // de programa: `recencia.ts` só conta grupo que a pessoa já
        // treinou alguma vez.
        evidencia: `O grupo já apareceu no histórico dele antes — é ausência recente, não um grupo que ele nunca treinou.`,
        possivelCausa: `O grupo pode ter saído da ficha, ou o dia em que ele cai é justamente o dia em que ${nome} tem faltado.`,
        oQueInvestigar: `Confirmar com ${nome} se esse dia de treino continua possível na rotina dele.`,
      };
    }

    case "estagnacao_exercicio": {
      const { semanasSemProgresso, e1rmEstavelEm, volumeEstavelEm } =
        alerta.evidencia;
      // Regra da Presença: campo ausente é informação que não temos —
      // não se inventa um número para preencher a linha de evidência.
      const numero =
        e1rmEstavelEm !== undefined
          ? `carga estimada parada em ${formatarPeso(e1rmEstavelEm)} kg`
          : volumeEstavelEm !== undefined
            ? `volume parado em ${formatarPeso(volumeEstavelEm)} kg`
            : undefined;
      return {
        titulo: `${alerta.alvo} sem progresso`,
        oQueAconteceu: `${alerta.alvo} não avança no registro de ${nome}.`,
        haQuantoTempo: `${semanasSemProgresso} ${plural(semanasSemProgresso, "semana", "semanas")}.`,
        evidencia: numero
          ? `${numero}, com o exercício ainda sendo treinado.`
          : `O exercício continua sendo treinado, sem melhora medida.`,
        possivelCausa: `Pode ser carga repetida sem ajuste, execução mudando sem ninguém notar, ou recuperação insuficiente entre as sessões.`,
        oQueInvestigar: `Perguntar a ${nome} como estão as últimas séries desse exercício e olhar a ficha dele.`,
      };
    }

    case "queda_volume": {
      const { semanas, volumeInicial, volumeAtual, quedaPct } =
        alerta.evidencia;
      return {
        titulo: `Volume em queda`,
        oQueAconteceu: `O volume semanal de ${nome} caiu em todas as semanas seguidas da janela.`,
        haQuantoTempo: `${semanas} ${plural(semanas, "semana", "semanas")}.`,
        evidencia: `De ${formatarPeso(volumeInicial)} kg para ${formatarPeso(volumeAtual)} kg — queda de ${Math.round(quedaPct)}%.`,
        possivelCausa: `Pode ser rotina apertada, treino mais curto, ou sessão sendo encerrada antes do fim.`,
        oQueInvestigar: `Perguntar a ${nome} se a agenda mudou nas últimas semanas.`,
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
): string {
  const nome = primeiroNome(nomeAluno);

  switch (alerta.evidencia.tipo) {
    case "grupo_sem_estimulo": {
      const grupo = formatarGrupoMuscular(alerta.alvo).toLowerCase();
      const { diasSemEstimulo } = alerta.evidencia;
      return [
        `Oi, ${nome}! Tudo bem?`,
        ``,
        `Passei os olhos no seu histórico e vi que o treino de ${grupo} não aparece há ${diasSemEstimulo} dias.`,
        ``,
        `Aconteceu alguma coisa que atrapalhou esse dia? Me conta que a gente ajusta a semana juntos.`,
      ].join("\n");
    }

    case "estagnacao_exercicio": {
      const { semanasSemProgresso } = alerta.evidencia;
      return [
        `Oi, ${nome}! Tudo bem?`,
        ``,
        `Olhei seus registros e o ${alerta.alvo} está no mesmo ponto há ${semanasSemProgresso} semanas.`,
        ``,
        `Isso é normal de acontecer e tem saída. Como você tem se sentido nessas séries? Quero dar uma olhada na sua ficha com esse retorno.`,
      ].join("\n");
    }

    case "queda_volume": {
      const { semanas } = alerta.evidencia;
      return [
        `Oi, ${nome}! Tudo bem?`,
        ``,
        `Vi que o seu volume de treino vem caindo nas últimas ${semanas} semanas.`,
        ``,
        `A rotina apertou por aí? Se estiver corrido, me fala que a gente adapta o treino ao tempo que você tem.`,
      ].join("\n");
    }
  }
}
