# Auditoria independente — OF-02

**Data:** 2026-08-28 · **Auditor:** Claude (sessão isolada, "Inspetor QA") · **SHA sob auditoria:** d4c79c5

## O que testei

Reprodução ao vivo, navegador real (Playwright MCP), login via `/login` com
`qa.persona@lastro.test`, no treino real `9c060043-de06-421b-ad9e-3886706fd6df`
(sexta 28/ago, "Bancada", 2 séries já registradas — Supino reto com barra e
Tríceps testa com barra).

1. Abri o formulário de registrar série ("Outra série").
2. Selecionei exercício "Supino reto com barra", tipo "Valendo", Reps=10,
   Peso=70.
3. Digitei **RIR=99** no campo "RIR (Repetições na Reserva — Opcional)".
4. Cliquei "Registrar série".

## O que vi

- Bloqueio imediato no cliente: alerta vermelho com o texto exato
  **"RIR precisa estar entre 0 e 10."**, abaixo do campo RIR.
- A lista de séries do exercício "Supino reto com barra" continuou em
  "1 série valendo" — nenhuma série nova foi adicionada.
- `browser_network_requests` após a tentativa mostra só 1 requisição POST
  desde o carregamento da página, para a própria URL do treino (server
  action). Inspecionei o corpo dessa requisição
  (`browser_network_request index=25 part=request-body`) — é
  `["339a305e-4c52-4744-86c5-6b830b707032"]`, um ID de exercício, disparado
  ao **selecionar** "Supino reto com barra" no combobox (busca de "Última
  vez: 10 × 70 kg"), não pelo clique em "Registrar série". Ou seja: **zero
  chamada de rede associada à tentativa de RIR=99** — confirma bloqueio
  100% client-side.
- Console sem erros (`browser_console_messages`, 0 erros/warnings).
- Screenshot: `of-02-bloqueio-rir-99.png` (anexo nesta pasta).

## Testes automatizados

Rodei `npx vitest run src/lib/offline/outbox.test.ts src/lib/offline/erro-permanente.test.ts`
isoladamente (ver saída completa na seção de checagem de suíte do relatório
final) — todos verdes, incluindo os 3 testes novos descritos em
`correcao.md` (item permanente sai da fila e não trava os seguintes, fica
registrado em `db.falhas`, erro transitório continua parando a fila
normalmente).

## Veredito

**PASSOU.** A correção resolve o achado original: RIR fora de 0–10 é
bloqueado no cliente com a mensagem correta, sem qualquer requisição de
rede, e a defesa em profundidade da fila offline está coberta por teste
automatizado passando.
