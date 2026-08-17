# 02 — Home (`/`) e Lista de treinos (`/treino`)

- [x] **HOME-01** Logado, acessar `/`. Esperado: métricas da semana carregam (Treinos, Volume, Séries valendo), com o usuário de teste tendo dado real na semana atual (0, já que a seed não cobre a semana corrente — checar se aparece "0" corretamente, não vazio/quebrado).

```
Tela (get_page_text em http://localhost:3002/):
ESTA SEMANA
Treinos
0
Volume
0
kg
Séries valendo
0
Semana em andamento. Aquecimento não entra em volume nem na contagem de séries.

Screenshot confirma "0" renderizado nos 3 cartões (Treinos/Volume/Séries valendo), não vazio/quebrado.

read_console_messages (tabId 1192488195):
Found 1 console messages:
[1] [11:24:36] [LOG] (chrome-extension://lopnbnfpjmgpbppclhclehhgafnifija/content-scripts/content.js:108:8872)
[SlashCommand] Config loaded, enabled: true commands: 22
(mensagem da própria extensão Chrome, não do app)

read_network_requests: "No network requests found for this tab." (chamado antes de qualquer navegação subsequente; página já tinha carregado via SSR)
```

- [x] **HOME-02** Sem treino de hoje registrado (usuário de teste não tem sessão hoje). Esperado: não mostra "Continuar treino de hoje"; mostra `IniciarTreino` (já que há modelos? checar se o usuário de teste tem modelo — se não, mostra form direto "Iniciar treino de hoje").

```
Screenshot (http://localhost:3002/, antes de qualquer treino de hoje existir):
Banner "PRONTO PARA TREINAR" com botão único "Iniciar treino de hoje" (não há "Continuar treino de hoje", não há seletor de modelo — o usuário de teste não tem modelo cadastrado, então vai direto pro botão de iniciar).

read_page (filter=interactive) mostrou:
button "Iniciar treino de hoje" [ref_1] type="submit"

Console: nenhuma mensagem de erro relevante do app (mesmas mensagens de HMR/DevTools).
Network: sem chamadas XHR relevantes nesse ponto (carregamento SSR).
```

- [x] **HOME-03** Clicar "Iniciar treino de hoje" (Server Action). Esperado: cria treino, navega para `/treino/{id}` novo.

```
Ação: click no botão "Iniciar treino de hoje" em http://localhost:3002/.
Resultado: navegação automática para http://localhost:3002/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0

Screenshot da tela resultante:
SEGUNDA · 17 AGO
Treino em andamento
"Nenhuma série registrada ainda. Comece pela primeira aqui embaixo."
Botão "Adicionar exercício"
"salvo no aparelho"

Data bate com o dia corrente (2026-08-17, segunda-feira). Treino novo, vazio, criado com sucesso via Server Action.

read_console_messages: sem erros de app.
read_network_requests (antes do clique, resetado): 29 requisições, todas GET com statusCode 200 (assets/rsc), nenhum erro 4xx/5xx registrado durante o fluxo.
```

- [x] **HOME-04** Voltar para `/` depois do HOME-03 (mesmo dia). Esperado: agora mostra "Continuar treino de hoje" → `/treino/{id}` do treino recém-criado.

```
Navegação: http://localhost:3002/ (via navigate, mesma sessão/dia).

get_page_text:
TREINO DE HOJE EM ANDAMENTO
Continuar treino de hoje
ESTA SEMANA
Treinos
0
Volume
0
kg
Séries valendo
0
...
TREINOS RECENTES
14 ago
10 séries · 3,1 t
12 ago
10 séries · 3,1 t
10 ago
10 séries · 3,1 t

Ação: click no botão "Continuar treino de hoje".
Resultado: tabs_context_mcp confirmou navegação para
http://localhost:3002/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0
— exatamente o mesmo id criado no HOME-03. Confirmado.

OBSERVAÇÃO (não é item do checklist, registrando como achado): o treino de hoje (0 séries) criado no HOME-03 NÃO aparece na seção "TREINOS RECENTES" da Home, mesmo sendo o mais novo — a lista mostra só 14/12/10 ago. Também o contador "Treinos" da semana continua em 0 mesmo com um treino "em andamento" criado hoje. Pode ser comportamento intencional (só conta/lista treino com série registrada), mas fica registrado pois testar o sub-caso de formatação "hoje"/"ontem" do HOME-05 não foi possível por causa disso (ver HOME-05).
```

- [x] **HOME-05** Seção "Treinos recentes" com o usuário de teste (15 treinos seedados). Esperado: lista aparece, datas formatadas ("hoje"/"ontem"/data curta), cada item mostra série+volume se > 0.

```
get_page_text (http://localhost:3002/, após HOME-03/04):
TREINOS RECENTES
14 ago
10 séries · 3,1 t
12 ago
10 séries · 3,1 t
10 ago
10 séries · 3,1 t

A seção "Treinos recentes" da Home mostra só 3 itens (não os 15 — isso é esperado, é um recorte "recentes"; o histórico completo fica em /treino, ver LISTA-01).
Cada item mostra data curta ("14 ago", "12 ago", "10 ago") + "N séries · X,X t" (série e volume, ambos > 0). Formato "data curta" confirmado.

[NÃO COBERTO]: formatação "hoje"/"ontem" não pôde ser verificada nesta seção. Motivo: o treino de hoje (criado no HOME-03, 0 séries) não aparece nesta lista "Treinos recentes" (ver observação no HOME-04) — só treinos com série registrada aparecem, e a seed não tem nenhum treino de ontem (16 ago). Não havia como forçar o sub-caso "hoje/ontem" sem violar a regra de não mexer nos 15 treinos seedados nem sem passar a sessão para o dia seguinte.
```

- [x] **HOME-06** Clicar num treino recente. Esperado: navega para `/treino/{id}` correto (o mesmo `id` do treino clicado).

```
Ação: click no item "14 ago" da seção "Treinos recentes" na Home.
Resultado: navegação para http://localhost:3002/treino/ac8113db-8d1c-4ab7-9499-57a27f943e4c

Screenshot da tela de destino:
SEXTA · 14 AGO
Treino em andamento
Séries | Editar
Supino reto com barra — 3 valendo
1  12 x 20 kg  AQUECIMENTO
2  8 x 50 kg   VALENDO
3  8 x 50 kg   VALENDO
4  7 x 50 kg   VALENDO
Agachamento livre — 3 valendo
...

Data "14 AGO" bate com o item clicado ("14 ago"). Navegação para o id correto confirmada.
```

- [x] **HOME-07** Atalho "Análise Semanal". Esperado: meta mostra "N semana(s) fechada(s) com treino" com N > 0 (usuário de teste tem 5 semanas de dado); clicar navega para `/analise`.

```
Screenshot/get_page_text da Home antes do clique:
Análise Semanal
5 semanas fechadas com treino

Ação: click no atalho "Análise Semanal".
Resultado: tabs_context_mcp confirmou navegação para http://localhost:3002/analise

get_page_text da página de destino (trecho):
ANÁLISE SEMANAL
Semana fechada
PROGRESSÃO
Supino reto com barra
e1RM ficou estável 0.0% entre 13/07 e 10/08. Platô há 3 semanas.
...
Agachamento livre
e1RM subiu 17.2% entre 13/07 e 10/08.
...
Rosca direta
e1RM subiu 12.5% entre 03/08 e 10/08.

5 semanas de dado (13/07, 20/07, 27/07, 03/08, 10/08) batem com "5 semanas fechadas com treino" mostrado na Home. N=5 > 0, confirmado.
```

- [x] **HOME-08** `AbaInferior` com `ativa="inicio"` destacada corretamente.

```
javascript_tool em http://localhost:3002/ (DOM real, não suposição):

Array.from(document.querySelectorAll('a[href="/"], a[href="/treino"], a[href="/analise"], a[href="/catalogo"], a[href="/ajustes"]')) -> 
[
  {"ariaCurrent": null, "href": "/analise", "text": "Análise Semanal5 semanas fechadas com treino"},  // atalho do card, não é a aba
  {"ariaCurrent": "page", "class": "", "href": "/", "text": "Início"},
  {"ariaCurrent": null, "class": "", "href": "/treino", "text": "Treinos"},
  {"ariaCurrent": null, "class": "", "href": "/analise", "text": "Análise"},
  {"ariaCurrent": null, "class": "", "href": "/catalogo", "text": "Catálogo"},
  {"ariaCurrent": null, "class": "", "href": "/ajustes", "text": "Ajustes"}
]

getComputedStyle das abas "Início" (ativa) vs "Treinos" (inativa):
{
  "inicio":   {"color": "rgb(240, 234, 224)",        "fontWeight": "700", "opacity": "1"},
  "treinos":  {"color": "rgba(240, 234, 224, 0.94)", "fontWeight": "600", "opacity": "1"}
}

Aba "Início" tem aria-current="page" e estilo visualmente distinto (peso de fonte 700 vs 600, cor full-opacity vs 94%). Destaque confirmado via DOM/CSS computado (o ícone da aba fica parcialmente coberto pelo avatar da extensão Chrome nos screenshots, por isso a verificação foi feita via JS em vez de só visual).
```

- [x] **LISTA-01** Acessar `/treino`. Esperado: histórico completo (15 treinos da seed) em ordem mais recente primeiro.

```
get_page_text (http://localhost:3002/treino):
HISTÓRICO
Editar
17 ago   0 séries
14 ago   10 séries
12 ago   10 séries
10 ago   10 séries
7 ago    10 séries
5 ago    8 séries
3 ago    8 séries
31 jul   8 séries
29 jul   8 séries
27 jul   8 séries
24 jul   8 séries
22 jul   8 séries
20 jul   8 séries
17 jul   8 séries
15 jul   8 séries
13 jul   8 séries

16 itens no total = 15 da seed + 1 (o treino de hoje criado no HOME-03, esperado já que ele existe nesse ponto do teste). Ordem decrescente por data confirmada (17 ago no topo, 13 jul no final). Os 15 da seed batem com o enunciado (datas de 14 ago até 13 jul, alternando 10/8 séries).
```

- [x] **LISTA-02** Clicar "Editar" no cabeçalho "Histórico". Esperado: vira "Concluído", lixeiras aparecem em cada linha; linha continua navegável clicando fora da lixeira.

```
Ação: click em "Editar" (canto superior direito de "HISTÓRICO").
get_page_text após o click:
HISTÓRICO
Concluído
17 ago   0 séries  [lixeira]
14 ago   10 séries [lixeira]
12 ago   10 séries [lixeira]
...

Screenshot confirma: label virou "Concluído" e um ícone de lixeira apareceu em cada linha, ao lado da seta ">".

Ação: click na linha "14 ago" fora do ícone de lixeira (coordenada à esquerda, sobre o texto da data).
Resultado: tabs_context_mcp confirmou navegação para
http://localhost:3002/treino/ac8113db-8d1c-4ab7-9499-57a27f943e4c
(mesmo id do treino "14 ago" visto no HOME-06). Linha continua navegável clicando fora da lixeira — confirmado.
```

- [x] **LISTA-03** Em modo de edição, clicar a lixeira de um treino. Esperado: confirmação inline com texto exato "Excluir o treino de {data} e as N séries dele? Não dá para desfazer." (N = 8 ou 10, conforme tinha rosca ou não) — checar a pluralização "a série dele" vs "as N séries dele" com um treino que realmente tenha só 1 série se possível, senão anotar que não foi possível testar esse sub-caso com a seed atual.

```
Ação: em /treino, modo edição ativo, click no ícone de lixeira da linha "14 ago" (10 séries).

get_page_text do trecho:
14 ago
10 séries
Excluir o treino de 14 ago e as 10 séries dele? Não dá para desfazer.
Cancelar
Excluir

Screenshot confirma caixa inline vermelha com o texto exato acima e botões "Cancelar" / "Excluir".
Texto bate 100% com o esperado: "Excluir o treino de 14 ago e as 10 séries dele? Não dá para desfazer." (N=10, plural "as 10 séries dele").

Ação: click em "Cancelar" (para NÃO apagar o treino da seed).
Resultado: get_page_text logo depois confirma os 16 itens ainda presentes (17 ago...13 jul), nenhum removido. read_console_messages não mostrou nenhum erro, só HMR/DevTools:
Found 2 console messages:
[1] [11:29:05] [INFO] ... Download the React DevTools ...
[2] [11:29:05] [LOG] ... [HMR] connected

[NÃO COBERTO]: o sub-caso singular "a série dele" (N=1) não pôde ser testado. Motivo: nenhum dos 15 treinos seedados nem o treino de hoje (0 séries) tem exatamente 1 série — a seed só tem treinos com 8 ou 10 séries (ou 0, no caso do treino recém-criado de hoje). Criar um treino específico com 1 série só para este teste tocaria em dado fora do escopo combinado (o item já autoriza criar "treino de hoje", mas não teste de exclusão real na seed); optei por não forçar esse cenário sem confirmação explícita. A pluralização para N=10 (plural) foi confirmada; a pluralização para N=8 não foi testada explicitamente (mesma regra gramatical do plural, risco de bug específico do singular é o que fica não coberto).
```
