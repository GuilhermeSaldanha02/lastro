# OF-06 — QA-01 2026-09-24

**Prova pedida:** depois de logar de novo, a fila drena sozinha.

## NÃO EXECUTADO (bloqueado)

Reproduzir este cenário exige provocar expiração/perda de sessão e logar de novo (login) para observar
se a fila drena na navegação seguinte. As regras desta auditoria proíbem explicitamente login/logout na
sessão. Não há como testar isso sem violar essa restrição.

## O que se sabe do código (não testado ao vivo)
`src/components/sincronizador-global.tsx` drena a fila a cada troca de rota (`useEffect` em `[rota]`), o
que cobre justamente o caso do achado B7 (login via `router.push`, sem remontar o layout raiz) — comentário
no próprio componente cita a correção. Não verificado ao vivo nesta sessão.

Registrado como NÃO EXECUTADO (bloqueado), não como PASSOU nem REPROVOU.
