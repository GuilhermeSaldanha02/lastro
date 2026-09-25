// lastro · PU-06 — Termos de Uso e Política de Privacidade.
//
// ⚠️ RASCUNHO, NÃO É PARECER JURÍDICO. Foi escrito por um assistente de IA a
// partir do que o app REALMENTE faz (conferido no código e no schema em
// 2026-09-25), para servir de base a um advogado. O app guarda dado de
// treino e de saúde de pessoas que o dono não conhece: revisão de advogado
// (LGPD) é obrigatória ANTES de anunciar o lastro ao público. Trechos entre
// [COLCHETES MAIÚSCULOS] são lacunas que só o dono ou o advogado preenchem.
//
// Ao mudar o texto, mude `VERSAO_DOCUMENTOS`: é ela que fica gravada no
// cadastro como prova de qual texto a pessoa aceitou.

export const VERSAO_DOCUMENTOS = "2026-09-25-rascunho-2";

export type Secao = {
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
};

export type Documento = {
  titulo: string;
  resumo: string;
  secoes: Secao[];
};

export const TERMOS: Documento = {
  titulo: "Termos de Uso",
  resumo:
    "As regras para usar o lastro: o que é o serviço, o que esperamos de você e o que não prometemos.",
  secoes: [
    {
      titulo: "1. O que é o lastro",
      paragrafos: [
        "O lastro é um aplicativo de treino que registra as séries que você executa e gera, com apoio de inteligência artificial, uma leitura em português sobre os seus números. Ele é oferecido por [NOME COMPLETO / RAZÃO SOCIAL DO RESPONSÁVEL], [CPF/CNPJ], adiante “lastro” ou “nós”.",
        "Ao criar uma conta ou usar o aplicativo, você declara que leu e aceita estes Termos e a Política de Privacidade.",
      ],
    },
    {
      titulo: "2. Quem pode usar",
      paragrafos: [
        "O lastro é destinado a maiores de 18 anos. [DECISÃO DO DONO E DO ADVOGADO: se menores de 18 puderem usar, a LGPD (art. 14) exige consentimento específico de um responsável, e este texto precisa mudar.]",
        "Você precisa informar dados verdadeiros no cadastro e manter a senha em segredo. O que acontece na sua conta é de sua responsabilidade.",
      ],
    },
    {
      titulo: "3. O lastro não é orientação médica nem profissional",
      paragrafos: [
        "O lastro analisa números do seu treino. Ele não faz diagnóstico, não prescreve tratamento e não substitui médico, fisioterapeuta ou profissional de educação física. As dicas de execução e os pareceres têm caráter informativo.",
        "Antes de começar ou mudar um programa de exercícios, principalmente se você tem lesão, dor, doença ou usa medicamento, procure um profissional habilitado. Você treina por sua conta e risco; pare se sentir dor, tontura ou desconforto.",
      ],
    },
    {
      titulo: "4. Inteligência artificial",
      paragrafos: [
        "O parecer da Análise Semanal e as respostas do Coach são gerados por um modelo de inteligência artificial. Ele pode errar, simplificar demais ou não considerar o seu caso. Confira o que for importante e não use a resposta como única base para uma decisão de saúde.",
        "O uso da inteligência artificial tem um limite diário por conta. Quando o limite é atingido, o recurso volta no dia seguinte. Podemos ajustar esses limites a qualquer momento para manter o serviço funcionando para todos.",
      ],
    },
    {
      titulo: "5. Como você pode usar",
      itens: [
        "Usar o aplicativo apenas para o seu treino pessoal ou, na conta de personal, para acompanhar alunos que aceitaram o vínculo.",
        "Não tentar acessar dados de outras contas, burlar limites, sobrecarregar o serviço ou fazer engenharia reversa.",
        "Não usar o aplicativo para fins ilegais nem enviar conteúdo que viole direito de terceiros.",
        "Na conta de personal, informar um CREF verdadeiro. O lastro guarda o número e não verifica o registro no conselho profissional.",
      ],
    },
    {
      titulo: "6. Conta de personal e vínculo com alunos",
      paragrafos: [
        "O personal só vê dados de um aluno depois que o aluno aceita o convite, e o aluno pode encerrar o vínculo quando quiser, o que corta o acesso na hora. O lastro não conversa com o aluno em nome do personal: quando há contato, ele acontece fora do aplicativo, e quem envia a mensagem é o próprio personal.",
      ],
    },
    {
      titulo: "7. Preço e disponibilidade",
      paragrafos: [
        "Hoje o lastro é gratuito. Se algum dia houver cobrança, ela será avisada antes e nada será cobrado sem a sua concordância expressa.",
        "O serviço é oferecido “como está”. Fazemos o possível para mantê-lo no ar e proteger seus dados, mas não garantimos funcionamento ininterrupto nem ausência de falhas. Pode haver manutenção, instabilidade de serviços de terceiros (hospedagem, banco de dados, inteligência artificial) ou alteração de recursos.",
      ],
    },
    {
      titulo: "8. Seus dados e o fim da conta",
      paragrafos: [
        "Os seus treinos são seus. Você pode baixar uma cópia em CSV e excluir a conta a qualquer momento em Ajustes; a exclusão apaga os seus dados do lastro. Os detalhes estão na Política de Privacidade.",
        "Podemos suspender ou encerrar contas que violem estes Termos ou coloquem o serviço em risco, avisando quando possível.",
      ],
    },
    {
      titulo: "9. Limitação de responsabilidade",
      paragrafos: [
        "Na medida permitida pela lei, o lastro não responde por lesões, perdas ou danos decorrentes do treino que você decidir fazer, do uso das informações do aplicativo ou de falhas de serviços de terceiros. [ADVOGADO: revisar esta cláusula à luz do Código de Defesa do Consumidor, que limita a exclusão de responsabilidade em relação ao consumidor.]",
      ],
    },
    {
      titulo: "10. Mudanças nestes Termos",
      paragrafos: [
        "Podemos atualizar estes Termos. Quando a mudança for relevante, avisaremos no aplicativo antes de ela valer. Continuar usando depois do aviso significa que você aceita a nova versão; se não concordar, exclua a conta.",
      ],
    },
    {
      titulo: "11. Contato e foro",
      paragrafos: [
        "Dúvidas, pedidos e reclamações: [E-MAIL DE CONTATO DO RESPONSÁVEL].",
        "Estes Termos seguem a lei brasileira. [ADVOGADO: definir foro. Em relação de consumo, o consumidor pode acionar o foro do próprio domicílio.]",
      ],
    },
  ],
};

export const PRIVACIDADE: Documento = {
  titulo: "Política de Privacidade",
  resumo:
    "Quais dados o lastro guarda, para quê, por quais mãos passam e como você apaga tudo. Escrita conforme a LGPD (Lei 13.709/2018).",
  secoes: [
    {
      titulo: "1. Quem é responsável pelos seus dados",
      paragrafos: [
        "O controlador dos dados é [NOME COMPLETO / RAZÃO SOCIAL DO RESPONSÁVEL], [CPF/CNPJ], com contato e encarregado (DPO) em [E-MAIL DE CONTATO DO RESPONSÁVEL].",
      ],
    },
    {
      titulo: "2. Quais dados coletamos",
      itens: [
        "Cadastro: nome, e-mail, número de WhatsApp com DDD e senha. A senha é guardada de forma criptografada (hash) pelo serviço de autenticação; nós não a vemos. Na conta de personal, também o número do CREF.",
        "Entrada com Google: nome, e-mail e foto de perfil que o Google informa. A foto é copiada para o armazenamento do lastro.",
        "Dados de treino: treinos, exercícios, séries, carga, repetições, esforço percebido (RIR), tipo de série (aquecimento ou válida), horários e tempo de descanso, modelos de treino, metas semanais e configuração de anilhas.",
        "Leituras geradas: os pareceres da Análise Semanal e o contador de quantas vezes você usou a inteligência artificial em cada dia.",
        "Preferências: idioma, tema visual e, se você ativar o aviso de fim do descanso, a inscrição de notificação do seu aparelho.",
        "Dados técnicos de erro: quando o aplicativo falha, gravamos a mensagem de erro, a página (sem os parâmetros do endereço), o tipo de navegador e, se você estava logado, o identificador da sua conta. Esses registros são apagados em 30 dias.",
        "Vínculo com personal: se você aceitar um convite, o vínculo, o estado dele e os alertas de treino gerados para o seu personal.",
      ],
      paragrafos: [
        "Os dados de treino e de condicionamento físico podem revelar informações sobre a sua saúde e, por isso, são tratados com cuidado especial (dado pessoal sensível, LGPD art. 5º, II). [ADVOGADO: confirmar o enquadramento e a base legal.] O lastro não pede peso corporal, exames, doenças ou medicamentos, e não recomendamos digitar esse tipo de informação em campos de texto livre, como a pergunta ao Coach.",
      ],
    },
    {
      titulo: "3. Para que usamos",
      itens: [
        "Criar e manter a sua conta e permitir o login.",
        "Registrar e mostrar os seus treinos, gráficos e histórico, inclusive quando você está sem internet e sincroniza depois.",
        "Gerar a Análise Semanal e as respostas do Coach com inteligência artificial.",
        "Ligar a sua conta a um personal, somente quando você aceita o convite.",
        "Enviar o aviso de fim de descanso, somente se você ativar.",
        "Manter a segurança, prevenir abuso, limitar o uso da inteligência artificial e corrigir erros.",
      ],
      paragrafos: [
        "Não vendemos os seus dados, não os usamos para publicidade e não os entregamos a anunciantes. [ADVOGADO: indicar a base legal de cada finalidade — execução do contrato, consentimento (dado sensível) e legítimo interesse (segurança).]",
      ],
    },
    {
      titulo: "4. O que vai para a inteligência artificial",
      paragrafos: [
        "A Análise Semanal usa o modelo Gemini, do Google. O lastro calcula as métricas no próprio servidor e envia à IA apenas um resumo já calculado: nomes de exercícios, cargas, volumes, tendências e faixas de semanas. Não enviamos o seu nome, e-mail ou telefone.",
        "O Coach envia à IA apenas o texto da pergunta que você escrever, sem os seus números de treino. O lastro não guarda o texto das perguntas do Coach. [ATENÇÃO, DONO E ADVOGADO: a chave da Gemini está no plano GRATUITO, e nos termos de serviço da Gemini API o plano gratuito costuma permitir que o Google use o conteúdo enviado para melhorar os produtos dele; o plano com faturamento costuma não permitir. Conferir os termos vigentes ANTES de divulgar: se for o caso, este parágrafo não pode prometer o contrário, e a recomendação é migrar para o plano com faturamento.]",
      ],
    },
    {
      titulo: "5. Com quem os dados passam",
      paragrafos: [
        "Para funcionar, o lastro usa prestadores de serviço (operadores). Eles só tratam os dados para prestar o serviço:",
      ],
      itens: [
        "Supabase: banco de dados, autenticação e armazenamento de arquivos. O banco fica na região de São Paulo (Brasil).",
        "Vercel: hospedagem do aplicativo, com infraestrutura em vários países.",
        "Google: login com Google (se você escolher) e o modelo Gemini de inteligência artificial.",
        "Serviço de notificação do seu navegador (Google, Apple ou Mozilla), somente se você ativar o aviso de fim do descanso.",
      ],
    },
    {
      titulo: "6. Transferência para fora do Brasil",
      paragrafos: [
        "Parte desses prestadores trata dados fora do Brasil (por exemplo, Estados Unidos). Isso é uma transferência internacional de dados (LGPD art. 33). [ADVOGADO: indicar o mecanismo aplicável — cláusulas contratuais dos prestadores ou consentimento específico.]",
      ],
    },
    {
      titulo: "7. Quem mais pode ver",
      itens: [
        "Personal vinculado: só depois que você aceita o convite. Ele vê o seu nome, o seu WhatsApp e os sinais do seu treino (por exemplo, exercício estagnado ou grupo muscular sem treino). Você encerra o vínculo quando quiser, e o acesso termina na hora.",
        "Foto de perfil: é guardada em um armazenamento com endereço público. Quem tiver o endereço exato da imagem pode abri-la, mas ele não é listado no app para outras pessoas. Se preferir, não use foto.",
        "Outros usuários: as contas não se veem entre si. Não há perfil público, feed, ranking nem comparação.",
        "Autoridades: quando houver ordem legal.",
      ],
    },
    {
      titulo: "8. Por quanto tempo guardamos",
      itens: [
        "Enquanto a conta existir: os dados de cadastro, treino e preferências.",
        "Ao excluir a conta: os dados são apagados do banco em seguida. [CONFERIR COM O DONO: cópias de segurança (backup) do provedor e por quanto tempo permanecem; informar o prazo aqui.]",
        "Registros de erro: 30 dias.",
      ],
    },
    {
      titulo: "9. Seus direitos",
      paragrafos: [
        "A LGPD (art. 18) garante que você pode: confirmar que tratamos seus dados, acessá-los, corrigi-los, pedir anonimização, bloqueio ou eliminação, pedir portabilidade, saber com quem compartilhamos, revogar o consentimento e se opor a um tratamento.",
        "Direto no aplicativo, em Ajustes: “Exportar Meus Dados (CSV)” baixa uma cópia dos seus treinos, e “Excluir conta” apaga a conta e os dados. Para qualquer outro pedido, escreva para [E-MAIL DE CONTATO DO RESPONSÁVEL]. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
      ],
    },
    {
      titulo: "10. Segurança",
      paragrafos: [
        "Cada conta só acessa os próprios dados: o banco aplica regras de isolamento por usuário. A comunicação é criptografada (HTTPS) e senhas são guardadas com hash. Nenhum sistema é totalmente imune; se houver incidente que possa causar risco relevante, avisaremos você e a ANPD, como a lei exige.",
      ],
    },
    {
      titulo: "11. Cookies e armazenamento no aparelho",
      paragrafos: [
        "Usamos cookies estritamente necessários para manter você logado. O aplicativo também guarda no aparelho dados de treino ainda não sincronizados (para funcionar sem internet), o tema escolhido e um cache de páginas. Não usamos cookies de publicidade nem de rastreamento de terceiros.",
      ],
    },
    {
      titulo: "12. Mudanças nesta Política",
      paragrafos: [
        "Podemos atualizar esta Política. Mudanças relevantes serão avisadas no aplicativo. A versão em vigor está indicada no topo desta página.",
      ],
    },
  ],
};
