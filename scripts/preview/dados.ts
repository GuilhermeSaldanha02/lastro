// Dado REAL do parecer 4dc6bcbf… (conta do dono, banco hospedado) — a
// bancada nunca inventa número. A única parte sintética está marcada.
import type { EvidenciaParaTela } from "@/app/api/analise/evidencia";

export const evidenciaReal = {
  periodo: { janela_semanas: 4, semana_atual_fim: "2026-08-30", semana_atual_inicio: "2026-08-24" },
  blocos: [
    { sinal: "plato", volume: 7280, delta_pct: 0, exercicio: "Leg press 45 graus", grupo_muscular: "Quadríceps", series_valendo: 4, peso_referencia: 160, reps_referencia: 8 },
    { sinal: "alta", volume: 4080, delta_pct: 66.7, exercicio: "Tríceps pulley (corda)", grupo_muscular: "Tríceps", series_valendo: 8, peso_referencia: 55, reps_referencia: 12 },
    { sinal: "plato", volume: 3300, delta_pct: 0, exercicio: "Rosca concentrada", grupo_muscular: "Bíceps", series_valendo: 5, peso_referencia: 40, reps_referencia: 10 },
    { sinal: "alta", volume: 4800, delta_pct: 25, exercicio: "Puxada pegada supinada", grupo_muscular: "Costas", series_valendo: 6, peso_referencia: 50, reps_referencia: 8 },
    { sinal: "queda", volume: 3200, delta_pct: -29.8, exercicio: "Supino fechado", grupo_muscular: "Tríceps", series_valendo: 4, peso_referencia: 40, reps_referencia: 10 },
    { sinal: "alta", volume: 3000, delta_pct: 10, exercicio: "Tríceps francês com halter", grupo_muscular: "Tríceps", series_valendo: 3, peso_referencia: 55, reps_referencia: 10 },
  ],
} as unknown as EvidenciaParaTela;

/** Texto REAL em fallback determinístico que está na conta do dono hoje. */
export const textoFallbackReal = `Semana de 2026-08-24 — 4 de 4 semanas da janela com dados.
Volume total em 2026-08-03: 16662.
Volume total em 2026-08-10: 42262.
Volume total em 2026-08-17: 32691.
Volume total em 2026-08-24: 60751.
Costas: 23 séries valendo, volume 15685 (349.4% vs. semana anterior) — acima da faixa de referência.
Quadríceps: 12 séries valendo, volume 11764 (-15.4% vs. semana anterior) — dentro da faixa de referência.
Tríceps: 15 séries valendo, volume 10280 (160.9% vs. semana anterior) — dentro da faixa de referência.
Peito: 14 séries valendo, volume 6584 (41.3% vs. semana anterior) — dentro da faixa de referência.
Ombro: 9 séries valendo, volume 5520 (220.9% vs. semana anterior) — abaixo da faixa de referência.
Bíceps: 11 séries valendo, volume 5132 (123.1% vs. semana anterior) — dentro da faixa de referência.
Posterior de coxa: 7 séries valendo, volume 3770 (129.9% vs. semana anterior) — abaixo da faixa de referência.
Panturrilha: 3 séries valendo, volume 1440 — abaixo da faixa de referência.
Abdômen: 4 séries valendo, volume 576 — abaixo da faixa de referência.
Frequência na semana atual: 5 treino(s).`;

/** Prosa REAL da Gemini, parecer `a7f5fe7c…` (pergunta 1, 2026-09-04,
 *  salvo pelo dono). Substituiu o exemplo sintético que existia aqui
 *  enquanto nenhuma geração tinha dado certo — o veredito tem 151
 *  caracteres, que é justamente o caso que revelou a falta do clamp no
 *  PDF (DECISIONS.md 2026-09-04). Não inventar texto aqui: agora existe
 *  o de verdade. */
export const textoProsaExemplo = `Você está progredindo na maioria dos exercícios, registrando por exemplo uma evolução de 66,7% na estimativa de carga máxima no Tríceps pulley (corda). Nesse mesmo exercício, o valor estimado atual atingiu 77, partindo de 46,2, além da conquista de um recorde pessoal de volume com 4080. A evolução de força também é visível no Crucifixo reto com halteres, com alta de 22,1%, e na Puxada pegada supinada, que subiu 25%. No Supino inclinado máquina, foi registrado um recorde de carga estimada de 70.

O volume total semanal apresentou crescimento ao longo das 4 semanas analisadas, subindo de 16662 para 60751 na semana atual. Apesar da tendência geral positiva, o comportamento difere entre os movimentos. No Supino fechado, embora tenha ocorrido um recorde pessoal de volume de 3200, a carga máxima estimada recuou 29,8%, caindo de 76 para 53,3. A Cadeira extensora apresentou diminuição de 9,3% na estimativa de força, enquanto o Leg press 45 graus e a Rosca concentrada mantiveram variação de 0%.

Analisando a distribuição do treino, o grupo de Costas ficou acima da faixa de referência prática com 23 séries válidas. Os grupos Quadríceps com 12, Tríceps com 15, Peito com 14 e Bíceps com 11 mantiveram-se dentro do intervalo de 10 a 20 séries. Ombro com 9, Posterior de coxa com 7, Abdômen com 4 e Panturrilha com 3 séries situaram-se abaixo dessa convenção. Não há dados disponíveis sobre a intensidade relativa por repetições de reserva, pois das 98 séries válidas do período, nenhuma apresentou esse registro.`;

/** SINTÉTICO — mesma ressalva acima, mas com o veredito (primeira frase)
 *  encurtado ao extremo, pra ver a tipografia Fraunces 48px numa única
 *  linha curta em vez de 3 linhas. Comparação de gate visual, não dado real. */
export const textoProsaExemploCurto = `Tudo estável. Puxada e tríceps subiram junto — 25% e 66,7% de e1RM na janela de 4 semanas — enquanto Leg press e Rosca concentrada não saíram do lugar em nenhuma das sessões registradas. O supino fechado caiu 29,8%, e é o único movimento em queda real da lista; nas 4 séries valendo dessa semana o peso de referência ficou em 40 kg × 10. Ombro e posterior de coxa seguem abaixo da faixa de referência de volume pela segunda semana.`;

/** SINTÉTICO — estresse do caso ruim: o LLM ignora a instrução de abrir
 *  com uma frase curta de julgamento (prompt.ts) e `separarVeredito` não
 *  acha um ponto final cedo, então o "veredito" vira um parágrafo inteiro.
 *  Serve só pra verificar o piso do clamp() em .doc__veredito (sistema.css). */
export const textoProsaExemploLongo = `Olhando pro conjunto da semana, o que mais chama atenção é que tríceps e puxada seguiram subindo enquanto leg press e rosca concentrada ficaram parados nas últimas quatro semanas seguidas. Puxada e tríceps subiram junto — 25% e 66,7% de e1RM na janela de 4 semanas — enquanto Leg press e Rosca concentrada não saíram do lugar em nenhuma das sessões registradas. O supino fechado caiu 29,8%, e é o único movimento em queda real da lista; nas 4 séries valendo dessa semana o peso de referência ficou em 40 kg × 10. Ombro e posterior de coxa seguem abaixo da faixa de referência de volume pela segunda semana.`;
