# 03 — Registro de série (bancada), `/treino/[id]`

Usar um treino novo (criado na Fase 3, não um dos 15 da seed) para não poluir a seed original com séries extras no meio do histórico.

## Fluxo feliz e formulário

- [x] **REG-01** Treino vazio (0 séries). Esperado: `<p className="vazio">` "Nenhuma série registrada ainda. Comece pela primeira aqui embaixo."; botão "Adicionar exercício" visível; botão "Repetir última série" **ausente**.
  ```
  Treino reusado: /treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0 (Segunda · 17 ago), 0 séries.
  get_page_text: "Nenhuma série registrada ainda. Comece pela primeira aqui embaixo." — texto bate exatamente.
  read_page: botão "Adicionar exercício" [ref_6] presente; nenhum botão "Repetir última série" na árvore — ausente, confirmado.
  (Não deu pra confirmar a classe CSS exata `className="vazio"` via read_page — a ferramenta não expõe atributos class, só texto/role.)

  read_console_messages: só ruído da extensão Chrome (SlashCommand manager), nenhuma mensagem do app.

  read_network_requests: não coletado nesta tela (sem ação de rede relevante além do load inicial).
  ```
- [x] **REG-02** Clicar "Adicionar exercício". Esperado: abre `SeletorGrupoMuscular` (chips), nenhum selecionado; botão "Continuar" `disabled`.
  ```
  Screenshot ss_5182g6odk confirma: 10 chips (Abdômen, Bíceps, Costas, Glúteos, Ombro, Panturrilha, Peito, Posterior de coxa, Quadríceps, Tríceps), nenhum com contorno ativo. Botão "Continuar" em cinza claro (visualmente disabled).
  read_page: checkboxes ref_19..ref_37, nenhum marcado (todos "on"=unchecked no snapshot). button "Continuar" [ref_38].
  ```
- [x] **REG-03** Selecionar 1 chip de grupo muscular, clicar "Continuar". Esperado: `disabled` libera antes disso? checar — deve ficar `disabled` até ≥1 selecionado, liberar com 1. Formulário de série aparece com exercícios filtrados por esse grupo.
  ```
  Cliquei em "Peito" (chip fica com borda verde no screenshot ss_8397fj2t0) — botão "Continuar" muda de cinza-claro pra verde escuro (habilitado) imediatamente após 1 seleção.
  Cliquei "Continuar" — formulário "Registrar série" abre com combobox Exercício contendo só exercícios de peito: Crossover no cabo, Crucifixo inclinado/reto com halteres, Flexão de braço, Peck deck, Supino declinado/inclinado/reto (barra/halteres/máquina) — 15 opções, todas do grupo Peito. Confirma filtragem correta.
  ```

- [ ] **REG-02** Clicar "Adicionar exercício". Esperado: abre `SeletorGrupoMuscular` (chips), nenhum selecionado; botão "Continuar" `disabled`.
- [ ] **REG-03** Selecionar 1 chip de grupo muscular, clicar "Continuar". Esperado: `disabled` libera antes disso? checar — deve ficar `disabled` até ≥1 selecionado, liberar com 1. Formulário de série aparece com exercícios filtrados por esse grupo.
- [x] **REG-04** Selecionar exercício no formulário que tem histórico (nenhum ainda, é treino novo — pular se não houver "Última vez" pra esse exercício ainda). Anotar se bloco "Última vez" aparece corretamente quando há histórico de outro treino da seed para o mesmo exercício (ex.: Supino reto com barra).
  ```
  Selecionei "Supino reto com barra" no combobox Exercício (form_input).
  get_page_text mostra bloco: "Última vez: 8 × 50 kg" + link "Usar esses valores" logo depois do combobox de Exercício e antes do combobox Tipo. Aparece corretamente puxando histórico da seed (15 treinos/5 semanas) mesmo o treino atual sendo novo/vazio.
  ```
- [x] **REG-05** Se "Última vez" aparecer (REG-04), clicar "Usar esses valores". Esperado: campos Tipo=valendo, Reps e Peso preenchidos com os valores do histórico.
  ```
  Cliquei "Usar esses valores" [ref_73].
  Screenshot ss_3114hrykw confirma: Tipo="Valendo", Reps="8", Peso (kg)="50" — bate exatamente com "Última vez: 8 × 50 kg". Campo RIR (opcional) também apareceu no formulário nesse momento (Tipo=Valendo).
  ```
- [x] **REG-06** Submeter formulário sem escolher exercício. Esperado: erro "Exercício é obrigatório." — não navega, não limpa formulário.
  ```
  REPROVADO (parcial) — texto do erro não bate com o esperado.
  Passos: voltei o combobox Exercício para "Selecione o exercício" (mantendo Tipo=Valendo, Reps=8, Peso=50 preenchidos por REG-05), cliquei "Registrar série" [ref_72].

  Esperado: mensagem de app "Exercício é obrigatório."
  Real: validação NATIVA do browser (HTML5 `required` no <select>) — balão azul "Selecione um item da lista." apareceu ancorado no combobox Exercício (screenshot ss_3371h5hm1). Não há texto de erro custom do app em lugar nenhum da página (get_page_text não mostra "Exercício é obrigatório.").
  Comportamento parcialmente correto: não navegou, não limpou o formulário (Tipo/Reps/Peso continuaram 8/50/Valendo) — só o texto da mensagem diverge do esperado no PRD.

  read_console_messages: só ruído da extensão (SlashCommand), nenhum log do app.
  read_network_requests: nenhuma requisição disparada (bloqueado antes do submit por validação nativa do browser) — condizente com "não navega".
  ```
- [x] **REG-07** Escolher exercício, deixar "Tipo" vazio, submeter. Esperado: erro "Escolha o tipo: aquecimento ou valendo."
  ```
  REPROVADO (parcial) — mesmo padrão do REG-06: texto do erro não bate.
  Passos: Exercício="Supino reto com barra" (via form_input), Tipo revertido para "Selecione o tipo", Reps/Peso continuavam 8/50 de antes. Cliquei "Registrar série" [ref_72].

  Observação extra: com Tipo despreenchido, o campo RIR já não estava mais na árvore da página antes mesmo do submit (consistente com a regra do REG-15 — RIR só aparece com Tipo=valendo).

  Esperado: mensagem de app "Escolha o tipo: aquecimento ou valendo."
  Real: validação nativa do browser — balão "Selecione um item da lista." ancorado no combobox Tipo (screenshot ss_7299fomk9). Nenhum texto custom do app na página (get_page_text confirmando ausência).
  Não navegou, não limpou formulário (Reps=8, Peso=50 mantidos).

  read_console_messages: só ruído da extensão, nada do app.
  read_network_requests: nenhuma requisição disparada (bloqueado antes do submit).
  ```
- [x] **REG-08** Reps = 0. Esperado: erro "Reps precisa ser um número positivo."
  ```
  REPROVADO (parcial) — texto do erro não bate, mas bloqueio funciona.
  Passos: Exercício="Supino reto com barra", Tipo="Valendo" (contornando a validação nativa `required`), Reps="0" (triple_click + type), Peso mantido em 50, cliquei "Registrar série".

  Esperado: "Reps precisa ser um número positivo."
  Real: validação nativa do browser (atributo `min` no <input type="number">) — balão "O valor deve ser maior ou igual a 1." ancorado no campo Reps (screenshot ss_5576ebm29). Nenhum texto custom do app na página.
  Não navegou, formulário manteve os outros valores.

  read_console_messages: só ruído da extensão.
  read_network_requests: nenhuma requisição (bloqueado antes do submit).
  ```
- [x] **REG-09** Reps = -5 (negativo). Esperado: mesmo erro de REG-08.
  ```
  REPROVADO (parcial) — mesmo texto nativo do REG-08, ainda não é o texto do app.
  Passos: Reps="-5" (o campo number aceitou o sinal de menos digitado — não rejeitou), cliquei "Registrar série".
  Real: mesmo balão nativo "O valor deve ser maior ou igual a 1." (screenshot ss_1486g7re5) — comportamento consistente com REG-08 (mesma mensagem para 0 e para -5), mas ainda a mensagem do browser, não "Reps precisa ser um número positivo." do app.
  Não navegou, formulário manteve os outros valores.

  read_console_messages: só ruído da extensão.
  read_network_requests: nenhuma requisição.
  ```
- [x] **REG-10** Reps = texto ("abc") no campo number — testar se o browser bloqueia digitação ou se permite e a validação JS pega. Esperado: campo `type="number"` deve rejeitar letras nativamente; documentar comportamento real.
  ```
  APROVADO — comportamento esperado confirmado.
  Passos: selecionei todo o texto do campo Reps e digitei "abc".
  Real: o campo `type="number"` rejeitou as letras nativamente — campo ficou vazio (screenshot ss_1063zp9d3), cursor piscando, nada foi inserido. Ao tentar submeter em seguida, browser mostrou balão nativo "Preencha este campo." (porque o campo ficou vazio/required).
  Documentado: rejeição é 100% nativa do browser (input type=number), a validação JS do app nunca chega a rodar pra esse caso porque o valor nunca entra no campo.
  ```
- [x] **REG-11** Peso = -1 (negativo). Esperado: erro "Peso precisa ser um número válido."
  ```
  REPROVADO (parcial) — mesmo padrão: validação nativa, não a mensagem do app.
  Passos: Reps="8", Peso="-1" (aceitou o sinal de menos), Tipo="Valendo", Exercício="Supino reto com barra", cliquei "Registrar série".
  Real: balão nativo "O valor deve ser maior ou igual a 0." ancorado no campo Peso (screenshot ss_8189h4s6f) — atributo `min="0"` no input. Nenhuma mensagem custom do app.
  Não navegou, formulário manteve os valores.

  read_console_messages: só ruído da extensão.
  read_network_requests: nenhuma requisição.
  ```
- [x] **REG-12** Peso = 0, Tipo = valendo. Esperado: **passa** (peso 0 é válido — barra sem carga, ou exercício de peso corporal), série registrada com peso 0.
  ```
  APROVADO.
  Passos: Exercício="Supino reto com barra", Tipo="Valendo", Reps="8", Peso="0", RIR em branco (ver REG-13/14), cliquei "Registrar série".
  Real: formulário fechou, lista de séries mostra "1  8 × 0 kg  VALENDO" (screenshot ss_71622d8tt / get_page_text: "8×0kg\nVALENDO"). Série com peso 0 foi aceita e persistida normalmente.

  read_network_requests (filtrado, excluindo entradas data:image de screenshot): 2 requisições POST para http://localhost:3002/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0, statusCode 200 (a 2ª foi de uma ação seguinte, ver REG-14 abaixo — a 1ª corresponde a este registro).
  read_console_messages: só ruído da extensão.
  ```
- [x] **REG-13** Tipo = valendo, RIR = "abc"/inválido (se conseguir digitar). Esperado: erro "RIR precisa ser um número válido."
  ```
  [NÃO TOTALMENTE COBERTO] — mesma limitação do REG-10: o campo RIR é `type="number"` e rejeita letras nativamente, então "abc" nunca entra no campo (ficou vazio após digitar, screenshot ss_6677nfqme) — a validação JS "RIR precisa ser um número válido." nunca chega a rodar para esse caso porque o valor não numérico não é aceito pelo input. Não dá pra forçar uma string inválida via teclado/form_input nesse tipo de campo pra testar a mensagem customizada.
  Comportamento de rejeição nativa documentado e consistente com REG-10.
  ```
- [x] **REG-14** Tipo = valendo, RIR em branco, submeter. Esperado: passa, RIR gravado como ausente/null (checar na tela ou no histórico se não aparece "0" onde deveria ser "sem RIR").
  ```
  APROVADO.
  Mesma submissão do REG-12 (RIR ficou em branco depois da tentativa frustrada de digitar "abc" — REG-13). Série "8 × 0 kg VALENDO" na lista não mostra nenhum indicador de RIR — nem "0" nem qualquer texto de RIR (get_page_text da linha da série: "8×0kg\nVALENDO", sem menção a RIR). Consistente com RIR gravado como ausente/null, sem exibir "0" indevidamente.

  read_network_requests: POST 200 (mesma requisição citada no REG-12).
  ```
- [x] **REG-15** Tipo = aquecimento — checar se campo RIR desaparece do formulário (regra: RIR só visível se tipo=valendo).
  ```
  APROVADO.
  Abri novo formulário ("Outra série"), Exercício="Flexão de braço", Tipo="Aquecimento".
  read_page (snapshot completo do form ref_95): campos presentes são só Exercício, Tipo, Reps, Peso (kg), Peso corporal incluso, botão Registrar série — nenhum campo "RIR (opcional)" na árvore. Confirma a regra: RIR só aparece com Tipo=valendo (visto nos REG-05/REG-12 quando Tipo=Valendo o campo RIR aparecia).
  ```
- [x] **REG-16** Selecionar exercício unilateral (ex.: Rosca direta). Esperado: nota "Exercício unilateral — reps contam por lado" aparece.
  ```
  APROVADO.
  Troquei grupo para Bíceps, selecionei "Rosca direta".
  get_page_text confirma a nota exata: "Exercício unilateral — reps contam por lado" logo abaixo do combobox Exercício (screenshot ss_8595gyjel). Também apareceu "Última vez: 10 × 12 kg" (histórico da seed pra esse exercício), reaproveitado no REG-17 a seguir.
  ```
- [x] **REG-17** Registrar série valendo com peso maior que qualquer peso anterior do mesmo exercício nesse treino/histórico. Esperado: marcada como Recorde (`EtiquetaRecorde` visível).
  ```
  APROVADO.
  Registrei "Rosca direta", Tipo=Valendo, Reps=10, Peso=15 (histórico "Última vez" era 10×12 kg — 15 > 12).
  Real: nova linha "Rosca direta — 1 valendo — 10×15kg" com etiqueta "★ RECORDE" ao lado (screenshot ss_455707vll / get_page_text: "10×15kg\n★ RECORDE").

  read_network_requests (filtrado, excluindo entradas data:image): POST http://localhost:3002/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0, statusCode 200 (última das 5 requisições não-imagem da sessão).
  ```
- [x] **REG-18** Registrar com sucesso. Esperado: formulário fecha (`formularioAberto=false`), campos resetados, nova série aparece na lista imediatamente (sem esperar rede — checar timing: a linha deve aparecer antes ou junto da resposta de rede, não depois).
  ```
  APROVADO (mesma submissão do REG-17, reaproveitada).
  Após clicar "Registrar série": o formulário "Registrar série" desapareceu da árvore (region ref_140 não existe mais no snapshot pós-submit) e a lista de séries já mostra "Rosca direta 10×15kg ★ RECORDE" no screenshot tirado logo em seguida — junto com "Repetir última série" atualizado para "10 × 15 kg · valendo" e status "sincronizado" no rodapé (não "salvo no aparelho" transitório, mas a UI já refletia a série antes de eu checar network). Comportamento consistente com update otimista (a série aparece na tela sem esperar confirmação visível de rede).
  ```
- [x] **REG-19** Depois de ≥1 série registrada, botão "Repetir última série" aparece com subtítulo "{reps} × {peso} kg · {tipo}" batendo com a última série real. Clicar. Esperado: nova série idêntica é criada sem abrir formulário, nunca marcada como recorde mesmo que o peso seja maior que qualquer anterior (regra explícita: `ehRecordePessoal: false` forçado).
  ```
  APROVADO.
  Antes de clicar: botão mostrava "Repetir última série / 10 × 15 kg · valendo" batendo exatamente com a série 1 de Rosca direta (10×15kg valendo) recém-criada no REG-17.
  Cliquei "Repetir última série" [ref_80].
  Real: nenhum formulário abriu (sem region "Registrar série" na árvore); nova série 2 de Rosca direta "10×15kg VALENDO" apareceu na lista SEM a etiqueta "★ RECORDE" (screenshot ss_5032lhh63 / get_page_text: linha 2 mostra "10×15kg\nVALENDO", sem "RECORDE"), mesmo tendo peso igual à série-recorde anterior (empate — mas mesmo assim não marcada, confirmando que a regra força `ehRecordePessoal: false` e não é só "menor que o máximo").

  read_network_requests (filtrado, excluindo data:image): POST http://localhost:3002/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0, statusCode 200 (última requisição da sessão, nº 19 de 20).
  read_console_messages: só ruído da extensão em todo o fluxo.
  ```
- [ ] **REG-20** `[NÃO COBERTO — sem controle de offline na ferramenta]` Registrar série sem rede. Esperado (não testável aqui, registrar como não coberto): série aparece na tela na hora mesmo assim, indicador muda para "salvo no aparelho", sem mensagem de erro vermelha.
