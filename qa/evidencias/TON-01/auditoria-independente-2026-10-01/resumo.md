# TON-01: auditoria independente (2026-10-01)

**Critério.** O TON-01 não tem linha própria no `QA.md`. O critério foi montado com duas fontes:
- a linha do `docs/BACKLOG-CANONICO.md`: "TON-01 (tonelagem com unilateral, #346)";
- o commit `b9c0856`, que diz: "a tonelagem do relatório pós-treino conta exercício `unilateral` como o agregador, e as três contas usam `volumeDeSerie`".

Na prática: a tonelagem do relatório tem de seguir a mesma regra da lista de treinos e do agregador. Unilateral dobra, peso por lado dobra, e os dois juntos não compõem (multiplicam por 2, não por 4).

**Veredito: PASSOU, com uma ressalva de observabilidade (abaixo).**

## Código (lido em `main` `ad6eed3`)
- `src/lib/analise/volume.ts`: `volumeDeSerie` usa multiplicador 2 se a série é `unilateral` ou `pesoPorLado`, e 1 caso contrário.
- Todas as contas de volume passam por essa função:
  - `metricas-treino.ts` (relatório);
  - `treino.ts` `listarTreinos` (lista e Home);
  - `padrao-sessao.ts`;
  - `agregar.ts`, via `calcularVolume`;
  - `fora-do-padrao.ts`.
- Não sobrou conta paralela de `reps * peso` em `src/`.
- O `exercicioUnilateral` chega ao relatório pelos três caminhos:
  - `buscarTreino`, que serve `relatorio-treino.ts` (`/treino` e `/ajustes/relatorios`);
  - `registrarSerie` em `treino-detalhe.tsx`, que lê `exercicio.unilateral` do catálogo;
  - "Repetir série", que passa por `registrarSerie` e não copia o campo da série anterior. Por isso a série repetida também sai certa.

## Testes
`npx vitest run src/lib/dados/metricas-treino.test.ts src/lib/analise/volume.test.ts src/lib/analise/agregar.test.ts`: 3 arquivos, 47 testes, todos passaram. Um deles cobre unilateral + peso por lado (1380 kg).

## Produção
Conta de personal "Guilherme" em modo TREINO, viewport 375×812 dentro de um iframe da mesma origem. A janela do Chrome não aceitou o redimensionamento.

Treino `bd97f808`, 4 séries valendo:

| Série | Exercício | Regra | Volume |
|---|---|---|---|
| 1 | Agachamento búlgaro, 10 × 20 kg | unilateral | 400 |
| 2 | Agachamento búlgaro, "Repetir série" | unilateral | 400 |
| 3 | Agachamento com halteres, 10 × 10 kg/lado | peso por lado | 200 |
| 4 | Agachamento livre, 10 × 50 kg | bilateral | 500 |
| | **Total esperado** | | **1500 kg** |

A conta manual saiu do SELECT no banco e também deu 1500.

O que a tela mostrou:

| Tela | Valor mostrado |
|---|---|
| Home, "Volume acumulado na semana" | 1,5t |
| Home, cartão em Treinos Recentes | 1,5 t |
| `/treino`, cartão do treino | 1,5 t |
| `/ajustes/relatorios`, "VOLUME" | 1.500 kg |

Antes da correção, o relatório daria 1100 kg (só peso por lado dobrava).

## Ressalva: o que não se vê na tela
- `tonelagemTotalKg` do relatório pós-treino **não é exibido** no cartão. O cartão mostra só duração, séries, exercícios e foco.
- O valor só aparece no bloco "fora do padrão" (AN-08 B1), e esse bloco exige histórico de sessões do mesmo tipo.
- A conta tinha 0 treinos, então o bloco não apareceu.
- Por isso a igualdade da tonelagem do relatório foi provada por **código + teste unitário da mesma função**, e não por pixel.

## Prints
- `00-conta-personal-guilherme-trabalho.png`: conta confirmada antes de gravar.
- `01-formulario-bulgaro-unilateral.png`: o formulário marca "UNILATERAL · REPS CONTAM POR LADO".

Dados de teste apagados no fim (ver o resumo do TR-16).
