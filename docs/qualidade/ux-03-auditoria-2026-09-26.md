# UX-03 — Auditoria visual: 1ª passada (2026-09-26)

> **Tudo aqui é `ALEGADO`.** Quem escreveu olhou as capturas; nenhum item virou `PASSOU` porque outro agente ainda não auditou em contexto limpo (`AGENTS.md` §5). Esta é a **primeira passada, parcial**: o Antigravity baixou as capturas da varredura `j4` e parou (cota esgotada) antes de escrever qualquer achado; o Claude retomou daí. Nenhuma correção de código foi feita ainda: o handoff manda **mostrar a lista ao dono antes** (`docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` §4).

## 1. O que foi (e não foi) coberto

**Fonte:** as 51 capturas da varredura `e2e/j4-varredura.spec.ts` (17 rotas × 3 larguras: celular 390, tablet 768, desktop 1440), em `qa/varredura-recente/varredura/` (artefato `varredura-telas` do CI, conta descartável "Ana Ribeiro", aluna, com vínculo). Evidências citadas foram copiadas para `qa/evidencias/UX-03/2026-09-26/`.

**Olhadas uma a uma:** as 12 rotas de celular listadas na tabela (§3), mais `desktop_treino`, `desktop_analise` e `tablet_ajustes`. As demais capturas de tablet e desktop **não foram inspecionadas individualmente**.

**Fora desta passada (precisam de captura nova, a varredura `j4` não cobre):** `/login`, `/aceite`, `/onboarding`, `/boas-vindas`, `/redefinir-senha`, `/termos`, `/privacidade`, `/treino/[id]`, `/ajustes/guia`, `/ajustes/politicas`, `/personal/completar`, a 404 e os modais de `src/app/@modal/`. Também não foram cobertos: inglês e espanhol, os 7 temas além do padrão, o viewport 375×812 e 1280×800 exatos, e medição de alvo de toque em px.

## 2. Limite do método (importante para quem continuar)

As capturas da `j4` são de **página inteira**. Nelas a barra inferior fixa aparece **no meio da página** (onde caiu na altura do viewport de captura). Isso é artefato de captura, não defeito do app, e por isso **esta varredura não consegue provar nem refutar "conteúdo escondido pela barra inferior"**. Para esse critério é preciso captura de **viewport rolado** (rolar até o fim e capturar só a janela). Fica como pendência da UX-03.

## 3. Achados

Severidade: ALTA = atrapalha a tarefa principal; MÉDIA = aparência ou uso claramente pior que o resto do app; BAIXA = polimento. Nenhum achado ALTA nesta passada.

| ID | Rota × largura | Achado | Sev. | Evidência |
|---|---|---|---|---|
| UX3-01 | `/treino`, `/analise` (e provavelmente todas) × desktop 1440 | O layout de celular é esticado até a largura inteira: cartões e botão "Continuar treino de hoje" ocupam ~1400 px, a barra inferior vira uma faixa de ponta a ponta. Sem largura máxima de coluna. O PRD (A8) prevê uso no PC. | MÉDIA | `desktop_treino.png`, `desktop_analise.png` |
| UX3-02 | `/analise` × celular | Os gráficos de progressão gastam ~130 px de altura vazia sob uma linha reta plotada no alto (série estável, e1RM 0,0%). Ocupa a tela sem informar. | MÉDIA | `celular_analise.png` |
| UX3-03 | `/ajustes/modelos/novo` × celular | O campo "Nome do modelo" e o botão "Continuar" ficam **colados** (sem espaço entre eles); o anel de foco do campo encosta no botão. | MÉDIA | `celular_ajustes_modelos_novo.png` |
| UX3-04 | `/ajustes/personal` × celular | O cabeçalho mostra o logotipo e um **círculo escuro cortado** no canto esquerdo. **Causa confirmada no código:** `src/app/ajustes/personal/page.tsx` monta `CabecalhoPro` **sem** `voltarHref` e usa o botão `VoltarFlutuante`, que aparece meio escondido sob o cabeçalho; as outras subtelas de Ajustes usam a seta de voltar do próprio cabeçalho. Navegação inconsistente. | MÉDIA | `celular_ajustes_personal.png` |
| UX3-05 | `/ajustes/relatorios` × celular | O título do cabeçalho é cortado ("Histó…"). Cada cartão repete o mesmo botão dourado "Gerar Imagem / Sticker Story" (fica pesado com muitos treinos), e "Sticker Story" é inglês numa tela em português. | BAIXA | `celular_ajustes_relatorios.png` |
| UX3-06 | `/ajustes/anilhas` × celular | As anilhas aparecem com ponto decimal ("2.5", "1.25") num app em português que usa vírgula em outros lugares ("1,5 t", "50,7 kg"). | BAIXA | `celular_ajustes_anilhas.png` |
| UX3-07 | `/treino` × celular | Os chips de filtro por grupo (Todos, Abdômen, Ombro, Costas…) passam da borda direita cortando "Costas", sem pista de que rolam para o lado. | BAIXA | `celular_treino.png` |
| UX3-08 | `/coach` × celular | A caixa de pergunta fica a ~10 px da barra inferior, com moldura dupla (contêiner + campo). Apertado, mas legível. | BAIXA | `celular_coach.png` |

**Notas para a UX-02 (não são achados de auditoria):** o `/treino` de hoje já tem **filtro por grupo muscular** (chips) e modo "Editar" para excluir. O que a UX-02 ainda pede está confirmado como ausente: o "treino de hoje" **não é separado** (aparece como "hoje" dentro da lista) e o histórico é uma lista de cartões, **sem agrupamento por mês** (`celular_treino.png`, `desktop_treino.png`).

**Observado e sem problema visível nesta passada:** `/ajustes` (hierarquia clara, grupos legíveis, "Excluir conta" isolado embaixo), `/ajustes/temas`, `/ajustes/modelos` (estado vazio), `/perfil`, `/catalogo/[id]`, `/personal`, `/personal/alunos`. "Sem problema visível" não é medição: alvo de toque e contraste não foram medidos aqui (o `j5-contraste` cobre contraste).

## 4. Próximos passos

1. **Dono vê esta lista** e decide o que corrigir (o handoff manda corrigir só ALTA e MÉDIA; hoje são os quatro MÉDIA: UX3-01 a UX3-04).
2. Completar a cobertura da §1 com capturas novas de **viewport rolado**, em 375×812, incluindo as rotas fora da `j4`, os temas e os idiomas.
3. Só depois de decidido: PRs pequenas de correção, uma por achado ou por rota, cada uma com critério de aceite; e passar os itens para o `QA.md`.
4. Outro agente audita esta lista e as correções (`ALEGADO` → `PASSOU`).
