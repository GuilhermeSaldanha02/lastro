# 02 — Home (`/`) e Lista de treinos (`/treino`)

- [ ] **HOME-01** Logado, acessar `/`. Esperado: métricas da semana carregam (Treinos, Volume, Séries valendo), com o usuário de teste tendo dado real na semana atual (0, já que a seed não cobre a semana corrente — checar se aparece "0" corretamente, não vazio/quebrado).
- [ ] **HOME-02** Sem treino de hoje registrado (usuário de teste não tem sessão hoje). Esperado: não mostra "Continuar treino de hoje"; mostra `IniciarTreino` (já que há modelos? checar se o usuário de teste tem modelo — se não, mostra form direto "Iniciar treino de hoje").
- [ ] **HOME-03** Clicar "Iniciar treino de hoje" (Server Action). Esperado: cria treino, navega para `/treino/{id}` novo.
- [ ] **HOME-04** Voltar para `/` depois do HOME-03 (mesmo dia). Esperado: agora mostra "Continuar treino de hoje" → `/treino/{id}` do treino recém-criado.
- [ ] **HOME-05** Seção "Treinos recentes" com o usuário de teste (15 treinos seedados). Esperado: lista aparece, datas formatadas ("hoje"/"ontem"/data curta), cada item mostra série+volume se > 0.
- [ ] **HOME-06** Clicar num treino recente. Esperado: navega para `/treino/{id}` correto (o mesmo `id` do treino clicado).
- [ ] **HOME-07** Atalho "Análise Semanal". Esperado: meta mostra "N semana(s) fechada(s) com treino" com N > 0 (usuário de teste tem 5 semanas de dado); clicar navega para `/analise`.
- [ ] **HOME-08** `AbaInferior` com `ativa="inicio"` destacada corretamente.
- [ ] **LISTA-01** Acessar `/treino`. Esperado: histórico completo (15 treinos da seed) em ordem mais recente primeiro.
- [ ] **LISTA-02** Clicar "Editar" no cabeçalho "Histórico". Esperado: vira "Concluído", lixeiras aparecem em cada linha; linha continua navegável clicando fora da lixeira.
- [ ] **LISTA-03** Em modo de edição, clicar a lixeira de um treino. Esperado: confirmação inline com texto exato "Excluir o treino de {data} e as N séries dele? Não dá para desfazer." (N = 8 ou 10, conforme tinha rosca ou não) — checar a pluralização "a série dele" vs "as N séries dele" com um treino que realmente tenha só 1 série se possível, senão anotar que não foi possível testar esse sub-caso com a seed atual.
