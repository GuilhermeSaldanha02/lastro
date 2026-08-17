# 06 — Análise Semanal e gráfico de progressão, `/analise`

Usuário de teste tem 5 semanas fechadas com treino (seed) — dado suficiente pra passar o gate (`MINIMO_SEMANAS_PARECER`, checar valor real no código/UI).

## Gráfico de progressão

- [ ] **ANA-01** Acessar `/analise` com o usuário seedado. Esperado: `GraficoProgressao` mostra esqueleto de carregamento antes dos dados chegarem (`<div className="esqueleto" style={{height:200}} />`).
- [ ] **ANA-02** Gráfico carregado. Esperado: painéis para Supino reto com barra (estagnado — texto de conclusão deve indicar estável/platô, não "subiu"), Agachamento livre (progredindo — texto deve indicar alta), Rosca direta (dado novo, só 4 sessões — checar se aparece com dado insuficiente pra tendência ou já mostra algo).
- [ ] **ANA-03** Passar mouse/foco num ponto do gráfico do Agachamento. Esperado: leitura ativa acessível aparece (valor do ponto).
- [ ] **ANA-04** Regra de platô do Supino (3 semanas consecutivas, variação ≤2%, `DECISIONS.md` 2026-08-07). Esperado: indicação visual de platô (tracejado + anotação de há quantas semanas), já que o Supino está fixo em 50kg nas 5 semanas da seed.
- [ ] **ANA-05** `GET /api/progressao` — checar resposta crua na aba de rede: status 200, corpo é array de painéis, bate com o que a tela renderizou.

## Parecer (Análise Semanal)

- [ ] **ANA-06** Botão "Solicitar Análise" e os 5 cards de pergunta — todos habilitados (não `aria-disabled`) já que há dado suficiente.
- [ ] **ANA-07** Clicar "Solicitar Análise" (pergunta primária). Esperado: estado "gerando" — esqueleto ×3 sob "Parecer em emissão", texto "escrevendo a leitura", sem spinner animado.
- [ ] **ANA-08** Parecer chega com sucesso (200). Esperado: componente `Parecer` renderiza veredito, blocos de evidência, prosa citando exercícios/números reais do usuário de teste (não genérico), rodapé fixo "Ressalvas do método" (4 itens).
- [ ] **ANA-09** `POST /api/analise` na aba de rede — checar corpo da requisição (`{pergunta: N}`) e da resposta (200, `{parecer, evidencia}` sem `avisoFalhaInterpretativa` no caso feliz).
- [ ] **ANA-10** Clicar numa das outras 4 perguntas (não a primária). Esperado: mesmo fluxo de "gerando" → resultado, pergunta correta enviada no corpo da requisição.
- [ ] **ANA-11** Verificar regra do agregador (CLAUDE.md regra 2): a resposta de `/api/progressao` e o corpo de `/api/analise` **não devem conter linhas cruas de série** — só resumo já calculado. Inspecionar o JSON da rede pra confirmar que não há um array bruto de séries sendo enviado como está no banco.
- [ ] **ANA-12** Deslogar (limpar cookie/sessão) e tentar `POST /api/analise` diretamente ou recarregar `/analise` sem sessão. Esperado: 401 com `{erro: "Sessão ausente."}`; UI mostra "Sessão expirada. Faça login novamente." se disparado pela tela.
- [ ] **ANA-13** Recarregar a página (F5) no meio do estado "gerando" (clicar Solicitar Análise, recarregar antes de terminar). Esperado: estado reseta, não trava em "gerando" eternamente, não há erro no console sobre requisição órfã.
- [ ] **ANA-14** Usuário novo/sem dado suficiente (criar um segundo teste temporário ou usar antes de seedar, se a ordem permitir): aviso "Você tem {N} semana(s) fechada(s). São necessárias {M} para calcular a análise semanal." com botões `aria-disabled`.
- [ ] **ANA-15** Nesse mesmo cenário de dado insuficiente, tentar clicar num card de pergunta mesmo `aria-disabled` (via teclado/Enter). Esperado: não dispara a chamada (checar aba de rede — nenhuma requisição a `/api/analise`).
- [ ] **ANA-16** `AbaInferior ativa="analise"` destacada corretamente; sem `VoltarFlutuante` (é aba de topo, não sub-tela).
