// lastro · UX3-02 — o eixo Y do gráfico de progressão.
//
// Sem eixo Y declarado, o Recharts usa o domínio `[0, auto]`: uma série
// estável em 50,7 kg desenhava a linha colada no topo com ~130 px de vazio
// embaixo (achado UX3-02, auditoria de 2026-09-26). O domínio agora acompanha
// os dados, com folga em volta.
//
// A folga é a MAIOR entre 25% da amplitude e 5% do maior valor. Amplitude zero
// (série estável) cai nos 5% e a linha fica no meio do gráfico. Tirar o zero do
// eixo aumenta a leitura de variações pequenas; por isso o gráfico continua
// acompanhado da conclusão em palavras e do percentual (`grafico-progressao`),
// que dizem o tamanho real da mudança.
//
// Função pura, sem dependência de Recharts.
export function dominioDoGrafico(valores: number[]): [number, number] {
  const validos = valores.filter((v) => Number.isFinite(v));
  if (validos.length === 0) return [0, 1];

  const minimo = Math.min(...validos);
  const maximo = Math.max(...validos);
  const folga = Math.max((maximo - minimo) * 0.25, Math.abs(maximo) * 0.05, 0.5);

  return [Math.max(0, minimo - folga), maximo + folga];
}
