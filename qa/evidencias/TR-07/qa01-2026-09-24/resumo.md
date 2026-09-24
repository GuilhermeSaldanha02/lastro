# QA-01 área TREINO — reexecução 2026-09-24 (produção lastro-pi.vercel.app, conta do dono, 375×812, main 8d616ea)

| ID | Resultado | Medido |
|---|---|---|
| TR-01 | PASSOU | b182c278 finalizado 19:27:31Z; cronômetro 155:56 igual em 2 leituras com 3 s de intervalo e após recarregar (+7 s); duracao_segundos 9356 = 155:56; botão de descanso some (0). Reaberto depois. |
| TR-02 | PASSOU | "Repetir série" → POST 5cb1810a, "sincronizado" em 313 ms; tela antes = tela após recarregar = 4 linhas idênticas ao banco. |
| TR-03 | NÃO EXECUTADO | conta tem 0 modelos; criar modelo é proibido. |
| TR-04 | PASSOU | b80ab6dc aberto + recarregado: 0 pageerror, 0 erro no console (só 4 avisos de preload de fonte/logo). |
| TR-05 | PASSOU | treino 19/09 (82137ea7), sticker "PERNAS"; grupos no catálogo: Quadríceps, Glúteos, Posterior de coxa, Panturrilha (inclui Cadeira abdutora, Mesa flexora). |
| TR-06 | PASSOU | reps 201/2,5/2.5, peso 1000,01/99999999, RIR 1,5 recusados com a mensagem; 0 POST de gravação por caso. |
| TR-07 | PASSOU | série f03a9d64 (b182c278) editada p/ 999: "Reps precisa ser um número inteiro entre 1 e 200.", 0 POST, tela e banco seguem 8 reps. |
| TR-08 | PASSOU (ressalva) | 2 cliques no "Registrar série": banco +1 (f03a9d64). A contagem de POST dessa execução perdeu-se (a ferramenta travou ~2 h). |
| TR-09 | PASSOU | peso vazio e "abc" → "Informe o peso. Use 0 para exercício sem carga.", 0 POST. |
| TR-10 | PASSOU | /treino/abc e UUID 00000000-… → 404, lang pt-BR, "Página não encontrada · 404"; console só o próprio 404. |
| TR-11 | PASSOU | entrada: reps vazio/0/-3/abc/e/2,5/201 e peso -5 recusados, 0 POST. Repetir série 2 cliques em 46 ms: 1 POST, banco 1→2 (5db7507b). |
| TR-12 | PASSOU | "Outra série": cartão 154–685 px, Registrar série 621–685, nav 735–800, cronômetro termina em 116; ações fixas ocultas. Edição inline: Salvar 681–729. |
| TR-13 | PASSOU (eventos sintéticos) | 2 toques em ~40–80 ms a 75% (2º caiu no "Finalizar Treino" da confirmação): continuou na confirmação. Obs.: um 2º clique real ~2 s depois finalizou (esperado, >500 ms). |
| TR-14 | PASSOU | 12 resumos (21/09 e 19/09), 0 ocorrências de "N repetição"; ex.: "3 séries valendo · 12 repetições". Caso de 1 repetição não observado. |
| TR-15 | PASSOU | 21/09 (397eb9de): 9 "kg/lado" + 10 "kg" = 19; banco peso_por_lado 9/19. |

Observação (não é critério de TR): sticker do b182c278 finalizado mostrou "25 min" enquanto cronômetro/duracao_segundos marcavam 155:56 / 9356 s.
Rede: 504 "Sem rede" em 4 prefetch RSC (/, /analise, /catalogo, /ajustes) aos ~234 s — instabilidade durante a sessão.
Séries criadas no b182c278: 5db7507b (ordem 2), f03a9d64 (ordem 3), 5cb1810a (ordem 4), todas aquecimento. Estado final: EM ABERTO (finalizado_em null).
