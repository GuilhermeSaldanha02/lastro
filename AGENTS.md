# AGENTS.md — protocolo de trabalho

Lido automaticamente por **Antigravity, Claude Code e Cursor**. É a camada compartilhada entre agentes: **ninguém precisa ler a diretriz completa para trabalhar aqui.** Regra específica de uma ferramenta vive no arquivo dela (`GEMINI.md`, `CLAUDE.md`) — nunca neste.

Responda sempre em **pt-BR**.

---

## 1. Abertura de sessão — antes de qualquer edição

Outro agente pode ter mexido aqui desde a sua última vez. Três passos, segundos:

```bash
git log --oneline -15     # o que mudou, e quem fez (trailer `Agente:`)
git status --short        # sobrou trabalho não commitado de alguém?
```

E leia o bloco **ESTADO ATUAL**, no topo do `PROGRESS.md` — é o único lugar que diz o que está em andamento e o que o próximo precisa saber.

**Working tree sujo = PARE e pergunte ao dono.** Pode ser trabalho em andamento do outro agente; commitar ou descartar por cima destrói contexto que não é seu.

Stack, comandos e contexto do produto: `CLAUDE.md`. **As invariantes que não se violam e os comandos de verificação estão inlinados aqui nas §8 e §9** — um agente que só leia este arquivo não fica cego.

---

## 2. Fechamento de sessão — é a ação final, não opcional

1. **Reescrever o bloco ESTADO ATUAL** do `PROGRESS.md`.
2. **Commitar** com o trailer de autoria (§4).
3. Dizer ao dono **o que ele deve VER ou FAZER** para confirmar.

Sem os dois primeiros, o próximo agente começa cego e refaz trabalho já feito — o desperdício mais caro que existe aqui.

---

## 3. O bloco ESTADO ATUAL

Fica no topo do `PROGRESS.md` e é **sobrescrito** a cada sessão. Não acumula: o histórico é o resto do arquivo e o `git log`.

```markdown
## ESTADO ATUAL
- **Última sessão:** 2026-08-23 · agente: antigravity · branch: feat/meta-semanal
- **Em andamento:** T5 meta semanal — falta o estado vazio do card
- **Não commitado:** scripts/render-temas.mjs — script de apoio, decidir se entra
- **Bloqueado / a decidir:** nada
- **Próximo passo:** verificar T5 no celular antes de abrir o PR
- **Para o outro agente saber:** mexi no token --lastro-superficie-2; toda
  tela que usa card precisa de reverificação visual
```

A última linha é a que faz a orquestração funcionar. Escreva-a pensando em quem chega depois **sem o seu contexto** — e não em você mesmo daqui a cinco minutos.

---

## 4. Git

- **Nunca commitar direto na `main`.** Sair dela: `feat/`, `fix/`, `chore/`, `refactor/`. Integração por PR.
- **MÓDULO GRANDE TEM BRANCH DE INTEGRAÇÃO PRÓPRIA** (decisão do dono, registrada em 2026-09-11 depois de a regra ter se perdido entre sessões). Funcionalidade que chega em várias fatias não vai para a `main` uma fatia por vez:
  1. Cria-se **uma** branch do módulo a partir da `main` — hoje, `feat/modulo-personal`.
  2. Cada fatia sai **dela**, não da `main`, e volta para **ela** por PR.
  3. A `main` só recebe o módulo quando ele estiver **inteiro e funcionando**, num PR só.

  **Como saber se é o seu caso:** o trabalho tem mais de uma fatia planejada e as fatias intermediárias não fazem sentido sozinhas para o dono. Fatia isolada que já entrega valor continua indo direto para a `main`, como sempre.

  **O que isto NÃO protege, e precisa ser dito:** o banco é **um só**. Migration aplicada em produção está aplicada, independente de qual branch a contém — a garantia de "só entra na `main` quando estiver pronto" não alcança o schema. Antes de aplicar migration de módulo em andamento, confirmar com o dono e verificar que o código vivo na `main` continua correto sem ela.
- **Conventional Commits em pt-BR:** `<tipo>: <Descrição imperativa com inicial maiúscula>`, sem ponto final, ≤ 72 caracteres.
- **Trailer de autoria em todo commit** — é o que faz o `git log` responder "quem fez o quê" a custo zero:

  ```
  Agente: antigravity
  ```

  (ou `Agente: claude`). Para filtrar depois: `git log --grep="Agente: "`.
- **Uma mudança lógica por commit.** Refatoração e feature nunca no mesmo commit — o diff passa a mentir e o `git bisect` deixa de servir.
- **Pré-commit bloqueante:** formatação, lint e type-check. Teste, se existir.
- **Antes do PR:** `git status --short`, `git diff --stat`, `git diff --check`.
- **Push:** só da sua própria branch. Nunca force-push em branch compartilhada.
- **Windows, restaurar binário:** `git checkout <SHA> -- caminho` — nunca `git show > arquivo` (o CRLF corrompe).

---

## 5. Os portões que não se pulam

- **Alegação não é prova.** "Consertei", "build limpo" e "deve funcionar" não fecham tarefa. Rodar o comando e ler a saída; se a mudança é visual, abrir no navegador e olhar, em viewport mobile.
- **Quem implementa não se audita.** Print, vídeo e walkthrough gerados por quem escreveu o código entram no registro de QA como **`ALEGADO`**. Viram **`PASSOU`** só depois da passada do outro agente, em contexto limpo. Isso não é desconfiança: é o único jeito de a verificação valer alguma coisa.
- **Procurar antes de escrever.** Isto já existe neste projeto ou na lib já instalada? O erro mais frequente de agente não é escrever errado — é escrever de novo. Tarefa que só soma linhas e não remove nenhuma merece essa pergunta antes do commit.
- **Menos código é melhor código.** Volume é o preditor mais forte de decadência arquitetural, em qualquer linguagem. Isso não é licença para código espremido: é para não criar o que já existe.
- **Nunca inventar dado de negócio.** Faltou informação real: TODO visível e pergunta ao dono. Nunca preencher com ficção plausível.
- **Valor de design tem fonte única.** Cor, espaçamento e tipografia vivem no arquivo de token. Nenhum valor cravado dentro de componente.
- **Mudança de escopo não acontece em silêncio.** Pedido fora do combinado: dizer que está fora, avaliar o impacto e só então implementar.
- **Pedido estrutural não vira retoque.** Se o pedido é redesenhar, desenhe a composição inteira antes de fatiar. Entregar retoques que nunca somam estrutura é falha, não prudência.

---

## 6. Onde está cada coisa

| Preciso de | Leia |
|---|---|
| O que está em andamento agora | `PROGRESS.md` → bloco **ESTADO ATUAL** (só o topo) |
| Stack, comandos, contexto do produto | `CLAUDE.md` |
| Escopo, critérios de aceitação | `PRD.md` |
| Decisões de arquitetura e fitness functions | `ADR.md` · estado atual em `ARCHITECTURE.md` |
| Por que uma decisão foi tomada | `DECISIONS.md` (busque a data/seção — nunca o arquivo inteiro) |
| Regras visuais, tokens, gate visual | `DESIGN.md` · a entrada da decisão em `BRIEFING-VISUAL.md` |
| Glossário do domínio, pesquisa, lições | `KNOWLEDGE.md` (por seção) |
| O que já foi verificado e em que commit | `QA.md` (as regras do registro estão na §7 e na skill `qa-registro`) |

`PROGRESS.md`, `DECISIONS.md`, `DESIGN.md` e `SDD.md` são arquivos grandes de propósito — **busque a seção, nunca leia inteiro.** Carregar um desses por completo estoura contexto e piora o seu próprio trabalho.

---

## 7. Antes de auditar qualquer coisa

```bash
node scripts/qa-obsoletos.mjs
```

Devolve **só os itens do `QA.md` que ficaram obsoletos** desde o commit em que foram verificados. Audite essa fila, não a lista inteira: item cuja área não mudou continua válido, e reauditá-lo não produz informação nenhuma.



O mapa de áreas está na §1 do próprio `QA.md`. As três regras que sustentam o registro:



1. **Um item verificado num commit continua válido enquanto nenhum arquivo da área dele mudar.**

2. **Prova crua obrigatória** em `qa/evidencias/<ID>/` — `print.png`, `console.txt`, `rede.txt`. Sem os três, o resultado é `ALEGADO`.

3. **`visual` e `i18n` são transversais de propósito**: mexer em token ou no dicionário invalida a prova de qualquer tela, não só a da área da rota.



> As skills citadas aqui (`qa-registro`, `portao-visual`, `projeto-retomada`) vivem em `.claude/skills/` e só carregam no Claude Code. **Agente sem elas segue as regras inlinadas acima** — não são opcionais por estarem numa skill.



---



## 8. As invariantes que este projeto não perdoa



Copiadas do `CLAUDE.md` para que valham mesmo para quem não o lê. Escreveu código que viola uma destas? Pare — a spec está errada, mesmo que compile.



1. **A chave da Gemini nunca toca o cliente.** Toda chamada passa por route handler. `@google/genai` só existe sob `src/app/api/`.

2. **O agregador calcula; o LLM interpreta.** O modelo nunca recebe linhas cruas de série, só um resumo já calculado. Se ele fizer conta, ele erra a conta.

3. **Aquecimento nunca entra em métrica.** Toda função de métrica filtra `tipo = valendo` antes de somar. **RIR ausente é ausência de informação, não RIR alto.**

4. **Dica de execução tem a origem registrada e declarada.** `dica_execucao_origem` guarda quem escreveu, e a tela avisa quando é IA. Escrever por LLM é permitido; esconder que foi LLM, não.

5. **Gravar série não tem `await` de rede no caminho crítico.** O app roda no subsolo da academia — sem sinal é o caso de uso real, não a exceção.

6. **Proibido emoji e emoticon** em código de UI, badge, toast e parecer. Comunicação visual é ícone SVG, tipografia e token de cor.



Mais duas, derivadas: `src/lib/analise/` não importa rede, HTTP nem Supabase (é matemática pura), e **valor de design tem fonte única** — cor, espaçamento e tipografia só no arquivo de token.



**Segredo nunca entra no diff.** `.env`, chave da Gemini e credencial do Supabase ficam fora do repositório; confira o diff antes de todo push.



---



## 9. Comandos, e o que cada um prova



```bash

npm test                 # vitest

npx tsc --noEmit         # tipos

npx eslint .             # lint (warnings antigos existem; erros, não)

npm run build            # build de produção

npm run dev              # dev server

```



Verificação antes de commit: `npx tsc --noEmit && npm test && npx eslint . && npm run build`.



**`npm run e2e` é o comando perigoso deste repositório.** O Playwright roda **contra o banco de produção** — não existe banco de dev —, criando e apagando contas descartáveis. A prova de E2E que vale é o CI do GitHub Actions, que já roda em todo PR:



```bash

gh pr view <n> --json statusCheckRollup

gh run view <id> --log-failed

```



Os prints das varreduras saem como artefato `varredura-telas` do run. Cuidado com duas coisas: `gh run watch --exit-status` **sai 0 quando a conexão cai**, e o CI cancela o run anterior a cada push (`concurrency: cancel-in-progress`) — run cancelado logo após um push não é falha.



**Nunca use a conta pessoal do dono como instrumento de medida**, e nunca apague conta de `auth.users` por conta própria. Conta de teste é criada e apagada pelo próprio spec.



### Três armadilhas que já custaram caro aqui



- **`npm run dev` reescreve `next-env.d.ts`** apontando os tipos para `.next/dev/`. Commitar isso quebra o build de produção. Depois do dev server: `git checkout -- next-env.d.ts`.

- **Em produção, erro lançado numa server action chega ao cliente sem a mensagem**, só com `digest`. Lógica de cliente que decide algo por `error.message` funciona no `next dev` e falha no build. Informação que o cliente precisa ler volta como **valor de retorno**, não como exceção.

- **Erro de tela se lê por `.aviso-erro`, nunca por `getByRole("alert")`** — o Next injeta `#__next-route-announcer__` com `role="alert"` em toda página.
