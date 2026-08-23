---
name: qa-registro
description: Registro incremental de verificação do projeto, no QA.md. Use ao auditar, verificar, testar ou revalidar telas e fluxos; ao perguntar o que precisa ser retestado; ao anotar o resultado de um teste; ou quando o projeto ainda não tiver QA.md. Calcula quais itens ficaram obsoletos desde o commit em que foram verificados, para reauditar só o que mudou em vez de tudo.
---

# Registro de verificação — QA.md

O problema que este arquivo resolve: uma auditoria de dezenas de itens roda numa sessão, prova tudo, e some junto com a sessão. A auditoria seguinte recomeça do zero. O `QA.md` é o registro durável — e, mais importante, o mecanismo que responde **"o que ainda vale e o que precisa rodar de novo?"** por cálculo, não por memória.

## Antes de auditar qualquer coisa

```bash
node scripts/qa-obsoletos.mjs          # relatório legível
node scripts/qa-obsoletos.mjs --json   # para script ou hook
```

Ele lê o `QA.md`, roda `git diff --name-only <SHA>..HEAD` por item e devolve **só os IDs obsoletos**. Audite essa fila, não a lista inteira.

**Propor "rodar tudo de novo" sem passar por esse cálculo é desperdício** — normalmente a maior parte dos itens continua válida, e reauditar item válido não produz informação nenhuma.

O script também reporta defeitos de formato que corroem o registro em silêncio: item apontando para área que não existe no mapa (nunca expira, então fica confiável para sempre sem nunca ser retestado), área sem caminho, área sem item. Trate esses alertas como bug do registro.

## O formato é contrato, não estilo

O script parseia as tabelas por nome de coluna. Mantenha os cabeçalhos:

- **Mapa de áreas:** `| Área | Caminhos (glob, separados por espaço) |`
- **Itens:** `| ID | Área | O que prova | Resultado | SHA | Data | Evidência |`
- **Automatizados:** `| ID | Spec |`

Globs aceitam `**` (qualquer profundidade) e `*` (um nível). Caminho literal também vale.

## As regras que fazem o registro valer alguma coisa

**Prova crua ou não passou.** Todo item `PASSOU` carrega em `qa/evidencias/<ID>/`: `print.png`, `console.txt` (console cru, não resumido) e `rede.txt` (requisições cruas). Relatório de agente sem anexo não move item para PASSOU.

**`ALEGADO` antes de `PASSOU`.** Print, vídeo e walkthrough gerados por quem escreveu o código entram como `ALEGADO` — é a alegação do próprio autor. Vira `PASSOU` só depois da passada de outro agente, em contexto limpo. Quem implementa não fecha o próprio portão.

**`REPROVOU` volta para a fila automaticamente.** Não precisa de SHA nem de cálculo: item reprovado é sempre obsoleto até passar.

**Fixture isolada, limpa no fim.** Usuário e dados de teste próprios da auditoria, nunca dados do dono. Limpeza confirmada por contagem ao final — **inclusive quando a auditoria falha no meio**.

**Área visual é transversal.** Se a prova do item é aparência, registre-o na área dos tokens/estilos globais, não só na área da rota — senão uma troca de token não invalida nada e o registro passa a mentir.

## Graduação para automação

Item determinístico e repetitivo vira spec (Playwright ou equivalente) e migra para a seção 3. A partir daí quem o roda é o CI, e a auditoria manual encolhe a cada rodada — é assim que o custo cai ao longo do projeto.

Item **não-determinístico** (saída de LLM, conteúdo gerado) nunca automatiza: fica na seção 2 e é julgado contra o critério declarado no PRD. Uma saída que serviria para qualquer usuário reprova, mesmo bem escrita.

## Se o projeto ainda não tem QA.md

Crie com as três tabelas acima. O mapa de áreas se deriva da estrutura real de pastas do projeto — **não invente itens**: o registro se preenche na primeira auditoria de verdade. Crie também `qa/evidencias/`.

## Protocolo de auditoria (5 fases)

Plano de teste escrito **antes** da implementação → implementação → execução por agente isolado dirigindo navegador real, sem permissão de editar código → correção por quem implementa → PR.

Ferramenta de navegador para subagente, verificado por execução: o painel Browser interno **não** registra clique nem digitação para subagente. Funcionam o **Playwright MCP** (`mcp__playwright__*`) e a extensão **Claude in Chrome**. MCP instalado no meio da sessão não carrega nela — instale antes e confira com `claude mcp list`.
