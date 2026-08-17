# 06 — Análise Semanal e gráfico de progressão, `/analise`

Usuário de teste tem 5 semanas fechadas com treino (seed) — dado suficiente pra passar o gate (`MINIMO_SEMANAS_PARECER`, checar valor real no código/UI).

> Execução ao vivo em 2026-08-17, viewport 390×844 (redimensionado; a extensão reportou viewport efetivo ~500×693 nos read_page/screenshot, mobile confirmado pelos breakpoints da UI), Chrome real via extensão `claude-in-chrome`. Usuário `qa-audit-geral2@teste.lastro.invalid`.

## Gráfico de progressão

- [x] **ANA-01** Acessar `/analise` com o usuário seedado. Esperado: `GraficoProgressao` mostra esqueleto de carregamento antes dos dados chegarem (`<div className="esqueleto" style={{height:200}} />`).
  PROVA: `javascript_exec` rodado imediatamente após `navigate` capturou o DOM antes da resolução do fetch client-side:
  `{"found":true,"html":"<div class=\"esqueleto\" style=\"height:200px\"></div>","style":"height:200px"}`
  Confirma o esqueleto exatamente como especificado. Network (`read_network_requests`, urlPattern `api`) mostrou `GET /api/progressao` client-side (status 200) confirmando fetch assíncrono real, não SSR.

- [x] **ANA-02** Gráfico carregado. Esperado: painéis para Supino reto com barra (estagnado), Agachamento livre (progredindo), Rosca direta (dado novo).
  PROVA (get_page_text/screenshot após carregamento completo):
  - "Supino reto com barra — e1RM ficou estável 0.0% entre 13/07 e 10/08. Platô há 3 semanas." (linha tracejada + rótulo, ver ANA-04)
  - "Agachamento livre — e1RM subiu 17.2% entre 13/07 e 10/08."
  - "Rosca direta — e1RM subiu 12.5% entre 03/08 e 10/08." — com só 4 sessões (2 pontos de dado no gráfico: 03/08 e 10/08) o painel já mostra tendência "subiu", sem nenhum aviso de "dado insuficiente". Comportamento aceitável dado que o item não define um mínimo explícito para o painel individual (só pro parecer, ANA-14), mas registrando que 2 pontos de série é a base mínima possível pra calcular variação percentual — não há um piso adicional de robustez estatística sinalizado ao usuário.

- [x] **ANA-03** Passar mouse/foco num ponto do gráfico do Agachamento. Esperado: leitura ativa acessível aparece.
  PROVA: hover no ponto (20/07) → tooltip visual "Semana de 20/07: 90.0 kg" + elemento `<p class="grafico-progressao__leitura-ativa" aria-live="polite">Semana de 20/07: 90.0 kg</p>` confirmado via JS (`aria-live: "polite"`). Acessível por leitor de tela, não só visual.

- [x] **ANA-04** Regra de platô do Supino (3 semanas consecutivas, variação ≤2%). Esperado: indicação visual de platô (tracejado + anotação de há quantas semanas).
  PROVA: zoom no painel do Supino mostra linha sólida até 27/07 e tracejada (pontilhada, cor âmbar) de 27/07 a 10/08; texto "Platô há 3 semanas." em destaque. `GET /api/progressao` (corpo cru, ver ANA-05) confirma `"plato":{"semanaInicio":"2026-07-27","semanaFim":"2026-08-10","semanas":3}`.
  ACHADO (não é reprovação do item, mas registrar): o parecer de IA (ANA-08/ANA-09) descreve o mesmo platô do Supino como "estagnado há 4 semanas" / `"semanas_sem_progresso":4` — divergindo do `semanas:3` que o próprio `/api/progressao` calcula e que o gráfico exibe. É uma inconsistência numérica entre os dois endpoints para o mesmo dado (contagem de semanas de platô), não claramente a mesma causa-raiz do bug de `criado_em` já registrado na ficha de exercício (aquele é sobre ordenação/data de séries; este é uma divergência de janela de cálculo entre `/api/progressao` e `/api/analise`), mas vale investigar se os dois cálculos de "semanas de platô" usam a mesma função. Reportando como achado separado.

- [x] **ANA-05** `GET /api/progressao` — resposta crua.
  PROVA (fetch direto na página, `credentials:'include'`): status 200, corpo é array de 3 objetos (um por exercício), cada um com `{exercicio:{id,nome}, pontos:[{semanaInicio, e1rm?, volume?}], plato}`. Resumo por exercício:
  - Supino: 12 pontos, `plato.semanas=3`, último ponto `e1rm:63.33, volume:3450`
  - Agachamento: 12 pontos, `plato:null`, último ponto `e1rm:102, volume:4267`
  - Rosca: 12 pontos, `plato:null`, último ponto `e1rm:18, volume:1560`
  Bate com o texto renderizado na tela (63.3kg, 102.0kg, 18.0kg, "Platô há 3 semanas" só no Supino).

## Parecer (Análise Semanal)

- [x] **ANA-06** Botão "Solicitar Análise" e os 5 cards de pergunta — todos habilitados.
  PROVA (JS sobre todos os `<button>` da página): os 6 botões relevantes têm `ariaDisabled:"false"` e `disabled:false`. Nenhum `aria-disabled="true"` presente.

- [x] **ANA-07** Clicar "Solicitar Análise" (pergunta primária). Esperado: estado "gerando".
  PROVA (`get_page_text` logo após o clique): "PARECER EM EMISSÃO / O que mudar na próxima semana? / ESCREVENDO A LEITURA" + screenshot mostra 3 barras de esqueleto (larguras diferentes, cor bege sobre bege) sob o texto. Nenhum spinner animado visível no screenshot.

- [x] **ANA-08** Parecer chega com sucesso (200). Esperado: veredito, blocos de evidência, prosa real, rodapé "Ressalvas do método" (4 itens).
  PROVA (`get_page_text` após ~15-18s de espera real da IA): resposta renderizada cita números reais do usuário — "Agachamento livre... 102 quilos, um avanço de 17,2%...", "Rosca direta subiu para 18 quilos... alta de 225% no volume, totalizando 1560", "Supino reto com barra... 63,3 quilos", 3 blocos de evidência com badges "Alta"/"Platô"/"Alta" e peso×reps por exercício. Rodapé "RESSALVAS DO MÉTODO" com exatamente 4 itens (faixa de volume, "estagnação" como convenção de mercado, e1RM acima do teto de reps, séries de peso corporal). Nenhum conteúdo genérico — todos os números batem com a seed.

- [x] **ANA-09** `POST /api/analise` — corpo da requisição e resposta.
  PROVA (monkeypatch de `window.fetch` instalado antes do clique em "Estou progredindo?", que também serve pro ANA-10): requisição `{"pergunta":1}`, resposta 200 com corpo `{"parecer": "...", "evidencia": {...}}` — chaves exatas `["parecer","evidencia"]`, `avisoFalhaInterpretativa` ausente (`temAviso:false`). `evidencia.periodo` e `evidencia.blocos` contêm resumo agregado por exercício (peso_referencia, reps_referencia, volume, series_valendo, delta_pct), nunca uma linha de série bruta — ver também ANA-11.

- [x] **ANA-10** Clicar numa das outras 4 perguntas. Esperado: mesmo fluxo "gerando" → resultado, pergunta correta no corpo.
  PROVA: cliquei em "Estou progredindo?" (segundo card da lista, índice 1). Screenshot confirma estado "PARECER EM EMISSÃO / Estou progredindo? / ESCREVENDO A LEITURA". Resposta real (capturada via monkeypatch, ver ANA-09) trouxe `{"pergunta":1}` no corpo da requisição — índice correto (0="O que mudar", 1="Estou progredindo") — e o texto do parecer responde de fato à pergunta de progressão, citando Agachamento e Rosca como exercícios que progrediram e o Supino como estagnado.

- [x] **ANA-11** Regra do agregador — sem linhas cruas de série.
  PROVA: `/api/progressao` só expõe `{semanaInicio, e1rm, volume}` por semana (agregado, não por série/repetição). `/api/analise` (`evidencia.blocos`) só expõe `{exercicio, grupo_muscular, sinal, peso_referencia, reps_referencia, volume, series_valendo, delta_pct, semanas_sem_progresso}` — tudo resumo calculado. Não há array de séries individuais (peso/reps/data por set) em nenhuma das duas respostas inspecionadas.

- [x] **ANA-12** Sem sessão — `POST /api/analise` e reload de `/analise`.
  PROVA API: `fetch('/api/analise', {method:'POST', credentials:'omit', body:'{"pergunta":0}'})` → status 401, corpo `{"erro":"Sessão ausente."}`, batendo com o esperado.
  PROVA UI: limpei os cookies via `document.cookie` e recarreguei `/analise` → app redirecionou automaticamente para `/login?proximo=%2Fanalise` (guard de rota/middleware), sem chegar a renderizar a tela de análise e portanto sem o toast "Sessão expirada. Faça login novamente." — esse comportamento (redirect preventivo) é uma alternativa razoável ao toast para o caso de reload sem sessão; o item do checklist já prevê isso como condicional ("se disparado pela tela"). Não testei o caminho de sessão expirar *durante* o uso (sem reload) por não ter como forçar expiração de token no servidor a partir do browser — registrando como cobertura parcial.

- [x] **ANA-13** Recarregar (F5) no meio do "gerando".
  PROVA: cliquei "Solicitar Análise", aguardei 1s (estado "gerando" confirmado visualmente antes), recarreguei a página. Após reload: botão "Solicitar Análise" voltou ao estado normal (verde, clicável, sem texto "gerando" nem esqueleto residual). `read_console_messages` (sem filtro, limit 50) não mostrou nenhum erro/warning da aplicação relacionado a requisição órfã ou abortada — as únicas mensagens de console são da própria extensão do Chrome (`[SlashCommand] Manager started`), não do app.

- [NÃO COBERTO] **ANA-14** Usuário sem dado suficiente. Motivo: só há o usuário de teste seedado com 5 semanas fechadas (sempre acima do gate) disponível para esta auditoria. Criar uma segunda conta de teste está fora do que este subagente pode fazer sem autorização explícita adicional (criação de conta é ação vedada pelas regras de execução deste agente) e alterar/apagar a seed do usuário existente violaria a instrução de não alterar dado nenhum. Não foi possível observar o texto de aviso "Você tem {N} semana(s)... São necessárias {M}..." nem os botões `aria-disabled` nesse cenário.

- [NÃO COBERTO] **ANA-15** Clicar card `aria-disabled` via teclado/Enter em cenário de dado insuficiente. Motivo: depende diretamente do cenário do ANA-14, que não foi possível reproduzir (ver acima). Sem um usuário em estado de dado insuficiente, não há botão `aria-disabled` pra testar o bloqueio via teclado.

- [x] **ANA-16** `AbaInferior ativa="analise"` e sem `VoltarFlutuante`.
  PROVA (JS sobre a nav inferior): link "Análise" com `aria-current="page"`; os demais (Início, Treinos, Catálogo, Ajustes) sem `aria-current`. Busca por `[class*="voltar" i]` no DOM não encontrou nenhum elemento — confirma ausência de `VoltarFlutuante` na tela.
