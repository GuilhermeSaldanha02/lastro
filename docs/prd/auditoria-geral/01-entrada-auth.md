# 01 — Entrada / autenticação

`/login`, `/` sem sessão, `/auth/callback`, guard (`src/proxy.ts`), `sanitizarRotaDeRetorno`.

- [ ] **AUTH-01** Acessar `/login` deslogado. Esperado: formulário carrega, modo "entrar" por padrão, campos E-mail/Senha visíveis, sem "Nome".
- [ ] **AUTH-02** Clicar "Criar uma conta". Esperado: campo "Nome" aparece, botão de submit vira "Criar conta".
- [ ] **AUTH-03** Submeter formulário de login com e-mail/senha do usuário de teste válidos. Esperado: botão vira "Entrando…", `disabled`; redireciona para `/` (rota de retorno default).
- [ ] **AUTH-04** Submeter login com senha errada. Esperado: mensagem de erro em `role="alert"`, não navega, campos continuam preenchidos.
- [ ] **AUTH-05** Campo "Senha" com menos de 6 caracteres, tentar submeter. Esperado: bloqueio nativo do browser (`minLength=6`), sem round-trip de rede (checar aba de rede — nenhuma requisição de auth disparada).
- [ ] **AUTH-06** Campo obrigatório vazio (e-mail em branco), tentar submeter. Esperado: bloqueio nativo `required`, foco vai para o campo.
- [ ] **AUTH-07** Duplo clique rápido no botão "Entrar" com credenciais válidas. Esperado: segunda submissão não dispara (botão já `disabled` após o primeiro clique) — checar rede, deve haver só 1 requisição de login, não 2.
- [ ] **AUTH-08** Acessar `/treino` diretamente pela URL, deslogado. Esperado: redireciona para `/login?proximo=/treino` (guard do `src/proxy.ts`).
- [ ] **AUTH-09** Fazer login a partir do redirecionamento do item AUTH-08. Esperado — **bug conhecido, documentado em `DECISIONS.md` 2026-08-15**: cai em `/`, não em `/treino` (o parâmetro é escrito como `proximo` mas `auth/callback` lê `next`). Confirmar se ainda reproduz; se sim, não é achado novo, é regressão de item já registrado — citar a decisão, não abrir como bug novo.
- [ ] **AUTH-10** Acessar `/login?erro=troca`. Esperado: mensagem "Não foi possível concluir o login com o Google. Tente de novo."
- [ ] **AUTH-11** Acessar `/login?erro=sem-codigo`. Esperado: mensagem "O Google não retornou a autorização. Tente de novo."
- [ ] **AUTH-12** Acessar `/login?erro=valor-qualquer-inventado`. Esperado: mensagem genérica "Falha na autenticação." (fallback do `switch`).
- [ ] **AUTH-13** Acessar `/` deslogado. Esperado: redireciona para `/login` no servidor (sem piscar tela intermediária — checar se algum HTML de outra tela aparece antes do redirect, ainda que por 1 frame; ligado à suspeita de A4/`offline.html` registrada em `DECISIONS.md` 2026-08-15).
- [ ] **AUTH-14** Após login válido, recarregar (F5) qualquer rota privada. Esperado: sessão persiste (cookie), não volta para `/login`.
