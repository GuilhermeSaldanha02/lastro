# Consistência de linguagem e dicas contextuais — desenho

**Data:** 2026-09-14

**Estado:** aprovado em conversa pelo dono; aguardando revisão do documento

**Escopo:** experiência completa de aluno/treino e personal/trabalho, em pt-BR, espanhol e inglês

## 1. Problema

O lastro já possui três idiomas e o componente `DicaInfo`, mas a cobertura é desigual.

- A casca do Personal e seus componentes exibem textos fixos em pt-BR, sem respeitar o idioma salvo.
- Algumas telas misturam linguagem direta com termos formais ou técnicos, e pt-BR ainda contém palavras em inglês que não são marcas nem siglas necessárias.
- O ícone de informação foi adotado em poucos lugares. Há explicações de “o que é isto?” permanentemente abertas em Treino, Catálogo e outras áreas.
- O caminho normal não é suficiente como prova: erros, falta de rede, sessão expirada, limites, estados vazios e respostas inválidas também precisam respeitar idioma, tom e hierarquia de informação.
- Não existe hoje um portão automatizado que impeça a entrada de novo texto visível fora do mecanismo de tradução.

## 2. Resultado desejado

Qualquer pessoa deve perceber uma única voz no app, independentemente de estar no modo Treino ou Trabalho:

- pt-BR simples, direto e natural;
- espanhol natural, sem copiar a construção do português;
- inglês natural, usado somente quando esse idioma estiver selecionado;
- marcas e siglas reais preservadas: `LASTRO`, `WhatsApp`, `CREF`, `RIR` e `e1RM`;
- explicações opcionais acessíveis pelo ícone “i”;
- alertas, consentimentos, consequências e instruções necessárias antes de agir sempre visíveis;
- caminhos normal e triste completos nas três línguas.

## 3. Classificação dos achados

| Tipo | Achado |
|---|---|
| Bug | Personal não propaga `idioma` e não usa `t()` em páginas, componentes, estados e `DicaInfo`. |
| Pedido não atendido | A adoção do ícone “i” foi parcial; várias explicações continuam abertas. |
| Dívida técnica | Não há teste de cobertura que detecte texto visível fora do sistema de tradução. |
| Drift de documentação | A etapa histórica de “~200 strings fixas” foi encerrada, mas a casca posterior do Personal nasceu fora dela. |
| Inconsistência editorial | Termos visíveis como “vínculo”, “revogado”, “curadoria”, “sinergistas” e “mecânica articular” destoam da voz direta do app. |

Nenhuma sobra morta foi identificada nesta triagem.

## 4. Estratégia

Será usado um **strangler incremental por jornada**. O fallback atual de pt-BR continua funcionando enquanto cada jornada passa a receber o idioma explicitamente. Cada etapa fecha tradução, tom, `DicaInfo`, caminho normal e caminho triste antes de a próxima começar.

Foram descartadas duas alternativas:

1. **Correção por ocorrência:** rápida, mas deixa buracos e não cria portão contra regressão.
2. **Troca transversal em um único pacote:** reduz repetições de passagem, mas cria um diff grande demais para revisão linguística e visual confiável.

## 5. Regra do ícone de informação

O padrão é o ícone **“i”**, nunca “!”. No lastro, “!” significa alerta ou erro.

### Vai para `DicaInfo`

- definição de conceito;
- explicação de como uma seção calcula ou organiza algo;
- contexto opcional para entender um rótulo;
- detalhe técnico que não precisa ser lido antes de continuar;
- explicação repetível que hoje ocupa espaço permanente.

### Continua visível

- erro de validação;
- falta de conexão ou falha do servidor;
- sessão expirada ou falta de permissão;
- confirmação e consequência de ação destrutiva;
- consentimento e mudança no acesso aos dados;
- informação necessária para preencher um campo corretamente;
- dado que mudou ou resultado de uma ação;
- aviso de saúde do catálogo;
- indicação de que conteúdo de execução veio de IA.

O botão do “i” nunca fica dentro de um `label`. Deve receber o idioma atual, nome acessível traduzido, alvo de toque de 48 px, foco visível, abertura em `Folha` e retorno do foco ao fechar.

## 6. Voz e vocabulário

O texto visível prioriza palavras usadas numa conversa de academia. Precisão interna de código e banco não obriga a mesma palavra na interface.

| Evitar na interface | Direção preferida em pt-BR |
|---|---|
| vínculo | acesso do personal / conexão com o personal |
| revogar vínculo | encerrar o acesso |
| acionado | mensagem aberta |
| curadoria | revisão |
| sinergistas | músculos que ajudam |
| mecânica articular | movimento das articulações |
| deload | semana mais leve |
| AI Coach / Coach IA | Assistente de IA |
| Stories | redes sociais, quando não for o nome exato de um destino |
| Stickers | adesivos |

As versões finais em espanhol e inglês devem expressar o mesmo significado, mas não precisam preservar a estrutura da frase em pt-BR. Nomes próprios de temas podem permanecer como nomes de edição; descrições e categorias ao redor obedecem ao idioma escolhido.

## 7. Backlog por etapas

Cada item usa `[AFK]` quando é determinístico e pode ser executado sem o dono e `[HITL]` quando exige julgamento editorial, visual ou toca a peça-assinatura.

### L0 — Contrato, inventário e proteção contra regressão `[HITL]`

**Caminho normal**

- inventariar rotas, componentes, folhas, mensagens e conteúdo derivado nas duas cascas;
- montar a matriz rota × modo × idioma;
- registrar o glossário visível e as exceções de marca/sigla;
- criar teste de caracterização do fallback atual;
- criar portão para chaves de tradução ausentes e novos literais visíveis.

**Caminho triste**

- inventariar erros, carregamentos, estados vazios, confirmações e avisos;
- incluir textos devolvidos por server actions, route handlers, fila offline e regras determinísticas;
- provar que uma chave ausente cai em pt-BR sem derrubar a tela, mas reprova o portão de cobertura.

**Termina quando:** a matriz possui dono, status e check executável para toda rota pública e autenticada.

### L1 — Modo Trabalho / Personal `[HITL]`

**Superfícies:** `/personal`, `/personal/alunos`, `/personal/completar`, `/ajustes/personal`, fila, alunos, convites, cadastro complementar, vínculo do lado do aluno, cabeçalho e navegação do modo Trabalho.

**Caminho normal**

- propagar `idioma` desde o perfil até páginas e componentes;
- traduzir títulos, botões, estados, folhas e nomes acessíveis;
- localizar o conteúdo determinístico dos alertas e a mensagem preparada para WhatsApp;
- simplificar o vocabulário visível sem alterar contrato de acesso.

**Caminho triste**

- nenhum aluno, nenhum alerta, nenhum telefone e nenhum convite;
- CREF ou telefone incompleto;
- convite inválido, vencido, já usado, próprio ou incompatível;
- sessão expirada, permissão recusada e falha ao gerar, copiar, aceitar, apagar ou encerrar acesso;
- duplo clique e requisição repetida;
- nomes longos, conteúdo sem espaços e contagens singular/plural.

**Termina quando:** todo o modo Trabalho e o vínculo visto pelo aluno funcionam em pt-BR, espanhol e inglês, nos estados normal e triste.

### L2 — Jornada Treino / Aluno `[HITL]`

**Superfícies:** Início, `/treino`, `/treino/[id]`, registro e edição de séries, cronômetro, descanso, finalização, reabertura, sincronização e relatório pós-treino.

**Caminho normal**

- revisar títulos, ações, métricas, confirmações e relatório;
- mover explicações opcionais para `DicaInfo` sem esconder instruções necessárias;
- manter termos do domínio consistentes nas três línguas.

**Caminho triste**

- treino e histórico vazios;
- campo vazio, decimal indevido, valor negativo ou fora do limite;
- duplo toque em registrar, repetir, finalizar e iniciar;
- operação offline antes, durante e depois do registro;
- item recusado pelo banco sem bloquear itens válidos;
- troca de conta no mesmo navegador;
- sessão expirada, ID inválido, registro inexistente e falha de servidor;
- texto grande, nome longo e viewport de 375 px.

**Termina quando:** registrar, editar, finalizar, reabrir e sincronizar estão localizados e comprovados nos dois caminhos.

### L3 — Catálogo, execução, modelos e anilhas `[HITL]`

**Superfícies:** `/catalogo`, `/catalogo/[id]`, modelos de treino e calculadora de anilhas.

**Caminho normal**

- revisar busca, filtros, grupos, detalhes, dicas e planos;
- substituir jargão visível ou explicá-lo no “i”;
- manter o aviso de saúde e a origem IA visíveis;
- preservar a tradução dos nomes de exercício por idioma.

**Caminho triste**

- busca sem resultado, exercício sem mídia ou sem dica;
- ID inválido e item inexistente;
- modelo vazio, nome em branco e plano fora do limite;
- anilha ou barra inválida, arredondamento e configuração vazia;
- falha de salvamento, sessão expirada e duplo clique;
- conteúdo longo, tradução ausente e mídia indisponível.

**Termina quando:** catálogo e ferramentas associadas são compreensíveis sem vocabulário técnico prévio e não escondem avisos obrigatórios.

### L4 — Análise, Assistente de IA, relatórios, conta e casca global `[HITL]`

**Superfícies:** `/analise`, `/coach`, relatórios e PDFs, perfil, ajustes, temas, idioma, login, cadastro, boas-vindas, navegação, carregamentos, 404 e erros globais.

**Caminho normal**

- eliminar inglês indevido em pt-BR e localizar toda a casca;
- manter datas, números, pesos e pluralização adequados ao idioma;
- revisar a Análise Semanal apenas em linguagem e apresentação de ajuda, sem redesenhar sua composição.

**Caminho triste**

- dados insuficientes, geração em andamento, falha e fallback da IA;
- cota diária, concorrência e pergunta inválida;
- sessão expirada e acesso negado;
- parecer inexistente, ainda em geração ou PDF indisponível;
- login inválido, senha fraca, retorno inseguro e cadastro incompleto;
- URL desconhecida e erro global sem página padrão do Next em idioma incorreto;
- troca de idioma durante um fluxo incompleto.

**Termina quando:** nenhuma rota pública, global ou da peça-assinatura possui texto fora do idioma selecionado, inclusive em erro.

### L5 — Matriz final e auditoria independente `[HITL]`

**Matriz mínima:**

| Experiência | pt-BR | Espanhol | Inglês |
|---|---:|---:|---:|
| Aluno / Treino | obrigatório | obrigatório | obrigatório |
| Personal / Trabalho | obrigatório | obrigatório | obrigatório |

Para cada célula:

- percorrer caminho normal e caminho triste;
- testar viewport mobile de 375 px e uma largura ampla;
- conferir teclado, foco, leitor de tela e folhas do “i”;
- coletar `print.png`, `console.txt` e `rede.txt` nos itens manuais;
- executar tipos, testes, lint e build;
- usar o CI para E2E contra as contas descartáveis, nunca a conta do dono;
- registrar primeiro como `ALEGADO` e promover a `PASSOU` somente após auditoria de outro agente.

**Termina quando:** a matriz inteira tem evidência válida e não restam itens sem classificação.

## 8. Arquitetura e fluxo de dados

- `obterPerfil()` continua sendo a fonte do idioma salvo.
- Páginas servidoras leem `perfil.idioma` e passam `idioma` explicitamente aos componentes.
- Componentes clientes não consultam perfil novamente; recebem `Idioma` por propriedade.
- `t(chavePtBr, idioma)` continua como mecanismo único para strings fixas.
- Conteúdo determinístico montado em `src/lib/texto/` recebe idioma ou devolve dados sem texto para a camada de apresentação localizar.
- Nome de exercício continua vindo da tradução de catálogo já existente.
- Texto gerado pela Gemini continua obedecendo ao idioma do perfil pelo contrato atual; esta frente não altera cálculo, prompt ou validação além do necessário para impedir idioma divergente.

## 9. Testes e evidência

O plano de implementação deve usar TDD para cada fatia:

1. teste falha mostrando o literal, tradução ou estado ausente;
2. implementação mínima;
3. teste passa nas três línguas;
4. teste do caminho triste correspondente;
5. verificação de tipos, lint e build;
6. commit lógico sem misturar refatoração com mudança de comportamento.

O E2E local continua proibido como rotina porque usa produção. Novos cenários Playwright rodam no CI com usuários descartáveis e limpeza confirmada.

## 10. Escopo negativo

Esta frente não inclui:

- quarto idioma;
- tradução automática em tempo de execução;
- biblioteca nova de internacionalização;
- mudança de schema ou migration;
- alteração de regra de treino, métrica, fila, vínculo, permissão ou cota;
- redesenho visual, troca de tokens ou nova identidade;
- reescrita da composição da Análise Semanal;
- mudança do comportamento da Gemini que não seja impedir divergência de idioma;
- esconder alerta, consentimento, origem IA ou aviso de saúde atrás do “i”.

## 11. Peça-assinatura

A Análise Semanal existe e funciona; não está ausente nem pela metade. Nesta frente ela entra apenas na etapa L4 para conferência linguística e dos estados tristes. Qualquer mudança de estrutura, hierarquia ou conteúdo analítico é mudança de escopo e exige novo portão visual.

## 12. Definição global de pronto

A frente termina somente quando:

- toda superfície inventariada está classificada;
- pt-BR não exibe inglês indevido;
- espanhol e inglês não caem silenciosamente em pt-BR;
- caminhos normal e triste foram exercitados para aluno e personal;
- todo texto opcional ou obrigatório segue a regra do “i”;
- verificações automatizadas passam;
- evidências manuais estão no `QA.md` e em `qa/evidencias/`;
- auditoria independente promove os itens aplicáveis de `ALEGADO` para `PASSOU`.
