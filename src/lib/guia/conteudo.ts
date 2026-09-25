// lastro · PU-08 (onboarding) e PU-09 (roteiro em Ajustes) — o texto do
// "como usar o lastro", num lugar só. Chave = texto em português, traduzido
// por `t()` (dicionário em `texto/i18n.ts`). Afirmações aqui são sobre o app
// como ele é HOJE: mudou o recurso, mude o texto (não prometa o que não há).

export type PassoGuia = {
  id: string;
  titulo: string;
  paragrafos: string[];
};

/** Quem treina: usuário, ou personal em modo treino. */
export const PASSOS_ALUNO: PassoGuia[] = [
  {
    id: "boas-vindas",
    titulo: "Bem-vindo ao lastro",
    paragrafos: [
      "O lastro registra as séries que você faz e, uma vez por semana, explica em português o que esses números significam.",
      "Em um minuto você vê o que tem aqui. Dá para pular e rever depois em Ajustes.",
    ],
  },
  {
    id: "registrar",
    titulo: "Registre o treino",
    paragrafos: [
      "Na tela inicial, toque em iniciar o treino de hoje, escolha o exercício e anote repetições e carga de cada série.",
      "“Repetir série” copia a última com um toque. Marque o aquecimento como aquecimento: ele não entra nas contas da análise.",
      "Sem internet, o lastro guarda a série no aparelho e sincroniza quando a rede voltar.",
    ],
  },
  {
    id: "descanso",
    titulo: "Descanso entre as séries",
    paragrafos: [
      "O cronômetro de descanso é disparado por você, com um toque.",
      "Se quiser um aviso quando o descanso acabar, ative em Ajustes, em “Aviso de fim do descanso”.",
    ],
  },
  {
    id: "analise",
    titulo: "A Análise Semanal",
    paragrafos: [
      "Escolha uma das perguntas, como “Estou progredindo?” ou “Onde eu empaquei?”. O parecer cita os seus exercícios e números.",
      "A análise usa a última semana completa, de segunda a domingo. Ela é gerada por inteligência artificial e pode errar: confira o que importa.",
      "Cada conta tem um limite diário de uso da inteligência artificial.",
    ],
  },
  {
    id: "coach-catalogo",
    titulo: "Catálogo e Coach",
    paragrafos: [
      "O catálogo tem centenas de exercícios em português, com dicas de execução. Consulte sem sair do treino.",
      "O Coach responde dúvidas gerais de treino. Ele não substitui um profissional, principalmente se você sente dor.",
    ],
  },
  {
    id: "ajustes",
    titulo: "Ajustes e seus dados",
    paragrafos: [
      "Em Ajustes você define a meta semanal, o idioma, o tema, as anilhas da sua academia e os modelos de treino.",
      "Seus dados são seus: dá para baixar tudo em CSV e excluir a conta quando quiser.",
    ],
  },
];

/** Conta nascida personal, em modo trabalho. */
export const PASSOS_PERSONAL: PassoGuia[] = [
  {
    id: "boas-vindas-personal",
    titulo: "Bem-vindo ao lastro",
    paragrafos: [
      "Você tem uma área de trabalho para acompanhar alunos e, na mesma conta, o seu próprio treino.",
      "Em um minuto você vê como funciona. Dá para pular e rever depois em Ajustes.",
    ],
  },
  {
    id: "convidar",
    titulo: "Convide seus alunos",
    paragrafos: [
      "Em Ajustes, em “Personal”, você gera um código de convite e passa para o aluno. Ele só entra na sua lista depois de aceitar.",
      "O aluno pode encerrar o vínculo quando quiser, e o seu acesso aos dados dele termina na hora.",
    ],
  },
  {
    id: "fila",
    titulo: "A fila de trabalho",
    paragrafos: [
      "O lastro calcula os sinais do treino de cada aluno e mostra na fila só o que merece a sua atenção, por prioridade.",
      "Cada alerta traz um botão que abre o seu WhatsApp com a mensagem pronta. Quem envia é você, o lastro não fala com o aluno em seu nome.",
    ],
  },
  {
    id: "dois-modos",
    titulo: "Trabalho e treino",
    paragrafos: [
      "Você alterna entre o modo trabalho e o modo treino em Ajustes. No modo treino você registra os seus próprios treinos.",
    ],
  },
];
