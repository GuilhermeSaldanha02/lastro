-- supabase/migrations/0021_dicas_execucao.sql

-- AS 102 DICAS DE EXECUCAO, E POR QUE ELAS EXISTEM AGORA.
--
-- Ate 2026-09-09 esta coluna estava NULL nas 102 linhas, por decisao
-- arquitetural: ADR-007 / FF7 diziam que dica de execucao e conteudo
-- curado por humano, nunca gerado por LLM, porque erro de instrucao de
-- forma machuca. DECISIONS 2026-08-07 fechou ate a saida de "pesquisar
-- fontes reais", que contava como gerado do mesmo jeito.
--
-- O dono reverteu essa decisao em 2026-09-09, de forma explicita e
-- depois de a restricao ter sido apresentada a ele. Ver DECISIONS
-- 2026-09-09 (2) e a FF7 reescrita em ADR.md. Esta migration e a
-- consequencia dessa reversao, nao um contorno dela.
--
-- PROCEDENCIA. Estas dicas foram escritas por Claude (Opus 5), nao por
-- profissional de educacao fisica. `dica_execucao_origem` registra isso
-- na propria linha, para nenhuma leitura futura do banco precisar
-- adivinhar de onde o texto veio. O aviso de saude da tela
-- (`catalogo/[id]/page.tsx`) continua obrigatorio e nao foi afrouxado.
--
-- CRITERIO DE ESCRITA. Uma dica por exercicio, apontando o erro de forma
-- mais comum daquele movimento especifico. Nenhuma frase se repete entre
-- exercicios -- checado por script antes de gerar este arquivo. Nenhuma
-- dica prescreve carga, series ou progressao: isso e treino, nao
-- execucao, e continua fora daqui.

alter table public.exercicio
  add column if not exists dica_execucao_origem text;

alter table public.exercicio
  drop constraint if exists exercicio_dica_origem_valida;
alter table public.exercicio
  add constraint exercicio_dica_origem_valida
  check (dica_execucao_origem is null or dica_execucao_origem in ('claude', 'humano'));

comment on column public.exercicio.dica_execucao_origem is
  'Quem escreveu a dica: claude (LLM, 2026-09-09) ou humano. NULL = sem dica.';


update public.exercicio
   set dica_execucao = 'Suba enrolando a pelve em direção às costelas, não puxando com as pernas. Se a lombar arquear e descolar do apoio, reduza a amplitude.',
       dica_execucao_origem = 'claude'
 where nome = 'Abdominal infra';

update public.exercicio
   set dica_execucao = 'Ajuste o encosto para o eixo da máquina ficar na altura do umbigo. O movimento é encurtar a distância entre esterno e quadril, não empurrar com os braços.',
       dica_execucao_origem = 'claude'
 where nome = 'Abdominal máquina';

update public.exercicio
   set dica_execucao = 'Ancore o quadril: ele fica parado e só o tronco enrola. Puxar com os braços transforma o exercício em remada.',
       dica_execucao_origem = 'claude'
 where nome = 'Abdominal na polia';

update public.exercicio
   set dica_execucao = 'Leve o ombro em direção ao joelho oposto, não o cotovelo. Puxar a nuca com as mãos força o pescoço sem envolver mais o oblíquo.',
       dica_execucao_origem = 'claude'
 where nome = 'Abdominal oblíquo na bicicleta';

update public.exercicio
   set dica_execucao = 'Descole só as escápulas do chão; não precisa sentar. Mantenha o queixo longe do peito, com o olhar no teto.',
       dica_execucao_origem = 'claude'
 where nome = 'Abdominal supra';

update public.exercicio
   set dica_execucao = 'Desça na vertical, com o joelho de trás quase tocando o chão. O joelho da frente aponta na direção do pé.',
       dica_execucao_origem = 'claude'
 where nome = 'Afundo com halteres';

update public.exercicio
   set dica_execucao = 'Pé de trás apoiado, peso na perna da frente. Distância curta demais joga o joelho à frente; ajuste até a descida ficar confortável.',
       dica_execucao_origem = 'claude'
 where nome = 'Agachamento búlgaro';

update public.exercicio
   set dica_execucao = 'A carga fica no quadril, poupando a coluna. Desça mantendo o tronco alto e o pé inteiro no chão.',
       dica_execucao_origem = 'claude'
 where nome = 'Agachamento com cinto (belt squat)';

update public.exercicio
   set dica_execucao = 'Cotovelo alto para a barra não rolar. O tronco fica mais vertical que no agachamento livre — se ele cair à frente, o peso vem junto.',
       dica_execucao_origem = 'claude'
 where nome = 'Agachamento frontal';

update public.exercicio
   set dica_execucao = 'O joelho aponta na direção do pé durante toda a descida. A coluna mantém a mesma forma do começo ao fim, e a profundidade vale enquanto isso for verdade.',
       dica_execucao_origem = 'claude'
 where nome = 'Agachamento livre';

update public.exercicio
   set dica_execucao = 'Posicione os pés um pouco à frente da barra. A máquina guia a trajetória, mas não corrige joelho caindo para dentro.',
       dica_execucao_origem = 'claude'
 where nome = 'Agachamento no smith';

update public.exercicio
   set dica_execucao = 'Pés bem abertos e pontas para fora, com o joelho apontando na mesma direção. Desça entre os calcanhares mantendo o tronco alto.',
       dica_execucao_origem = 'claude'
 where nome = 'Agachamento sumô com halter';

update public.exercicio
   set dica_execucao = 'Comece com as palmas voltadas para você e gire durante a subida. A rotação é o ponto do exercício — sem ela vira desenvolvimento comum.',
       dica_execucao_origem = 'claude'
 where nome = 'Arnold press';

update public.exercicio
   set dica_execucao = 'Comece puxando as escápulas para baixo, antes de dobrar o cotovelo. Suba levando o peito à barra, não o queixo.',
       dica_execucao_origem = 'claude'
 where nome = 'Barra fixa';

update public.exercicio
   set dica_execucao = 'Movimento de quadril, não de coluna: empurre o quadril para trás com as costas travadas. Carga leve — a mecânica é exigente.',
       dica_execucao_origem = 'claude'
 where nome = 'Bom dia (good morning) com barra';

update public.exercicio
   set dica_execucao = 'Abra até onde o quadril permite sem o tronco tombar para trás. Volte resistindo, sem deixar o peso bater.',
       dica_execucao_origem = 'claude'
 where nome = 'Cadeira abdutora';

update public.exercicio
   set dica_execucao = 'Use amplitude confortável na abertura; forçar alongamento aqui é a lesão mais comum do aparelho. Feche controlado.',
       dica_execucao_origem = 'claude'
 where nome = 'Cadeira adutora';

update public.exercicio
   set dica_execucao = 'Termine com quadril, joelho e ombro alinhados e o glúteo apertado. Passar disso arqueia a lombar em vez de trabalhar o glúteo.',
       dica_execucao_origem = 'claude'
 where nome = 'Cadeira de glúteo (hip thrust máquina)';

update public.exercicio
   set dica_execucao = 'Alinhe o joelho com o eixo da máquina. Suba controlado e não trave o joelho com força no topo.',
       dica_execucao_origem = 'claude'
 where nome = 'Cadeira extensora';

update public.exercicio
   set dica_execucao = 'Alinhe o joelho com o eixo da máquina. Quadril colado no assento; se ele subir para ajudar, reduza a carga.',
       dica_execucao_origem = 'claude'
 where nome = 'Cadeira flexora';

update public.exercicio
   set dica_execucao = 'Trabalhe um lado por vez sem deixar o quadril rodar. Compare os lados: assimetria grande vale registrar.',
       dica_execucao_origem = 'claude'
 where nome = 'Cadeira flexora unilateral';

update public.exercicio
   set dica_execucao = 'Quadril quadrado para frente durante todo o movimento. Subir mais rodando a pelve troca glúteo por lombar.',
       dica_execucao_origem = 'claude'
 where nome = 'Coice no cabo';

update public.exercicio
   set dica_execucao = 'Cotovelo levemente dobrado e constante. O movimento é juntar as mãos à frente do peito, não empurrar.',
       dica_execucao_origem = 'claude'
 where nome = 'Crossover no cabo';

update public.exercicio
   set dica_execucao = 'Desça até sentir o peito alongar, sem passar da linha do tronco. Cotovelo semi-dobrado do início ao fim.',
       dica_execucao_origem = 'claude'
 where nome = 'Crucifixo inclinado com halteres';

update public.exercicio
   set dica_execucao = 'Cotovelo levemente dobrado e fixo; abra com as escápulas. Subir demais recruta trapézio no lugar do deltoide posterior.',
       dica_execucao_origem = 'claude'
 where nome = 'Crucifixo inverso';

update public.exercicio
   set dica_execucao = 'É abertura, não supino: o cotovelo não dobra para empurrar. Peso alto aqui estressa a cápsula do ombro.',
       dica_execucao_origem = 'claude'
 where nome = 'Crucifixo reto com halteres';

update public.exercicio
   set dica_execucao = 'Não desça abaixo da linha da orelha se o ombro reclamar. Costelas para baixo, sem arquear a lombar para empurrar.',
       dica_execucao_origem = 'claude'
 where nome = 'Desenvolvimento com halteres';

update public.exercicio
   set dica_execucao = 'Abdome firme e glúteo contraído para a lombar não virar dobradiça. A barra passa rente ao rosto, não à frente do corpo.',
       dica_execucao_origem = 'claude'
 where nome = 'Desenvolvimento militar com barra';

update public.exercicio
   set dica_execucao = 'Ajuste o assento até as alças ficarem na altura dos ombros. Empurre sem travar o cotovelo no fim.',
       dica_execucao_origem = 'claude'
 where nome = 'Desenvolvimento máquina';

update public.exercicio
   set dica_execucao = 'Suba pelos cotovelos, não pelas mãos, até a linha dos ombros. Peso alto vira encolhimento de trapézio.',
       dica_execucao_origem = 'claude'
 where nome = 'Elevacao lateral com halteres';

update public.exercicio
   set dica_execucao = 'Antes de subir as pernas, gire a pelve para trás e cole a lombar. Sem isso o iliopsoas assume o trabalho e a lombar recebe a carga.',
       dica_execucao_origem = 'claude'
 where nome = 'Elevação de pernas';

update public.exercicio
   set dica_execucao = 'Suba até a altura dos ombros e pare. Balançar o tronco para lançar o peso é o erro mais comum aqui.',
       dica_execucao_origem = 'claude'
 where nome = 'Elevação frontal com halteres';

update public.exercicio
   set dica_execucao = 'Alinhe o eixo da máquina com a articulação do ombro. Movimento curto e limpo vale mais que amplitude com impulso.',
       dica_execucao_origem = 'claude'
 where nome = 'Elevação lateral máquina';

update public.exercicio
   set dica_execucao = 'Queixo no peito, olhar para frente. Suba até o tronco ficar paralelo ao chão e segure um instante no topo.',
       dica_execucao_origem = 'claude'
 where nome = 'Elevação pélvica com barra';

update public.exercicio
   set dica_execucao = 'A perna livre fica dobrada e parada. Se o quadril cair para o lado no meio da subida, o peso está alto.',
       dica_execucao_origem = 'claude'
 where nome = 'Elevação pélvica unilateral';

update public.exercicio
   set dica_execucao = 'Só sobe e desce — não rode o ombro. Segure um instante no topo em vez de aumentar a carga.',
       dica_execucao_origem = 'claude'
 where nome = 'Encolhimento com halteres';

update public.exercicio
   set dica_execucao = 'O ombro sobe em direção à orelha, com o pescoço relaxado. Empurrar o queixo para frente não faz parte do movimento.',
       dica_execucao_origem = 'claude'
 where nome = 'Encolhimento máquina';

update public.exercicio
   set dica_execucao = 'Suba até o tronco alinhar com as pernas e pare — hiperestender não recruta mais. Movimento lento nas duas fases.',
       dica_execucao_origem = 'claude'
 where nome = 'Extensora lombar máquina';

update public.exercicio
   set dica_execucao = 'O movimento vem do quadril, não da lombar. Segure em algo firme para o tronco não compensar.',
       dica_execucao_origem = 'claude'
 where nome = 'Extensão de quadril no cabo';

update public.exercicio
   set dica_execucao = 'Cotovelo colado ao corpo e imóvel. Só o antebraço desce e sobe.',
       dica_execucao_origem = 'claude'
 where nome = 'Extensão de tríceps na polia alta unilateral';

update public.exercicio
   set dica_execucao = 'Puxe a corda na altura do rosto, separando as mãos e girando o ombro para fora. Cotovelo acima da linha do punho.',
       dica_execucao_origem = 'claude'
 where nome = 'Face pull no cabo';

update public.exercicio
   set dica_execucao = 'Tronco estável e apoiado. Só o joelho dobra — o quadril fica parado.',
       dica_execucao_origem = 'claude'
 where nome = 'Flexora unilateral no cabo';

update public.exercicio
   set dica_execucao = 'Corpo em linha reta, do calcanhar à cabeça. Quadril caído joga carga na lombar; quadril alto tira o peito da conta.',
       dica_execucao_origem = 'claude'
 where nome = 'Flexão de braço';

update public.exercicio
   set dica_execucao = 'Costas e quadril colados no encosto. Se a lombar descolar no fundo, reduza a amplitude.',
       dica_execucao_origem = 'claude'
 where nome = 'Hack squat';

update public.exercicio
   set dica_execucao = 'A lombar não pode descolar do encosto no fundo — é aí que o disco recebe carga. Não trave o joelho no fim.',
       dica_execucao_origem = 'claude'
 where nome = 'Leg press 45 graus';

update public.exercicio
   set dica_execucao = 'Pé inteiro na plataforma, joelho seguindo a linha do pé. Empurre sem estender o joelho até o travamento.',
       dica_execucao_origem = 'claude'
 where nome = 'Leg press horizontal';

update public.exercicio
   set dica_execucao = 'Quadril quadrado no assento, sem rodar para o lado que empurra. Compare os lados a cada série.',
       dica_execucao_origem = 'claude'
 where nome = 'Leg press unilateral';

update public.exercicio
   set dica_execucao = 'A barra sobe rente à canela e a coluna não muda de forma. Se a lombar arredondar no início, reduza a carga e reveja a posição do quadril.',
       dica_execucao_origem = 'claude'
 where nome = 'Levantamento terra';

update public.exercicio
   set dica_execucao = 'Joelho levemente dobrado e fixo. Desça empurrando o quadril para trás até sentir o posterior alongar, sem arredondar a lombar.',
       dica_execucao_origem = 'claude'
 where nome = 'Levantamento terra romeno com halteres';

update public.exercicio
   set dica_execucao = 'Mantenha o corpo rente ao banco. Descer demais com o ombro rodado à frente é o que costuma machucar aqui.',
       dica_execucao_origem = 'claude'
 where nome = 'Mergulho no banco';

update public.exercicio
   set dica_execucao = 'Quadril apoiado no coxim, sem descolar. Suba até o limite confortável e desça resistindo.',
       dica_execucao_origem = 'claude'
 where nome = 'Mesa flexora';

update public.exercicio
   set dica_execucao = 'Quadril flexionado com a coluna neutra. Desça o calcanhar até alongar e suba até o topo, sem quicar.',
       dica_execucao_origem = 'claude'
 where nome = 'Panturrilha burrinho';

update public.exercicio
   set dica_execucao = 'Amplitude completa: desce até esticar, sobe até o máximo. Quicar no fundo usa o tendão, não o músculo.',
       dica_execucao_origem = 'claude'
 where nome = 'Panturrilha em pé';

update public.exercicio
   set dica_execucao = 'Só o antepé apoiado na plataforma, com o joelho quase estendido e fixo. Não deixe o joelho dobrar para ajudar.',
       dica_execucao_origem = 'claude'
 where nome = 'Panturrilha no leg press';

update public.exercicio
   set dica_execucao = 'Joelho dobrado muda o alvo para o sóleo — carga menor e mais repetições fazem sentido aqui.',
       dica_execucao_origem = 'claude'
 where nome = 'Panturrilha sentado';

update public.exercicio
   set dica_execucao = 'Apoie-se para equilíbrio, não para puxar. Compare os dois lados: diferença grande de repetições merece atenção.',
       dica_execucao_origem = 'claude'
 where nome = 'Panturrilha unilateral com halter';

update public.exercicio
   set dica_execucao = 'Tronco vertical mantém o foco no tríceps; inclinar à frente leva para o peito. Desça até o cotovelo em 90°.',
       dica_execucao_origem = 'claude'
 where nome = 'Paralelas';

update public.exercicio
   set dica_execucao = 'Suba empurrando pelo calcanhar da perna de cima, sem impulso da perna de baixo. Use um banco que deixe o joelho em ângulo confortável.',
       dica_execucao_origem = 'claude'
 where nome = 'Passada (step-up)';

update public.exercicio
   set dica_execucao = 'Ajuste o assento até as alças ficarem na linha do peito. Junte com o peito, mantendo o ombro apoiado no encosto.',
       dica_execucao_origem = 'claude'
 where nome = 'Peck deck';

update public.exercicio
   set dica_execucao = 'Empurre pelo calcanhar e feche o glúteo no topo. Se o posterior de coxa cãibrar, aproxime os pés do quadril.',
       dica_execucao_origem = 'claude'
 where nome = 'Ponte de glúteo';

update public.exercicio
   set dica_execucao = 'Alinhe orelha, ombro, quadril e tornozelo. Quadril alto vira descanso; quadril baixo joga a carga na lombar.',
       dica_execucao_origem = 'claude'
 where nome = 'Prancha';

update public.exercicio
   set dica_execucao = 'Empilhe o ombro sobre o cotovelo e suba o quadril até o corpo virar uma linha reta. Não deixe o tronco rodar para frente.',
       dica_execucao_origem = 'claude'
 where nome = 'Prancha lateral';

update public.exercicio
   set dica_execucao = 'Desça o peso com o cotovelo levemente dobrado e fixo. A lombar não pode arquear para ganhar amplitude.',
       dica_execucao_origem = 'claude'
 where nome = 'Pull-over com halter';

update public.exercicio
   set dica_execucao = 'Puxe a barra até a clavícula, com o peito aberto. Atrás da nuca não é necessário e estressa o ombro.',
       dica_execucao_origem = 'claude'
 where nome = 'Puxada frente no pulley';

update public.exercicio
   set dica_execucao = 'Pegada um pouco além da largura dos ombros; mais aberta que isso encurta a amplitude sem ganho. As escápulas descem primeiro.',
       dica_execucao_origem = 'claude'
 where nome = 'Puxada pegada aberta';

update public.exercicio
   set dica_execucao = 'Palmas viradas para você, cotovelos rentes ao tronco. O bíceps participa mais aqui — espere carga maior que na pegada aberta.',
       dica_execucao_origem = 'claude'
 where nome = 'Puxada pegada supinada';

update public.exercicio
   set dica_execucao = 'Deixe o equipamento guiar o arco, sem forçar trajetória própria. Ajuste o assento até os braços começarem esticados acima da cabeça.',
       dica_execucao_origem = 'claude'
 where nome = 'Puxador articulado máquina';

update public.exercicio
   set dica_execucao = 'Não passe o cotovelo acima da linha do ombro — é onde o ombro pinça. Pegada na largura dos ombros é mais segura que fechada.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada alta com barra';

update public.exercicio
   set dica_execucao = 'Tronco estável na vertical; balançar para trás vira impulso, não força. Puxe até o abdome, juntando as escápulas.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada baixa no cabo';

update public.exercicio
   set dica_execucao = 'Quadril para trás, coluna neutra, peito para fora. A barra encosta no abdome e desce controlada.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada cavalinho';

update public.exercicio
   set dica_execucao = 'Tronco em torno de 45°, coluna reta e travada. Se a lombar arredondar para puxar, o peso está alto.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada curvada com barra';

update public.exercicio
   set dica_execucao = 'Peito no apoio, ombro relaxado no início. Puxe com os cotovelos, não com as mãos.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada máquina';

update public.exercicio
   set dica_execucao = 'O peito não descola do coxim. O apoio existe justamente para tirar a lombar da conta — deixar o tronco subir anula o motivo do aparelho.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada máquina peito-apoiado';

update public.exercicio
   set dica_execucao = 'Coluna paralela ao chão e quadril fixo. Puxe o cotovelo rente ao corpo; se o tronco rodar para acompanhar, reduza a carga.',
       dica_execucao_origem = 'claude'
 where nome = 'Remada unilateral com halter';

update public.exercicio
   set dica_execucao = 'Cotovelo colado ao tronco durante a subida. Se o ombro vier à frente para ajudar, o peso está alto.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca alternada com halteres';

update public.exercicio
   set dica_execucao = 'Apoie o cotovelo na parte interna da coxa e mantenha ele imóvel. Desça até o braço esticar por completo.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca concentrada';

update public.exercicio
   set dica_execucao = 'Cotovelo parado ao lado do corpo; só o antebraço se move. Balançar o tronco para subir transfere o trabalho para a lombar.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca direta';

update public.exercicio
   set dica_execucao = 'Pegada pronada, punho firme e alinhado ao antebraço. Carga menor que na rosca direta é esperado — quem trabalha aqui é o braquiorradial.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca inversa com barra';

update public.exercicio
   set dica_execucao = 'Punho neutro, polegar para cima, do começo ao fim. Girar a mão no topo tira a tensão do braquial.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca martelo';

update public.exercicio
   set dica_execucao = 'Ajuste o assento até a axila apoiar no topo do coxim e o cotovelo alinhar com o eixo. Volte devagar até quase esticar.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca máquina';

update public.exercicio
   set dica_execucao = 'A tensão existe também na descida — resista ao cabo em vez de deixá-lo puxar. Cotovelo fixo ao lado do corpo.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca no cabo';

update public.exercicio
   set dica_execucao = 'Apoie o braço inteiro no banco, com a axila encostada. A descida é a parte que costuma machucar quando feita solta: controle até o fim.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca scott';

update public.exercicio
   set dica_execucao = 'Peito apoiado, braços pendurados na vertical. O corpo não se move — se o tronco subir junto, tire carga.',
       dica_execucao_origem = 'claude'
 where nome = 'Rosca spider';

update public.exercicio
   set dica_execucao = 'Gire a partir das costelas, com o quadril fixo no banco. Amplitude curta e controlada vale mais que giro máximo.',
       dica_execucao_origem = 'claude'
 where nome = 'Rotação de tronco máquina';

update public.exercicio
   set dica_execucao = 'Braços travados: quem gira é o tronco, não os ombros. Pés firmes e quadril estável durante todo o arco.',
       dica_execucao_origem = 'claude'
 where nome = 'Rotação de tronco no cabo';

update public.exercicio
   set dica_execucao = 'A barra desliza rente à perna. A amplitude vem do quadril indo para trás, não da coluna dobrando.',
       dica_execucao_origem = 'claude'
 where nome = 'Stiff com barra';

update public.exercicio
   set dica_execucao = 'Prenda bem os pés antes de começar. A barra desce na linha inferior do peito.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino declinado com barra';

update public.exercicio
   set dica_execucao = 'Peça ajuda para receber os halteres na posição declinada. Desça controlado, sem deixar o ombro rolar para frente.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino declinado com halteres';

update public.exercicio
   set dica_execucao = 'Ajuste o assento para as alças ficarem abaixo da linha do peito. Empurre sem travar o cotovelo no fim.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino declinado máquina';

update public.exercicio
   set dica_execucao = 'Mãos na largura dos ombros, não mais fechado — pegada estreita demais estressa o punho. Cotovelo rente ao tronco.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino fechado';

update public.exercicio
   set dica_execucao = 'Banco entre 30° e 45°; mais que isso vira desenvolvimento de ombro. A barra desce na altura da clavícula.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino inclinado com barra';

update public.exercicio
   set dica_execucao = 'Escápulas encaixadas no banco antes de subir o peso. Desça até a linha do peito, sem forçar amplitude extra.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino inclinado com halteres';

update public.exercicio
   set dica_execucao = 'Costas inteiras no encosto. Empurre sem projetar o ombro à frente no fim do movimento.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino inclinado máquina';

update public.exercicio
   set dica_execucao = 'Alinhe as alças com o meio do peito ajustando o assento. Volte devagar até sentir o alongamento.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino máquina';

update public.exercicio
   set dica_execucao = 'Escápulas juntas e presas no banco, pés firmes no chão. A barra desce na linha do mamilo, não no pescoço.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino reto com barra';

update public.exercicio
   set dica_execucao = 'Punho alinhado com o antebraço, sem quebrar para trás. Desça até a linha do peito e suba sem bater os halteres.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino reto com halteres';

update public.exercicio
   set dica_execucao = 'Ajuste o assento até as alças ficarem na linha do meio do peito. Ombro apoiado no encosto durante todo o movimento.',
       dica_execucao_origem = 'claude'
 where nome = 'Supino reto máquina';

update public.exercicio
   set dica_execucao = 'Braço paralelo ao chão e cotovelo parado. Estenda até o braço ficar reto e segure um instante.',
       dica_execucao_origem = 'claude'
 where nome = 'Tríceps coice com halter';

update public.exercicio
   set dica_execucao = 'Cotovelo apontando para cima e fechado. Desça atrás da cabeça com controle — soltar no fundo é onde o cotovelo sofre.',
       dica_execucao_origem = 'claude'
 where nome = 'Tríceps francês com halter';

update public.exercicio
   set dica_execucao = 'Ajuste o assento até o cotovelo alinhar com o eixo. Volte devagar em vez de deixar o peso puxar.',
       dica_execucao_origem = 'claude'
 where nome = 'Tríceps máquina';

update public.exercicio
   set dica_execucao = 'Separe as pontas da corda no fim do movimento. Cotovelo fixo ao lado do corpo — se ele abrir, o peito entra na conta.',
       dica_execucao_origem = 'claude'
 where nome = 'Tríceps pulley (corda)';

update public.exercicio
   set dica_execucao = 'Cotovelo apontado ao teto e parado. A barra desce até a testa ou um pouco atrás, sempre controlada.',
       dica_execucao_origem = 'claude'
 where nome = 'Tríceps testa com barra';


-- Trava de seguranca: se algum nome nao casou, a migration falha em vez
-- de deixar o catalogo pela metade sem ninguem perceber.
do $$
declare faltando int;
begin
  select count(*) into faltando from public.exercicio where dica_execucao is null;
  if faltando > 0 then
    raise exception 'ainda ha % exercicio(s) sem dica_execucao', faltando;
  end if;
end $$;
