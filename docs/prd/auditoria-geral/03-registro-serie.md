# 03 — Registro de série (bancada), `/treino/[id]`

Usar um treino novo (criado na Fase 3, não um dos 15 da seed) para não poluir a seed original com séries extras no meio do histórico.

## Fluxo feliz e formulário

- [ ] **REG-01** Treino vazio (0 séries). Esperado: `<p className="vazio">` "Nenhuma série registrada ainda. Comece pela primeira aqui embaixo."; botão "Adicionar exercício" visível; botão "Repetir última série" **ausente**.
- [ ] **REG-02** Clicar "Adicionar exercício". Esperado: abre `SeletorGrupoMuscular` (chips), nenhum selecionado; botão "Continuar" `disabled`.
- [ ] **REG-03** Selecionar 1 chip de grupo muscular, clicar "Continuar". Esperado: `disabled` libera antes disso? checar — deve ficar `disabled` até ≥1 selecionado, liberar com 1. Formulário de série aparece com exercícios filtrados por esse grupo.
- [ ] **REG-04** Selecionar exercício no formulário que tem histórico (nenhum ainda, é treino novo — pular se não houver "Última vez" pra esse exercício ainda). Anotar se bloco "Última vez" aparece corretamente quando há histórico de outro treino da seed para o mesmo exercício (ex.: Supino reto com barra).
- [ ] **REG-05** Se "Última vez" aparecer (REG-04), clicar "Usar esses valores". Esperado: campos Tipo=valendo, Reps e Peso preenchidos com os valores do histórico.
- [ ] **REG-06** Submeter formulário sem escolher exercício. Esperado: erro "Exercício é obrigatório." — não navega, não limpa formulário.
- [ ] **REG-07** Escolher exercício, deixar "Tipo" vazio, submeter. Esperado: erro "Escolha o tipo: aquecimento ou valendo."
- [ ] **REG-08** Reps = 0. Esperado: erro "Reps precisa ser um número positivo."
- [ ] **REG-09** Reps = -5 (negativo). Esperado: mesmo erro de REG-08.
- [ ] **REG-10** Reps = texto ("abc") no campo number — testar se o browser bloqueia digitação ou se permite e a validação JS pega. Esperado: campo `type="number"` deve rejeitar letras nativamente; documentar comportamento real.
- [ ] **REG-11** Peso = -1 (negativo). Esperado: erro "Peso precisa ser um número válido."
- [ ] **REG-12** Peso = 0, Tipo = valendo. Esperado: **passa** (peso 0 é válido — barra sem carga, ou exercício de peso corporal), série registrada com peso 0.
- [ ] **REG-13** Tipo = valendo, RIR = "abc"/inválido (se conseguir digitar). Esperado: erro "RIR precisa ser um número válido."
- [ ] **REG-14** Tipo = valendo, RIR em branco, submeter. Esperado: passa, RIR gravado como ausente/null (checar na tela ou no histórico se não aparece "0" onde deveria ser "sem RIR").
- [ ] **REG-15** Tipo = aquecimento — checar se campo RIR desaparece do formulário (regra: RIR só visível se tipo=valendo).
- [ ] **REG-16** Selecionar exercício unilateral (ex.: Rosca direta). Esperado: nota "Exercício unilateral — reps contam por lado" aparece.
- [ ] **REG-17** Registrar série valendo com peso maior que qualquer peso anterior do mesmo exercício nesse treino/histórico. Esperado: marcada como Recorde (`EtiquetaRecorde` visível).
- [ ] **REG-18** Registrar com sucesso. Esperado: formulário fecha (`formularioAberto=false`), campos resetados, nova série aparece na lista imediatamente (sem esperar rede — checar timing: a linha deve aparecer antes ou junto da resposta de rede, não depois).
- [ ] **REG-19** Depois de ≥1 série registrada, botão "Repetir última série" aparece com subtítulo "{reps} × {peso} kg · {tipo}" batendo com a última série real. Clicar. Esperado: nova série idêntica é criada sem abrir formulário, nunca marcada como recorde mesmo que o peso seja maior que qualquer anterior (regra explícita: `ehRecordePessoal: false` forçado).
- [ ] **REG-20** `[NÃO COBERTO — sem controle de offline na ferramenta]` Registrar série sem rede. Esperado (não testável aqui, registrar como não coberto): série aparece na tela na hora mesmo assim, indicador muda para "salvo no aparelho", sem mensagem de erro vermelha.
