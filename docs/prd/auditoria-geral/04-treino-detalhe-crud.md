# 04 — Treino detalhe: CRUD de série e treino, `/treino/[id]`

Usar um dos 15 treinos da seed (tem dado real pra editar/excluir sem precisar registrar antes).

## Edição inline de série

- [ ] **TDET-01** Clicar numa linha de série (fora do modo de edição). Esperado: abre edição inline no lugar da linha (sem navegar, sem folha) — campos Tipo/Reps/Peso/RIR/checkbox pré-preenchidos com os valores atuais.
- [ ] **TDET-02** Clicar numa linha via teclado (Tab até focar, Enter). Esperado: mesmo comportamento do clique — linha tem `role="button" tabIndex=0`.
- [ ] **TDET-03** Na edição, mesma linha, tecla Espaço em vez de Enter. Esperado: também abre a edição (ambos os padrões de ativação de `role="button"` devem funcionar).
- [ ] **TDET-04** Editar Reps para 0, salvar. Esperado: erro "Reps precisa ser um número positivo.", não salva, edição continua aberta.
- [ ] **TDET-05** Editar Peso para valor negativo, salvar. Esperado: erro "Peso precisa ser um número válido."
- [ ] **TDET-06** Trocar Tipo de "valendo" para "aquecimento" numa série que tinha RIR preenchido, salvar. Esperado: campo RIR some do formulário de edição antes de salvar; após salvar, série vira aquecimento (não conta mais em métrica).
- [ ] **TDET-07** Clicar "Cancelar" na edição sem salvar. Esperado: fecha sem alterar a série, valores originais preservados na lista.
- [ ] **TDET-08** Salvar edição válida. Esperado: lista atualiza no local (otimista), sem esperar round-trip visível; texto "Salvando…" aparece brevemente no botão.
- [ ] **TDET-09** Confirmar que o formulário de edição **não** tem campo pra trocar o exercício da série (por design). Documentar que está ausente, não é bug.

## Exclusão de série (inline, sem folha)

- [ ] **TDET-10** Fora do modo de edição, lixeira de série não deve estar clicável/visível/tabulável (`aria-hidden`, `tabIndex=-1`). Tentar Tab até ela — foco não deve parar nela.
- [ ] **TDET-11** Ativar "Editar" (modo de edição da tela). Lixeiras aparecem. Clicar lixeira de uma série. Esperado: confirmação inline com texto exato "Excluir a série {N} de {exercício} — {reps} × {peso} kg? Não dá para desfazer." — clicar a lixeira **não** deve também abrir a edição da linha (checar `stopPropagation`).
- [ ] **TDET-12** Confirmar exclusão. Esperado: série some da lista imediatamente, sem estado "Excluindo…" (é síncrona local, diferente de excluir treino/conta/modelo — documentado como intencional).
- [ ] **TDET-13** Abrir confirmação de exclusão de série, clicar "Cancelar". Esperado: série permanece, confirmação fecha.

## Modo de edição — abrangência

- [ ] **TDET-14** Cabeçalho "Séries" + botão "Editar" só aparece se `series.length > 0`. Confirmar ausência em treino vazio.
- [ ] **TDET-15** Ativar modo de edição, sair da tela (voltar) e reentrar. Esperado: modo de edição reseta para desligado (é estado de tela, não persiste).

## Excluir treino (online-only, fora da fila offline)

- [ ] **TDET-16** Dentro de `/treino/[id]`, verificar se existe ação de excluir o treino a partir do detalhe (ou só a partir da lista `/treino`, componente `ExcluirTreino`). Documentar onde a ação realmente vive.
- [ ] **TDET-17** Excluir um treino da seed pela lista (`/treino`, modo de edição). Confirmar. Esperado: treino some da lista, série(s) dele deixam de aparecer em `/catalogo/[id]` do(s) exercício(s) envolvido(s) (checar 1 exercício depois).
- [ ] **TDET-18** Tentar acessar diretamente pela URL o `id` do treino recém-excluído (`/treino/{id-excluido}`). Esperado: `notFound()` → página 404.
