# DECISIONS.md — `lastro`

> **HD append-only.** Log de decisões em ordem cronológica. Nunca reescrever entrada antiga.
> Formato: o que mudou · por quê · alternativa descartada · impacto · como reverter.

---

## 2026-08-04 — Bootstrap do projeto

**O que mudou.** Projeto criado do zero em `C:\lastro`, repo privado `GuilhermeSaldanha02/lastro`, branch `chore/bootstrap-projeto`. Documentos de contrato criados: `KNOWLEDGE.md`, `PRD.md` (aprovado e congelado), `ADR.md` (ADR-001 a ADR-008).

**Por quê.** Bootstrap segundo `diretrizes-v7.md`.

**Impacto.** Nenhum código escrito ainda. Todo trabalho de implementação passa a depender do SDD, que ainda não existe.

---

## 2026-08-04 — Glossário travado: série, aquecimento, peso

**O que mudou.** Três termos definidos no grill de domínio viraram contrato (`KNOWLEDGE.md` §1): série = uma execução (1 linha por série); aquecimento = registrado mas fora de toda métrica; peso = o número lido no equipamento, em kg.

**Por quê.** Cada um deles, mal definido, corrompe silenciosamente **toda** a matemática de volume — e a Análise passa a dar parecer confiante sobre número errado.

**Alternativas descartadas.** Série resumida (`3×10×40` em uma linha) — esconde a queda de reps na última série, que é o sinal de fadiga que a Análise usa. Peso real total (barra + anilhas somadas) — comparável entre academias, mas exige cálculo mental entre séries.

**Impacto.** Define o schema da tabela de séries. Mudança posterior exige migração de dados.

**Como reverter.** "Peso" é o único reversível a baixo custo, se o campo de unidade e um marcador de convenção existirem desde o início. As outras duas exigem migração.

---

## 2026-08-04 — Enquadramento: ferramenta pessoal, não produto de mercado

**O que mudou.** A exigência de "monopólio de nicho" da diretriz foi explicitamente descartada. Ver ADR-001.

**Por quê.** O dono definiu uso pessoal/fechado com a chave dele. Manter a linguagem de monopólio seria teatro e levaria a features de crescimento que ninguém vai usar.

**Impacto.** Escopo negativo do PRD ficou muito mais agressivo. Sem rate limit, billing, social ou onboarding.

---

## 2026-08-04 — Sem tela de rotina (ADR-008)

**O que mudou.** A pergunta "meu volume está equilibrado?" deixa de comparar executado vs. plano declarado e passa a derivar o padrão real dos dados registrados.

**Por quê.** Resposta do dono no portão do PRD: "a pessoa escreve e anota e com base nisso o app deixa registrado". Mede o que foi feito, não o que foi prometido.

**Alternativa descartada.** Configurador de divisão (ABC / Upper-Lower / Full body).

**Impacto.** Uma tela a menos no MVP. A lógica de detecção de padrão entra no agregador.

**Como reverter.** Barato — acrescentar a tela depois não invalida dado nenhum.

---

## 2026-08-04 — RIR entra na UI

**O que mudou.** Campo RIR opcional por série valendo, visível na interface.

**Por quê.** Decisão do dono no portão do PRD. Habilita a métrica de séries difíceis (RIR ≤ 3), que mede estímulo real melhor que volume bruto.

**Impacto.** Um toque a mais por série. O agregador precisa tratar RIR ausente sem contaminar a métrica — série sem RIR não é "série fácil", é série sem informação.
