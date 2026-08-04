---
name: padrao-verificacao
description: Carregar antes de mover qualquer tarefa para Concluído, antes de afirmar que algo está corrigido ou funcionando, antes de commit ou PR, e ao fechar uma fase do roadmap. Define o que conta como prova e o que é só alegação.
---

# Verificação

**Relatório de agente ("consertei", "build limpo") não é prova.** Antes de mover para Concluído:

1. **Rodar o comando de verificação de fato e ler a saída.**
2. **Mudança visual: abrir no navegador e olhar.** Mobile em viewport mobile; hard refresh. **No mesmo gate, passe de acessibilidade:** alt em imagem, contraste AA **medido** (não estimado), foco visível, navegação por teclado. A11y é critério do gate visual, não fase posterior.
3. **Verificação visual é do controller.** Subagentes não têm essa ferramenta de forma confiável. **Medição de DOM não substitui olho:** `getComputedStyle` não detecta toda renderização errada, alguns bugs só aparecem em captura real, e páginas pesadas derrubam a ferramenta de screenshot por timeout. Nesses casos o gate é o olho humano, e **isso se declara na tarefa**.
4. Correção apontada 2× como "não bateu" → toda alegação de "corrigido" naquela área passa a exigir **medição numérica antes/depois**.
5. Mudança que preserva comportamento: comparar branch e `main` com o mesmo teste/fixture. **Verde sozinho esconde regressão.**
6. **Anotar a evidência na tarefa do `PROGRESS.md`** (1 linha). Atualizar o PROGRESS é a ação final obrigatória de toda tarefa.

## Check executável — o loop que fecha sozinho

Sem ele, "parece pronto" é o único sinal e o humano vira o loop de verificação. Cada tarefa nasce com o seu.

Em vez de *"implementar validação de e-mail"* → *"implementar `validateEmail`; casos: `user@example.com`=true, `invalid`=false, `user@.com`=false; rodar os testes após implementar"*.

**Consertar a causa raiz — proibido suprimir erro para o check passar.**

Escala de rigidez: check no prompt → condição re-checada por turno → hook de `Stop` que bloqueia o fim do turno → reviewer em contexto fresco tentando refutar.

## O caso especial do `lastro`: a Análise não tem teste verde

O parecer da Gemini é saída **não-determinística**. Não existe assert que prove que está bom. O check é a leitura humana contra o **critério A6** do PRD: *o parecer cita ao menos um exercício e um número reais do dono?* Um parecer que serviria para qualquer pessoa **reprova**, mesmo bem escrito.

O agregador, ao contrário, é 100% testável — e é onde o rigor máximo mora (TDD estrito, valores conferidos à mão).

## Checklist antes de entregar

O que foi feito (1–3 frases)? O que acontece com entrada inválida? Há incerteza de lógica? (→ **PARAR** se sim) O que pode quebrar em outros módulos? Como reverter? Segue o SDD — e se não, o SDD deve mudar?

## Gate de fase

Ao concluir cada fase do roadmap, **Revisão de Arquitetura** antes de abrir a próxima: drift vs ADR, acoplamento, dependências novas não justificadas, e cada fitness function (FF1..FF7) checada de fato. Eixo falhou → apresentar opções, aguardar decisão, registrar em `DECISIONS.md`.

## Fechamento para o dono

Toda fase termina com (a) checklist do que ele deve **VER** ou **FAZER** e (b) o próximo prompt pronto. Incertezas listadas honestamente.

## Handoff de sessão

Ao fechar fase, avaliar o custo da sessão. Estando longa, o fechamento vira handoff — **documentos atualizados PRIMEIRO, recomendação de sessão nova DEPOIS.** Ordem invertida perde o estado.
