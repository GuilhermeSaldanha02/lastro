// lastro · módulo de idiomas, etapa 4/4 (2026-08-24) — dicionário de
// strings fixas da UI. Chave é o texto PT-BR ORIGINAL (não um id
// inventado): mantém o diff mecânico (`"Salvar"` vira `t("Salvar",
// idioma)`, sem renomear nada) e torna óbvio, olhando o dicionário, se
// uma tradução ficou desatualizada quando o texto PT-BR muda.
//
// Função pura, sem "use server"/"use client" — importável tanto em
// Server quanto Client Components, mesmo padrão de
// `src/lib/texto/grupo-muscular.ts`.
//
// Fallback honesto: chave sem entrada devolve o próprio PT-BR (nunca
// quebra a tela, só não traduz aquele texto específico) — mesmo
// raciocínio do fallback de `mapaTraducaoExercicios` (etapa 1/4).
import type { Idioma } from "@/lib/dados/idioma";

const DICIONARIO: Record<string, { en: string; es: string }> = {
  // --- seletor-temas.tsx / ajustes/temas/page.tsx ---
  "Ajustes": { en: "Settings", es: "Ajustes" },
  "Temas": { en: "Themes", es: "Temas" },
  "Ativo": { en: "Active", es: "Activo" },
  "Exemplo de Botão": { en: "Button Example", es: "Ejemplo de Botón" },
  "Fundo": { en: "Background", es: "Fondo" },
  "Superfície": { en: "Surface", es: "Superficie" },
  "Acento": { en: "Accent", es: "Acento" },
  "Padrão": { en: "Default", es: "Predeterminado" },
  "Claro": { en: "Light", es: "Claro" },
  "Orgânico": { en: "Organic", es: "Orgánico" },
  "Minimalista": { en: "Minimalist", es: "Minimalista" },
  "Exclusivo": { en: "Exclusive", es: "Exclusivo" },
  "Quente": { en: "Warm", es: "Cálido" },
  "Stealth": { en: "Stealth", es: "Sigiloso" },
  "Obsidian Ouro": { en: "Obsidian Gold", es: "Obsidiana Oro" },
  "Spartan Gold": { en: "Spartan Gold", es: "Oro Espartano" },
  "Luxo espartano e assinatura clássica do LASTRO.": {
    en: "Spartan luxury and LASTRO's classic signature.",
    es: "Lujo espartano y firma clásica de LASTRO.",
  },
  "Marfim & Ouro Imperial": { en: "Ivory & Imperial Gold", es: "Marfil y Oro Imperial" },
  "Light Luxury": { en: "Light Luxury", es: "Lujo Claro" },
  "Modo claro refinado com superfícies de mármore e acento em ouro nobre.": {
    en: "Refined light mode with marble surfaces and noble gold accents.",
    es: "Modo claro refinado con superficies de mármol y acento en oro noble.",
  },
  "Duna Areia & Âmbar": { en: "Dune Sand & Amber", es: "Duna Arena y Ámbar" },
  "Sandstone Warmth": { en: "Sandstone Warmth", es: "Calidez Arenisca" },
  "Tons minerais de linho e areia do deserto em fundo carvão quente.": {
    en: "Mineral tones of linen and desert sand on a warm charcoal background.",
    es: "Tonos minerales de lino y arena del desierto sobre fondo carbón cálido.",
  },
  "Clean Monolith": { en: "Clean Monolith", es: "Monolito Limpio" },
  "Pure Platinum": { en: "Pure Platinum", es: "Platino Puro" },
  "Minimalismo brutalista de alto contraste com platina pura e ônix fosco.": {
    en: "High-contrast brutalist minimalism with pure platinum and matte onyx.",
    es: "Minimalismo brutalista de alto contraste con platino puro y ónix mate.",
  },
  "Slate Petróleo & Ouro Antigo": { en: "Petrol Slate & Antique Gold", es: "Pizarra Petróleo y Oro Antiguo" },
  "Equinox Luxury": { en: "Equinox Luxury", es: "Lujo Equinox" },
  "Grafite petróleo profundo com detalhes em ouro antigo escovado.": {
    en: "Deep petrol graphite with brushed antique gold details.",
    es: "Grafito petróleo profundo con detalles en oro antiguo cepillado.",
  },
  "Café Moka & Caramelo": { en: "Mocha Coffee & Caramel", es: "Café Moka y Caramelo" },
  "Leica Craft": { en: "Leica Craft", es: "Artesanía Leica" },
  "Tons terrosos de espresso escuro e caramelo tostado.": {
    en: "Earthy tones of dark espresso and toasted caramel.",
    es: "Tonos terrosos de espresso oscuro y caramelo tostado.",
  },
  "Oliva Tático": { en: "Tactical Olive", es: "Oliva Táctico" },
  "Forest Stealth": { en: "Forest Stealth", es: "Sigilo Forestal" },
  "Verde sálvia militar sóbrio em grafite floresta.": {
    en: "Sober military sage green on forest graphite.",
    es: "Verde salvia militar sobrio sobre grafito bosque.",
  },

  // --- app/page.tsx (Home) ---
  "hoje": { en: "today", es: "hoy" },
  "ontem": { en: "yesterday", es: "ayer" },
  "Semana": { en: "Week", es: "Semana" },
  "Perfil do usuário": { en: "User profile", es: "Perfil del usuario" },
  "Continuar Treino de Hoje": { en: "Continue Today's Workout", es: "Continuar Entrenamiento de Hoy" },
  "Iniciar Treino de Hoje": { en: "Start Today's Workout", es: "Iniciar Entrenamiento de Hoy" },
  "Análise Semanal (AI Coach)": { en: "Weekly Analysis (AI Coach)", es: "Análisis Semanal (AI Coach)" },
  "treino": { en: "workout", es: "entrenamiento" },
  "treinos": { en: "workouts", es: "entrenamientos" },
  "Toque para ver a leitura da sua semana.": {
    en: "Tap to see your week's readout.",
    es: "Toca para ver la lectura de tu semana.",
  },
  "Ainda sem treinos nesta semana. Inicie uma sessão para gerar o parecer inteligente.": {
    en: "No workouts yet this week. Start a session to generate the AI report.",
    es: "Aún sin entrenamientos esta semana. Inicia una sesión para generar el informe inteligente.",
  },
  "Treinos Recentes": { en: "Recent Workouts", es: "Entrenamientos Recientes" },
  "Ver Todos": { en: "View All", es: "Ver Todos" },
  "Nenhum treino registrado ainda. O primeiro começa no botão acima.": {
    en: "No workouts logged yet. The first one starts with the button above.",
    es: "Aún no hay entrenamientos registrados. El primero comienza con el botón de arriba.",
  },
  "SESSÃO": { en: "SESSION", es: "SESIÓN" },
  "série": { en: "set", es: "serie" },
  "séries": { en: "sets", es: "series" },

  // --- components/treino-detalhe.tsx ---
  "Séries": { en: "Sets", es: "Series" },
  "Concluído": { en: "Done", es: "Listo" },
  "Editar": { en: "Edit", es: "Editar" },
  "valendo": { en: "working", es: "válida" },
  "Nenhuma série registrada ainda. Comece pela primeira aqui embaixo.": {
    en: "No sets logged yet. Start with the first one below.",
    es: "Aún no hay series registradas. Comienza con la primera aquí abajo.",
  },
  "série valendo": { en: "working set", es: "serie válida" },
  "séries valendo": { en: "working sets", es: "series válidas" },
  "EXERCÍCIO": { en: "EXERCISE", es: "EJERCICIO" },
  "Excluir a série": { en: "Delete set", es: "Eliminar la serie" },
  "de": { en: "of", es: "de" },
  "Não dá para desfazer.": { en: "This can't be undone.", es: "Esto no se puede deshacer." },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Excluir": { en: "Delete", es: "Eliminar" },
  "Excluir série": { en: "Delete set", es: "Eliminar serie" },
  "aquecimento": { en: "warm-up", es: "calentamiento" },
  "recorde pessoal": { en: "personal record", es: "récord personal" },
  "Registrar Série": { en: "Log Set", es: "Registrar Serie" },
  "Preencha a carga e repetições executadas": {
    en: "Fill in the weight and reps performed",
    es: "Completa la carga y las repeticiones realizadas",
  },
  "Trocar grupo": { en: "Change group", es: "Cambiar grupo" },
  "Repetir última série": { en: "Repeat last set", es: "Repetir última serie" },
  "Fechar": { en: "Close", es: "Cerrar" },
  // --- components/dica-info.tsx ---
  "Saiba mais sobre": { en: "Learn more about", es: "Más información sobre" },
  "Adicionar exercício": { en: "Add exercise", es: "Agregar ejercicio" },
  "Outra série": { en: "Another set", es: "Otra serie" },
  "sincronizado": { en: "synced", es: "sincronizado" },
  "salvo no aparelho": { en: "saved on device", es: "guardado en el dispositivo" },

  // --- app/treino/[id]/page.tsx ---
  "Bancada": { en: "Workbench", es: "Banco" },

  // --- app/ajustes/page.tsx ---
  "Preferências": { en: "Preferences", es: "Preferencias" },
  "Ver Perfil": { en: "View Profile", es: "Ver Perfil" },
  "Coach IA": { en: "AI Coach", es: "Coach IA" },
  "Consultoria 24h e leitura de ciclo": { en: "24h coaching and cycle readout", es: "Asesoría 24h y lectura de ciclo" },
  "Modelos de Treino": { en: "Workout Templates", es: "Modelos de Entrenamiento" },
  "Criar e organizar rotinas": { en: "Create and organize routines", es: "Crear y organizar rutinas" },
  "Calculadora de Anilhas": { en: "Plate Calculator", es: "Calculadora de Discos" },
  "Configurar estoque e barra": { en: "Configure stock and bar", es: "Configurar stock y barra" },
  "Temas & Cores": { en: "Themes & Colors", es: "Temas y Colores" },
  "Personalizar paleta do aplicativo": { en: "Customize the app's color palette", es: "Personalizar la paleta de la app" },
  "Encerrar Sessão (Sair)": { en: "End Session (Sign Out)", es: "Cerrar Sesión" },
  "Entre para ver seus ajustes.": { en: "Sign in to see your settings.", es: "Inicia sesión para ver tus ajustes." },

  // --- components/meta-semanal-form.tsx ---
  "Meta Semanal de Treinos": { en: "Weekly Workout Goal", es: "Meta Semanal de Entrenamientos" },
  "Quantos treinos por semana é a sua meta. Deixe em branco para não mostrar meta nenhuma na Home.": {
    en: "How many workouts per week is your goal. Leave blank to show no goal on the Home screen.",
    es: "Cuántos entrenamientos por semana es tu meta. Deja en blanco para no mostrar ninguna meta en el Inicio.",
  },
  "Treinos por semana (1 a 7)": { en: "Workouts per week (1 to 7)", es: "Entrenamientos por semana (1 a 7)" },
  "Sem meta": { en: "No goal", es: "Sin meta" },
  "A meta precisa ser um número inteiro entre 1 e 7.": {
    en: "The goal must be a whole number between 1 and 7.",
    es: "La meta debe ser un número entero entre 1 y 7.",
  },
  "Salvando…": { en: "Saving…", es: "Guardando…" },
  "Salvar meta": { en: "Save goal", es: "Guardar meta" },
  "Meta removida.": { en: "Goal removed.", es: "Meta eliminada." },
  "Meta salva.": { en: "Goal saved.", es: "Meta guardada." },
  "Sessão ausente — entre de novo.": { en: "Session expired — sign in again.", es: "Sesión ausente — inicia sesión de nuevo." },
  "Não foi possível salvar. Tente de novo.": { en: "Couldn't save. Try again.", es: "No se pudo guardar. Intenta de nuevo." },

  // --- components/idioma-form.tsx ---
  "Idioma": { en: "Language", es: "Idioma" },
  "Catálogo de exercícios e textos do app neste idioma.": {
    en: "Exercise catalog and app text in this language.",
    es: "Catálogo de ejercicios y textos de la app en este idioma.",
  },
  "Idioma salvo.": { en: "Language saved.", es: "Idioma guardado." },

  // --- components/excluir-conta.tsx ---
  "Não foi possível excluir a conta. Tente de novo.": {
    en: "Couldn't delete the account. Try again.",
    es: "No se pudo eliminar la cuenta. Intenta de nuevo.",
  },
  "Excluir conta": { en: "Delete account", es: "Eliminar cuenta" },
  "Confirmar exclusão de conta": { en: "Confirm account deletion", es: "Confirmar eliminación de cuenta" },
  "Excluir sua conta apaga o perfil, todos os treinos e séries registradas, os modelos de treino e a configuração de anilhas — tudo, sem exceção. Não dá para desfazer.": {
    en: "Deleting your account erases your profile, all logged workouts and sets, workout templates, and plate configuration — everything, no exceptions. This can't be undone.",
    es: "Eliminar tu cuenta borra el perfil, todos los entrenamientos y series registradas, los modelos de entrenamiento y la configuración de discos — todo, sin excepción. Esto no se puede deshacer.",
  },
  "Excluindo…": { en: "Deleting…", es: "Eliminando…" },

  // --- components/iniciar-treino.tsx ---
  "Iniciar treino de hoje": { en: "Start today's workout", es: "Iniciar entrenamiento de hoy" },
  "Como começar?": { en: "How do you want to start?", es: "¿Cómo empezar?" },
  "Treino novo": { en: "New workout", es: "Entrenamiento nuevo" },

  // --- app/not-found.tsx ---
  "Página não encontrada": { en: "Page not found", es: "Página no encontrada" },
  "Este endereço não existe ou não é da sua conta. Nada foi perdido.": {
    en: "This address doesn't exist or isn't part of your account. Nothing was lost.",
    es: "Esta dirección no existe o no es de tu cuenta. No se perdió nada.",
  },
  "Voltar ao início": { en: "Back to home", es: "Volver al inicio" },
  "Peso da anilha precisa estar entre 0,01 e 9999,99 kg.": {
    en: "Plate weight must be between 0.01 and 9999.99 kg.",
    es: "El peso del disco debe estar entre 0,01 y 9999,99 kg.",
  },
  "Peso da barra precisa estar entre 0,01 e 9999,99 kg.": {
    en: "Bar weight must be between 0.01 and 9999.99 kg.",
    es: "El peso de la barra debe estar entre 0,01 y 9999,99 kg.",
  },
  "Reps do plano precisa ser um número inteiro entre 1 e 100.": {
    en: "Planned reps must be a whole number between 1 and 100.",
    es: "Las repeticiones del plan deben ser un número entero entre 1 y 100.",
  },
  "Peso do plano precisa estar entre 0 e 1000 kg.": {
    en: "Planned weight must be between 0 and 1000 kg.",
    es: "El peso del plan debe estar entre 0 y 1000 kg.",
  },
  "Sem conexão. Conecte-se à internet para iniciar o treino.": {
    en: "No connection. Connect to the internet to start the workout.",
    es: "Sin conexión. Conéctate a internet para iniciar el entrenamiento.",
  },
  "Não foi possível iniciar o treino. Verifique a conexão e tente de novo.": {
    en: "Couldn't start the workout. Check your connection and try again.",
    es: "No se pudo iniciar el entrenamiento. Revisa la conexión e inténtalo de nuevo.",
  },

  // --- components/formulario-serie.tsx ---
  "Repetir série": { en: "Repeat set", es: "Repetir serie" },
  "Finalizar Treino": { en: "Finish Workout", es: "Finalizar Entrenamiento" },
  "Ver Relatório do Treino": { en: "View Workout Report", es: "Ver Informe del Entrenamiento" },
  "Treino Finalizado": { en: "Workout Finished", es: "Entrenamiento Finalizado" },
  "Exercício é obrigatório.": { en: "Exercise is required.", es: "El ejercicio es obligatorio." },
  "Escolha o tipo: aquecimento ou valendo.": {
    en: "Choose the type: warm-up or working set.",
    es: "Elige el tipo: calentamiento o serie válida.",
  },
  "Reps precisa ser um número inteiro entre 1 e 200.": {
    en: "Reps must be a whole number between 1 and 200.",
    es: "Las repeticiones deben ser un número entero entre 1 y 200.",
  },
  "Peso precisa estar entre 0 e 1000 kg.": { en: "Weight must be between 0 and 1000 kg.", es: "El peso debe estar entre 0 y 1000 kg." },
  "Informe o peso. Use 0 para exercício sem carga.": {
    en: "Enter the weight. Use 0 for an unloaded exercise.",
    es: "Indica el peso. Usa 0 para un ejercicio sin carga.",
  },
  "RIR precisa ser um número inteiro entre 0 e 10.": {
    en: "RIR must be a whole number between 0 and 10.",
    es: "El RIR debe ser un número entero entre 0 y 10.",
  },
  "Exercício": { en: "Exercise", es: "Ejercicio" },
  "Selecione o exercício": { en: "Select the exercise", es: "Selecciona el ejercicio" },
  "Unilateral · reps contam por lado": { en: "Unilateral · reps count per side", es: "Unilateral · las repeticiones cuentan por lado" },
  "Última vez:": { en: "Last time:", es: "Última vez:" },
  "Usar valores": { en: "Use", es: "Usar" },
  "Tipo de Série": { en: "Set Type", es: "Tipo de Serie" },
  "Selecione o tipo": { en: "Select the type", es: "Selecciona el tipo" },
  "Valendo": { en: "Working", es: "Válida" },
  "Aquecimento": { en: "Warm-up", es: "Calentamiento" },
  "Reps": { en: "Reps", es: "Reps" },
  "Peso (kg)": { en: "Weight (kg)", es: "Peso (kg)" },
  "RIR (Repetições na Reserva — Opcional)": { en: "RIR (Reps in Reserve — Optional)", es: "RIR (Repeticiones en Reserva — Opcional)" },
  "Ex: 2": { en: "E.g.: 2", es: "Ej.: 2" },
  "Peso é de cada lado (ex.: um halter em cada mão)": {
    en: "Weight is per side (e.g., one dumbbell in each hand)",
    es: "El peso es de cada lado (ej.: una mancuerna en cada mano)",
  },
  "Registrar série": { en: "Log set", es: "Registrar serie" },

  // --- app/treino/page.tsx ---
  "Treinos": { en: "Workouts", es: "Entrenamientos" },
  "Histórico": { en: "History", es: "Historial" },
  "Continuar treino de hoje": { en: "Continue today's workout", es: "Continuar entrenamiento de hoy" },

  // --- components/lista-treinos.tsx ---
  "Histórico de Treinos": { en: "Workout History", es: "Historial de Entrenamientos" },
  "sessão registrada": { en: "session logged", es: "sesión registrada" },
  "sessões registradas": { en: "sessions logged", es: "sesiones registradas" },
  "Filtro de grupos": { en: "Group filter", es: "Filtro de grupos" },
  "Todos": { en: "All", es: "Todos" },
  "Nenhum treino registrado ainda. Inicie sua primeira sessão abaixo.": {
    en: "No workouts logged yet. Start your first session below.",
    es: "Aún no hay entrenamientos registrados. Inicia tu primera sesión abajo.",
  },
  "Nenhum treino com o grupo": { en: "No workout with the group", es: "Ningún entrenamiento con el grupo" },

  // --- components/excluir-treino.tsx ---
  "Não foi possível excluir. Tente de novo.": { en: "Couldn't delete. Try again.", es: "No se pudo eliminar. Intenta de nuevo." },
  "Excluir o treino de": { en: "Delete the workout from", es: "Eliminar el entrenamiento del" },
  "Confirmar exclusão": { en: "Confirm deletion", es: "Confirmar eliminación" },
  "e": { en: "and", es: "y" },
  "a série dele": { en: "its set", es: "su serie" },
  "as": { en: "its", es: "sus" },
  "séries dele": { en: "sets", es: "series" },

  // --- components/seletor-metricas-home.tsx ---
  "Métricas da Semana": { en: "Weekly Metrics", es: "Métricas de la Semana" },
  "Volume": { en: "Volume", es: "Volumen" },
  "Grupos": { en: "Groups", es: "Grupos" },
  "Volume acumulado na semana": { en: "Volume accumulated this week", es: "Volumen acumulado en la semana" },
  "sessão": { en: "session", es: "sesión" },
  "sessões": { en: "sessions", es: "sesiones" },
  "Sem treinos": { en: "No workouts", es: "Sin entrenamientos" },
  "Volume dos últimos": { en: "Volume of the last", es: "Volumen de los últimos" },
  "Séries valendo concluídas (aquecimento excluído)": {
    en: "Working sets completed (warm-up excluded)",
    es: "Series válidas completadas (calentamiento excluido)",
  },
  "Séries dos últimos": { en: "Sets of the last", es: "Series de los últimos" },
  "grupo": { en: "group", es: "grupo" },
  "grupos": { en: "groups", es: "grupos" },
  "Séries por grupo muscular nesta semana": { en: "Sets by muscle group this week", es: "Series por grupo muscular esta semana" },
  "Volume por grupo muscular nesta semana": { en: "Volume by muscle group this week", es: "Volumen por grupo muscular esta semana" },
  "Métrica dos grupos": { en: "Group metric", es: "Métrica de los grupos" },
  "Grupos sem estímulo recente": { en: "Groups without recent stimulus", es: "Grupos sin estímulo reciente" },
  "Dias desde a última série valendo de cada grupo.": {
    en: "Days since the last working set of each group.",
    es: "Días desde la última serie válida de cada grupo.",
  },
  "Hoje": { en: "Today", es: "Hoy" },
  "dia": { en: "day", es: "día" },
  "dias": { en: "days", es: "días" },
  "Nenhuma série registrada nesta semana ainda.": {
    en: "No sets logged this week yet.",
    es: "Aún no hay series registradas esta semana.",
  },
  "Os treinos que você registrar aparecem aqui como histórico.": {
    en: "The workouts you log will appear here as history.",
    es: "Los entrenamientos que registres aparecerán aquí como historial.",
  },

  // --- components/aba-inferior.tsx ---
  "Seções do app": { en: "App sections", es: "Secciones de la app" },
  "Início": { en: "Home", es: "Inicio" },
  "Análise": { en: "Analysis", es: "Análisis" },
  "Catálogo": { en: "Catalog", es: "Catálogo" },

  // --- components/editar-serie.tsx ---
  "RIR (opcional)": { en: "RIR (optional)", es: "RIR (opcional)" },
  "Salvar": { en: "Save", es: "Guardar" },

  // --- components/seletor-grupo-muscular.tsx ---
  "Grupo Muscular de Hoje": { en: "Today's Muscle Group", es: "Grupo Muscular de Hoy" },
  "Escolha um ou mais para filtrar a lista de exercícios": {
    en: "Choose one or more to filter the exercise list",
    es: "Elige uno o más para filtrar la lista de ejercicios",
  },
  "Grupos musculares de hoje": { en: "Today's muscle groups", es: "Grupos musculares de hoy" },
  "Continuar": { en: "Continue", es: "Continuar" },

  // --- components/modelo-treino-form.tsx ---
  "Dê um nome ao modelo.": { en: "Give the template a name.", es: "Dale un nombre al modelo." },
  "Escolha pelo menos um exercício.": { en: "Choose at least one exercise.", es: "Elige al menos un ejercicio." },
  "Que treino é esse?": { en: "What workout is this?", es: "¿Qué entrenamiento es este?" },
  "Dê um nome — os exercícios vêm no passo seguinte.": {
    en: "Give it a name — the exercises come in the next step.",
    es: "Dale un nombre — los ejercicios vienen en el siguiente paso.",
  },
  "Nome do modelo": { en: "Template name", es: "Nombre del modelo" },
  "Ex.: Peito e tríceps": { en: "E.g.: Chest and triceps", es: "Ej.: Pecho y tríceps" },
  "Renomear": { en: "Rename", es: "Renombrar" },
  "Exercícios do modelo": { en: "Template exercises", es: "Ejercicios del modelo" },
  "Salvar modelo": { en: "Save template", es: "Guardar modelo" },

  // --- components/folha.tsx / ajustes/modelos/novo ---
  "Novo modelo": { en: "New template", es: "Nuevo modelo" },
  "Modelos": { en: "Templates", es: "Modelos" },
  "Novo": { en: "New", es: "Nuevo" },

  // --- components/catalogo-interativo.tsx ---
  "Buscar exercício ou músculo…": { en: "Search exercise or muscle…", es: "Buscar ejercicio o músculo…" },
  "Limpar busca": { en: "Clear search", es: "Limpiar búsqueda" },
  "Grupos musculares": { en: "Muscle groups", es: "Grupos musculares" },
  "Curadoria": { en: "Curation", es: "Curaduría" },
  "exercícios estão aguardando curadoria de execução. Dicas técnicas são revisadas por humanos (ADR-007).": {
    en: "exercises are awaiting execution curation. Technical tips are reviewed by humans (ADR-007).",
    es: "ejercicios están esperando curaduría de ejecución. Los consejos técnicos son revisados por humanos (ADR-007).",
  },
  "Nenhum exercício encontrado para": { en: "No exercise found for", es: "Ningún ejercicio encontrado para" },
  "exercício": { en: "exercise", es: "ejercicio" },
  "exercícios": { en: "exercises", es: "ejercicios" },
  "Unilateral": { en: "Unilateral", es: "Unilateral" },
  "Peso por lado": { en: "Weight per side", es: "Peso por lado" },
  "Sem dica registrada": { en: "No tip recorded", es: "Sin consejo registrado" },
  "Dica de execução ainda não escrita para este exercício.": {
    en: "Execution tip not written yet for this exercise.",
    es: "Consejo de ejecución aún no escrito para este ejercicio.",
  },
  "As instruções deste catálogo não substituem orientação médica ou fisioterapêutica.": {
    en: "The instructions in this catalog do not replace medical or physical therapy guidance.",
    es: "Las instrucciones de este catálogo no reemplazan la orientación médica o fisioterapéutica.",
  },

  // --- relatorio-pos-treino.tsx ---
  // Os rótulos da tela e os avisos de desfecho de cada ação. Antes só
  // existiam em PT-BR: a tela do relatório aparecia meio traduzida em
  // en/es (achado do teste de jornada, 2026-08-27).
  "SESSÃO FINALIZADA": { en: "WORKOUT COMPLETED", es: "SESIÓN FINALIZADA" },
  "SÉRIES": { en: "SETS", es: "SERIES" },
  "EXERCÍCIOS": { en: "EXERCISES", es: "EJERCICIOS" },
  "Mais uma sessão no histórico.": {
    en: "Another session in the books.",
    es: "Otra sesión en el historial.",
  },
  "Compartilhar Treino": { en: "Share Workout", es: "Compartir Entrenamiento" },
  "Fundo transparente": { en: "Transparent background", es: "Fondo transparente" },
  "Compartilhar com": { en: "Share with", es: "Compartir con" },
  "Carga Total": { en: "Total Load", es: "Carga Total" },
  "Séries Válidas": { en: "Working Sets", es: "Series Válidas" },
  "Tempo": { en: "Time", es: "Tiempo" },
  "Copiar": { en: "Copy", es: "Copiar" },
  // "Salvar" já existe acima (formulários) — mesma tradução, uma entrada só.
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Mais": { en: "More", es: "Más" },
  "Concluir e Voltar ao Início": {
    en: "Finish and Back to Home",
    es: "Concluir y Volver al Inicio",
  },
  "Sticker copiado! Cole no Story do Instagram.": {
    en: "Sticker copied! Paste it into your Instagram Story.",
    es: "¡Sticker copiado! Pégalo en tu Historia de Instagram.",
  },
  "Imagem salva no aparelho.": {
    en: "Image saved to your device.",
    es: "Imagen guardada en tu dispositivo.",
  },
  "Seu aparelho não deixou copiar. A imagem foi salva.": {
    en: "Your device blocked copying. The image was saved instead.",
    es: "Tu dispositivo no permitió copiar. La imagen fue guardada.",
  },
  "Não foi possível copiar nem salvar a imagem.": {
    en: "Could not copy or save the image.",
    es: "No fue posible copiar ni guardar la imagen.",
  },
  "Não foi possível salvar a imagem.": {
    en: "Could not save the image.",
    es: "No fue posible guardar la imagen.",
  },
  "Não foi possível gerar a imagem do treino.": {
    en: "Could not generate the workout image.",
    es: "No fue posible generar la imagen del entrenamiento.",
  },

  // --- modelo de treino com plano (ADR-010) ---
  "Reps e peso são opcionais. Em branco, o app usa a sua última série daquele exercício.":
    {
      en: "Reps and weight are optional. Left blank, the app uses your last set of that exercise.",
      es: "Reps y peso son opcionales. En blanco, la app usa tu última serie de ese ejercicio.",
    },

  // --- app/catalogo/[id]/page.tsx ---
  "Exercícios": { en: "Exercises", es: "Ejercicios" },
  "Instruções Técnicas": { en: "Technical Instructions", es: "Instrucciones Técnicas" },
  "Dica técnica de execução ainda não cadastrada.": {
    en: "Technical execution tip not registered yet.",
    es: "Consejo técnico de ejecución aún no registrado.",
  },
  "registro": { en: "record", es: "registro" },
  "registros": { en: "records", es: "registros" },
  "Nenhuma série valendo registrada ainda para": {
    en: "No working set logged yet for",
    es: "Aún no hay serie válida registrada para",
  },

  // --- components/etiqueta-recorde.tsx ---
  "recorde": { en: "record", es: "récord" },

  // --- components/anilhas-form.tsx ---
  "Peso da anilha precisa ser um número positivo.": {
    en: "Plate weight must be a positive number.",
    es: "El peso del disco debe ser un número positivo.",
  },
  "Peso da barra precisa ser um número positivo.": {
    en: "Bar weight must be a positive number.",
    es: "El peso de la barra debe ser un número positivo.",
  },
  "Peso da barra (kg)": { en: "Bar weight (kg)", es: "Peso de la barra (kg)" },
  "Peso da barra em kg": { en: "Bar weight in kg", es: "Peso de la barra en kg" },
  "Anilhas disponíveis": { en: "Available plates", es: "Discos disponibles" },
  "Nenhuma anilha configurada ainda.": { en: "No plates configured yet.", es: "Aún no hay discos configurados." },
  "Remover anilha de": { en: "Remove plate of", es: "Quitar disco de" },
  "Adicionar anilha (kg)": { en: "Add plate (kg)", es: "Agregar disco (kg)" },
  "Adicionar": { en: "Add", es: "Agregar" },
  "Salvar configuração": { en: "Save configuration", es: "Guardar configuración" },
  "Configuração salva.": { en: "Configuration saved.", es: "Configuración guardada." },
  "Calculadora de Carga": { en: "Load Calculator", es: "Calculadora de Carga" },
  "Peso alvo (kg)": { en: "Target weight (kg)", es: "Peso objetivo (kg)" },
  "De cada lado da barra:": { en: "On each side of the bar:", es: "De cada lado de la barra:" },
  "kg / lado": { en: "kg / side", es: "kg / lado" },
  "Só a barra, sem anilha de cada lado.": {
    en: "Just the bar, no plates on each side.",
    es: "Solo la barra, sin discos de cada lado.",
  },
  "Total:": { en: "Total:", es: "Total:" },
  "mais próximo do alvo": { en: "closest to target", es: "más cercano al objetivo" },
  "exato": { en: "exact", es: "exacto" },

  // --- app/ajustes/anilhas/page.tsx ---
  "Anilhas": { en: "Plates", es: "Discos" },
  "Entre para configurar suas anilhas.": { en: "Sign in to configure your plates.", es: "Inicia sesión para configurar tus discos." },

  // --- components/lista-modelos.tsx / excluir-modelo.tsx ---
  "Nenhum modelo criado ainda.": { en: "No templates created yet.", es: "Aún no hay modelos creados." },
  "Excluir modelo": { en: "Delete template", es: "Eliminar modelo" },
  "Excluir o modelo": { en: "Delete the template", es: "Eliminar el modelo" },
  "A lista de exercícios some — os treinos já registrados a partir dela não são afetados. Não dá para desfazer.": {
    en: "The exercise list disappears — workouts already logged from it are not affected. This can't be undone.",
    es: "La lista de ejercicios desaparece — los entrenamientos ya registrados a partir de ella no se ven afectados. Esto no se puede deshacer.",
  },

  // --- app/ajustes/modelos/page.tsx ---
  "Listas de exercícios pra reaproveitar ao iniciar um treino — sem série, peso ou reps. Isso continua sendo preenchido normalmente no dia.": {
    en: "Exercise lists to reuse when starting a workout — no sets, weight, or reps. Those are still filled in normally on the day.",
    es: "Listas de ejercicios para reutilizar al iniciar un entrenamiento — sin series, peso ni repeticiones. Eso se sigue completando normalmente en el día.",
  },
  "Criar modelo": { en: "Create template", es: "Crear modelo" },

  // --- components/coach-interativo.tsx ---
  "Sessão expirada. Faça login novamente.": { en: "Session expired. Sign in again.", es: "Sesión expirada. Inicia sesión de nuevo." },
  "Falha ao consultar o coach.": { en: "Failed to reach the coach.", es: "Fallo al consultar al coach." },
  "Falha de rede. Tente de novo.": { en: "Network error. Try again.", es: "Fallo de red. Intenta de nuevo." },
  "Você usou as {n} perguntas de hoje. O limite existe para sobrar cota da Análise Semanal — ele volta amanhã.": {
    en: "You have used today's {n} questions. The limit exists to leave quota for the Weekly Analysis — it resets tomorrow.",
    es: "Usaste las {n} preguntas de hoy. El límite existe para dejar cuota al Análisis Semanal — vuelve mañana.",
  },
  "Assistente de Treino 24h": { en: "24h Training Assistant", es: "Asistente de Entrenamiento 24h" },
  "Tire dúvidas sobre periodização, fadiga e progressão com base nas suas métricas reais.": {
    en: "Ask about periodization, fatigue, and progression based on your real metrics.",
    es: "Resuelve dudas sobre periodización, fatiga y progresión basadas en tus métricas reales.",
  },
  "Sugestões de perguntas:": { en: "Suggested questions:", es: "Preguntas sugeridas:" },
  "Analisando seus dados…": { en: "Analyzing your data…", es: "Analizando tus datos…" },
  "Pergunte ao coach…": { en: "Ask the coach…", es: "Pregúntale al coach…" },
  "Enviar pergunta": { en: "Send question", es: "Enviar pregunta" },

  // --- app/coach/page.tsx ---
  "Coach": { en: "Coach", es: "Coach" },
  "Consultoria": { en: "Coaching", es: "Asesoría" },

  // --- components/analise-interativa.tsx ---
  "Falha ao gerar o parecer (erro": { en: "Failed to generate the report (error", es: "Fallo al generar el informe (error" },
  "Falha de rede ao gerar o parecer. Tente novamente.": {
    en: "Network error generating the report. Try again.",
    es: "Fallo de red al generar el informe. Intenta de nuevo.",
  },
  "Análise semanal": { en: "Weekly analysis", es: "Análisis semanal" },
  // Duas frases, dois assuntos — ver o comentário em analise-interativa.tsx.
  "O gráfico de progressão precisa de": {
    en: "The progress chart needs",
    es: "El gráfico de progresión necesita",
  },
  "treinos do mesmo exercício.": {
    en: "sessions of the same exercise.",
    es: "sesiones del mismo ejercicio.",
  },
  "A análise semanal precisa de": {
    en: "The weekly analysis needs",
    es: "El análisis semanal necesita",
  },
  "semanas fechadas — você tem": {
    en: "closed weeks — you have",
    es: "semanas cerradas — tienes",
  },
  "Parecer em emissão": { en: "Report in progress", es: "Informe en emisión" },
  "escrevendo a leitura": { en: "writing the readout", es: "escribiendo la lectura" },
  "Confira em Ajustes > Relatórios em instantes.": {
    en: "Check Settings > Reports in a few moments.",
    es: "Consulta Ajustes > Informes en unos instantes.",
  },
  "Já existe uma análise em andamento. Aguarde ela terminar.": {
    en: "There's already an analysis in progress. Wait for it to finish.",
    es: "Ya hay un análisis en curso. Espera a que termine.",
  },
  "Análise em andamento": { en: "Analysis in progress", es: "Análisis en curso" },
  // Módulo Personal (PRD §11.2 e §11.4.2) — entraram na /analise com a
  // fatia da prescrição e ficaram sem tradução até 2026-09-12: a tela é
  // inteiramente traduzida, e estas três eram as únicas em pt-BR no meio
  // de uma /analise em inglês ou espanhol.
  "O que mudar na próxima semana é de": {
    en: "What to change next week is up to",
    es: "Lo que cambiar la próxima semana le corresponde a",
  },
  "desde": { en: "since", es: "desde" },
  "Quem monta a próxima semana é o seu personal. Essa pergunta volta para você se o vínculo terminar.": {
    en: "Your personal trainer plans next week. This question comes back to you if the link ends.",
    es: "Tu entrenador personal arma la próxima semana. Esta pregunta vuelve a ti si el vínculo termina.",
  },

  // --- components/alerta-deload.tsx ---
  "Suas séries valendo estão mais difíceis do que o normal:": {
    en: "Your working sets are harder than usual:",
    es: "Tus series válidas están más difíciles de lo normal:",
  },
  "delas foram próximas da falha esta semana, contra": {
    en: "of them were close to failure this week, versus",
    es: "de ellas estuvieron cerca del fallo esta semana, contra",
  },
  "nas semanas anteriores. Pode ser hora de uma semana mais leve.": {
    en: "in the previous weeks. It might be time for a lighter week.",
    es: "en las semanas anteriores. Puede ser hora de una semana más ligera.",
  },

  // --- components/bloco-evidencia.tsx ---
  "Alta": { en: "Up", es: "Alza" },
  "Platô": { en: "Plateau", es: "Meseta" },
  "Queda": { en: "Down", es: "Baja" },
  "semanas": { en: "weeks", es: "semanas" },
  "calculado no dispositivo": { en: "calculated on device", es: "calculado en el dispositivo" },

  // --- components/parecer.tsx ---
  "Semana de": { en: "Week of", es: "Semana del" },
  "Emitido em": { en: "Issued on", es: "Emitido el" },
  "Não foi possível gerar a interpretação por IA desta vez. O texto abaixo é um resumo determinístico dos seus dados, sem prosa gerada — não é o parecer normal.": {
    en: "The AI interpretation could not be generated this time. The text below is a deterministic summary of your data, no generated prose — this is not the normal report.",
    es: "No fue posible generar la interpretación por IA esta vez. El texto de abajo es un resumen determinístico de tus datos, sin prosa generada — no es el informe normal.",
  },
  "Ressalvas do método": { en: "Method caveats", es: "Advertencias del método" },
  "A faixa de referência de volume é uma convenção prática, baseada majoritariamente em homens jovens treinados — não tem teto validado.": {
    en: "The volume reference range is a practical convention, based mostly on trained young men — it has no validated ceiling.",
    es: "El rango de referencia de volumen es una convención práctica, basada mayoritariamente en hombres jóvenes entrenados — no tiene techo validado.",
  },
  '"Estagnação" de N semanas é uma convenção de mercado, não um critério clínico.': {
    en: '"Stagnation" of N weeks is a market convention, not a clinical criterion.',
    es: '"Estancamiento" de N semanas es una convención de mercado, no un criterio clínico.',
  },
  "e1RM calculado acima do teto de reps não é reportado — a fórmula perde precisão nessa faixa.": {
    en: "e1RM calculated above the rep ceiling is not reported — the formula loses precision in that range.",
    es: "El e1RM calculado por encima del techo de repeticiones no se reporta — la fórmula pierde precisión en ese rango.",
  },

  // --- components/grafico-progressao.tsx ---
  "subiu": { en: "went up", es: "subió" },
  "caiu": { en: "went down", es: "bajó" },
  "ficou estável": { en: "stayed stable", es: "se mantuvo estable" },
  "entre": { en: "between", es: "entre" },
  "Platô há": { en: "Plateaued for", es: "Meseta hace" },
  "semanas.": { en: "weeks.", es: "semanas." },
  "melhor marca:": { en: "best mark:", es: "mejor marca:" },
  "semana de": { en: "week of", es: "semana del" },
  "Não foi possível carregar o gráfico de progressão agora.": {
    en: "Couldn't load the progression chart right now.",
    es: "No se pudo cargar el gráfico de progresión ahora.",
  },
  "Progressão": { en: "Progression", es: "Progresión" },
  "Carregando progressão": { en: "Loading progression", es: "Cargando progresión" },
  "Ainda não há sessões suficientes de nenhum exercício pra desenhar progressão — registre pelo menos 2 treinos com o mesmo exercício.": {
    en: "There aren't enough sessions of any exercise yet to chart progression — log at least 2 workouts with the same exercise.",
    es: "Aún no hay suficientes sesiones de ningún ejercicio para trazar progresión — registra al menos 2 entrenamientos con el mismo ejercicio.",
  },
  "Progressão de": { en: "Progression of", es: "Progresión de" },

  // --- components/cabecalho-pro.tsx ---
  "Voltar": { en: "Back", es: "Volver" },
  "Perfil do atleta": { en: "Athlete profile", es: "Perfil del atleta" },

  // --- app/analise/page.tsx ---
  "Análise Semanal": { en: "Weekly Analysis", es: "Análisis Semanal" },
  "Ciclo": { en: "Cycle", es: "Ciclo" },

  // --- components/editar-perfil.tsx / validar-avatar.ts / atualizar-avatar.ts / app/perfil ---
  "Envie uma foto em JPEG ou PNG.": { en: "Upload a JPEG or PNG photo.", es: "Sube una foto en JPEG o PNG." },
  "A foto precisa ter até 5 MB.": { en: "The photo must be up to 5 MB.", es: "La foto debe tener hasta 5 MB." },
  "Não foi possível enviar a foto. Tente de novo.": { en: "Couldn't upload the photo. Try again.", es: "No se pudo subir la foto. Intenta de nuevo." },
  "Foto enviada, mas não deu para salvar o perfil. Tente de novo.": {
    en: "Photo uploaded, but couldn't save the profile. Try again.",
    es: "Foto subida, pero no se pudo guardar el perfil. Intenta de nuevo.",
  },
  "Escolher foto de perfil": { en: "Choose profile photo", es: "Elegir foto de perfil" },
  "Enviando…": { en: "Uploading…", es: "Subiendo…" },
  "Trocar foto": { en: "Change photo", es: "Cambiar foto" },
  "Perfil": { en: "Profile", es: "Perfil" },
  "Entre para editar seu perfil.": { en: "Sign in to edit your profile.", es: "Inicia sesión para editar tu perfil." },

  // --- components/rastreador-disciplina.tsx ---
  "Rastreador de disciplina semanal": { en: "Weekly discipline tracker", es: "Rastreador de disciplina semanal" },
  "Disciplina Semanal": { en: "Weekly Discipline", es: "Disciplina Semanal" },
  "dia seguido": { en: "day streak", es: "día seguido" },
  "dias seguidos": { en: "day streak", es: "días seguidos" },

  // --- app/ajustes/page.tsx (Relatórios & Stickers) / app/ajustes/relatorios/page.tsx ---
  // F5 do relatório de estado (2026-08-26): 21 strings sem tradução,
  // concentradas nas features mais novas (Stories, player 3D, timer).
  "Relatórios & Stickers": { en: "Reports & Stickers", es: "Informes y Stickers" },
  "Exportar imagem de treino para Stories": {
    en: "Export a workout image for Stories",
    es: "Exportar una imagen de entrenamiento para Stories",
  },
  "Exportar Meus Dados (CSV)": { en: "Export My Data (CSV)", es: "Exportar Mis Datos (CSV)" },
  "Histórico e Stories": { en: "History & Stories", es: "Historial y Stories" },
  "Nenhum treino registrado ainda": { en: "No workouts logged yet", es: "Aún no hay entrenamientos registrados" },
  "Ir para Treinos": { en: "Go to Workouts", es: "Ir a Entrenamientos" },
  "Selecione qualquer treino passado para visualizar as estatísticas e exportar o sticker oficial transparente (1080×1080) para Instagram Stories.": {
    en: "Select any past workout to view the stats and export the official transparent sticker (1080×1080) for Instagram Stories.",
    es: "Selecciona cualquier entrenamiento pasado para ver las estadísticas y exportar el sticker oficial transparente (1080×1080) para Instagram Stories.",
  },
  "Assim que você concluir sua primeira sessão de treino, ela aparecerá aqui com métricas completas e opções de sticker.": {
    en: "Once you finish your first workout session, it'll show up here with full metrics and sticker options.",
    es: "En cuanto termines tu primera sesión de entrenamiento, aparecerá aquí con métricas completas y opciones de sticker.",
  },

  // --- app/catalogo/[id]/page.tsx ---
  "Biomecânica & Instruções Técnicas": {
    en: "Biomechanics & Technical Instructions",
    es: "Biomecánica e Instrucciones Técnicas",
  },
  "Músculo Alvo": { en: "Target Muscle", es: "Músculo Objetivo" },
  "Sinergistas": { en: "Synergists", es: "Sinergistas" },
  "Mecânica Articular": { en: "Joint Mechanics", es: "Mecánica Articular" },
  "Histórico de Séries": { en: "Set History", es: "Historial de Series" },
  // Achado da auditoria independente (PR #160): chamadas t(...) MULTI-LINHA
  // escapavam do script de varredura (regex de linha única) — ficavam em
  // português cru mesmo em EN/ES. Corrigido aqui; ver PROGRESS.md.

  // --- components/historico-relatorios-pos-treino.tsx ---
  "VOLUME": { en: "VOLUME", es: "VOLUMEN" },
  "Carregando...": { en: "Loading...", es: "Cargando..." },
  "Gerar Imagem / Sticker Story": { en: "Generate Image / Story Sticker", es: "Generar Imagen / Sticker de Historia" },

  // --- components/player-execucao-exercicio.tsx ---
  "Foco:": { en: "Focus:", es: "Enfoque:" },
  "Animação Ativa": { en: "Animation Active", es: "Animación Activa" },

  // --- components/timer-topo.tsx ---
  "Treino": { en: "Workout", es: "Entrenamiento" },
  "Descanso": { en: "Rest", es: "Descanso" },
  "Retomar": { en: "Resume", es: "Reanudar" },
  "Pausar": { en: "Pause", es: "Pausar" },
  "Pronto!": { en: "Done!", es: "¡Listo!" },

  // --- components/analise-interativa.tsx / pareceres-salvos.tsx ---
  // Nota: "Salvando…", "Não foi possível salvar. Tente de novo." e
  // "Excluindo…" já existem no dicionário (meta-semanal-form.tsx /
  // excluir-conta.tsx) com o mesmo texto em PT-BR — reaproveitados via
  // t(), não duplicados aqui (chave é o texto em PT-BR; duplicar quebraria
  // no-dupe-keys do lint).
  "Salvar este parecer": { en: "Save this analysis", es: "Guardar este informe" },
  "Salvo": { en: "Saved", es: "Guardado" },
  "Pareceres salvos": { en: "Saved analyses", es: "Informes guardados" },
  "Baixar PDF": { en: "Download PDF", es: "Descargar PDF" },
  "Ver parecer": { en: "View analysis", es: "Ver informe" },
  "Excluir parecer salvo": { en: "Delete saved analysis", es: "Eliminar informe guardado" },
  "Excluir este parecer apaga o registro salvo — não afeta seus treinos nem séries. Não dá para desfazer.": {
    en: "Deleting this analysis removes the saved record — it doesn't affect your workouts or sets. Can't be undone.",
    es: "Eliminar este informe borra el registro guardado — no afecta tus entrenamientos ni series. No se puede deshacer.",
  },
  "Falha ao baixar o PDF. Tente de novo.": {
    en: "Failed to download the PDF. Try again.",
    es: "Error al descargar el PDF. Intenta de nuevo.",
  },
  "Baixando…": { en: "Downloading…", es: "Descargando…" },
  "Descartar": { en: "Discard", es: "Descartar" },
  "Descartar rascunho": { en: "Discard draft", es: "Descartar borrador" },
  "Descartando…": { en: "Discarding…", es: "Descartando…" },
  "Descartar apaga este rascunho — não dá para desfazer. Pedir outro parecer exige uma nova geração, que leva alguns minutos.": {
    en: "Discarding deletes this draft — it can't be undone. Getting another analysis requires a new generation, which takes a few minutes.",
    es: "Descartar borra este borrador — no se puede deshacer. Pedir otro informe exige una nueva generación, que tarda algunos minutos.",
  },
  "Gerando…": { en: "Generating…", es: "Generando…" },
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Revisar e salvar": { en: "Review and save", es: "Revisar y guardar" },
  // --- lib/pdf/documento-parecer.tsx (PDF do parecer, SDD §10.4) ---
  "Evidência": { en: "Evidence", es: "Evidencia" },
  "Sinal": { en: "Signal", es: "Señal" },
  // Abreviação de "semanas" no cabeçalho da tabela — precede o número da
  // janela ("4 SEM"). Chave curta de propósito: a coluna é estreita.
  "sem": { en: "wks", es: "sem" },
  "semanas sem novo máximo": { en: "weeks without a new max", es: "semanas sin nuevo máximo" },
  "Documento emitido pelo lastro · não substitui acompanhamento profissional": {
    en: "Document issued by lastro · does not replace professional guidance",
    es: "Documento emitido por lastro · no sustituye el acompañamiento profesional",
  },

  // --- components/treino-detalhe.tsx (finalizar / reabrir treino) ---
  "Reabrir treino": { en: "Reopen workout", es: "Reabrir entrenamiento" },
  "Finalizar o treino? O cronômetro para e o registro fecha — dá para reabrir depois.": {
    en: "Finish the workout? The timer stops and logging closes — you can reopen it later.",
    es: "¿Finalizar el entrenamiento? El cronómetro se detiene y el registro se cierra — puedes reabrirlo después.",
  },

  // --- lib/texto/aviso-falha.ts (por que a IA não saiu, migration 0019) ---
  "O texto abaixo é um resumo determinístico dos seus dados, sem prosa gerada — não é o parecer normal.": {
    en: "The text below is a deterministic summary of your data, no generated prose — this is not the normal report.",
    es: "El texto de abajo es un resumen determinístico de tus datos, sin prosa generada — no es el informe normal.",
  },
  "Não foi possível gerar a interpretação por IA desta vez.": {
    en: "The AI interpretation could not be generated this time.",
    es: "No fue posible generar la interpretación por IA esta vez.",
  },
  "A IA não respondeu desta vez — o serviço estava indisponível. Tentar de novo em alguns minutos costuma resolver.": {
    en: "The AI did not respond this time — the service was unavailable. Trying again in a few minutes usually works.",
    es: "La IA no respondió esta vez — el servicio no estaba disponible. Intentar de nuevo en unos minutos suele resolver.",
  },
  "O limite de uso da IA foi atingido por enquanto. Ela volta a funcionar quando a cota renovar.": {
    en: "The AI usage limit has been reached for now. It works again once the quota resets.",
    es: "Se alcanzó el límite de uso de la IA por ahora. Vuelve a funcionar cuando la cuota se renueve.",
  },
  "A IA não pôde ser consultada: o modelo não estava disponível. Isso é falha nossa, não sua.": {
    en: "The AI could not be reached: the model was unavailable. That is on us, not on you.",
    es: "No se pudo consultar la IA: el modelo no estaba disponible. Es fallo nuestro, no tuyo.",
  },
  "A IA não respondeu desta vez, por um erro que não soubemos identificar.": {
    en: "The AI did not respond this time, due to an error we could not identify.",
    es: "La IA no respondió esta vez, por un error que no supimos identificar.",
  },
  "A interpretação gerada citou números que não batem com os seus dados, então foi descartada.": {
    en: "The generated interpretation cited numbers that do not match your data, so it was discarded.",
    es: "La interpretación generada citó números que no coinciden con tus datos, así que fue descartada.",
  },

  // --- components/analise-interativa.tsx (teto diário de gerações) ---
  "Você já gerou": { en: "You have already generated", es: "Ya generaste" },
  "análises hoje — o limite diário existe para não esgotar a cota que o Coach também usa. Amanhã libera.": {
    en: "analyses today — the daily limit exists so the quota the Coach also uses is not drained. It resets tomorrow.",
    es: "análisis hoy — el límite diario existe para no agotar la cuota que el Coach también usa. Mañana se libera.",
  },
  // --- cobertura i18n inicial da área de trabalho ---
  "Fila": { en: "Queue", es: "Pendientes" },
  "Alunos": { en: "Clients", es: "Alumnos" },
  "Modo do app": { en: "App mode", es: "Modo de la aplicación" },
  "Nada pede atenção nesta semana.": {
    en: "Nothing needs attention this week.",
    es: "Nada necesita atención esta semana.",
  },
  "Sessão expirada. Entre novamente.": {
    en: "Your session expired. Sign in again.",
    es: "Tu sesión venció. Inicia sesión de nuevo.",
  },
};

export function possuiTraducao(chavePtBr: string): boolean {
  return Object.hasOwn(DICIONARIO, chavePtBr);
}

export function t(chavePtBr: string, idioma: Idioma): string {
  if (idioma === "pt-BR") return chavePtBr;
  const entrada = DICIONARIO[chavePtBr];
  if (!entrada) return chavePtBr;
  return entrada[idioma];
}
