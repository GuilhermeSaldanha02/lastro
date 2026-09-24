# TR-16 — fim do treino no servidor (produção, 2026-09-24)

Conta do dono (login digitado por ele), Playwright MCP, 375×812, `main` em 50c90ac.
Treino criado para o QA com autorização do dono: `b80ab6dc-3a03-4d99-8354-ed03c1cafb9a` (24/09, 2 séries de AQUECIMENTO de Supino reto máquina 10 × 20 kg). O dono combinou apagar depois.

| Passo | Obtido | Evidência |
|---|---|---|
| a. Finalizar | Confirmação → "Finalizar Treino" → POST 200 na rota do treino; relatório "SESSÃO FINALIZADA · 2 min" | a-relatorio.png |
| b. Home e /treino | Nenhum "Continuar"; aparece "Iniciar treino de hoje" nas duas | b-home.png, b-treino.png |
| c. Segundo contexto (cookies da sessão, localStorage vazio) | HTML do servidor já traz "Ver relatório" e "Reabrir treino", sem "Finalizar Treino"; o localStorage do contexto novo ganhou `lastro_fim_treino_<id>` = `2026-09-24T16:47:58.267+00:00` e `lastro_fim_servidor_<id>` = "1" | c-segundo-contexto.png |
| d. Reabrir | Cronômetro 03:00 → 03:03 (continua de onde parou); POST 200; "Finalizar Treino" volta; Home e /treino mostram "CONTINUAR TREINO DE HOJE" | d-reaberto.png, d-home-continuar.png |
| e. localStorage | Finalizado: `lastro_fim_servidor_<id>` = "1", `lastro_fim_treino_<id>` = `2026-09-24T16:47:58.267Z` (igual ao banco). Reaberto: a chave de fim some, `lastro_fim_servidor_<id>` fica "1", `lastro_inicio_treino_<id>` é deslocado (16:44:57 → 16:45:55) para o cronômetro retomar | — |
| f. Banco (execute_sql, só leitura) | Finalizado: `finalizado_em` = 2026-09-24 16:47:58.267+00, `duracao_segundos` = 180, 2 séries. Reaberto: os dois `null` | — |
| g. Segundo treino no mesmo dia | Autorizado pelo dono: ver seção "g" abaixo — nasceu outro treino no mesmo dia | g-segundo-treino.png, g-home.png |

Console: 0 erros; só avisos de preload de fonte/avatar (console.txt, console-sessao.log). Rede: rede.txt.

Observação: o relatório mostra "0 SÉRIES" porque as duas séries são de aquecimento (contagem de séries valendo), não defeito do TR-16.

## g (autorizado pelo dono)

Refinalizado o b80ab6dc (POST 200) e tocado 'Iniciar treino de hoje' em /treino: nasceu b182c278-8bc3-4c55-9262-b5ddcbf0fe1a (POST 200), sem reaproveitar o fechado. Banco: b80ab6dc finalizado_em 16:51:28.627, duracao_segundos 333, 2 séries; b182c278 aberto, 0 séries. Home volta a 'CONTINUAR TREINO DE HOJE' (o novo). Prints g-segundo-treino.png, g-home.png. Os dois treinos são de QA e o dono vai apagá-los.
