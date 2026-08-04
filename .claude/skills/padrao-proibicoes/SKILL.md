---
name: padrao-proibicoes
description: Carregar no início de toda tarefa não-trivial deste projeto — lista o que é proibido fazer e a regra que substitui cada proibição. Consultar ANTES de propor abordagem, não depois de implementar.
---

# Proibições

| # | Proibido | Regra que substitui |
|---|---|---|
| P1 | Fatiar pedido estrutural em retoques que nunca somam estrutura | Desenhar a composição inteira antes de fatiar (E4) |
| P2 | Violar regra de documento recém-escrita, ou manter documento autocontraditório | O agente dono do doc lê o doc antes de aprovar |
| P3 | Validar visual só por medição, deixando o dono como único QA visual | Gate visual declarado na tarefa |
| P4 | Interpretar sistematicamente para baixo, obrigando o dono a repetir 2–3× | Na ambiguidade, perguntar (E7) |
| P5 | Aplicar recomendação de reviewer sem verificar | E8 — review é alegação, não verdade |
| P6 | Usar CSS/API exclusivo de um motor sem testar no navegador do público | E9 |
| P7 | Duplicar valores entre documentos | Fonte única por dado |
| P8 | Mudar processo com base em diagnóstico não confirmado | Confirmar a causa raiz com evidência antes |
| P9 | Inventar conteúdo ou dado de negócio | E3 — `TODO` visível + pergunta |
| P10 | Manter código rejeitado comentado | E11 — deletar; o git guarda a história |

## Proibições específicas do `lastro`

| # | Proibido | Por quê |
|---|---|---|
| L1 | Importar o SDK da Gemini em código de cliente | A chave vaza no DevTools (ADR-002, FF1/FF2) |
| L2 | Mandar linhas cruas de série para o LLM | Ele inventa a aritmética. Parecer confiante sobre número falso mata a peça-assinatura (ADR-003) |
| L3 | Contar série de aquecimento em volume, e1RM ou frequência | Infla o volume e a Análise passa a mentir (FF4) |
| L4 | Gerar dica de execução de exercício com LLM | Assunto de saúde. Conteúdo inventado onde o erro machuca (ADR-007, FF7) |
| L5 | Fazer o registro de série esperar resposta de rede | O app morre no subsolo da academia — o caso de uso real (FF6) |
| L6 | Tratar RIR ausente como série fácil | Série sem RIR é série sem informação |
| L7 | Justificar feature com "outros usuários poderiam querer" | Persona única. Não há outros usuários (ADR-001) |

## Obrigatório em reconstrução grande

Dupla **Auditoria** (o que falhou e por quê) + **Blueprint** (a tese inteira) antes de fatiar, com portão do dono na etapa da peça-assinatura. Desvio consciente do blueprint é permitido, mas **registrado com motivo** — desviar em silêncio não.
