# DESIGN.md — `lastro`

> **Fonte ÚNICA do visual.** Nenhum valor de cor, espaçamento ou tipografia é definido em outro lugar. Verificar autoconsistência deste arquivo a cada edição.
>
> **Estado em 2026-08-04:** as restrições funcionais abaixo estão **decididas** — elas derivam do contexto de uso real, não de gosto. A **identidade estética** (paleta, tipografia, personalidade) está **em aberto** e passa pelo gate do Diretor de Arte + aprovação do dono antes de qualquer tela ser construída.

---

## 1. O contexto de uso manda no design

Toda decisão visual deste app responde a uma cena específica: **uma pessoa em pé, suada, segurando o celular com uma mão, entre séries, com pressa, às vezes em iluminação ruim.** Não é alguém sentado, concentrado, com as duas mãos livres.

Isso não é detalhe de acabamento — é a restrição que decide o layout inteiro.

---

## 2. Restrições funcionais (decididas, não negociáveis)

| # | Restrição | Por quê |
|---|---|---|
| D1 | **Alvo de toque mínimo 48×48px**, com folga generosa entre alvos | Dedo suado, pessoa em pé, sem precisão fina |
| D2 | **Ações primárias na metade inferior da tela**, ao alcance do polegar | Uma mão só. Botão no topo obriga a reposicionar o aparelho |
| D3 | **"Repetir última série" é o botão mais proeminente do app** | É a ação mais frequente do fluxo de treino. Se ela custar mais de um toque, o log é abandonado |
| D4 | **Legível a um braço de distância** — corpo nunca abaixo de 16px | O celular fica apoiado no banco, não na mão, entre séries |
| D5 | **Tema escuro como padrão** | Academia com luz baixa, e tela clara à noite cansa. **A decisão é funcional; a paleta ainda não existe** |
| D6 | **Nenhuma ação de registro espera resposta de rede** | ADR/ARCHITECTURE: registrar série é offline-first. A UI confirma na hora |
| D7 | **Estado de sincronização sempre visível, nunca alarmante** | O usuário precisa saber que o dado está salvo local, sem que isso pareça erro |
| D8 | **Contraste AA medido, não estimado** | Gate de acessibilidade é critério do gate visual, não fase posterior |
| D9 | **Foco visível e navegação por teclado funcionais** no PC | O PC é onde os gráficos são lidos com calma |

---

## 3. Tokens

**Ainda não definidos.** Serão preenchidos aqui, e **só aqui**, no gate do Diretor de Arte.

```css
/* :root — a preencher no gate de identidade visual.
   Regra: nenhum valor de cor, espaçamento ou fonte
   pode existir em componente sem passar por aqui primeiro. */
```

---

## 4. Em aberto — gate do Diretor de Arte

- Paleta (dentro da restrição D5: escuro por padrão, contraste AA medido).
- Tipografia: uma família para números (o app é cheio de número — carga, reps, volume) e uma para texto.
- Personalidade: `lastro` é nome sóbrio, de ferramenta de dados. O visual acompanha ou contrasta?
- Como um **parecer da Análise** se apresenta na tela. É a peça-assinatura: se ela parecer um balão de chat genérico, o produto parece um chatbot com gráfico. **Esta é a tela que mais merece investimento de design do projeto inteiro.**
- Como o gráfico de progressão comunica progresso/estagnação sem exigir leitura de eixo.

**Advertência registrada:** a validação final de qualquer peça visual é **olho do dono em navegador real, no celular**. Medição de DOM não substitui — `getComputedStyle` não detecta toda renderização errada.
