# UX-03 (§4c, cobertura "sem medir"): auditoria independente (2026-10-01)

**Como li o escopo.** A expressão "sem medir" não aparece em `docs/qualidade/ux-03-auditoria-2026-09-26.md`. Usei o parágrafo "Ponto cego da medida" da §4c, que lista o que a métrica do `j26` não cobre:
1. texto que se sobrepõe sem estar cortado (foi assim que o defeito da barra em espanhol apareceu);
2. a faixa de ação fixa (`.acao-area`) do `/treino/[id]`, que só foi "vista na captura".

**Veredito: AINDA NÃO DÁ PARA PASSAR, segue ALEGADO.**
- O que medi passou.
- Ficaram sem medir en/es e os estados transitórios da faixa.
- Nenhum defeito encontrado.

## Ambiente
- Produção, conta de personal "Guilherme" em modo TREINO, pt-BR.
- Iframe de 375×812, com a barra de rolagem desligada para imitar o celular.
- **A aba do Chrome ficou em segundo plano** (`visibilityState = hidden`) desde ~16:48. Por isso não houve prints desta parte, e as medidas são por `getBoundingClientRect`.
- Provei que, nessa aba, o `ResizeObserver` não dispara: 0 chamadas depois de redimensionar um elemento de teste.

## 1. Faixa de ação fixa do `/treino/[id]`, medida na carga da página

| Estado | Altura da faixa / var publicada | Faixa top–bottom | Nav top | Fim do último cartão (rolagem máxima) | Botões |
|---|---|---|---|---|---|
| Aberto com séries (Repetir / Outra / Finalizar) | 129 / 129px | 595–724 | 735 | 566,6 (28 px livres) | 3 × 48 px de altura |
| Finalizado (Ver relatório / Reabrir) | 69 / 69px | 655–724 | 735 | 626,6 (28 px livres) | 2 × 48 px |
| Aberto sem série (Adicionar exercício) | 69 / 69px | 655–724 | 735 | — | 48 px |

Nos três estados:
- a faixa não invade a nav (fica 11 px acima);
- não sobra conteúdo sob a faixa no fim da rolagem;
- não há vazamento horizontal;
- os alvos têm pelo menos 44 px.

**Não conclusivo: as transições sem recarregar** (finalizado → reaberto, e o texto de confirmação de "Finalizar").
- Medida feita depois de "Reabrir" com a aba oculta: a variável ficou em 69px com a faixa já em 129 px, e o último cartão ficou 31 px sob a faixa.
- Isso é artefato da aba oculta. A altura é publicada por `ResizeObserver`, que não dispara nessa aba.
- Numa recarga o valor fica certo.
- **Precisa repetir com a aba visível** antes de afirmar qualquer coisa.

## 2. Sobreposição de texto não cortado (pt-BR)
Método: retângulos de cada nó de texto visível (`Range.getClientRects`), comparados par a par, no topo e no fim da rolagem. A sobreposição conta quando passa de 2 px nos dois eixos e os dois textos estão na mesma camada; texto passando atrás de barra fixa durante a rolagem não conta.

Rotas medidas: `/`, `/treino`, `/analise`, `/coach`, `/catalogo`, `/ajustes`, `/treino/[id]` (finalizado e aberto vazio).

Resultado:
- 0 sobreposições na mesma camada;
- 0 conteúdo sob a nav no fim;
- 0 vazamento horizontal;
- 0 alvos de bloco menores que 44 px.

## Não medido (o que segue ALEGADO)
- **Inglês e espanhol.** É justamente onde o UX3-09 e o UX3-10 apareceram. Não troquei o idioma da conta, porque a tarefa não autorizou mudar essa preferência.
- **Transições da faixa** com a aba visível.
- **Prints** desta parte.

## Divergência de documento (fora do escopo)
- Na §4c, o UX3-15 aparece como "Aberto".
- O `BACKLOG-CANONICO.md` lista UX3-15 como feito (#347).
