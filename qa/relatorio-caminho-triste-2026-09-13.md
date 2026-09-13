# Caminho triste do app inteiro — relatório do QA independente

- **Data:** 2026-09-13 · **agente:** claude (QA independente, não escreveu o código testado)
- **Base:** `main` em `475c774` · **branch:** `chore/qa-caminho-triste-app` · **PR:** #245
- **Specs:** `e2e/j10-serie-e-fila`, `j11-formularios`, `j12-isolamento-e-apis`, `j13-sessao-e-navegacao`
- **1ª rodada do CI:** run `34784135645` (commit `57b3172`) — 89 passed, 19 failed, 1 flaky, 24,5 min
- **2ª rodada:** run `34785642721` (commit `10f51ba`) — 90 passed, 20 failed, 0 flaky, 29,7 min. Três defeitos do próprio teste corrigidos e um caso novo (ver o fim). As 20 falhas são os achados abaixo: as 19 da 1ª rodada menos o M1 (passou de primeira), mais o M3 (agora medido certo) e o caso novo da fila travada
- **Produção sem conta:** `qa/evidencias/TR-PUB-01/`

Cada falha foi conferida contra defeito do próprio teste antes de entrar aqui. Três não passaram nessa conferência e estão na seção "Defeitos do teste".

Custo de cota da Gemini: zero. Contas descartáveis: todas apagadas (conferido no banco depois da rodada).

---

## Achados, do mais grave para o menos grave

### ALTA

**A1 · Série com número fora do limite aparece registrada, fica presa para sempre e some ao recarregar**
- **Área:** treino / offline
- **Passos:** abrir um treino, registrar série com reps 201, reps 2,5, peso 1000,01, peso 99999999 ou RIR 1,5.
- **Esperado:** a tela recusa na hora, como faz com reps 0 ou peso negativo.
- **Obtido:** a tela aceita, mostra a série e diz "salvo no aparelho". Depois de 25 s a fila local tem **1 pendente e 0 descartada**; o banco não tem a série; ao recarregar ela some. Os 5 casos, nas duas tentativas.
- **O que foi MEDIDO:** a tela aceitou; a fila local ficou com 1 pendente e 0 descartada depois de 25 s; o banco não tem a série; o log do SERVIDOR mostra `[erro-permanente] Falha ao registrar série: ... violates check constraint "serie_reps_positiva"` acompanhado de `digest: '2357073175'`.
- **O que é INFERÊNCIA (bem fundada, não medida no cliente):** o build de produção do Next entrega ao cliente só o `digest`, sem a mensagem. Sem o prefixo, `ehErroPermanente` devolve falso, o item é tratado como falha de rede e fica na cabeça da fila FIFO. Se isso se confirmar, **o mecanismo do OF-02 (registrado como PASSOU) não funciona no build de produção**. A correção sugerida (validar os limites da tabela `serie` na tela, e não depender da mensagem atravessar a server action) resolve o achado por qualquer uma das duas causas.
- **Consequência MEDIDA na 2ª rodada (run `34785642721`, as duas tentativas):** depois da série de reps 201, uma série válida (10 kg × peso único) foi registrada; em 30 s ela **não chegou ao banco**, a fila local ficou com **2 pendentes e 0 descartadas** e a tela dizia "salvo no aparelho". Ou seja: uma única série inválida faz **todo o treino seguinte daquele aparelho parar de sincronizar**, sem aviso, até alguém limpar o navegador. É isso que torna o A1 ALTA.
- **Evidência:** run `34784135645`, log linhas 606–873 (digest); prints `aceita-depois-da-fila.png` ("201 × 41.76 kg · salvo no aparelho") e `aceita-depois-de-recarregar.png`.

**A2 · Editar uma série para reps 999 mostra 999 e o banco guarda o valor antigo, sem aviso**
- **Área:** treino / offline
- **Passos:** tocar numa série registrada (8 × 40), mudar reps para 999, Salvar.
- **Esperado:** recusa na tela.
- **Obtido:** a tela mostra "999 × 40 · salvo no aparelho"; o banco segue com 8; ao recarregar volta 8. Mesmo mecanismo do A1.
- **Evidência:** print `edicao-aceita-antes-da-fila.png`; anotação "a tela mostrou reps 999; o banco ficou com 8".

### MÉDIA

**M1 · Aparelho compartilhado: a série pendente de uma conta trava a fila da conta seguinte (intermitente)**
- **Área:** offline
- **Passos:** conta A registra sem rede e a sessão acaba; conta B entra no mesmo navegador e registra uma série.
- **Esperado:** a série de B chega ao banco de B.
- **Obtido:** na 1ª rodada, 1ª tentativa, a série de B não chegou em 30 s, com 2 itens pendentes na fila; o servidor recusou a de A com `treino_id ... inexistente` (erro que a fila trata como transitório). No retry passou, e na 2ª rodada passou de primeira: **intermitente, 1 falha em 3 execuções**. A fila Dexie é uma só por navegador, não por conta.
- **Evidência:** run `34784135645`, log linhas 1562–1601; print `conta-b-depois-da-fila.png`.

**M2 · Duplo clique em "Registrar série" grava duas séries iguais**
- **Área:** treino
- **Obtido:** 2 na tela e 2 no banco ("11 × 33.21" duas vezes, "sincronizado"). O botão não trava durante o envio.
- **Evidência:** print `duplo-clique-registrar.png`.

**M3 · "Iniciar treino de hoje" sem rede troca a tela inteira pela página de erro do Next, em inglês**
- **Área:** treino / offline
- **Obtido:** "This page couldn't load · Reload · Back", fundo branco. É o caso de uso do subsolo sem sinal. O duplo clique com rede criou um treino só (passou).
- **Evidência:** print `iniciar-sem-rede.png`. A 1ª rodada deu verde por defeito da asserção (ver abaixo); a 2ª mede certo.

**M4 · Modelo de treino com plano fora do limite deixa um modelo vazio no banco a cada tentativa**
- **Área:** ajustes / modelos
- **Passos:** criar modelo com reps 150, reps 2,5 ou peso 1000,5 no plano de um exercício, Salvar.
- **Obtido:** a tela mostra "Não foi possível salvar", e o banco ganha 1 modelo com 0 exercícios, nos 3 casos. `criarModelo` grava o cabeçalho antes dos itens. A tela ainda aceita esses valores (o campo tem `max=100`, mas não é validado).
- **Evidência:** log `Falha ao gravar exercícios do modelo: ... modelo_treino_exercicio_reps_valida`; prints `modelo-reps-150.png` e afins.

**M5 · Dois pedidos simultâneos à Análise criam dois rascunhos e gastam cota dupla**
- **Área:** análise (API)
- **Passos:** dois `POST /api/analise` ao mesmo tempo, mesma conta.
- **Esperado:** um 202 e um 409.
- **Obtido:** 202 e 202; 2 rascunhos; 2 usos na cota de 5/dia. A checagem de "geração em andamento" e o insert não são atômicos.

### BAIXA

- **B1 · Peso em branco grava 0 kg sem aviso** (severidade decidida pelo dono). Print `peso-vazio.png` ("9 × 0 kg").
- **B2 · Id que não é UUID responde 500, não 404:** `/treino/abc`, `/catalogo/abc`, `/ajustes/relatorios/parecer/abc`, `/api/parecer/abc/pdf`. Log: `invalid input syntax for type uuid: "abc"`. Com UUID inexistente as três telas dão 404 (passou).
- **B3 · PDF de um parecer ainda em geração responde 500.** Sem link na tela; só por URL.
- **B4 · Coach aceita pergunta feita só de caractere invisível (`​`) e gasta cota.** No CI respondeu 502 por falta da chave; em produção iria à Gemini.
- **B5 · Anilha de 0,001 kg é salva como 0 kg no inventário** (`numeric(6,2)` arredonda depois da validação `> 0`).
- **B6 · Texto sem espaço estoura a largura no celular:** nome de modelo com 10 mil caracteres (lista de modelos, 109.706 px a 375 px) e nome de perfil gigante (`/perfil`, 43.337 px). Home e `/personal/alunos` aguentaram. Nenhum HTML do nome foi executado.
- **B7 · Depois de logar de novo, a fila não drena sozinha:** a série da sessão expirada só sobe ao recarregar o app ou abrir o treino. Não se perde (passou depois do recarregamento).
- **B8 · Página 404 é a padrão do Next:** branca, em inglês, sem marca e sem caminho de volta (produção). Print `qa/evidencias/TR-PUB-01/print-404.png`.

---

## O que PASSOU (verificado, não alegado)

- **Isolamento entre duas contas sem relação, pela API com o próprio JWT:** não leu, não alterou, não apagou nem inseriu em nome da outra em `treino`, `serie`, `parecer`, `modelo_treino`, `modelo_treino_exercicio`, `uso_ia`, `vinculo_personal`, `usuario` e no storage de avatar.
- Nenhuma conta (nem o personal vinculado, que enxerga o treino) move a própria série para o treino de outra.
- A conta não apaga o próprio `uso_ia` para recuperar cota.
- Conta desconhecida e personal vinculado não abrem treino, parecer nem PDF da aluna pelo id.
- `?modelo=` com modelo de outra conta não traz o plano.
- CSV e progressão do personal vinculado só com os dados dele.
- As 5 APIs sem sessão → 401 (CI e produção); rotas privadas sem sessão → login com `?proximo=` preservado (produção).
- 409 com geração em andamento e 429 no teto, sem gastar cota; pedidos simultâneos ao coach não furaram o teto de 10.
- Conta excluída com vínculo vivo, pelos dois lados: telas de pé, a prescrição volta para a aluna.
- Botão voltar depois de sair e depois de excluir a conta não mostra dado; a senha antiga não entra.
- Sessão expirada no coach e na Análise mostra o aviso; meta e modelo não fingem ter salvo.
- `?proximo=` com `//evil.example`, `/\evil.example` e `https://evil.example/x` fica no app.
- Tema corrompido no localStorage: nenhum script executado, tela no tema padrão (CI e produção).
- Reps vazio, negativo, zero, com letras e peso negativo: recusados.
- Ciclo sem rede (criar, editar, excluir) chegou ao banco exatamente assim.
- Dois toques rápidos em "Repetir série" criaram uma série só.
- Modelo: nome só de espaços trava o botão; nome com símbolo e HTML aparece literal; duplo clique cria um só.
- Anilhas: barra 0, negativa e absurda não salvam. Meta 0, 8, 3,5 e -1 recusadas na tela e 99 no banco.

---

## Defeitos do próprio teste, achados e corrigidos na 2ª rodada

1. **"Iniciar treino sem rede" deu verde com a tela quebrada.** A asserção procurava "Application error"; a tela dizia "This page couldn't load". Agora mede se a tela do app sumiu. **2ª rodada: vermelho nas duas tentativas, com a anotação "trocou a tela pela página de erro do Next" — M3 confirmado.**
2. **"Login com e-mail gigante" deu vermelho medindo outra coisa.** A senha "x" foi barrada pelo `minLength` nativo antes de o app ver o e-mail. O app fez o certo; a senha do teste agora tem 8 caracteres. **2ª rodada: passou — o app mostra o erro e não quebra. Não é achado.**
3. **Faltava provar a consequência do A1.** Caso novo: série recusada pelo banco seguida de série válida. **2ª rodada: vermelho nas duas tentativas — a fila trava (ver A1).**

Contas descartáveis depois da 2ª rodada: conferido em `auth.users` (só leitura) — nenhuma conta desta sessão sobrou; restam só as 5 antigas listadas abaixo.

## Outros registros

- **`scripts/qa-obsoletos.mjs` marca 35 de 35 itens como obsoletos**, inclusive todo item PASSOU com comentário na coluna Resultado: o script só reconhece `PASSOU` puro. Defeito do registro, não do app.
- **Contas QA antigas no banco, que não são desta sessão:** as 4 da `j9` de hoje às 18:26 UTC e uma da `j2` de 2026-09-05, que não estava na lista de conhecidas. Não foram tocadas.
- **O perfil do Chrome do Playwright MCP tem credencial salva** de `qa-lastro-perf@example.com`, que não existe entre as contas `qa.*`. Não foi usada.
