# Missão — Motor Determinístico + Novas Camadas de Inteligência

> **Status (atualizado 2026-10-01): EM ANDAMENTO, por milestones.** O estudo
> (5 entregas) foi aprovado em 2026-09-28; **M1 e M2 estão em produção**; a
> **M3 está em PRs abertas (#359 a #363), ainda não mergeadas**. O estado vivo
> está na tabela `AN-08.*` de `docs/BACKLOG-CANONICO.md`; cada milestone só
> começa com autorização do dono. Fases A (check-in, aprovado para depois da
> M3) e B/C seguem a ordem do backlog; D1, D2 e F0-CACHE estão congelados.
>
> Histórico: este roteiro foi colado em 2026-09-28 e registrado sem execução.
> O texto abaixo é o original do dono, sem edição de conteúdo.

---

# MISSÃO — EVOLUÇÃO DO LASTRO: MOTOR DETERMINÍSTICO + NOVAS CAMADAS DE INTELIGÊNCIA

Quero iniciar uma nova etapa do projeto Lastro.

Antes de implementar qualquer coisa, leia obrigatoriamente o estado atual do repositório e os documentos canônicos, especialmente:

- `PRD.md`
- `PROGRESS.md`
- `ARCHITECTURE.md`
- `ADR.md`
- `DECISIONS.md`
- `KNOWLEDGE.md`
- `docs/BACKLOG-CANONICO.md`
- `AGENTS.md`
- código atual de `src/lib/analise/`
- implementação atual do Coach
- implementação atual da Análise Semanal
- implementação atual de progressão, PRs, volume, frequência, platô, grupos sem estímulo e modo Personal.

Não presuma que este roteiro reflete perfeitamente a `main`.

Primeiro confronte cada proposta com o código real.

Se algo abaixo já existir, estiver parcialmente implementado ou conflitar com uma decisão documentada, registre isso antes de propor implementação.

---

# 1. OBJETIVO PRINCIPAL

Quero aprofundar o diferencial central do Lastro:

> O usuário registra o treino e o Lastro transforma os registros em uma leitura útil do que está acontecendo.

O objetivo NÃO é transformar o Lastro em:

- rede social;
- aplicativo de dieta;
- gerador automático de treino;
- aplicativo de gamificação;
- substituto de personal;
- ferramenta médica.

O foco continua sendo:

**dados → métricas → sinais → interpretação.**

Existe também um segundo objetivo técnico extremamente importante:

> REDUZIR chamadas desnecessárias à Gemini.

Hoje várias perguntas que um usuário pode fazer sobre seus próprios dados podem, em princípio, ser respondidas por código determinístico.

Não quero gastar Gemini para calcular ou descobrir algo que o próprio sistema consegue determinar.

---

# 2. NOVO PRINCÍPIO DE ARQUITETURA

Adicionar como princípio desta evolução:

## DETERMINISTIC FIRST

Sempre seguir esta ordem:

DADOS BRUTOS
↓
AGREGADORES DETERMINÍSTICOS
↓
MÉTRICAS
↓
DETECTORES
↓
INSIGHTS ESTRUTURADOS
↓
RESPOSTA DETERMINÍSTICA
↓
GEMINI SOMENTE SE NECESSÁRIO

A Gemini nunca deve ser a primeira opção para responder uma pergunta sobre dados que já podem ser calculados localmente ou no backend.

Exemplo:

Usuário pergunta:

> "Qual exercício mais evoluiu no último mês?"

Não chamar Gemini.

Código:

1. busca período;
2. calcula evolução;
3. compara exercícios;
4. encontra maior evolução;
5. formata resposta.

Outro exemplo:

> "Estou treinando peito menos?"

Não chamar Gemini.

Código:

1. calcula frequência histórica;
2. calcula frequência recente;
3. compara;
4. responde.

Gemini deve ser reservada para perguntas realmente abertas ou que necessitem interpretação textual não coberta pelo motor determinístico.

---

# 3. FASE 0 — MOTOR DETERMINÍSTICO

Esta fase deve acontecer ANTES das novas features.

Primeiro faça uma auditoria das perguntas que o Lastro consegue responder apenas com código.

Não implemente imediatamente.

Produza primeiro uma MATRIZ DE CAPACIDADES.

Formato:

| Pergunta | Dados necessários | Já existem? | Lógica necessária | Gemini necessária? |
|---|---|---|---|---|

Investigar no mínimo as seguintes categorias.

## PROGRESSÃO

Exemplos:

- Estou evoluindo?
- Qual exercício mais evoluiu?
- Qual exercício menos evoluiu?
- Onde estou estagnado?
- Estou perdendo força?
- Qual foi meu melhor exercício no mês?
- Quanto meu e1RM aumentou?
- Há quanto tempo não bato PR?
- Qual foi meu último PR?
- Quantos PRs fiz este mês?
- Qual exercício está mais próximo do PR histórico?

Grande parte provavelmente pode reutilizar:

- e1RM;
- progressão;
- PR;
- platô;
- histórico semanal.

---

# 4. VOLUME

Perguntas possíveis:

- Meu volume aumentou?
- Meu volume caiu?
- Qual grupo recebeu mais volume?
- Qual grupo recebeu menos volume?
- Qual exercício mais contribuiu para o volume?
- Meu volume de peito caiu?
- Quanto meu volume mudou em relação ao mês passado?
- Qual foi minha semana de maior volume?
- Qual treino teve maior volume?

Tudo isso deve ser investigado como cálculo determinístico.

---

# 5. FREQUÊNCIA

Perguntas:

- Quantas vezes treinei esta semana?
- Quantas vezes treinei peito?
- Estou treinando costas menos?
- Qual grupo estou deixando de treinar?
- Há quanto tempo não treino determinado grupo?
- Qual exercício não faço há mais tempo?
- Minha frequência caiu?
- Qual é minha média semanal de treinos?

Novamente:

não usar Gemini se uma consulta + agregador responder.

---

# 6. CONSISTÊNCIA

Criar uma camada de análise de consistência.

Possíveis métricas:

- treinos por semana;
- semanas consecutivas com treino;
- cumprimento da meta semanal;
- média móvel de sessões;
- frequência por grupo;
- semanas abaixo da própria média.

Exemplos:

> "Nas últimas 8 semanas você completou sua meta em 6."

> "Sua média caiu de 4,1 para 3,2 treinos por semana."

Isso deve ser completamente determinístico.

---

# 7. COMPARAÇÃO TEMPORAL

Criar uma abstração consistente para comparar:

- semana atual × anterior;
- últimas 4 semanas × 4 anteriores;
- mês atual × anterior;
- período personalizado × período anterior equivalente.

Essa camada deve poder ser reutilizada por:

- volume;
- frequência;
- e1RM;
- PRs;
- consistência;
- recuperação futuramente.

Evitar implementar a mesma matemática em várias features.

---

# 8. DETECTOR DE ANOMALIAS DE TREINO

Criar uma lógica para detectar quando uma sessão foge significativamente do padrão recente do próprio usuário.

Não comparar o usuário com população geral.

Comparar:

USUÁRIO ATUAL
vs.
HISTÓRICO DO MESMO USUÁRIO.

Exemplo:

Média das últimas sessões comparáveis:

10.200 kg

Treino atual:

7.100 kg

Diferença:

-30,4%

Gerar evento estruturado:

```text
tipo: volume_abaixo_padrao
valor_atual: 7100
referencia: 10200
variacao_pct: -30.4
```

Outro exemplo:

Carga/e1RM caiu, mas quantidade de séries permaneceu semelhante.

Outro:

Sessão terminou com número significativamente menor de exercícios/séries do que o padrão recente.

Definir critérios cuidadosamente para evitar alertas com amostra insuficiente.

---

# 9. MOTOR DE INSIGHTS

Criar conceito de `Insight`.

Não deve começar como texto livre.

Primeiro deve existir como dado estruturado.

Exemplo conceitual:

```text
Insight {
  tipo
  prioridade
  periodo
  alvo
  valorAtual
  valorReferencia
  variacao
  evidencias
}
```

Tipos possíveis:

```text
PROGRESSAO
QUEDA_PERFORMANCE
PLATO
NOVO_PR
VOLUME_SUBIU
VOLUME_CAIU
FREQUENCIA_CAIU
GRUPO_SEM_ESTIMULO
SESSAO_FORA_PADRAO
CONSISTENCIA_SUBIU
CONSISTENCIA_CAIU
RECUPERACAO_BAIXA
RECUPERACAO_RELACIONADA_PERFORMANCE
```

Não use exatamente esses nomes sem antes verificar convenções existentes no projeto.

A intenção é arquitetural.

---

# 10. ROTEADOR DE PERGUNTAS DO COACH

Investigar a criação de uma camada anterior à Gemini.

Fluxo desejado:

PERGUNTA
↓
CLASSIFICADOR
↓
CAPACIDADE DETERMINÍSTICA EXISTE?
↓
SIM → EXECUTA TOOL/FUNÇÃO LOCAL
↓
FORMATA RESPOSTA
↓
NÃO → GEMINI

Exemplo:

"Qual meu melhor exercício?"

→ progresso/ranking interno
→ código
→ resposta.

"Quanto treinei esta semana?"

→ frequência
→ código
→ resposta.

"Quando foi meu último PR no supino?"

→ histórico PR
→ código
→ resposta.

"Por que você acha que meu treino piorou?"

Pode existir informação determinística suficiente para responder:

- volume caiu;
- frequência caiu;
- recuperação caiu;
- etc.

Nesse caso responder:

> "A queda coincidiu com..."

Nunca afirmar causalidade que os dados não provam.

Caso a pergunta seja realmente aberta:

> "Como posso melhorar meu treino?"

Aí o roteador pode decidir que é necessário Gemini — respeitando os limites de produto e de não prescrição já existentes.

---

# 11. NÃO USAR GEMINI PARA CLASSIFICAÇÃO SE NÃO FOR NECESSÁRIO

Antes de usar um LLM para classificar a pergunta, investigar alternativas:

1. intents explícitas;
2. padrões;
3. normalização de texto;
4. aliases;
5. parser simples;
6. comandos/atalhos;
7. combinação dessas técnicas.

Exemplo:

"meu volume caiu?"

"volume caiu?"

"estou fazendo menos volume?"

podem cair em:

```text
intent = COMPARAR_VOLUME
```

Somente se a intenção não puder ser determinada com confiança suficiente deve existir fallback.

Não quero trocar:

1 chamada Gemini para responder

por:

1 chamada Gemini para descobrir qual função chamar.

Isso não resolve o problema de custo.

---

# 12. CACHE DE RESPOSTAS E MÉTRICAS

Investigar também oportunidades de evitar recálculo.

Exemplo:

Se o usuário pergunta:

> "Como foi minha semana?"

e 30 segundos depois:

> "Qual exercício mais evoluiu nessa semana?"

não deveria ser necessário reconstruir desnecessariamente toda a mesma base analítica.

Avaliar:

- agregados persistidos;
- cache;
- memoização;
- snapshots;
- invalidação após novo treino/série;
- custo real de cada abordagem.

Não adicionar infraestrutura pesada sem necessidade.

---

# 13. FASE A — CONTEXTO

Depois do Motor Determinístico estar desenhado, avaliar implementação das seguintes features.

## A1 — Check-in de recuperação

Antes do treino, permitir registro rápido de:

- sono;
- energia;
- dor muscular;
- estresse.

Escala simples.

Objetivo:

dar contexto aos números de treino.

Não transformar em diário médico.

Não diagnosticar.

Não prescrever.

---

# 14. A2 — ÍNDICE DE PRONTIDÃO

Investigar um índice determinístico derivado do check-in.

Exemplo conceitual:

0–100.

Mas NÃO inventar fórmula arbitrária e apresentá-la como ciência.

Pesquisar/documentar uma regra defensável ou apresentar apenas uma composição transparente dos próprios sinais.

O usuário deve conseguir entender por que o índice recebeu aquele valor.

---

# 15. A3 — RECUPERAÇÃO × DESEMPENHO

Depois de existir histórico suficiente, comparar:

- prontidão;
- energia;
- sono;
- dor;
- estresse;

com:

- e1RM;
- volume;
- performance da sessão.

Nunca dizer:

> "Seu sono causou sua queda."

Preferir:

> "A queda de performance coincidiu com recuperação abaixo da sua média."

Correlação não deve virar causalidade.

---

# 16. FASE B — INTELIGÊNCIA

## B1 — Sessão fora do padrão

Após finalizar treino:

comparar sessão atual com sessões comparáveis anteriores.

Possíveis dimensões:

- volume;
- séries;
- exercícios;
- duração, se existir dado confiável;
- e1RM;
- carga;
- repetições.

Exemplo:

> "O volume desta sessão ficou 28% abaixo da média das últimas 5 sessões comparáveis."

---

# 17. B2 — INSIGHTS AUTOMÁTICOS NA HOME

Criar área:

**Lastro percebeu**

Exemplos:

> Supino voltou a evoluir.

> Costas perderam frequência.

> Novo PR no agachamento.

> Seu volume semanal caiu pela terceira semana consecutiva.

Esses insights devem vir prioritariamente do Motor Determinístico.

ZERO Gemini para gerar o insight quando o fato puder ser representado por template.

---

# 18. B3 — EXPLICAR MUDANÇA DE DESEMPENHO

Combinar múltiplas evidências.

Exemplo:

Supino:

e1RM: -6%

frequência: -50%

volume: -18%

recuperação: abaixo da média.

Resposta:

> "A queda de 6% no e1RM aconteceu no mesmo período em que a frequência caiu e o volume ficou 18% menor."

Isso é diferente de afirmar:

> "Você perdeu força porque treinou menos."

O primeiro é evidência.

O segundo é causalidade.

O Lastro deve ficar no primeiro.

---

# 19. FASE C — HISTÓRICO

## C1 — Página profunda por exercício

Exemplo:

SUPINO RETO

Agora:
- e1RM atual;
- PR;
- diferença para PR;
- volume recente;
- frequência.

Últimas semanas:
- tendência;
- sessões;
- séries;
- PRs.

Último PR:
- data;
- valor.

Desde o PR:
- sessões;
- séries;
- evolução.

Investigar quanto disso já existe antes de construir novos cálculos.

---

# 20. C2 — CONSISTÊNCIA / CALENDÁRIO

Criar visualização temporal de treinos.

Não transformar em gamificação.

Mostrar:

- dias treinados;
- meta semanal;
- frequência;
- semanas completas;
- semanas abaixo da meta;
- tendência de consistência.

Permitir que o Motor Determinístico responda perguntas sobre isso.

---

# 21. C3 — RESUMO MENSAL

Criar resumo determinístico mensal.

Exemplo:

AGOSTO

18 treinos

4 PRs

Volume:
+12%

Maior evolução:
Supino +7,8%

Sem progresso:
Rosca direta — 5 semanas

Consistência:
18/20 sessões da meta

O texto principal pode ser produzido inicialmente por templates determinísticos.

Não chamar Gemini apenas para transformar esses números em três frases bonitas.

---

# 22. FASE D — DADOS EXTERNOS

## D1 — Peso corporal

Permitir registro simples de peso.

Depois relacionar com evolução de performance.

Exemplo:

> "Nos últimos três meses seu peso corporal variou +1,8%, enquanto o e1RM do agachamento aumentou 9,4%."

Não gerar interpretação médica.

---

# 23. D2 — HEALTH CONNECT / APPLE HEALTH

NÃO implementar agora.

Somente estudar depois que as fases anteriores estiverem maduras.

Avaliar futuramente:

- passos;
- sono;
- frequência cardíaca;
- peso;
- workouts.

Somente integrar dados que tenham utilidade concreta para a tese do Lastro.

Não adicionar integração apenas porque existe API.

---

# 24. MATRIZ GEMINI × DETERMINÍSTICO

Quero que esta seja uma entrega formal.

Mapear funcionalidades atuais e futuras em:

### NÍVEL 0 — SQL/consulta

Exemplo:

"Quantos treinos fiz?"

### NÍVEL 1 — cálculo determinístico

Exemplo:

"Quanto meu volume mudou?"

### NÍVEL 2 — detector determinístico

Exemplo:

"Estou estagnado?"

### NÍVEL 3 — composição de evidências

Exemplo:

"O que mudou no meu supino?"

### NÍVEL 4 — interpretação aberta

Somente aqui considerar Gemini.

Exemplo:

pergunta conversacional que não possui resposta objetiva coberta pelas capacidades anteriores.

Quero saber quantas perguntas atualmente enviadas à Gemini poderiam cair nos níveis 0–3.

---

# 25. OBSERVABILIDADE DE CUSTO

Criar proposta para medir:

- perguntas respondidas deterministicamente;
- perguntas enviadas à Gemini;
- tokens/chamadas evitadas;
- intent mais utilizada;
- fallback para Gemini;
- erros de classificação.

Idealmente poder calcular algo como:

```text
Perguntas Coach no mês: 1.240

Determinísticas: 914
Gemini: 326

Taxa de resolução local: 73,7%
```

Isso permite saber se a arquitetura realmente está economizando IA.

Não implementar telemetria invasiva.

Respeitar privacidade e decisões atuais do projeto.

---

# 26. REGRAS IMPORTANTES

Não:

- implementar tudo de uma vez;
- criar dezenas de tabelas antecipadamente;
- duplicar cálculos existentes;
- colocar Gemini dentro dos agregadores;
- permitir que Gemini calcule métricas;
- criar microserviço;
- adicionar vector database/RAG sem necessidade comprovada;
- adicionar embeddings apenas para classificar perguntas simples;
- usar IA para responder pergunta que SQL/TypeScript consegue responder;
- inventar métricas científicas;
- afirmar causalidade;
- fazer diagnóstico;
- prescrever treino;
- quebrar offline-first;
- quebrar isolamento aluno/personal;
- quebrar i18n;
- ignorar testes existentes.

---

# 27. IMPORTANTE: NÃO COMEÇAR CODANDO

A primeira entrega desta tarefa é um ESTUDO.

Quero primeiro:

## ENTREGA 1 — Auditoria

Mapear o que já existe na `main`.

## ENTREGA 2 — Matriz de capacidades

Listar perguntas que podem ser respondidas sem Gemini.

Quero pelo menos 30 perguntas reais.

Para cada uma:

- intenção;
- exemplo de pergunta;
- dados necessários;
- funções existentes reutilizáveis;
- cálculo faltante;
- resposta determinística possível;
- necessidade de Gemini.

## ENTREGA 3 — Arquitetura proposta

Desenhar:

```text
Pergunta
   ↓
Normalização
   ↓
Intent Router
   ↓
Capability Registry
   ↓
Executor determinístico
   ↓
Evidence
   ↓
Formatter
   ↓
Resposta
```

e o caminho alternativo:

```text
Intent desconhecida
        ↓
verificar se existem evidências úteis
        ↓
Gemini Gateway
        ↓
resposta
```

## ENTREGA 4 — Roadmap

Separar:

- Fase 0;
- Fase A;
- Fase B;
- Fase C;
- Fase D.

Para cada feature informar:

- benefício;
- dependências;
- tabelas afetadas;
- módulos afetados;
- cálculos reutilizados;
- cálculos novos;
- risco;
- dificuldade;
- necessidade de migração;
- impacto offline;
- impacto modo Personal;
- impacto i18n;
- testes necessários.

## ENTREGA 5 — Economia estimada de IA

Usando as capacidades encontradas, estimar quais categorias de perguntas poderiam deixar de usar Gemini.

Não inventar percentual de economia sem dados de uso.

Se não houver telemetria suficiente, declarar:

> "não há dados suficientes para estimar."

Nesse caso, propor como medir.

---

# 28. DECISÃO DE IMPLEMENTAÇÃO

Depois das cinco entregas:

PARE.

Não implemente nenhuma feature nova.

Apresente:

1. estado atual;
2. lacunas;
3. arquitetura;
4. matriz Gemini/determinístico;
5. roadmap;
6. riscos;
7. primeira milestone recomendada;
8. arquivos que seriam alterados.

A implementação só começa depois da minha aprovação.

---

# RESULTADO QUE EU ESPERO

Quero transformar o Lastro em algo onde a maior parte da "inteligência" não significa necessariamente "chamar uma IA".

Quero três camadas claras:

### CAMADA 1 — MATEMÁTICA

O que aconteceu?

### CAMADA 2 — INTELIGÊNCIA DETERMINÍSTICA

O que mudou?

O que está fora do padrão?

O que merece atenção?

### CAMADA 3 — IA GENERATIVA

Como interpretar uma pergunta aberta que as duas primeiras camadas não conseguem responder?

A Gemini deve complementar o Lastro.

Ela não deve ser o cérebro responsável por tudo.

O próprio Lastro precisa saber interpretar seus números antes de pedir ajuda a um modelo.
