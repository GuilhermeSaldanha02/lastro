// lastro · PU-09 — o manual completo, em Ajustes > Como usar o lastro. Sempre
// acessível (o onboarding de `conteudo.ts` aparece uma vez). Uma seção por
// assunto, na ordem em que a pessoa encontra as coisas. `link` leva à tela
// descrita. Como no onboarding: só se afirma o que o app faz HOJE.
import type { PassoGuia } from "./conteudo";

export type SecaoGuia = PassoGuia & {
  link?: { href: string; rotulo: string };
};

/** Para todas as contas que treinam. */
export const SECOES_GUIA: SecaoGuia[] = [
  {
    id: "primeiros-passos",
    titulo: "Primeiros passos",
    paragrafos: [
      "A tela inicial é a porta de entrada do lastro: mostra a sua semana, deixa iniciar o treino de hoje e leva às outras áreas pela barra de baixo.",
      "Em Ajustes você pode definir uma meta de treinos por semana. Sem meta, a tela inicial não mostra fração nem barra de progresso.",
    ],
    link: { href: "/ajustes", rotulo: "Abrir Ajustes" },
  },
  {
    id: "registrar-treino",
    titulo: "Registrar um treino",
    paragrafos: [
      "Toque em iniciar o treino de hoje, escolha um exercício do catálogo e registre cada série com repetições e carga. O RIR (quantas repetições você ainda conseguiria fazer) é opcional e vale para séries valendo.",
      "Cada série é de aquecimento ou valendo. O aquecimento fica no histórico, mas não entra em volume, em e1RM nem na contagem de séries da análise.",
      "Errou um número? Toque na série para corrigir ou excluir. Excluir sempre pede uma segunda confirmação na tela. Um treino inteiro se exclui pela lista de treinos, também com confirmação.",
      "Ao terminar, use “Finalizar Treino” e depois “Ver relatório”. Se finalizou sem querer, dá para reabrir o treino. Se você treina duas vezes no mesmo dia, “Iniciar treino de hoje” cria um novo treino depois que o anterior foi finalizado.",
    ],
    link: { href: "/treino", rotulo: "Abrir Treinos" },
  },
  {
    id: "repetir-serie",
    titulo: "Repetir série e carga por lado",
    paragrafos: [
      "“Repetir série” copia a série anterior com um toque: é o que mais se usa entre uma série e outra.",
      "Em exercícios com halteres, a carga é anotada por lado, e a tela indica isso com “kg/lado”. Em exercícios unilaterais, a série vale para um lado por vez.",
    ],
  },
  {
    id: "descanso",
    titulo: "Descanso entre as séries",
    paragrafos: [
      "O cronômetro de descanso é manual: você toca para começar. O tempo de descanso real fica gravado na série.",
      "Para ser avisado quando o descanso acabar, ative “Aviso de fim do descanso” em Ajustes. O aviso chega como notificação do aparelho e precisa da sua permissão. No iPhone, isso pede que o lastro esteja instalado na tela de início.",
    ],
  },
  {
    id: "sem-internet",
    titulo: "Sem internet",
    paragrafos: [
      "Séries registradas sem sinal ficam guardadas no aparelho e sobem sozinhas quando a rede volta. Enquanto houver série esperando a rede, a tela mostra “salvo no aparelho”.",
      "Algumas ações exigem conexão, como excluir um treino inteiro e gerar a análise.",
    ],
  },
  {
    id: "modelos",
    titulo: "Modelos de treino",
    paragrafos: [
      "Em Ajustes > Modelos de Treino você monta um treino com antecedência: a lista de exercícios e, se quiser, as repetições e a carga que costuma usar. No dia, escolha o modelo ao iniciar o treino e os exercícios já vêm prontos.",
      "Modelo é opcional: começar um treino do zero continua funcionando. É possível criar e excluir modelos. A Análise Semanal nunca lê os modelos, só o que você de fato executou.",
    ],
    link: { href: "/ajustes/modelos", rotulo: "Abrir Modelos de Treino" },
  },
  {
    id: "analise",
    titulo: "Análise Semanal",
    paragrafos: [
      "A análise é o coração do lastro. Você escolhe uma pergunta, como “Estou progredindo?” ou “Onde eu empaquei?”, e recebe um parecer em português que cita os seus exercícios e números.",
      "Ela usa sempre a última semana completa (de segunda a domingo) e precisa de algumas semanas fechadas com treino: a própria tela diz quantas você tem e quantas faltam. A semana em andamento nunca entra.",
      "O parecer é gerado por inteligência artificial em segundo plano: você pode sair da tela e encontrá-lo depois em Ajustes > Relatórios e adesivos. Ele pode errar, então confira o que for importante.",
      "Cada conta tem um limite diário de uso da inteligência artificial. Passou do limite, ele volta no dia seguinte.",
    ],
    link: { href: "/analise", rotulo: "Abrir Análise" },
  },
  {
    id: "coach",
    titulo: "Coach 24h",
    paragrafos: [
      "O Coach é um chat para dúvidas gerais de treino e de execução dos exercícios. Ele não vê os seus números (quem lê os seus números é a Análise) e não substitui um profissional, principalmente se você sente dor.",
      "Ele divide com a Análise o mesmo tipo de limite diário de uso da inteligência artificial. Não escreva no Coach informações de saúde que você não queira compartilhar.",
    ],
    link: { href: "/coach", rotulo: "Abrir Coach" },
  },
  {
    id: "catalogo",
    titulo: "Catálogo de exercícios",
    paragrafos: [
      "O catálogo tem centenas de exercícios em português, com busca e filtro por grupo muscular. Cada exercício traz dicas de execução, e os que têm imagem mostram o movimento.",
      "Os nomes seguem o jeito de falar da academia; quando o termo em inglês é o mais conhecido, ele aparece entre parênteses.",
    ],
    link: { href: "/catalogo", rotulo: "Abrir Catálogo" },
  },
  {
    id: "relatorios",
    titulo: "Relatórios e adesivos",
    paragrafos: [
      "Em Ajustes > Relatórios e adesivos ficam os pareceres da Análise já gerados e o histórico dos seus treinos. Escolha um treino para ver as estatísticas e exportar uma imagem transparente para redes sociais.",
      "A imagem é criada no seu aparelho: nada é publicado ou enviado por conta própria. Você decide se copia, salva ou compartilha.",
    ],
    link: { href: "/ajustes/relatorios", rotulo: "Abrir Relatórios e adesivos" },
  },
  {
    id: "anilhas",
    titulo: "Calculadora de anilhas",
    paragrafos: [
      "Em Ajustes > Calculadora de Anilhas você informa o peso da barra e quais anilhas a sua academia tem. A calculadora usa esse estoque para montar a carga.",
    ],
    link: { href: "/ajustes/anilhas", rotulo: "Abrir Calculadora de Anilhas" },
  },
  {
    id: "personalizar",
    titulo: "Idioma, tema e perfil",
    paragrafos: [
      "Em Ajustes você escolhe o idioma do aplicativo (português, inglês ou espanhol) e as cores em Temas e Cores. O idioma vale também para os nomes de exercícios do catálogo.",
      "No perfil você troca a foto. O nome é o do cadastro.",
    ],
    link: { href: "/perfil", rotulo: "Abrir Perfil" },
  },
  {
    id: "vinculo-personal",
    titulo: "Se você treina com um personal",
    paragrafos: [
      "Se o seu personal usa o lastro, ele gera um código de convite. Você o coloca em Ajustes > Personal e só então o vínculo existe: ninguém ganha acesso aos seus dados sem você aceitar.",
      "Com o vínculo, o personal vê o seu nome, o seu WhatsApp e os sinais do seu treino. O que mudar na próxima semana passa a ser dele: a Análise mostra quem detém essa parte. Você pode encerrar o vínculo quando quiser, e o acesso termina na hora.",
    ],
    link: { href: "/ajustes/personal", rotulo: "Abrir Personal" },
  },
  {
    id: "seus-dados",
    titulo: "Seus dados",
    paragrafos: [
      "Em Ajustes, “Exportar Meus Dados (CSV)” baixa uma cópia dos seus treinos.",
      "“Excluir conta” apaga a conta e os dados. Não dá para desfazer. Os Termos de Uso e a Política de Privacidade também estão em Ajustes.",
    ],
    link: { href: "/privacidade", rotulo: "Ler a Política de Privacidade" },
  },
  {
    id: "quando-algo-falha",
    titulo: "Quando algo não funciona",
    paragrafos: [
      "Tela “Sem conexão”: ela tenta voltar sozinha quando a rede volta. Séries já registradas não se perdem.",
      "Análise que não termina ou dá erro: espere alguns minutos e tente de novo. Se o limite do dia acabou, ela volta amanhã.",
      "Esqueceu a senha? Na tela de entrada, toque em “Esqueci minha senha”.",
    ],
  },
];

/** Só para quem nasceu personal: a área de trabalho. */
export const SECOES_GUIA_PERSONAL: SecaoGuia[] = [
  {
    id: "personal-modos",
    titulo: "Dois modos: trabalho e treino",
    paragrafos: [
      "A conta de personal alterna entre o modo trabalho (Fila e Alunos) e o modo treino (o seu próprio treino). Você troca em Ajustes, e a escolha fica guardada na conta.",
      "No modo trabalho não existe “iniciar treino”: essa tela só aparece no modo treino.",
    ],
    link: { href: "/ajustes", rotulo: "Abrir Ajustes" },
  },
  {
    id: "personal-convites",
    titulo: "Convidar alunos",
    paragrafos: [
      "Em Ajustes > Personal você gera um código de convite e passa ao aluno. Ele só entra na sua lista depois de aceitar, e pode encerrar o vínculo quando quiser. O convite não dá acesso a nada por si só.",
    ],
    link: { href: "/ajustes/personal", rotulo: "Abrir Personal" },
  },
  {
    id: "personal-fila",
    titulo: "A fila de trabalho",
    paragrafos: [
      "O lastro calcula os sinais do treino de cada aluno (por exemplo, exercício sem evolução ou grupo muscular sem treino) e mostra na fila só o que merece atenção, por prioridade. Ela espera por você: não manda notificação.",
      "Cada alerta traz um botão que abre o seu WhatsApp com a mensagem pronta. Quem envia é você: o lastro nunca fala com o aluno em seu nome.",
      "O seu CREF aparece como informado por você: o lastro guarda o número e não verifica o registro.",
    ],
    link: { href: "/personal", rotulo: "Abrir a fila" },
  },
];
