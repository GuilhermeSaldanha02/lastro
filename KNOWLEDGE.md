# KNOWLEDGE.md — `lastro`

> **HD append-only.** Escreve-se, nunca se apaga nem se resume. Carregue **por seção**, nunca o arquivo inteiro.

## Índice

- [1. Glossário do domínio](#1-glossário-do-domínio) — definições travadas no grill; corrompem a matemática se mudarem
- [2. Pesquisa de mercado](#2-pesquisa-de-mercado) — o que os concorrentes fazem e onde está o buraco
- [3. Achados técnicos](#3-achados-técnicos) — Gemini, dados de exercício, offline
- [4. Perguntas em aberto](#4-perguntas-em-aberto) — o que ainda não sabemos e não pode ser inventado
- [5. Lições](#5-lições) — erros cometidos e o que aprendemos

---

## 1. Glossário do domínio

*Fonte: grill de domínio com o dono, 2026-08-04. Estas definições são contrato — mudá-las invalida dados já gravados.*

| Termo | Definição travada | Por que importa |
|---|---|---|
| **Série** (`set`) | **Uma** execução contínua de repetições. "3 séries de 10" = 3 registros separados no banco, cada um com suas próprias reps e peso. | Registrar 3×10 como uma linha só esconde a queda de reps na última série — que é o principal sinal de fadiga intra-treino. |
| **Série valendo** (`work set`) | Série executada com carga de trabalho real. **Só ela conta** para volume, e1RM e frequência. | Padrão de todo cálculo do app. |
| **Série de aquecimento** (`warmup`) | Série com carga leve, preparatória. É **registrada** mas **excluída de toda métrica**. | Se contasse como valendo, o volume semanal inflaria e a Análise diria "você está treinando demais" sem ser verdade. |
| **Peso** (`load`) | **O número que o dono lê no equipamento**: a placa selecionada na máquina, ou barra + anilhas já somadas. Unidade: **kg**. | Não é comparável entre academias/marcas de máquina. É comparável consigo mesmo ao longo do tempo — que é exatamente o uso. Assumir "peso real total" obrigaria cálculo mental entre séries. |
| **Treino** (`workout` / sessão) | Uma ida à academia. Contém N exercícios, cada um com N séries. | Unidade de frequência semanal. |
| **Exercício** | Um movimento do catálogo (ex.: "Supino reto com barra"). Tem grupo muscular primário e dicas de execução curadas. | Chave de agregação de e1RM e de volume por grupo. |
| **Volume** (`volume load`) | `Σ (reps × peso)` das séries **valendo**, no período. | Métrica central do gráfico e da Análise. |
| **e1RM** | Carga máxima estimada para 1 repetição, derivada de uma série valendo. | Mede força quando as reps variam — volume sozinho não distingue "mais peso" de "mais reps". |
| **Estagnação** | Exercício sem melhora em e1RM nem em volume por N semanas consecutivas. | É uma das cinco perguntas da Análise. **`N` ainda não definido — ver seção 4.** |
| **RIR** (`reps in reserve`) | Quantas repetições sobraram no tanque ao encerrar a série. RIR 0 = falha. Campo **opcional** por série valendo. | Mede esforço real. Volume alto com RIR 5 é estímulo fraco disfarçado de trabalho. |
| **Série difícil** (`hard set`) | Série valendo com RIR ≤ 3. | Indicador de estímulo melhor que volume bruto — mas só existe quando o RIR foi preenchido. O agregador precisa tratar RIR ausente sem contaminar a métrica. |

**Decisão de unidade:** kg fixo, sem tela de configuração. O campo `unidade` existe no banco desde o início para não exigir migração se isso mudar.

---

## 2. Pesquisa de mercado

*Pesquisa web, 2026-08-04.*

**O que já é commodity (e de graça):** Hevy tem o tier gratuito mais generoso da categoria — log ilimitado, rotinas ilimitadas, gráficos de progresso, biblioteca de 400+ exercícios, volume por grupo muscular, histórico de e1RM desde o primeiro dia. Strong é equivalente. **Construir "mais um logger" é competir com software gratuito e maduro.**

**O que é diferenciado e pago:** Alpha Progression lê as séries registradas e prescreve a próxima carga (peso, reps, RIR) calibrada na força real, em vez de template genérico.

**Onde está o buraco que justifica `lastro`:** nenhum deles responde, em português e em linguagem direta, **"e daí? o que esses números significam pra mim esta semana?"**. Eles entregam o gráfico e param. A leitura fica por conta do usuário — que é exatamente quem não sabe fazer a leitura.

**Conclusão que orienta o produto:** o log e o gráfico são **infraestrutura para a Análise**, não o produto. Se a Análise for boa e o log for medíocre, o app tem razão de existir. Se o log for excelente e a Análise for genérica, é uma cópia pior do Hevy.

Fontes: [Hevy vs Strong 2026](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026) · [Alpha Progression](https://alphaprogression.com/en) · [Melhores apps de hipertrofia 2026](https://mesostrength.com/blog/best-hypertrophy-training-apps)

---

## 3. Achados técnicos

### 3.1 Gemini — a chave nunca toca o cliente
Num app web, qualquer chave embarcada no bundle é lida no DevTools. Toda chamada obrigatoriamente passa por route handler no servidor. Isso é restrição de arquitetura, virou fitness function no ADR.

### 3.2 Gemini — quota: NÃO CONFIAR EM FONTE SECUNDÁRIA
As fontes públicas se contradizem sobre o free tier (500 RPD vs 1.500 RPD) e mencionam um corte de 50–80% nas quotas em dezembro/2025. O Google deixou de publicar tabela universal — a quota é **por projeto** e só é confiável lida no console do AI Studio.
**Pendência:** ler a quota real do projeto e registrar aqui como **valor medido, com data**. Até lá, não existe orçamento de quota neste projeto.

### 3.3 Dados de exercício — por que catálogo curado venceu API pronta
- `ExerciseDB`: 1500–11000 exercícios com GIF, mas a procedência das mídias é nebulosa (risco de licença) e os nomes são em inglês.
- `wger`: open source, sem GIF animado.
- `free-exercise-db`: domínio público, mas JSON estático auto-hospedado, com imagens paradas.

Tradução automática de nome de exercício produz lixo ("Bent Over Row" → "Fileira Curvada"). **Decisão: catálogo curado de ~100 exercícios em PT-BR real**, escrito e revisado, com nomenclatura de academia brasileira. Mais barato que corrigir 1500 traduções e coerente com "profundidade na fatia".

### 3.4 Conteúdo de execução é assunto de saúde (E3)
Dica de forma gerada por LLM é conteúdo inventado em domínio onde erro machuca. Dicas de execução vêm do catálogo curado, revisado, com aviso de que não substitui profissional. O coach 24h responde dúvidas, mas **não improvisa técnica de movimento**.

### 3.5 A Análise calcula ANTES de perguntar
Entregar linhas cruas de série ao LLM faz ele inventar aritmética. Fluxo obrigatório:
`séries → agregador determinístico (TypeScript, testado) → resumo compacto → prompt`
O LLM recebe métricas já calculadas e **apenas interpreta**. É a decisão de engenharia que decide se a peça-assinatura funciona.

---

## 4. Perguntas em aberto

*Nada aqui pode ser preenchido com invenção. Cada item vira pergunta ao dono ou medição.*

- **TODO** — Quota real da Gemini no console do AI Studio (seção 3.2).
- **TODO** — `N` semanas sem progresso que caracterizam **estagnação**. Precisa de fundamento, não de chute.
- **TODO** — Faixa de referência de séries semanais por grupo muscular, para a pergunta "meu volume está equilibrado?". Existe literatura, mas **ainda não foi consultada em fonte primária** — não usar número de memória.
- ~~Rotina/divisão de treino do dono~~ → **RESOLVIDO (2026-08-04):** não existe rotina declarada. O dono anota o que treinou e a Análise **deriva o padrão real dos dados**. Elimina a tela de configuração e mede o que foi feito, não o que foi prometido.
- ~~RIR/RPE aparece na UI?~~ → **RESOLVIDO (2026-08-04):** sim, campo opcional por série valendo.

---

## 5. Lições

*(vazio — preencher quando algo falhar)*
