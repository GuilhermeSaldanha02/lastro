# Grade de séries e descanso real — desenho

**Data:** 2026-09-15

**Estado:** aprovado em conversa pelo dono; aguardando revisão deste documento

**Tela de prova:** `/treino/[id]`, em viewport móvel

## 1. Problema

A tela de treino usa um cartão separado para cada série. Isso ocupa altura, fragmenta a leitura e dificulta comparar carga, repetições e descanso entre séries do mesmo exercício. A referência fornecida pelo dono resolve essa leitura com uma tabela compacta por exercício.

O cronômetro de descanso atual é apenas um contador regressivo local. Ele não informa ao restante da tela quando o descanso começou ou terminou e não persiste o tempo realmente descansado. Derivar o descanso pela diferença entre os horários das séries seria incorreto: incluiria troca de exercício, ajuste de carga, conversa e qualquer outro intervalo não cronometrado.

O redesenho também precisa preservar duas regras do produto:

- o app funciona sem sinal e registrar série nunca espera a rede;
- toda informação visível respeita pt-BR, espanhol ou inglês, sem usar inglês quando outro idioma estiver ativo.

## 2. Resultado desejado

Manter o cabeçalho, o tempo total do treino, o controle de descanso e a navegação inferior nos lugares atuais. Substituir somente o miolo por uma grade contínua por exercício, seguindo a direção visual C aprovada.

Cada bloco mostra:

- nome do exercício;
- resumo das séries valendo;
- colunas `Série`, `Carga`, `Repetições` e `Descanso real`;
- uma linha tocável por série;
- o tipo da série por texto curto, nunca somente por cor;
- a conquista de recorde pessoal como marcador adicional;
- o tempo de descanso realmente medido depois daquela série.

## 3. Direção visual aprovada

O dono comparou três direções renderizadas e escolheu a direção C, **Bloco contínuo**. Cada exercício recebe uma única moldura interativa contendo cabeçalho de colunas e linhas. Não haverá um cartão elevado por série.

Travas visuais:

- preservar a paleta e os tokens existentes do Lastro;
- preservar cabeçalho, cronômetros e navegação inferior;
- usar uma moldura por exercício, não uma moldura por informação;
- separar conteúdo por alinhamento, tipografia e divisórias;
- manter a linha inteira como alvo de toque para edição;
- nenhum valor novo de cor, espaço, raio ou tipografia será cravado no componente;
- provar primeiro esta tela antes de propagar qualquer padrão para outras telas.

O mockup aprovado está nos artefatos locais do portão visual, fora do versionamento, na sessão `.superpowers/brainstorm/codex-20260915-090230/`.

## 4. Hierarquia e conteúdo

### 4.1 Cabeçalho do exercício

O nome do exercício aparece em primeiro nível. Abaixo dele, o resumo considera somente séries `valendo`, preservando a invariante de que aquecimento não entra em métricas.

Formatos:

- sem série valendo: `0 séries valendo`, sem faixa de repetições;
- uma série valendo: `1 série valendo · 10 repetições`;
- várias com a mesma quantidade: `4 séries valendo · 10 repetições`;
- várias com quantidades diferentes: `4 séries valendo · 8–10 repetições`.

Singular, plural, rótulos e ordem textual são localizados no idioma ativo.

### 4.2 Tipo e recorde

O tipo nunca depende somente de cor e nunca é substituído pelo recorde. Toda linha mostra exatamente um tipo e pode mostrar uma conquista adicional:

| Idioma | Aquecimento | Valendo | Recorde pessoal |
|---|---|---|---|
| pt-BR | `AQ` | `VAL` | `RP` |
| Espanhol | `CAL` | `VÁL` | `RP` |
| Inglês | `WU` | `WORK` | `PR` |

Uma série recorde em pt-BR mostra `VAL · RP`. O texto expandido localizado fica disponível ao tocar ou focar e no nome acessível para leitor de tela. Cor é reforço visual, não portadora exclusiva de significado.

### 4.3 Descanso real

O valor pertence à série depois da qual o descanso ocorreu. O formato visual é `mm:ss`, sem perder horas internamente. Um descanso maior que 59:59 usa `h:mm:ss` para não truncar informação real.

Estados:

- duração concluída: valor formatado;
- descanso ativo da última série: `Em andamento`;
- descanso não iniciado ou dado antigo inexistente: `—`;
- sincronização pendente: o valor continua visível e o estado offline existente informa que há dados aguardando envio.

## 5. Semântica do cronômetro

O controle do topo é o único lugar que inicia, pausa, retoma, acrescenta tempo e encerra o descanso.

1. Antes da primeira série, o controle permanece visível, mas desabilitado. A orientação localizada é `Registre uma série para iniciar o descanso`.
2. Iniciar vincula o descanso à última série registrada e cria um marco local com horário absoluto.
3. A contagem regressiva mostra quanto falta para a meta configurada.
4. Pausar acumula o tempo já descansado e exclui o intervalo pausado da duração real.
5. Retomar continua a mesma medição; não cria outro descanso.
6. Acrescentar tempo muda a meta da contagem regressiva, sem reiniciar nem alterar o tempo real já acumulado.
7. Ao chegar a zero, som e vibração acontecem uma vez. A duração real continua sendo medida por trás do mostrador até o descanso ser encerrado.
8. Registrar a próxima série, mesmo de outro exercício, encerra o descanso e associa o total à série anterior.
9. A ação manual, com nome acessível `Encerrar descanso`, encerra e salva imediatamente. A confirmação localizada informa o total registrado.
10. Finalizar o treino encerra e salva qualquer descanso ativo antes de concluir a sessão.
11. Depois de um encerramento manual, o controle não inicia outro descanso para a mesma série; uma nova série libera uma nova medição. Isso evita sobrescrever ou somar períodos ambíguos.
12. Existe no máximo um descanso ativo por treino e aparelho.

## 6. Persistência e fluxo offline

### 6.1 Banco

A alternativa aprovada adiciona à tabela `serie` uma coluna anulável:

```text
descanso_real_segundos integer null check (descanso_real_segundos >= 0)
```

`null` significa ausência de medição. Zero é um descanso medido de zero segundos, não substituto para ausência. Treinos antigos permanecem válidos.

O banco é único e afeta produção independentemente da branch. Portanto, criar e aplicar a migration são etapas distintas. A migration pode ser escrita e revisada na branch, mas **não pode ser aplicada no banco sem confirmação explícita do dono** e sem provar que a `main` viva continua compatível com a coluna anulável.

### 6.2 Estado local ativo

Enquanto está ativo, o descanso vive em armazenamento local, identificado por treino e série. O registro contém somente o necessário para reconstruir a medição:

- `treinoId`;
- `serieId`;
- meta atual em segundos;
- instante absoluto do início ou da retomada;
- tempo ativo já acumulado;
- estado ativo ou pausado;
- marca de que o aviso de conclusão já foi emitido.

Isso permite sobreviver a atualização da página, bloqueio de tela e fechamento acidental do navegador. O dado ativo não é sincronizado a cada segundo; somente a duração concluída entra na fila.

### 6.3 Conclusão e fila

Ao concluir um descanso:

1. calcular a duração usando timestamps absolutos e tempo ativo acumulado;
2. atualizar otimisticamente a série na tela;
3. remover o descanso ativo do armazenamento local;
4. enfileirar uma mutação específica `atualizar_descanso_serie`, contendo apenas `id` e `descansoRealSegundos`;
5. iniciar a sincronização em segundo plano sem aguardar a rede.

Ao registrar uma nova série enquanto há descanso ativo, a ordem FIFO deve ser:

```text
criar série anterior → atualizar descanso da série anterior → criar série seguinte
```

Uma função remota específica atualiza somente `descanso_real_segundos`. Ela não reutiliza a edição geral de série, pois carregar tipo, peso, repetições e RIR apenas para alterar descanso aumentaria o risco de sobrescrever uma correção concorrente.

Editar peso, repetições, tipo, RIR ou peso por lado preserva o descanso existente.

## 7. Limites entre componentes

### Controlador de descanso

Unidade dedicada à máquina de estados e ao relógio. Calcula duração, pausa, retomada, expiração da meta e recuperação local sem renderizar a tabela ou acessar Supabase.

### `TimerTopo`

Renderiza o tempo total e os controles do descanso. Recebe o estado do controlador e emite intenções de iniciar, pausar, retomar, acrescentar e encerrar. Não decide qual linha da tabela atualizar.

### `TreinoDetalhe`

Conhece a última série, coordena registro, edição, exclusão e finalização, e associa o descanso concluído à série correta. Mantém a lista otimista usada pela grade.

### Persistência de treino

Lê e escreve a nova coluna, fornece a mutação remota específica e integra o novo tipo à fila existente. Não coloca rede no caminho crítico.

### Grade de séries

Renderiza os blocos, resumos e estados localizados. A linha preserva a interação atual de edição por toque e teclado. A grade não calcula tempo nem acessa armazenamento.

## 8. Caminhos tristes

- **Sem série:** controle de descanso visível e desabilitado; nenhuma medição sem destino.
- **Sem internet:** série e descanso aparecem imediatamente; mutações aguardam na fila da conta correta.
- **Troca de conta no mesmo navegador:** item da fila continua associado ao usuário que o criou e não é enviado pela sessão de outra pessoa.
- **Meta esgotada:** aviso ocorre uma vez; tempo real continua sem ficar negativo.
- **Página recarregada ou tela bloqueada:** o horário absoluto reconstrói o valor correto.
- **Armazenamento local apagado durante descanso não concluído:** a tela mostra `—`; não deriva nem inventa duração.
- **Série vinculada excluída:** o descanso ativo é cancelado antes da exclusão; não se envia atualização órfã.
- **Treino finalizado:** descanso ativo é concluído e enfileirado antes da marca de fim.
- **Treino reaberto:** descansos concluídos permanecem no histórico; não se reabre automaticamente um descanso encerrado.
- **Duplo toque:** não cria duas medições, dois avisos nem duas mutações de conclusão.
- **Falha permanente do banco:** a mutação sai da fila ativa para o registro de falhas, sem bloquear itens válidos posteriores.
- **Idioma alterado:** dados numéricos permanecem; rótulos, estados, confirmações e nomes acessíveis passam a usar o idioma escolhido.
- **Nome de exercício longo e viewport estreito:** o nome quebra linha; a grade não corta carga, repetições ou duração.

## 9. Acessibilidade

- Linha interativa com alvo mínimo equivalente ao padrão atual e ativação por toque, `Enter` e `Espaço`.
- Foco visível medido em tema e viewport relevantes.
- Cabeçalhos associados semanticamente aos valores da grade.
- Marcadores com nome completo localizado; a cor não é a única pista.
- `Em andamento`, ausência, sincronização e confirmação não são comunicados apenas por cor.
- O botão visual de encerrar possui nome acessível inequívoco.
- Mudança para descanso concluído é anunciada sem repetir a cada render.

## 10. Alternativas descartadas

### Derivar pelos horários das séries

Evita migration, mas mede o intervalo total entre registros e não o uso real do cronômetro. Foi descartada por produzir um dado com nome enganoso.

### Guardar somente no aparelho

Preserva o relógio real, porém perde histórico após limpar dados locais e diverge entre aparelhos. Foi descartada porque o valor passa a fazer parte da série.

### Criar tabela separada de sessões de descanso

Permitiria vários intervalos e auditoria detalhada. Foi descartada por adicionar entidade, políticas, sincronização e interface sem necessidade aprovada. Uma duração concluída por série resolve o caso atual.

## 11. Backlog por etapas

Cada etapa termina com uma evidência clara. Nenhuma etapa autoriza aplicar migration em produção.

### T0 — Contrato e testes da medição `[AFK]`

- caracterizar o comportamento atual do cronômetro;
- especificar a máquina de estados do descanso em testes puros;
- cobrir início, pausa, retomada, acréscimo, meta esgotada e encerramento;
- cobrir recuperação por timestamp absoluto e aviso único;
- definir serialização local por treino e série.

**Termina quando:** testes falham pelos comportamentos novos e não dependem de DOM nem rede.

### T1 — Estado local e integração com o topo `[AFK]`

- extrair o controlador de descanso;
- tornar o estado recuperável após recarga e bloqueio de tela;
- ligar os controles atuais ao controlador;
- desabilitar início antes da primeira série;
- manter o cabeçalho e a contagem regressiva visualmente estáveis.

**Termina quando:** o cronômetro mede corretamente todos os estados localmente, ainda sem persistência remota.

### T2 — Contrato de dados e fila offline `[HITL na aplicação]`

- escrever a migration anulável com restrição não negativa;
- ampliar leitura e tipos de série;
- criar a atualização remota exclusiva do descanso;
- adicionar `atualizar_descanso_serie` à fila por conta;
- provar FIFO, retry, falha permanente e preservação dos demais campos;
- preparar a checagem de compatibilidade da `main`.

**Termina quando:** código e migration estão revisados e testados na branch. Aplicar a migration continua bloqueado até autorização específica do dono.

### T3 — Coordenação com a série `[AFK]`

- concluir descanso ao registrar a próxima série;
- concluir ao encerrar manualmente e ao finalizar treino;
- cancelar ao excluir a série vinculada;
- atualizar a lista de forma otimista;
- impedir duplicação por toque repetido;
- preservar a invariante de não aguardar rede.

**Termina quando:** cada evento atualiza exatamente a série anterior e produz no máximo uma mutação.

### T4 — Grade contínua e idiomas `[HITL]`

- substituir cartões por um bloco contínuo por exercício;
- implementar colunas, resumo somente de séries valendo e duração formatada;
- adicionar marcadores localizados de tipo e recorde;
- preservar edição, exclusão, teclado e foco;
- acrescentar todas as chaves em pt-BR, espanhol e inglês;
- usar somente tokens existentes ou adicionar novos valores na fonte única de tokens.

**Termina quando:** a tela corresponde à direção C e nenhum idioma exibe sigla ou texto de outro idioma.

### T5 — Caminhos tristes e regressão `[AFK]`

- testar sem série, sem descanso, offline, recarga, storage apagado, exclusão, finalização e troca de conta;
- testar nomes longos, durações acima de uma hora e viewport estreito;
- rodar tipos, testes, lint e build;
- restaurar `next-env.d.ts` caso o build o altere;
- não executar E2E local contra produção.

**Termina quando:** verificações locais passam e o diff não contém segredo, literal visual indevido ou valor de design cravado.

### T6 — Portão visual e integração `[HITL]`

- abrir `/treino/[id]` em viewport móvel com séries AQ, VAL e recorde;
- verificar descanso concluído, ativo, ausente e pendente de sincronização;
- repetir em pt-BR, espanhol e inglês;
- medir contraste, foco e áreas de toque;
- registrar evidência como `ALEGADO`;
- abrir PR separado e usar o CI para E2E;
- obter validação final do dono no aparelho e auditoria independente para promover a `PASSOU`.

**Termina quando:** dono aprova a tela real, CI passa e o QA registra honestamente o nível da evidência.

## 12. Roteiro do gate visual

### Telas e estados

- `/treino/[id]`, largura de 320 px e 375 px, com cabeçalho fixo e navegação inferior;
- exercício com nome curto e longo;
- tabela com aquecimento, valendo, recorde, descanso concluído, ativo e ausente;
- linha em edição e confirmação de exclusão;
- estado offline com sincronização pendente;
- pt-BR, espanhol e inglês.

### Medições

- texto principal e secundário contra seus fundos: mínimo WCAG AA correspondente ao tamanho;
- texto dos marcadores contra o fundo do marcador: mínimo 4,5:1 quando texto normal;
- contorno de foco contra superfícies adjacentes: mínimo 3:1;
- alvos de toque: mínimo adotado pelo projeto, sem sobreposição.

### Percurso de teclado

1. alcançar o controle de descanso;
2. iniciar, pausar, retomar e encerrar;
3. navegar pelas linhas na ordem visual;
4. abrir uma edição com `Enter` e `Espaço`;
5. salvar ou cancelar e devolver o foco à linha correspondente;
6. abrir e cancelar exclusão sem perder o foco.

### Reprovação objetiva

- cabeçalho ou navegação cobrem conteúdo;
- tabela exige rolagem horizontal em 320 px para ler uma linha comum;
- tipo ou estado só pode ser entendido pela cor;
- sigla não corresponde ao idioma ativo;
- foco não é visível ou salta para o topo após editar;
- duração muda depois de recarregar sem que o relógio justifique;
- ação offline aguarda rede ou perde o valor da tela;
- aquecimento entra no resumo de séries valendo;
- linha deixa de ser editável por teclado;
- valor antigo nulo aparece como `00:00`.

## 13. Escopo negativo

Esta frente não inclui:

- redesenhar cabeçalho, cronômetro total ou navegação inferior;
- aplicar o padrão de tabela a outras telas;
- criar estatísticas, metas ou recomendações baseadas em descanso;
- guardar vários intervalos de descanso para uma única série;
- sincronizar o descanso ativo a cada segundo;
- alterar cálculo de volume, e1RM, RIR ou recorde;
- executar ou aplicar migration sem autorização específica;
- executar E2E local contra o banco de produção;
- misturar a implementação ao PR de consistência linguística.

## 14. Definição de pronto

A frente termina somente quando:

- a direção C está implementada na tela de prova com tokens do projeto;
- toda série mostra `AQ` ou `VAL`, e recorde aparece adicionalmente;
- o descanso real é medido, recuperado, concluído e persistido sem bloquear registro offline;
- treinos antigos exibem `—` para descanso ausente;
- caminhos normal e triste passam nos testes definidos;
- pt-BR, espanhol e inglês têm rótulos e siglas próprios;
- tipos, testes, lint e build passam;
- o CI do PR separado passa;
- a evidência visual do implementador está registrada como `ALEGADO`;
- o dono valida a tela no aparelho e a auditoria independente registra o resultado aplicável.
