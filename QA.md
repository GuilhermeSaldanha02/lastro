# QA.md — Registro Incremental de Verificação

Registro durável de verificação. **Um item verificado num commit (`SHA`) continua válido enquanto nenhum arquivo da área dele mudar.** Antes de auditar, calcule o que ficou obsoleto e rode só isso:

```bash
node scripts/qa-obsoletos.mjs
```

Regras completas: skill `qa-registro`. Prova crua obrigatória em `qa/evidencias/<ID>/` — `print.png`, `console.txt`, `rede.txt`.

---

## 1. Mapa de Áreas

| Área | Caminhos (glob, separados por espaço) |
|---|---|
| auth | src/app/login/** src/app/auth/** src/lib/supabase/** |
| treino | src/app/treino/** src/lib/dados/** src/lib/rota-de-retorno.ts |
| analise | src/app/analise/** src/lib/analise/** src/lib/texto/** src/app/api/** |
| catalogo | src/app/catalogo/** |
| coach | src/app/coach/** |
| perfil | src/app/perfil/** |
| ajustes | src/app/ajustes/** src/lib/anilhas.ts |
| offline | src/lib/offline/** public/sw.js |
| visual | src/app/tokens.css src/app/sistema.css src/app/globals.css src/app/layout.tsx |

> **`visual` é transversal de propósito.** Mudança de token invalida todo item cuja prova é visual, em qualquer tela — se um item depende de aparência, registre-o na área `visual`, não só na área da rota.

---

## 2. Estado por Item

| ID | Área | O que prova | Resultado | SHA | Data | Evidência |
|---|---|---|---|---|---|---|

> **Vazio de propósito.** A auditoria mais recente deste projeto foi executada e perdida junto com a sessão — é exatamente o desperdício que este arquivo existe para impedir. Não inventei itens aqui: o registro se preenche na próxima auditoria de verdade, um item por linha, com o SHA em que passou e a evidência anexada.
>
> Ordem sugerida para a primeira rodada: `analise` (a peça-assinatura), depois `treino` (a tela mais usada), depois o resto.

---

## 3. Automatizados

Itens determinísticos graduam para spec e passam a rodar no CI — a auditoria manual encolhe a cada rodada. Item não-determinístico (o parecer da Gemini) **nunca** automatiza: fica na seção 2 e é julgado contra o critério A6 do PRD.

| ID | Spec |
|---|---|
