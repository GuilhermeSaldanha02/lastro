# AN-08 — Estudo do Motor Determinístico (Entregas 1 a 5)

> **Status:** estudo entregue em 2026-09-28, **nenhuma linha de código**. Ordem do dono (`docs/MISSAO-MOTOR-DETERMINISTICO.md` §28): depois das 5 entregas, PARAR e esperar aprovação.
> Base: `main` em `e2912e2`. Autor: Claude.

## Como ler

- **Nível** segue a §24 da missão: **N0** consulta, **N1** cálculo, **N2** detector, **N3** composição de evidências, **N4** interpretação aberta (só aqui entra Gemini).
- **"Semana" tem duas definições no app, e toda linha da matriz diz qual usa.**
  - **Semana em andamento**: é a da Home (`resumo-home.ts`).
  - **Última semana ISO fechada**: é a da Análise (`semanaAnaliseAtual`).
  - Misturar as duas é a forma mais barata de o roteador responder número errado.
- **O que eu li:**
  - Inteiros: todo o código de `src/lib/analise/`, as rotas `/api/coach` e `/api/analise`, `resumo-home.ts`, `progressao.ts` (dados), `metricas-treino.ts`, `/catalogo/[id]`, `coach-interativo.tsx`, `uso-ia.ts` e a migração `0020_uso_ia`. Também o `PRD.md` §1–§10 e a missão.
  - Em parte, por título e seção relevante: `ADR.md`, `KNOWLEDGE.md`, `ARCHITECTURE.md`, `DECISIONS.md` (últimas entradas) e `AGENTS.md`.

---

## Entrega 1 — Auditoria: o que já existe na `main`

### 1.1 A camada 1 (matemática) já está quase inteira

| Capacidade | Onde | Observação |
|---|---|---|
| Volume (reps × peso × 2 se unilateral **ou** peso por lado, nunca ×4) | `analise/volume.ts` | Fonte única declarada. Ver divergência D1 abaixo. |
| e1RM (teto de 12 reps) | `analise/e1rm.ts` | |
| Semana ISO, janelas, diferença em semanas | `analise/semanas.ts` | **Só semana.** Não há mês nem período livre. |
| Resumo da semana fechada + 4 semanas de comparação | `analise/agregar.ts` → `ResumoCompacto` | Tem volume por semana, por grupo e por exercício (com delta), tendência de e1RM, frequência, grupos sem estímulo, estagnações e PRs. |
| Pontos semanais por exercício + platô do gráfico | `analise/progressao.ts`, `dados/progressao.ts` | 12 semanas, até 4 painéis. |
| Recorde por série (piso de 3 sessões) | `analise/recorde-serie.ts` | Usado no formulário e no histórico do exercício. |
| Dias sem estímulo por grupo | `analise/recencia.ts` | Só grupos já treinados. |
| Sequência de dias | `analise/sequencia.ts` | Dias de calendário, não semanas. |
| Séries por grupo / volume por grupo | `analise/equilibrio.ts` | Home, aba "Grupos". |
| Séries difíceis (RIR ≤ 3, piso de cobertura 60%) | `analise/series-dificeis.ts` | |
| Métricas de uma sessão (tonelagem, séries, PRs do dia, foco) | `dados/metricas-treino.ts` | Relatório pós-treino. |
| Meta semanal de treinos | `dados/meta-semanal.ts` | Configurada em Ajustes. **Nenhuma métrica compara com ela ainda.** |

### 1.2 A camada 2 (inteligência determinística) existe em pedaços

| Peça | Onde | O que já é |
|---|---|---|
| **Detectores** | `estagnacao.ts` (4 semanas sem novo máximo), `progressao.detectarPlato` (3 semanas a 2%), `alerta-deload.ts` (salto de +30 pontos na proporção de séries difíceis), `fila-personal.ts` (grupo parado ≥ 21 dias, 3 quedas seguidas de volume) | Já existem quatro, todos puros e testados. |
| **Insight estruturado** | `AlertaPersonal` em `fila-personal.ts` | Já tem **tipo, alvo, prioridade, evidência, supressão por 3 semanas e teto por semana**. É o conceito `Insight` da missão §9, só que restrito ao personal. |
| **Formatador por template em 3 idiomas** | `leitura-deterministica.ts` | Cobre as perguntas 1 a 4 da Análise inteiras, sem IA. Hoje só aparece quando a Gemini falha. |
| **Evidência para a tela** | `api/analise/evidencia.ts` | Blocos por exercício com sinal (alta/platô/queda). |

### 1.3 A camada 3 (IA) e onde ela gasta cota

- **Análise Semanal** (`/api/analise`): 5 perguntas fixas. Cada parecer consome **2 unidades** (tentativa + retry de validação). O LLM já recebe só o `ResumoCompacto`, nunca série crua (ADR-003).
- **Coach** (`/api/coach`): texto livre, **1 unidade** por pergunta.
  - Por contrato, **não lê nenhum dado do usuário**: a regra 5 do prompt manda dizer que não tem acesso aos números.
  - O texto da pergunta **não é gravado em lugar nenhum**.
- **Cota:** plano gratuito, com 16 unidades por dia para o lastro inteiro. Por conta, são 2 análises e 3 perguntas ao Coach por dia (`config_ia`).

### 1.4 Achados da auditoria que o dono precisa saber

1. **As 3 perguntas sugeridas no Coach são recusadas pelo próprio Coach.** Estão em `coach-interativo.tsx`:
   - "Como foi meu volume de treino nesta semana?" → é dado do usuário, recusado pela regra 5.
   - "Qual grupo muscular estou treinando com menor frequência?" → idem.
   - "Devo aumentar a carga ou as repetições no meu próximo treino?" → é prescrição, recusada pela regra 2.

   **Cada toque num chip gasta 1 das 3 perguntas diárias da conta, e 1 das 16 do lastro inteiro, para receber uma recusa.** É o desperdício mais claro do app, e provado pelo código, sem precisar de telemetria. As duas primeiras são N0/N1 e o motor responde sem Gemini.
2. **D1 — A tonelagem do relatório diverge da tonelagem da lista.**
   - `metricas-treino.ts` dobra o volume só por `pesoPorLado` e ignora `exercicio.unilateral`.
   - `listarTreinos` e `calcularVolume` dobram pelos dois.
   - Resultado: num treino com exercício unilateral, a linha do histórico (UX-02) e o relatório do mesmo treino mostram números diferentes. São **52 dos 218 exercícios** do catálogo marcados como unilaterais (contado no banco em 2026-09-28).
   - É um bug, fora do escopo deste estudo. Sugiro PR própria.
3. **D2 — "Melhor marca" do catálogo é o maior peso cru**, enquanto PR em todo o resto do app é e1RM. A página funda por exercício (C1) tem de escolher uma definição.
4. **D3 — Platô tem três definições**, e cada uma tem motivo documentado:
   - gráfico: 3 semanas a 2%;
   - estagnação: 4 semanas sem novo máximo de e1RM nem de volume;
   - zona morta da evidência: ±1%.

   O roteador tem de escolher uma por intenção, não criar a quarta.
5. **D4 — Volume é recalculado em três lugares:** `calcularVolume`, `listarTreinos` (linha 144, correto) e `metricas-treino` (divergente). A missão pede para não duplicar; a correção de D1 deveria passar a usar `calcularVolume`.
6. **D5 — Não existe comparação de período fora da semana ISO.**
   - `montarResumoCompacto` está preso à última semana fechada mais a janela de 4 semanas.
   - Mês, "desde o início" e período livre não existem. É exatamente o que o AN-07 pediu.
7. **D6 — `leituraDeterministica` imprime data ISO crua em en/es** (`formatarDataCurta` só existe em português). O formatador do motor herda essa limitação.
8. Menor: o `ADR.md` tem duas entradas numeradas **ADR-010**.

### 1.5 Conflitos com decisões documentadas (registrados antes de propor)

| Proposta da missão | Conflito | De quem é a decisão |
|---|---|---|
| Roteador que responde perguntas sobre os dados no Coach (§10) | O Coach foi desenhado para **não ler dado nenhum** (comentário de `api/coach/route.ts` e regra 5 do prompt). O roteador inverte esse contrato. | **Dono.** |
| Responder as perguntas 1 a 4 da Análise sem Gemini (maior economia possível) | O PRD §1/§3 define a peça-assinatura como "parecer em português… usando IA". Trocar por template muda a peça-assinatura. | **Dono** (Scope Change). Eu não recomendo fazer isso sem ver os números da §5.2. |
| "Frequência caiu" como sinal/insight (§5, §9) | `DECISIONS.md` 2026-09-11 (4): uma semana contra uma média é oscilação, não tendência. Por isso o alerta do personal é queda de volume em 3 semanas seguidas. | Resolve por desenho: responder a **pergunta** com o número ("3 treinos contra média de 4,1") é descritivo e pode. Virar **insight automático** exige a mesma régua de tendência. |
| Limiares de anomalia e de sessão fora do padrão (§8, B1) | PRD §10: faixa de referência e N semanas de estagnação são TODO sem fonte primária. `KNOWLEDGE.md` §3.7: "não há critério científico". | **Dono.** O número é convenção declarada, igual a `DIAS_SEM_ESTIMULO_PARA_ALERTA`, nunca "ciência". |
| Índice de prontidão 0–100 (A2) | Qualquer fórmula ponderada é número inventado (E3). | Proposta: mostrar só os sinais crus e a média própria, sem índice único, ou uma soma transparente das 4 escalas, rotulada como tal. |
| D1 peso corporal, D2 Health Connect/Apple Health | PRD §5: "❌ Integração com relógio, balança, wearable, Health/Google Fit". | **Scope Change** antes de qualquer estudo técnico. |
| B2 "Lastro percebeu" na Home | Não conflita, mas a Home hoje não gasta IA e é o que abre sem rede (cache do SW). O insight precisa ser servido junto do `carregarResumoHome`, sem requisição extra. | Técnico. |

---

## Entrega 2 — Matriz de capacidades

Legenda de semana: **A** = semana em andamento, **F** = última semana ISO fechada, **P** = período pedido na pergunta (mês, "desde o início"…).

### Progressão

| # | Intenção | Exemplo | Nível | Semana | Dados e funções que já existem | Cálculo que falta | Resposta determinística possível | Gemini? |
|---|---|---|---|---|---|---|---|---|
| 1 | `PROGRESSO_GERAL` | "Estou evoluindo?" | N3 | F | `tendencia_e1rm`, `estagnacoes`, `leituraDeterministica` (parágrafo 1) | nada | "4 dos 6 exercícios subiram; o supino liderou com +5,2% de e1RM." | Não |
| 2 | `EXERCICIO_MAIS_EVOLUIU` | "Qual exercício mais evoluiu no último mês?" | N1 | P | `calcularSeriesSemanais`, `calcularE1rm` | período mensal (D5); ranking sem o corte de 8 exercícios | "Supino reto: e1RM de 80 para 86 kg (+7,5%) em 4 semanas." | Não |
| 3 | `EXERCICIO_MENOS_EVOLUIU` | "Qual exercício menos evoluiu?" | N1 | P | idem | idem | "Rosca direta: −3,1%." | Não |
| 4 | `ESTAGNACAO` | "Onde estou estagnado?" | N2 | F | `calcularEstagnacoes` | nada | "Leg press sem novo máximo há 5 semanas." | Não |
| 5 | `PERDENDO_FORCA` | "Estou perdendo força?" | N2 | F | `tendencia_e1rm` com zona morta de 1% | escolher a régua (D3) | "Em queda real: remada curvada (−6,4%)." ou "Nenhum exercício caiu além de 1%." | Não |
| 6 | `DELTA_E1RM_EXERCICIO` | "Quanto meu e1RM do supino aumentou?" | N1 | P | `calcularSeriesSemanais` | reconhecer o exercício no texto (aliases em 3 idiomas + catálogo traduzido) | "Supino: de 80 para 86 kg desde 1/set." | Não |
| 7 | `ULTIMO_PR` | "Quando foi meu último PR no supino?" | N1 | P | `marcarRecordesHistoricos`, `historicoDoExercicio` | pegar o último índice marcado | "12/set: 8 × 85 kg (e1RM 107)." | Não |
| 8 | `TEMPO_SEM_PR` | "Há quanto tempo não bato PR?" | N1 | P | idem, todos os exercícios | varrer exercícios | "Último recorde: 19 dias atrás, no agachamento." | Não |
| 9 | `PRS_NO_PERIODO` | "Quantos PRs fiz este mês?" | N1 | P | `marcarRecordesHistoricos` | período mensal; **escolher a definição de PR** (por série/e1RM × `calcularPrs` semanal com e1RM **e** volume) | "3 recordes em setembro: …" | Não |
| 10 | `PROXIMO_DO_PR` | "Qual exercício está mais perto do recorde?" | N1 | P | `calcularE1rm` | razão entre o e1RM recente e o máximo histórico | "Terra: a 2% do seu recorde." | Não |

### Volume

| # | Intenção | Exemplo | Nível | Semana | Dados e funções que já existem | Cálculo que falta | Resposta determinística possível | Gemini? |
|---|---|---|---|---|---|---|---|---|
| 11 | `VOLUME_VARIOU` | "Meu volume aumentou?" / "caiu?" | N1 | F | `volume_semanal` (4 semanas) | nada | "Semana fechada: 42.300 kg, +8% sobre a anterior." | Não |
| 12 | `VOLUME_SEMANA_ATUAL` | "Como foi meu volume nesta semana?" (**chip do Coach**) | N0 | A | `resumoHome.volumeNaSemana` | nada | "Até agora: 18.200 kg em 2 treinos." | Não |
| 13 | `GRUPO_MAIS_VOLUME` | "Qual grupo recebeu mais volume?" | N0 | A ou F | `calcularVolumePorGrupo` | nada | "Costas: 9.800 kg." | Não |
| 14 | `GRUPO_MENOS_VOLUME` | "Qual grupo recebeu menos?" | N1 | F | idem + `grupos_sem_estimulo` | nada | "Panturrilha: nenhuma série na semana." | Não |
| 15 | `EXERCICIO_MAIS_VOLUME` | "Qual exercício mais contribuiu pro volume?" | N1 | F | `volume_por_exercicio` | nada | "Leg press: 31% do volume da semana." | Não |
| 16 | `VOLUME_GRUPO_CAIU` | "Meu volume de peito caiu?" | N1 | F | `volume_por_grupo_muscular.delta_volume_pct` | reconhecer o grupo no texto | "Peito: −18% contra a semana anterior." | Não |
| 17 | `VOLUME_MES_VS_MES` | "Quanto meu volume mudou em relação ao mês passado?" | N1 | P | `calcularVolume` | comparação temporal mensal (D5) | "Setembro: 168 t; agosto: 150 t (+12%)." | Não |
| 18 | `SEMANA_MAIOR_VOLUME` | "Qual foi minha semana de maior volume?" | N1 | P | `calcularVolume` | iterar o histórico todo por semana | "Semana de 8/set: 51.000 kg." | Não |
| 19 | `TREINO_MAIOR_VOLUME` | "Qual treino teve maior volume?" | N0 | P | `listarTreinos.volumeKg` | nada (depende de D1 corrigido) | "15/set, 14.700 kg." | Não |

### Frequência

| # | Intenção | Exemplo | Nível | Semana | Dados e funções que já existem | Cálculo que falta | Resposta determinística possível | Gemini? |
|---|---|---|---|---|---|---|---|---|
| 20 | `TREINOS_NA_SEMANA` | "Quantas vezes treinei esta semana?" | N0 | A | `resumoHome.treinosNaSemana` | nada | "3 treinos (seg, qua, sex)." | Não |
| 21 | `FREQUENCIA_GRUPO` | "Quantas vezes treinei peito este mês?" | N0 | P | séries valendo + grupo | contar treinos distintos por grupo | "Peito em 6 treinos de setembro." | Não |
| 22 | `GRUPO_MENOS_FREQUENTE` | "Qual grupo estou treinando com menor frequência?" (**chip do Coach**) | N1 | P | `diasSemEstimuloPorGrupo`, `calcularSeriesPorGrupo` | contagem de treinos por grupo em 4 semanas | "Posterior de coxa: 1 treino nas últimas 4 semanas." | Não |
| 23 | `DIAS_SEM_GRUPO` | "Há quanto tempo não treino costas?" | N0 | — | `diasSemEstimuloPorGrupo` | nada | "Costas: 9 dias." | Não |
| 24 | `EXERCICIO_MAIS_PARADO` | "Qual exercício não faço há mais tempo?" | N0 | — | análogo a `recencia.ts`, por exercício | variação pequena de `recencia` | "Stiff: 41 dias." | Não |
| 25 | `FREQUENCIA_COMPARADA` | "Minha frequência caiu?" | N1 | F | `frequencia.treinos_semana_atual` e `media_semanas_anteriores` | nada | "3 treinos na semana fechada, contra média de 4,1." **Descritivo, sem chamar de queda** (conflito da §1.5). | Não |
| 26 | `MEDIA_SEMANAL` | "Qual é minha média semanal de treinos?" | N1 | P | `frequencia` (só 4 semanas) | período livre | "Média de 3,6 treinos por semana desde julho." | Não |

### Consistência

| # | Intenção | Exemplo | Nível | Semana | Dados e funções que já existem | Cálculo que falta | Resposta determinística possível | Gemini? |
|---|---|---|---|---|---|---|---|---|
| 27 | `META_CUMPRIDA` | "Em quantas semanas bati minha meta?" | N1 | P | `usuario.meta_treinos_semana`, treinos por semana | comparar semana a semana | "Meta de 4: cumprida em 6 das últimas 8 semanas." | Não |
| 28 | `SEMANAS_SEGUIDAS` | "Quantas semanas seguidas treinei?" | N1 | P | `semanas.ts` | sequência por **semana** (`sequencia.ts` é por dia) | "11 semanas seguidas com pelo menos 1 treino." | Não |
| 29 | `SEQUENCIA_DIAS` | "Quantos dias seguidos treinei?" | N0 | — | `calcularSequenciaAtual` | nada | "2 dias seguidos (ontem e hoje)." | Não |

### Composição de evidências (N3)

| # | Intenção | Exemplo | Nível | Semana | Dados e funções que já existem | Cálculo que falta | Resposta determinística possível | Gemini? |
|---|---|---|---|---|---|---|---|---|
| 30 | `RESUMO_SEMANA` | "Como foi minha semana?" | N3 | F | `leituraDeterministica` inteira | nada | Os 3 parágrafos que já existem. | Não |
| 31 | `RESUMO_PERIODO` (**AN-07**) | "Relatório do primeiro treino até hoje" | N3 | P | todos os agregadores | `montarResumoCompacto` com período genérico (D5) | "Desde 4/ago: 58 treinos, 9 PRs, volume semanal médio de 38 t, maior evolução…" | Não |
| 32 | `O_QUE_MUDOU_EXERCICIO` | "O que mudou no meu supino?" | N3 | P | pontos semanais, recordes, recência | compositor por exercício | "e1RM −6%; frequência de 2 para 1 treino por semana; volume −18% no mesmo período." | Não |
| 33 | `POR_QUE_PIOROU` | "Por que meu treino piorou?" | N3 | P | volume, frequência, séries difíceis, `avaliarSinalDeload` | compositor de coincidências | "A queda coincidiu com volume 18% menor e 1 treino a menos por semana." **Nunca "porque".** Sem evidência nenhuma: diz isso, não chama Gemini para adivinhar. | Não |
| 34 | `ESFORCO` | "Estou treinando pesado demais?" | N2 | F | `series_dificeis`, `avaliarSinalDeload` | nada | "8 das 20 séries com RIR ≤ 3; proporção subiu 35 pontos contra as 4 semanas anteriores." | Não |

### Fora do motor (recusa determinística ou N4)

| # | Intenção | Exemplo | O que o app faz hoje | Proposta | Gemini? |
|---|---|---|---|---|---|
| 35 | `PRESCRICAO` | "Devo aumentar a carga ou as repetições?" (**chip do Coach**) | Gasta 1 unidade e a Gemini recusa (regra 2). | Recusa por template **sem reservar cota**, apontando para a pergunta 5 da Análise (ou para o personal, sob vínculo). | Não |
| 36 | `EXECUCAO` | "Como faço o agachamento?" | Gasta 1 unidade e a Gemini recusa (regra 1). | Reconhecido o exercício, devolve o link de `/catalogo/[id]`. Sem reconhecer, cai no N4 como hoje. | Só no fallback |
| 37 | `SAUDE` | "Meu joelho dói no agachamento" | Gasta 1 unidade e a Gemini recusa (regra 3). | Recusa por template, com os termos-gatilho em 3 idiomas. O falso negativo cai na Gemini, que também recusa. **Mesmo resultado, com menos cota gasta.** | Só no fallback |
| 38 | `DUVIDA_GERAL` | "O que é RIR?" / "Vale treinar em jejum?" | Gemini responde. | "O que é RIR" pode apontar para o manual (`/ajustes/guia`). O resto segue N4, que é o papel atual do Coach. | **Sim** |

**Total: 34 perguntas de dados (N0–N3), todas respondíveis sem Gemini, mais 3 recusas que hoje gastam cota à toa.** Das 34, 22 funcionam **só com o que já existe**, sem nenhum cálculo novo além de reconhecer o alvo no texto. O cálculo novo que mais se repete é a comparação de período (D5): ela aparece em 11 linhas.

---

## Entrega 3 — Arquitetura proposta

Mapeada sobre o que já existe, sem caixa paralela.

```text
POST /api/coach { pergunta }
   │
   ├─ limparPergunta (já existe)
   ├─ Normalização: minúsculas, sem acento, sem pontuação; idioma da conta
   ├─ Intent Router (NOVO, src/lib/coach/roteador.ts)
   │     regras por padrão + aliases em pt/en/es + nomes do catálogo traduzido
   │     saída: { intent, alvo?, periodo?, confianca: "alta" | "baixa" }
   ├─ Capability Registry (NOVO, src/lib/coach/capacidades.ts)
   │     intent → { executor, precisaDados, semana: "A"|"F"|"P" }
   ├─ Executor determinístico
   │     REUSA: agregar.ts, progressao.ts, recencia.ts, recorde-serie.ts,
   │            sequencia.ts, equilibrio.ts, alerta-deload.ts
   │     NOVO:  analise/periodo.ts (comparação temporal, D5)
   ├─ Evidence  = ResumoCompacto / EvidenciaParaTela / AlertaPersonal generalizado
   ├─ Formatter = Frases por idioma, no molde de leitura-deterministica.ts
   └─ Resposta  { resposta, origem: "local" }   ← NÃO reserva cota
```

Caminho alternativo:

```text
intent desconhecida ou confiança baixa
   ├─ recusa por template (prescrição, execução, saúde) → sem cota
   ├─ existe evidência útil? → devolve a evidência + "não sei interpretar além disso"
   └─ senão: reservarUso("coach") → Gemini com o prompt atual → { origem: "gemini" }
```

Decisões de desenho, cada uma com o porquê:

1. **Classificar sem LLM** (missão §11). O vocabulário é pequeno e fechado: os 11 grupos musculares, os 218 exercícios já traduzidos (`mapaTraducaoExercicios`) e umas 30 formas de perguntar por intent em 3 idiomas. Um parser de regras cobre isso. **Embedding e LLM para classificar ficam fora.**
2. **Confiança baixa não chama Gemini para classificar.** Ela cai no caminho N4 normal, que já é o comportamento de hoje. O pior caso fica igual ao atual, nunca pior.
3. **`Insight` = generalizar o `AlertaPersonal`**, não criar tipo novo. Ele já tem tipo, alvo, prioridade, evidência, supressão e teto.
   - Os tipos da missão (`PROGRESSAO`, `NOVO_PR`, `VOLUME_CAIU`…) entram como novos valores de `TipoAlerta`, com o prefixo do projeto e em minúsculas (convenção atual: `grupo_sem_estimulo`).
   - A fila do personal passa a ser **um consumidor** dos insights, filtrando os três tipos que ela aceita.
4. **Comparação temporal** num módulo só (`analise/periodo.ts`): `{ inicio, fim }` e `anteriorEquivalente(periodo)` (semana, 4 semanas, mês de calendário, período livre).
   - `montarResumoCompacto` passa a aceitar o período em vez de derivar tudo de `agora`.
   - O caminho da Análise continua passando "semana fechada + 4". **O contrato do prompt (`ResumoCompacto` v1) não muda.**
5. **Cache: não adicionar agora.** O custo real de cada pergunta é uma consulta ao Supabase (todos os treinos do usuário) mais agregação em memória. Com o volume atual de dados por conta, recalcular é mais barato do que manter invalidação. Reavaliar só se a consulta passar de ~300 ms em produção (medir antes).
6. **Isolamento aluno/personal:** toda consulta nova filtra `.eq("usuario_id", user.id)` explicitamente (regra da 0022). A trava da prescrição sob vínculo vale para o roteador: `PRESCRICAO` sob vínculo encaminha ao personal, com o mesmo texto de `sistemaCoach(true)`.
7. **Offline: sem impacto.** Coach e Análise já exigem rede, toda a análise é `"use server"` e o Dexie guarda só a fila de envio. O motor roda no servidor.
8. **i18n:** hoje o chip do Coach envia a pergunta em português mesmo com a tela em en/es.
   - O roteador precisa de aliases nos 3 idiomas.
   - As respostas por template entram no `i18n.ts` (ou em `Frases` por idioma) e passam no `verificar-textos-i18n.mjs`.
   - As datas em en/es herdam D6.

---

## Entrega 4 — Roadmap

Esforço segue a régua do backlog (BAIXO = uma PR pequena, MÉDIO = sessão longa, ALTO = várias sessões).

### Fase 0 — Motor determinístico

| Item | Benefício | Depende de | Tabelas | Módulos | Reusa | Novo | Risco | Esforço | Migração | Offline | Personal | i18n | Testes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **F0-TEMPO** comparação temporal | Destrava 11 das 34 perguntas e o AN-07 | — | nenhuma | `analise/periodo.ts`, `agregar.ts` | `semanas.ts` | período genérico | Mudar `agregar.ts` quebrar a Análise | MÉDIO | Não | Nenhum | `fila-personal` segue na semana fechada | Nenhum | Unitários do período; os testes do agregador já existentes têm de passar sem mudar |
| **F0-ROTEADOR** roteador + registry + executores | Para de gastar cota com as 3 recusas e os 2 chips de dados | F0-TEMPO (só para as intents de período); **decisão do dono** de inverter o contrato do Coach | nenhuma | `api/coach/route.ts`, `api/coach/prompt.ts` (regra 5), `lib/coach/*` novo, `coach-interativo.tsx` | todos os agregadores, `leitura-deterministica` | parser, aliases, executores | Classificar errado e responder a pergunta errada com número certo | MÉDIO a ALTO | Não | Nenhum | Trava da prescrição sob vínculo | Aliases e respostas em 3 idiomas | Tabela de frases → intent (pt/en/es), falso positivo, e2e do Coach com resposta local sem chamar `reservar_uso_ia` |
| **F0-INSIGHT** generalizar `AlertaPersonal` | Base de B2 e da fila; um lugar só para priorizar e silenciar | — | nenhuma (a supressão da Home pode ser só por semana, sem gravar) | `fila-personal.ts`, novo `analise/insights.ts` | detectores existentes | tipos novos | Mexer na fila do personal e mudar o que ela mostra | MÉDIO | Não | Nenhum | A fila tem de continuar idêntica (teste de regressão) | Textos por tipo | Regressão completa da `fila-personal` |
| **F0-ANOMALIA** sessão fora do padrão | Base de B1 | F0-INSIGHT; **limiar decidido pelo dono** | nenhuma | novo detector | `calcularMetricasSessao` (depois de D1) | "sessões comparáveis" (mesmo foco? mesmos grupos?) | Alerta com amostra pequena | MÉDIO | Não | Nenhum | Nenhum | Textos | Piso de amostra; sessão com 1 exercício |
| **F0-CUSTO** contadores | Única forma de provar economia (§5) | F0-ROTEADOR | 1 tabela nova de contadores diários **sem `usuario_id` e sem texto** | rota do Coach | — | — | Nenhum de privacidade, pelo desenho | BAIXO | Sim | Nenhum | Nenhum | Nenhum | Unitário do incremento |
| **F0-CACHE** | — | — | — | — | — | — | — | — | — | — | — | — | **Não fazer agora** (decisão 5 da Entrega 3). |
| **Pré-requisito: D1** tonelagem | Relatório e lista passam a bater | — | nenhuma | `metricas-treino.ts` | `calcularVolume` | — | Números já vistos pelo dono mudam em treinos com unilateral | BAIXO | Não | Nenhum | Nenhum | Nenhum | Teste com exercício unilateral |

### Fase A — Contexto de recuperação

| Item | Benefício | Depende de | Tabelas | Risco | Esforço | Migração | Offline | Personal | Observação |
|---|---|---|---|---|---|---|---|---|---|
| **A1** check-in (sono, energia, dor, estresse) | Contexto aos números | — | `checkin` nova | Virar diário médico | MÉDIO | Sim | **Alto:** é feito na academia, então precisa entrar na fila do Dexie como a série | **A política de leitura do personal não cobre a tabela nova, de propósito.** Decidir se o personal vê. | Dado de saúde novo: **Política de Privacidade muda, e `VERSAO_DOCUMENTOS` sobe (todos reaceitam).** |
| **A2** prontidão | Leitura rápida do check-in | A1 | nenhuma | Número inventado apresentado como ciência | BAIXO | Não | Nenhum | Idem A1 | Proposta: sinais crus contra a média própria, sem índice único ponderado (§1.5). |
| **A3** recuperação × desempenho | Coincidência, nunca causa | A1 com histórico, F0-TEMPO | nenhuma | Causalidade implícita no texto | MÉDIO | Não | Nenhum | Idem | Só depois de ~8 semanas de check-in. |

### Fase B — Inteligência

| Item | Benefício | Depende de | Tabelas | Risco | Esforço | Migração | Offline | Personal | Observação |
|---|---|---|---|---|---|---|---|---|---|
| **B1** sessão fora do padrão no fim do treino | Leitura imediata pós-treino | F0-ANOMALIA, D1 | nenhuma | Alerta chato em semana de deload | MÉDIO | Não | O relatório pós-treino abre com a última série; a comparação precisa de histórico do servidor. **Sem rede, mostra só a sessão.** | Nenhum | Entra no relatório existente (`relatorio-pos-treino.tsx`). |
| **B2** "Lastro percebeu" na Home | Diferencial visível sem gastar IA | F0-INSIGHT | nenhuma | Poluir a Home; repetir o mesmo insight toda semana | MÉDIO | Não | Vem junto com o `carregarResumoHome`, sem requisição extra | Nenhum | **Portão visual** (tela existente). Máximo de 2 por vez, como a fila do personal. |
| **B3** explicar mudança de desempenho | "Coincidiu com" | F0-TEMPO, F0-INSIGHT | nenhuma | Causalidade | MÉDIO | Não | Nenhum | Nenhum | É a intent 33 da matriz: sai junto com o roteador. |

### Fase C — Histórico

| Item | Benefício | Depende de | Tabelas | Risco | Esforço | Migração | Offline | Personal | Observação |
|---|---|---|---|---|---|---|---|---|---|
| **C1** página funda por exercício | e1RM, PR e tendência num lugar | D2 decidido (PR = e1RM ou peso) | nenhuma | Duplicar o gráfico de `/analise` | MÉDIO | Não | Nenhum | Nenhum | `/catalogo/[id]` já tem histórico e marca de recorde; falta e1RM, tendência e "desde o último PR". **Portão visual.** |
| **C2** consistência/calendário | — | — | — | — | BAIXO | Não | — | — | **O calendário já existe (UX-02).** Falta só meta cumprida por semana (intent 27) e semanas seguidas (28). |
| **C3** resumo mensal | Fechamento do mês por template | F0-TEMPO | nenhuma | — | BAIXO | Não | Nenhum | Nenhum | É a intent 31 com período = mês. |

### Fase D — Dados externos

| Item | Observação |
|---|---|
| **D1** peso corporal | **Conflita com PRD §5** (balança/Health). O registro de peso corporal isolado, fora da série, pede Scope Change e Política nova. |
| **D2** Health Connect / Apple Health | **Conflita com PRD §5** ("❌ Health/Google Fit"). App PWA não lê o Health Connect nem o HealthKit sem app nativo, e app nativo também está no §5. Não estudar até o dono mudar o escopo. |

---

## Entrega 5 — Economia estimada de IA

### 5.1 O que dá para afirmar sem telemetria

- **Coach, as 3 sugestões da tela:** 100% das vezes gastam 1 unidade e voltam recusa. Com o roteador, as 2 de dados passam a ser respondidas sem Gemini e a de prescrição é recusada sem cota. **Economia por toque: 1 unidade, sempre.** Quantos toques existem por dia é desconhecido.
- **Coach, pergunta digitada sobre os próprios dados:** hoje recusada por contrato. Toda pergunta dessas é gasto sem resposta. Quantas são: **não há dados suficientes para estimar.** O texto da pergunta não é gravado, e `uso_ia` guarda só a origem.
- **Análise, perguntas 1 a 4:** cada uma já tem resposta determinística completa (`leituraDeterministica`) e custa 2 unidades.
  - Trocar por template é a maior economia possível: até 2 unidades por parecer.
  - **Mas é a decisão de escopo da §1.5** (peça-assinatura). A proporção das perguntas 1–4 no total **é mensurável hoje**, com as consultas abaixo.

### 5.2 Consultas (só leitura, contagens agregadas)

```sql
-- Uso por origem nos últimos 30 dias
select origem, count(*) as unidades_registradas, count(distinct usuario_id) as contas
from uso_ia
where criado_em > now() - interval '30 days'
group by origem;

-- Pareceres por pergunta e quantos caíram no fallback determinístico
select pergunta,
       count(*) as pareceres,
       count(*) filter (where falha_motivo is not null) as caiu_no_fallback
from parecer
where criado_em > now() - interval '30 days'
group by pergunta
order by pergunta;
```

Resultado: §5.3.

Com a segunda consulta: **economia máxima da Análise = pareceres das perguntas 1–4 × 2 unidades.** Isso vale se o dono decidir que o template basta. Sem essa decisão, a economia da Análise é zero, e o número serve só para decidir.

### 5.3 Resultado medido (2026-09-28, últimos 30 dias, produção)

| Fonte | O quê | Total | Contas |
|---|---|---|---|
| `uso_ia` | `coach` | 3 | 1 |
| `uso_ia` | `parecer` | 1 | 1 |
| `parecer` | pergunta 1 | 1 (0 no fallback) | 1 |

**Leitura honesta:** o uso real de IA hoje é quase nulo (4 registros em 30 dias, uma conta). Com isso:
- Não dá para estimar percentual de economia. **Não há dados suficientes para estimar**, como a missão pede que se declare.
- A cota não é o gargalo **hoje**. O motor se justifica por três outros motivos:
  - responder o que hoje é recusado (os chips);
  - não depender da Gemini, que cai com 503 com frequência (`DECISIONS.md` 2026-09-04);
  - preparar a abertura ao público, quando o teto de 16 unidades por dia passa a apertar.
- Como a `uso_ia` registra tentativa e é imutável, o número é confiável. A tabela `parecer` perde linhas descartadas, então a contagem por pergunta pode estar subestimada.

### 5.4 Como medir depois do roteador

- Uma tabela de **contadores diários agregados**: `(dia, intent, destino)`, com destino `local` | `recusa_local` | `gemini` | `fallback_gemini`, mais um contador de reclassificação. **Sem `usuario_id`, sem texto da pergunta.**
- Por que sem usuário e sem texto:
  - Gravar o texto seria dado pessoal novo, porque pergunta de treino pode conter saúde.
  - Isso obrigaria a mudar a Política, subir `VERSAO_DOCUMENTOS` e fazer **todas as contas reaceitarem**.
  - Contador agregado dá a taxa da missão §25 ("Taxa de resolução local: 73,7%") sem nada disso.
- **Erro de classificação** não se mede sozinho. Proposta: um toque de "não era isso" na resposta local, que incrementa o contador e reenvia a mesma pergunta pelo caminho da Gemini.

---

## §28 — Decisão de implementação: o que apresento e onde paro

1. **Estado atual:**
   - A matemática está pronta.
   - Há 4 detectores e um motor de insight (restrito ao personal).
   - O formatador em 3 idiomas já existe, mas só aparece quando a IA falha.
   - O Coach não lê dado nenhum, e as 3 sugestões da tela dele são recusadas por ele mesmo.
2. **Lacunas:**
   - Não há comparação de período fora da semana ISO (D5).
   - Não há roteador.
   - Três definições de volume, com uma divergente (D1).
   - Duas de PR (D2) e três de platô (D3).
   - Não há medição de onde a cota é gasta.
3. **Arquitetura:** Entrega 3, montada sobre o que existe (`AlertaPersonal`, `leituraDeterministica`, `ResumoCompacto`).
4. **Matriz Gemini × determinístico:**
   - 34 perguntas de dados em N0–N3, todas sem Gemini.
   - 3 recusas que hoje gastam cota.
   - N4 fica só para dúvida geral, que é o papel atual do Coach.
5. **Roadmap:** Entrega 4.
6. **Riscos:**
   - Classificar errado e responder com número certo para a pergunta errada.
   - Inverter o contrato do Coach sem o dono decidir.
   - Mexer em `agregar.ts` e alterar a Análise.
   - Limiar inventado virar "ciência".
   - Dado de saúde novo (A1) sem atualizar a Política.
7. **Primeira milestone recomendada (M1):** "o Coach para de gastar cota com o que o lastro já sabe".
   - Antes dela, a correção de D1 numa PR própria.
   - Depois F0-TEMPO, e F0-ROTEADOR cobrindo só as intents **12, 13, 20, 22, 23, 25, 29, 30** e as recusas **35–37**. Com isso somem os 3 chips que hoje só gastam, e as perguntas mais frequentes da Home viram resposta local.
   - AN-07 (intent 31) entra na M2, junto com C3, porque os dois são o mesmo cálculo.
   - **Pré-condição:** o dono autorizar que o Coach passe a ler os dados do próprio usuário (§1.5, primeira linha).
8. **Arquivos que a M1 alteraria:**
   - `src/lib/dados/metricas-treino.ts` (D1)
   - `src/lib/analise/periodo.ts` (novo)
   - `src/lib/analise/agregar.ts` (aceitar período)
   - `src/lib/coach/roteador.ts`, `src/lib/coach/capacidades.ts`, `src/lib/coach/respostas.ts` (novos)
   - `src/app/api/coach/route.ts` (roteador antes de `reservarUso`)
   - `src/app/api/coach/prompt.ts` (regra 5)
   - `src/components/coach-interativo.tsx` (chips)
   - `src/lib/texto/i18n.ts`
   - uma migração de contadores (F0-CUSTO)
   - os testes de cada um e um spec e2e do Coach local.

**Parado aqui. Nenhuma implementação começa sem aprovação.**
