# PRD.md — `lastro`

> **Contrato de produto.** Congela após aprovação do dono. Mudança depois disso = protocolo de Scope Change (`padroes/documentos.md`), registrada em `DECISIONS.md`.
>
> **Status: APROVADO pelo dono em 2026-08-04.** Congelado. Mudança daqui em diante = Scope Change registrado em `DECISIONS.md`.

---

## 1. O que é

Um app de treino **pessoal** que registra cada série executada e, uma vez por semana, entrega um **parecer em português sobre o que aqueles números significam** — usando IA sobre métricas já calculadas.

**Tese em uma frase:** o log e o gráfico são infraestrutura; o produto é a leitura.

**Posicionamento (âncora de toda decisão):** ferramenta séria de dados para uma pessoa que treina sozinho e quer saber se está progredindo de verdade. Não é app social, não é rede de fitness, não é plataforma.

**Anti-referência:** apps que entregam o gráfico bonito e param ali, deixando a interpretação por conta de quem não sabe interpretar.

---

## 2. Persona (uma, e só uma)

**O dono.** Treina sozinho, sem personal. Usa o celular **dentro da academia, entre séries, com o sinal ruim do subsolo**. Quer três coisas, nesta ordem de importância:

1. Saber se está progredindo — e onde não está.
2. Anotar a série sem atrapalhar o treino.
3. Tirar dúvida de execução sem se machucar.

**Não existe segunda persona.** Nenhuma decisão deste produto se justifica por "outros usuários poderiam querer". Isso não é limitação: é o que permite profundidade.

---

## 3. Peça-assinatura: a Análise Semanal

**A 1 coisa pela qual o projeto existe.** É o que `PROGRESS.md` valida **primeiro**, como fatia vertical de ponta a ponta — antes de qualquer polimento de UI, antes do catálogo completo de exercícios, antes do coach 24h.

**A fatia vertical mínima:** registrar séries reais → agregador calcula → botão Análise → escolher pergunta → ler um parecer que cita **os números do dono**.

**Regra inegociável de arquitetura:** o LLM **nunca** recebe linhas cruas de série. Recebe um resumo já calculado por código determinístico e testado. Se o modelo tiver que fazer conta, ele erra a conta, e um parecer confiante com número errado é pior que nenhum parecer.

**As cinco perguntas padrão:**

| # | Pergunta | Do que o parecer se alimenta |
|---|---|---|
| 1 | Estou progredindo? | Tendência de e1RM e volume nas últimas 4 semanas |
| 2 | Onde eu empaquei? | Exercícios sem melhora de e1RM nem volume por N semanas |
| 3 | Meu volume está equilibrado? | Séries valendo por grupo muscular vs faixa de referência |
| 4 | Estou treinando demais ou de menos? | Frequência e volume semanal vs semanas anteriores |
| 5 | O que mudar na próxima semana? | Tudo acima, com recomendação acionável |

**Critério de qualidade que separa isto de conselho genérico:** o parecer precisa **citar exercício e número específicos do dono**. "Aumente a carga progressivamente" é falha. "Seu supino está em 60kg há 5 semanas enquanto o agachamento subiu 12% no mesmo período" é o produto.

**Liberação semanal:** o botão fica disponível quando há dados de uma semana fechada. **TODO — confirmar com o dono:** semana começa na segunda? O botão bloqueia antes disso ou fica sempre disponível com aviso de "poucos dados"?

---

## 4. Escopo do MVP

**4.1 Registro de treino** — o que precisa ser rápido de fazer suado, com uma mão.
- Iniciar treino, escolher exercício do catálogo, registrar série (reps + peso), marcar como aquecimento ou valendo.
- Repetir a última série com um toque (a ação mais frequente do app).
- Funciona **offline**: grava local primeiro, sincroniza quando a rede volta.

**4.2 Registro e gráfico**
- Histórico de treinos.
- Por exercício: evolução de e1RM e de volume no tempo.
- Volume semanal por grupo muscular.

**4.3 Análise Semanal** — seção 3.

**4.4 Coach 24h** — chat de dúvidas sobre treino, alimentado pela mesma chave. **Não improvisa técnica de movimento** (seção 4.5).

**4.5 Demonstração de execução** — catálogo curado de ~100 exercícios em PT-BR real, com dicas de execução escritas e revisadas, mais aviso de que não substitui acompanhamento profissional. **Não é conteúdo gerado por IA** — é assunto de saúde, cai no E3.

**4.6 Conta e login** — criar conta com e-mail ou entrar com Google. Serve para backup e para usar no celular e no PC.

---

## 5. Escopo NEGATIVO (explícito — não entra, e não é esquecimento)

- ❌ Qualquer coisa social: feed, seguir, comparar, ranking, compartilhar.
- ❌ Planos e periodizações gerados automaticamente. O app **analisa** o que foi feito; não prescreve programa.
- ❌ Integração com relógio, balança, wearable, Health/Google Fit.
- ❌ Contagem de calorias, macros, dieta.
- ❌ Múltiplos usuários, planos pagos, onboarding para estranhos, tela de billing, limite de uso.
- ❌ Catálogo gigante de exercícios. ~100 curados vencem 1500 auto-traduzidos.
- ❌ App nativo em loja.
- ❌ Cronômetro de descanso, vídeo próprio, importação de outros apps — **na v1**. Nenhum está descartado para sempre; estão fora do MVP.

---

## 6. Jornadas

**J1 — Treino (a jornada que precisa ser perfeita).** Chega na academia → abre o app pelo ícone da tela inicial → inicia treino → escolhe supino → registra 3 séries valendo → **o elevador do prédio derruba o sinal** → continua registrando normalmente → sai da academia → o treino aparece sincronizado no PC.

**J2 — Análise (a jornada que justifica o projeto).** Domingo à noite → abre o app → botão Análise disponível → escolhe "Onde eu empaquei?" → recebe um parecer citando exercícios e números reais dele.

**J3 — Dúvida.** No meio do treino → não lembra a execução do remada curvada → abre o exercício → lê as dicas curadas → se a dúvida persiste, pergunta ao coach.

---

## 7. Critérios de aceitação verificáveis

*Verificável = existe um comando, teste ou observação que dá um sim/não. Sem "deve ser rápido" ou "deve ser intuitivo".*

| # | Critério | Como se verifica |
|---|---|---|
| A1 | Registrar uma série com o celular em modo avião salva o dado; ao voltar a rede, ele aparece no servidor sem ação do usuário | Modo avião no celular real, registrar 3 séries, reativar rede, recarregar no PC e conferir as 3 |
| A2 | Séries de aquecimento não entram em volume, e1RM nem contagem de séries | Teste unitário do agregador com fixture contendo aquecimento + valendo |
| A3 | O agregador calcula volume e e1RM corretamente | Teste unitário com valores conferidos à mão |
| A4 | Nenhum módulo do cliente importa o cliente da Gemini | Fitness function: busca por import no bundle do cliente |
| A5 | A chave da Gemini não aparece no bundle do cliente | Busca pela string da chave em `dist/` após build |
| A6 | Um parecer da Análise cita ao menos um nome de exercício e um número reais do dono | Leitura humana de 3 pareceres gerados sobre dados reais |
| A7 | O agregador não faz chamada de rede | Fitness function: sem import de `fetch`/cliente HTTP no módulo |
| A8 | Login com Google funciona em celular e PC, e o mesmo treino aparece nos dois | Teste manual nos dois dispositivos |
| A9 | Todo exercício do catálogo tem nome em PT-BR de academia e dica de execução revisada | Revisão do seed, contagem de campos vazios = 0 |
| A10 | O gate visual passa em viewport mobile real, com contraste AA **medido** e foco visível | Navegador real no celular + medição de contraste |

---

## 8. Benchmark nomeado

- **Registro de treino:** **Hevy.** É a régua — log rápido, repetir série num toque, gráficos limpos. Não precisa ser superado; precisa ser igualado no essencial e nunca ser pior no fluxo de registrar série.
- **Leitura dos dados:** **não há benchmark bom.** É exatamente o buraco que justifica o projeto. A régua aqui é interna: um parecer precisa passar no teste de A6 — se pudesse ter sido escrito sem olhar os dados do dono, falhou.

---

## 9. Decisões resolvidas no portão de aprovação (2026-08-04)

**Sem tela de configuração de rotina.** O dono anota o que treinou; a Análise **deriva o padrão real dos dados registrados** em vez de comparar com uma divisão declarada. Consequência: a pergunta "meu volume está equilibrado?" não compara com um plano — ela detecta o padrão efetivo e aponta grupos musculares negligenciados. Isso mede o que foi feito, não o que foi prometido, e elimina uma tela inteira do MVP.

**RIR entra na UI.** Campo opcional por série valendo. Habilita a métrica de **séries difíceis** (dentro de 1–3 reps da falha), que mede estímulo real melhor que volume bruto.

## 10. TODOs — dados que faltam e não podem ser inventados

- **TODO** — Faixa de referência de séries semanais por grupo muscular, com **fonte primária consultada**. Assunto de saúde: não usar número de memória. → tarefa de pesquisa no `PROGRESS.md`.
- **TODO** — `N` semanas que caracterizam estagnação. Mesma tarefa de pesquisa.
- **TODO** — Regra de liberação semanal do botão Análise (seção 3).
- **TODO** — Quota real da Gemini, medida no console do AI Studio.
