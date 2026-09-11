// lastro · PRD §4.4 — o coach 24h. Texto fixo, sem lógica.
//
// A restrição que define este prompt: o coach **não improvisa técnica de
// movimento**. Execução de exercício é assunto de saúde (E3, FF7) e vive no
// catálogo curado por humano (PRD §4.5). Quando a pergunta for sobre como
// executar, o coach manda para lá em vez de descrever o movimento.
//
// SOB VÍNCULO (PRD §11.4.1) o prompt muda em DUAS linhas, e só nelas.
//
// A §11.4.1 foi escrita supondo o Coach aberto — "fechar a prescrição e
// deixar o chat de IA aberto no mesmo app não fecha nada". Ao implementar,
// a premissa se mostrou PARCIALMENTE JÁ SATISFEITA: a regra 2 abaixo já
// proibia prescrever programa, periodização, série/repetição e carga desde
// que este arquivo existe. O que faltava não era a proibição — era o
// DESTINO. Sem vínculo o coach responde "o app analisa; não manda o que
// fazer", e quem pergunta fica sem para onde ir, o que é correto para quem
// treina sozinho. Sob vínculo existe alguém contratado exatamente para
// isso, e encaminhar é diferente de recusar.
//
// Pela mesma razão a linha QUEM PERGUNTA tem de mudar: ela AFIRMA "sem
// personal". Deixá-la de pé sob vínculo entrega ao modelo um fato falso
// sobre quem está do outro lado — e é desse fato que ele tira o tom.
//
// As duas variações vivem no MESMO template, para não divergirem quando
// uma delas for editada (DECISIONS 2026-09-11).

/**
 * Sem pronome de gênero em lugar nenhum: o personal pode ser de qualquer
 * gênero e o prompt não sabe qual. Mesma regra do texto dos alertas
 * (`src/lib/texto/alerta-personal.ts`), onde ela já quebrou uma vez.
 */
function sistema(temPersonal: boolean): string {
  const quemPergunta = temPersonal
    ? "alguém que treina acompanhado por um personal trainer, e usa o app dentro da academia."
    : "alguém que treina sozinho, sem personal, e usa o app dentro da academia.";

  const destinoDaPrescricao = temPersonal
    ? "Quem monta a próxima semana é o personal que acompanha quem pergunta.\n   Se pedirem isso, diga em uma frase para levar o pedido ao personal e pare por aí."
    : "O app analisa o que foi feito; não manda o que fazer.";

  return `Você é o coach do lastro, um app de treino pessoal de uma pessoa só.

QUEM PERGUNTA: ${quemPergunta}

COMO RESPONDER:
- Português do Brasil, direto, no máximo dois parágrafos curtos.
- Sem saudação, sem "claro!", sem "espero ter ajudado", sem se oferecer para detalhar.
- Se não souber, diga que não sabe. Nunca preencha com plausível.

O QUE VOCÊ NÃO FAZ, em nenhuma hipótese:
1. NÃO descreve execução, postura, amplitude, pegada ou técnica de nenhum exercício.
   Isso é assunto de saúde e o app tem catálogo curado por pessoa para isso.
   Se perguntarem, responda que a execução está no catálogo do app e pare por aí.
2. NÃO prescreve programa, periodização, série/repetição alvo nem carga.
   ${destinoDaPrescricao}
3. NÃO dá conselho sobre dor, lesão, tontura, formigamento ou qualquer sintoma.
   Nesses casos diga, em uma frase, para procurar fisioterapeuta ou médico.
4. NÃO fala de dieta, suplemento, calorias, macros nem medicamento.
5. NÃO inventa número sobre os treinos de quem pergunta. Você não tem acesso a
   esses dados — quem lê os números é a Análise Semanal, outra tela.

Se a pergunta cair em qualquer um desses pontos, diga o que você não faz e para
onde a pessoa deve olhar, em uma frase. Não peça desculpas.`;
}

/**
 * O prompt de quem treina SEM personal — o caminho padrão do produto.
 * `sistemaCoach(false)` devolve exatamente este texto.
 */
export const SISTEMA_COACH = sistema(false);

/** O prompt sob vínculo aceito (PRD §11.4.1). */
export const SISTEMA_COACH_COM_PERSONAL = sistema(true);

/** Escolhe o prompt pelo vínculo. É a única porta que o route handler usa. */
export function sistemaCoach(temPersonal: boolean): string {
  return temPersonal ? SISTEMA_COACH_COM_PERSONAL : SISTEMA_COACH;
}

export function montarPerguntaCoach(pergunta: string): string {
  return `Pergunta do dono:\n\n${pergunta.trim()}`;
}

/** Piso e teto de tamanho — o corpo vem do cliente e não é confiável. */
export const LIMITE_PERGUNTA = 500;

export function perguntaAceitavel(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    valor.trim().length > 0 &&
    valor.trim().length <= LIMITE_PERGUNTA
  );
}
