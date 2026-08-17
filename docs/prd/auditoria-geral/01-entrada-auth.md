# 01 — Entrada / autenticação

`/login`, `/` sem sessão, `/auth/callback`, guard (`src/proxy.ts`), `sanitizarRotaDeRetorno`.

> **Rodada re-executada em 2026-08-17 com `mcp__claude-in-chrome__*` (extensão Chrome real).** A rodada anterior usou `mcp__Claude_Browser__*` (painel interno) e não conseguiu registrar clique/digitação de subagente — todos os itens que dependiam de interação ficaram `[NÃO COBERTO]`. Nesta rodada, clique, digitação, duplo clique e teclado nativo funcionaram de ponta a ponta via extensão. Todos os 14 itens foram reexecutados ao vivo (navegação real, clique real, digitação real, reload real) contra `http://localhost:3002`, aba redimensionada para 390×844. Evidência (screenshot, `read_page`/`get_page_text`, console, rede) colada abaixo de cada item.

- [x] **AUTH-01** Acessar `/login` deslogado. Esperado: formulário carrega, modo "entrar" por padrão, campos E-mail/Senha visíveis, sem "Nome".

```
TELA (screenshot real + read_page): heading "lastro", texto "Registro de treino e leitura semanal.".
form: label "E-mail" + textbox type=email; label "Senha" + textbox type=password; button "Entrar" type=submit.
button "Entrar com Google" type=button. button "Criar uma conta" type=button.
Nenhum campo "Nome" presente.
Observação à parte (não é bug do app): o Chrome autopreencheu E-mail/Senha via autofill de senha salva
no perfil do navegador na primeira carga da aba — comportamento do navegador, não do app; nas
reexecuções seguintes os campos foram sempre limpos e preenchidos explicitamente via form_input/type.

CONSOLE (read_console_messages): só ruído da extensão Claude in Chrome ([SlashCommand] Manager started /
Config loaded). Nenhum erro do app.

REDE (read_network_requests, após reload para capturar): GET http://localhost:3002/login → 200 OK
(+ assets estáticos normais, todos 200).
```

- [x] **AUTH-02** Clicar "Criar uma conta". Esperado: campo "Nome" aparece, botão de submit vira "Criar conta".

```
AÇÃO REAL: computer{left_click, ref=botão "Criar uma conta"} via extensão Claude in Chrome.

TELA (screenshot real após o clique):
Campo "Nome" (textbox vazio) aparece acima de "E-mail". Botão de submit agora lê "Criar conta"
(era "Entrar"). Botão secundário agora lê "Já tenho conta" (era "Criar uma conta").

read_page confirma a árvore: form > label "Nome" + textbox "Nome" type=text; label "E-mail" + textbox;
label "Senha" + textbox; button "Criar conta" type=submit. button "Entrar com Google". button
"Já tenho conta".

CONSOLE: só ruído da extensão, nenhum erro.
```

- [x] **AUTH-03** Submeter formulário de login com e-mail/senha do usuário de teste válidos. Esperado: botão vira "Entrando…", `disabled`; redireciona para `/` (rota de retorno default).

```
AÇÃO REAL: form_input preencheu E-mail (qa-audit-geral2@teste.lastro.invalid) e Senha
(SenhaTeste123!); computer{left_click, ref=botão "Entrar"}.

TELA (screenshot capturado imediatamente após o clique): botão mostra "Entrando…", com fundo
esverdeado mais claro (estado disabled visual) — read_page confirma button "Entrando…" type=submit.
Dois segundos depois (novo screenshot): navegou para "/", heading/label "Início", card "PRONTO PARA
TREINAR" / "Iniciar treino de hoje", resumo da semana, "Análise Semanal", lista de treinos recentes,
barra inferior (Início/Treinos/Análise/Catálogo/Ajustes).

CONSOLE: só ruído da extensão, nenhum erro.

REDE: POST http://localhost:3002/login → 200 OK, seguido de navegação para "/" (GET / e _rsc payloads,
200). Confirma submissão real e redirect para a rota default.
```

- [x] **AUTH-04** Submeter login com senha errada. Esperado: mensagem de erro em `role="alert"`, não navega, campos continuam preenchidos.

```
AÇÃO REAL: deslogado via botão "Sair" em /ajustes (confirmado por get_page_text voltando a /login).
form_input preencheu E-mail (qa-audit-geral2@teste.lastro.invalid) e Senha ("SenhaErrada999!" — errada
de propósito). computer{left_click, ref=botão "Entrar"}.

TELA (screenshot + read_page): mensagem "E-mail ou senha inválidos." aparece em elemento
alert [ref_43] — read_page mostra literalmente `alert "E-mail ou senha inválidos." [ref_43]` dentro do
form. Campos E-mail e Senha continuam preenchidos (visíveis no screenshot). URL permanece
http://localhost:3002/login (não navegou).

CONSOLE: só ruído da extensão, nenhum erro.

REDE (filtrada por "login"): 2x POST http://localhost:3002/login → 200 OK (login válido anterior +
este login inválido). Sem navegação de servidor para outra rota.
```

- [x] **AUTH-05** Campo "Senha" com menos de 6 caracteres, tentar submeter. Esperado: bloqueio nativo do browser (`minLength=6`), sem round-trip de rede (checar aba de rede — nenhuma requisição de auth disparada).

```
NOTA METODOLÓGICA (achado do processo, não do app): a primeira tentativa usou form_input para setar
senha="abc" (3 caracteres) — o formulário SUBMETEU normalmente (POST /login → 200, "E-mail ou senha
inválidos."), o que pareceria reprovar o item. Investigação via javascript_tool mostrou que o campo TEM
sim `minlength=6` e `required` (confirmado lendo `el.hasAttribute('minlength')`, `el.minLength === 6`),
mas `el.validity.tooShort` ficava `false` — porque form_input seta `.value` via JS direto, sem passar
pela "dirty value flag" do browser, que é pré-requisito para a constraint `tooShort` disparar. Isso é
uma limitação da ferramenta de automação, não um bug do app: um usuário real digitando não passa por
esse caminho.

AÇÃO REAL (refeita com digitação de verdade): computer{triple_click no campo Senha} +
computer{type, text="abc"} (digitação simulada real, não form_input) + computer{left_click no botão
Entrar}.

TELA (screenshot real): balão nativo do Chrome apareceu sobre o campo Senha: "Aumente este texto para
6 caracteres ou mais. No momento, você está usando 3 caracteres." — validação HTML5 nativa bloqueando o
envio, exatamente o esperado.

REDE: read_network_requests (limpo antes do clique, urlPattern "login") não mostrou NENHUMA requisição
nova após o clique — confirma "sem round-trip de rede".
```

- [x] **AUTH-06** Campo obrigatório vazio (e-mail em branco), tentar submeter. Esperado: bloqueio nativo `required`, foco vai para o campo.

```
AÇÃO REAL: computer{triple_click no campo E-mail} + computer{key: Delete} (esvazia o campo) +
computer{triple_click no campo Senha} + computer{type, "SenhaTeste123!"} + computer{left_click no
botão Entrar}.

TELA (screenshot real): campo E-mail aparece com borda de foco (azul), vazio, com cursor piscando —
compatível com o navegador tendo movido o foco para ele e bloqueado o envio.

CONFIRMAÇÃO via javascript_tool (leitura do DOM real, não suposição):
document.activeElement === campo E-mail → true
campo E-mail .validity.valueMissing → true
campo E-mail .value → "" (vazio)
Confirma bloqueio nativo `required` com foco movido para o campo, exatamente o esperado.
```

- [x] **AUTH-07** Duplo clique rápido no botão "Entrar" com credenciais válidas. Esperado: segunda submissão não dispara (botão já `disabled` após o primeiro clique) — checar rede, deve haver só 1 requisição de login, não 2.

```
AÇÃO REAL: E-mail/Senha válidos preenchidos (qa-audit-geral2@teste.lastro.invalid /
SenhaTeste123!). read_network_requests limpo (filtro "login"). computer{double_click, ref=botão
"Entrar"} — duplo clique real via extensão, não dois cliques separados.

REDE (após o duplo clique, mesmo filtro "login"): exatamente 1 requisição —
POST http://localhost:3002/login → 200 OK. Nenhuma segunda requisição de login apareceu, confirmando
que o segundo clique do duplo-clique não disparou nova submissão (botão já em estado disabled/
"Entrando…" ao processar o primeiro clique).

TELA: navegação bem-sucedida para "/" (get_page_text mostra "LASTRO / Início / PRONTO PARA TREINAR..."),
confirmando que o login completou normalmente uma única vez.
```

- [x] **AUTH-08** Acessar `/treino` diretamente pela URL, deslogado. Esperado: redireciona para `/login?proximo=/treino` (guard do `src/proxy.ts`).

```
AÇÃO REAL: deslogado (botão "Sair" em /ajustes, confirmado). navigate para
http://localhost:3002/treino.

TELA (get_page_text): URL final = http://localhost:3002/login?proximo=%2Ftreino — corpo é o formulário
de login de sempre (heading "lastro", E-mail/Senha/Entrar/Entrar com Google/Criar uma conta).

REDE (filtrada por "treino"): GET http://localhost:3002/treino (200) seguido de
GET http://localhost:3002/login?proximo=%2Ftreino — confirma o redirect do guard (`src/proxy.ts`) com
querystring `proximo=/treino` exatamente como esperado.

CONSOLE: só ruído padrão (React DevTools / HMR connected), nenhum erro.
```

- [x] **AUTH-09** Fazer login a partir do redirecionamento do item AUTH-08. Esperado — **bug conhecido, documentado em `DECISIONS.md` 2026-08-15 (2)**: cai em `/`, não em `/treino` (o parâmetro é escrito como `proximo` mas `auth/callback` lê `next`). Confirmar se ainda reproduz; se sim, não é achado novo, é regressão de item já registrado — citar a decisão, não abrir como bug novo.

```
AÇÃO REAL: a partir de http://localhost:3002/login?proximo=%2Ftreino (estado deixado pelo AUTH-08),
preenchidos E-mail/Senha válidos via form_input e submetido com computer{left_click no botão Entrar}.

RESULTADO: navegou para http://localhost:3002/treino (não para "/") — get_page_text confirma conteúdo
de "Treinos" (histórico de treinos, botão "Iniciar treino de hoje"). O parâmetro `proximo=/treino` FOI
respeitado neste caminho.

LEITURA DO ACHADO — isto NÃO é reprodução do bug de DECISIONS.md 2026-08-15 (2). Aquela entrada é
específica sobre `src/app/auth/callback/route.ts:18`, que lê `?next=` (nunca escrito) enquanto
`src/proxy.ts:49` escreve `?proximo=` — essa rota só é usada no fluxo OAuth do Google
("Entrar com Google" → Google → volta para `/auth/callback?code=...`). O login testado aqui foi o
formulário de e-mail/senha, que aparentemente lê `proximo` no client e redireciona corretamente sem
passar por `/auth/callback`. Ou seja: o caminho e-mail/senha funciona certo; o bug documentado
permanece específico do caminho Google OAuth, que não foi possível testar nesta sessão.

[NÃO COBERTO — parcial] O fluxo Google OAuth em si (clicar "Entrar com Google" → autenticar numa conta
Google real → voltar em `/auth/callback?code=...&next=` ou `?proximo=`) não pôde ser reproduzido: exige
uma conta Google real e sai do controle do app sob teste (tela de consentimento do Google), o que este
ambiente de QA não tem e não deve simular. Fica como estava: pendência de verificação Google-específica,
citando `DECISIONS.md` 2026-08-15 (2) como a decisão que documenta a causa raiz — não é achado novo.
```

- [x] **AUTH-10** Acessar `/login?erro=troca`. Esperado: mensagem "Não foi possível concluir o login com o Google. Tente de novo."

```
TELA (get_page_text após navigate real): "lastro / Registro de treino e leitura semanal. / Não foi
possível concluir o login com o Google. Tente de novo. / E-mail / Senha / Entrar / Entrar com Google /
Criar uma conta" — mensagem bate exatamente com o esperado.

CONSOLE: só ruído da extensão, nenhum erro.

REDE: GET http://localhost:3002/login?erro=troca → 200 OK.
```

- [x] **AUTH-11** Acessar `/login?erro=sem-codigo`. Esperado: mensagem "O Google não retornou a autorização. Tente de novo."

```
TELA (get_page_text): "... / O Google não retornou a autorização. Tente de novo. / E-mail / Senha /
Entrar / Entrar com Google / Criar uma conta" — mensagem bate exatamente com o esperado.

CONSOLE: só ruído da extensão, nenhum erro.

REDE: GET http://localhost:3002/login?erro=sem-codigo → 200 OK.
```

- [x] **AUTH-12** Acessar `/login?erro=valor-qualquer-inventado`. Esperado: mensagem genérica "Falha na autenticação." (fallback do `switch`).

```
TELA (get_page_text): "... / Falha na autenticação. / E-mail / Senha / Entrar / Entrar com Google /
Criar uma conta" — fallback do switch confirmado para um valor de erro inventado que não corresponde a
nenhum case tratado.

CONSOLE: só ruído da extensão, nenhum erro.

REDE: GET http://localhost:3002/login?erro=valor-qualquer-inventado → 200 OK.
```

- [x] **AUTH-13** Acessar `/` deslogado. Esperado: redireciona para `/login` no servidor (sem piscar tela intermediária — checar se algum HTML de outra tela aparece antes do redirect, ainda que por 1 frame; ligado à suspeita de A4/`offline.html` registrada em `DECISIONS.md` 2026-08-15).

```
AÇÃO REAL: deslogado (confirmado). navigate para http://localhost:3002/.

TELA (get_page_text após navigate): URL final = http://localhost:3002/login, conteúdo = formulário de
login de sempre — nenhum conteúdo de outra tela (nem home antiga, nem offline.html) apareceu no DOM
final.

REDE (filtrada por "3002/"): GET http://localhost:3002/ → 200 (pending/redirect), imediatamente seguido
de GET http://localhost:3002/login → 200 (mais assets estáticos). Nenhuma requisição contendo "offline"
apareceu.

RESSALVA (parcial, mantida por honestidade): mesmo com screenshot funcional nesta rodada, um
screenshot é uma foto de UM instante — não captura frame a frame a transição inteira do carregamento.
A evidência de rede (só duas rotas HTTP: `/` e `/login`, sem terceira rota intermediária) cobre a causa
mais provável (uma rota extra sendo servida), mas não prova 100% ausência de um flash renderizado
client-side por um Service Worker interceptando a navegação antes do HTML do servidor chegar — isso só
seria visível com captura frame a frame de verdade (ex.: gravação de vídeo quadro a quadro), fora do
escopo das ferramentas disponíveis. Fechado como aprovado com essa ressalva explícita, porque a
evidência disponível é forte e direta contra a hipótese original de A4/`offline.html`.
```

- [x] **AUTH-14** Após login válido, recarregar (F5) qualquer rota privada. Esperado: sessão persiste (cookie), não volta para `/login`.

```
AÇÃO REAL: com sessão válida ativa (login de AUTH-09 já tinha deixado a sessão em /treino), navigate
para http://localhost:3002/treino novamente (equivalente a F5 na mesma URL, forçando novo carregamento
do documento).

TELA (get_page_text após o reload): URL permanece http://localhost:3002/treino, conteúdo idêntico ao
anterior ("LASTRO / Treinos / HISTÓRICO / Editar / 14 ago... / Iniciar treino de hoje" + barra
inferior) — não voltou para /login.

REDE (filtrada por "treino"): GET http://localhost:3002/treino → 200 OK direto, sem passar por
/login. Confirma que o cookie de sessão persistiu através do reload completo de documento.
```
