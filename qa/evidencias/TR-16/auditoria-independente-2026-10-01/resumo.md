# TR-16: auditoria independente (2026-10-01)

**Critério.** Linha TR-16 do `QA.md`, itens (a) a (g). O fim do treino é gravado no servidor (PR #286).

**Desvio do critério.** O critério pedia a conta do dono. Por ordem da tarefa, usei a conta de personal "Guilherme" (`43a49e36`), em modo TREINO.
- A conta foi confirmada antes de gravar: em `/perfil` o nome é exatamente "Guilherme", e em `/ajustes` aparece a cápsula TREINO/TRABALHO. O modo inicial era TRABALHO.
- Linha de base pelo SELECT: 0 treinos, 0 séries, 0 `aviso_descanso`.
- Viewport 375×812 dentro de um iframe da mesma origem, porque a janela não aceitou o redimensionamento.

**Veredito: PASSOU.**

| Item | O que foi feito | Resultado |
|---|---|---|
| (a) | Criei o treino `bd97f808` com 4 séries. Toquei em "Finalizar Treino" e depois em "Finalizar Treino" na confirmação. | O relatório abriu com "SESSÃO FINALIZADA · 1 min · 4 séries · 3 exercícios · PERNAS" (print `01-…`). O banco gravou `finalizado_em` 16:47:02.216Z e `duracao_segundos` 102. |
| (b) | Busquei o HTML de `/` e de `/treino` e o texto renderizado. | Só aparece "Iniciar treino de hoje"; nenhum "Continuar treino de hoje". |
| (c) | `fetch` do HTML cru de `/treino/bd97f808` (resposta do servidor, sem rodar o localStorage). | Status 200, com "Ver relatório" e "Reabrir treino"; sem "Finalizar Treino" e sem "Registrar/Repetir série". |
| (d) | Toquei em "Reabrir treino". | O cronômetro voltou de 01:42 e seguiu para 01:43 e 01:47. O HTML de `/` e de `/treino` passou a ter "Continuar treino de hoje", sem "Iniciar". |
| (e) | Li o `localStorage` direto. | Depois de finalizar, `lastro_fim_servidor_<id>` = "1" e existe a chave de fim. Depois de reabrir, a chave de fim sumiu e a confirmação ficou "1". Na 2ª finalização, a chave local e o `finalizado_em` do banco são idênticos (16:53:19.678Z). |
| (f) | Conferi o banco. | Depois da 1ª finalização: 16:47:02.216 / 102 s. Depois de reabrir: `null`/`null`. Depois da 2ª: 16:53:19.678 / 322 s. Os 322 s batem com o cronômetro, que mostrava 05:22. |
| (g) | Com o de hoje finalizado, toquei em "INICIAR TREINO DE HOJE" na Home. | Nasceu `424942c4`: mesmo dia, aberto, 0 séries. O `bd97f808` continuou fechado. |

**Observação, não é defeito.** Na 1ª finalização a chave local ficou 0,37 s **depois** do `finalizado_em` do banco: 02.587 contra 02.216.
- Causa no código: `limitarFimMs` prende o fim ao relógio do servidor (`min(agora, …)`). O relógio do aparelho estava adiantado.
- `espelharServidor` mantém de propósito o fim local quando os dois estão finalizados.
- Diferença abaixo de 1 s, dentro do que o código decide.

**Limitação.** O console de erros só foi lido no fim, então não cobre a carga das páginas. Não posso afirmar "console sem erro".

**Testes unitários relacionados.** `fim-treino`, `marcos-treino` e `espelho-servidor` passaram junto com os do coach: 6 arquivos, 140 testes.

## Limpeza
Feita por SQL, filtrada por `usuario_id = 43a49e36…` e pelos dois ids (`bd97f808`, `424942c4`).
- SELECT depois da limpeza: 0 treinos, 0 séries, 0 `aviso_descanso`, `modo_ativo = trabalho`.
- `/ajustes` mostra "Modo trabalho: Fila e Alunos".
- Também removi do `localStorage` as 5 chaves `lastro_*` desses dois treinos.
