/**
 * lastro · roteador de perguntas do Coach (AN-08 M1). Decide, SEM LLM, se a
 * pergunta tem resposta calculada pelo próprio lastro ou é recusa conhecida.
 * Na dúvida devolve `null` e a pergunta segue para a Gemini como antes: o
 * pior caso é o comportamento de hoje, nunca uma resposta errada com número
 * certo. Regra que não tem certeza não entra.
 */

export type IntentDados =
  | "VOLUME_SEMANA"
  | "GRUPO_MAIS_VOLUME"
  | "TREINOS_NA_SEMANA"
  | "GRUPO_MENOS_FREQUENTE"
  | "DIAS_SEM_GRUPO"
  | "FREQUENCIA_COMPARADA"
  | "SEQUENCIA_DIAS"
  | "RESUMO_SEMANA";

export type IntentRecusa = "SAUDE" | "EXECUCAO" | "PRESCRICAO";

export type Classificacao =
  | { intent: IntentRecusa }
  | { intent: Exclude<IntentDados, "DIAS_SEM_GRUPO"> }
  | { intent: "DIAS_SEM_GRUPO"; grupo: string };

export type ClassificacaoDados = Exclude<Classificacao, { intent: IntentRecusa }>;

export function ehRecusa(c: Classificacao): c is { intent: IntentRecusa } {
  return c.intent === "SAUDE" || c.intent === "EXECUCAO" || c.intent === "PRESCRICAO";
}

/** Minúsculas, sem acento, sem pontuação, espaço simples. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chave do banco (`grupo_muscular.id`) → como a pessoa escreve, em pt/en/es, já normalizado. */
const ALIASES_GRUPO: Record<string, string[]> = {
  peito: ["peito", "peitoral", "peitorais", "chest", "pecs", "pecho", "pectoral", "pectorales"],
  costas: ["costas", "dorsal", "dorsais", "back", "espalda"],
  ombro: ["ombro", "ombros", "deltoide", "deltoides", "shoulder", "shoulders", "hombro", "hombros"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  antebraco: ["antebraco", "antebracos", "forearm", "forearms", "antebrazo", "antebrazos"],
  quadriceps: ["quadriceps", "quads", "cuadriceps"],
  posterior_coxa: [
    "posterior de coxa",
    "posteriores de coxa",
    "posterior",
    "isquiotibiais",
    "isquiotibiales",
    "hamstring",
    "hamstrings",
  ],
  gluteo: ["gluteo", "gluteos", "glute", "glutes"],
  panturrilha: ["panturrilha", "panturrilhas", "calf", "calves", "pantorrilla", "pantorrillas", "gemelos"],
  abdomen: ["abdomen", "abdominal", "abdominais", "abs", "abdominales"],
};

/** Um grupo citado, `"varios"` se mais de um (ambíguo), `null` se nenhum. */
export function grupoCitado(textoNormalizado: string): string | "varios" | null {
  const comBordas = ` ${textoNormalizado} `;
  const achados = Object.entries(ALIASES_GRUPO)
    .filter(([, aliases]) => aliases.some((a) => comBordas.includes(` ${a} `)))
    .map(([id]) => id);
  if (achados.length === 0) return null;
  return achados.length === 1 ? achados[0] : "varios";
}

const tem = (texto: string, padrao: RegExp) => padrao.test(texto);

const SAUDE = /\b(dor|dores|doi|doem|doendo|lesao|lesionei|machuquei|machucado|formigamento|formigando|tontura|pain|hurts?|injury|injured|dizzy|dolor|duele|duelen|lesion|mareo)\b/;
const EXECUCAO = /\b(execucao|executar|executo|postura|pegada|technique|ejecucion|ejecutar|forma correta)\b/;
const PRESCRICAO =
  /\b(devo|deveria|should i|debo|deberia)\b.*\b(aumentar|diminuir|subir|baixar|trocar|mudar|increase|decrease|change|bajar|cambiar)\b|\bo que (devo )?mudar\b|\bwhat should i change\b|\bque (debo )?cambiar\b|\b(monta|montar|monte|crie|criar|gere|gerar)\b.*\b(treino|ficha|programa|plano)\b|\b(build|create|make)\b.*\b(workout|program|plan)\b|\b(arma|armar|crea|crear)\b.*\b(rutina|entrenamiento|plan)\b/;

const SEMANA = /\b(semana|week)\b/;
const PALAVRA_GRUPO = /\b(grupo|grupos|musculo|musculos|muscle|muscles|group|groups)\b/;
const TREINAR = /\b(trein\w*|train\w*|entren\w*|frequen\w*|frecuen\w*)\b/;

export function classificar(pergunta: string): Classificacao | null {
  const texto = normalizar(pergunta);
  if (!texto) return null;

  if (tem(texto, SAUDE)) return { intent: "SAUDE" };
  if (tem(texto, EXECUCAO)) return { intent: "EXECUCAO" };
  if (tem(texto, PRESCRICAO)) return { intent: "PRESCRICAO" };

  const grupo = grupoCitado(texto);
  // Pergunta sobre mais de um grupo ao mesmo tempo ainda não tem resposta
  // local; responder um só seria responder outra pergunta.
  if (grupo === "varios") return null;

  if (
    tem(texto, /\b(streak|sequencia|racha)\b/) ||
    tem(texto, /\b(dias|days)\b.*\b(seguidos|consecutivos|in a row|straight)\b/)
  ) {
    return { intent: "SEQUENCIA_DIAS" };
  }

  if (grupo) {
    if (
      tem(
        texto,
        /\b(quanto tempo|ha quanto|faz quanto|desde quando|ultima vez|how long|last time|when did i last|cuanto tiempo|hace cuanto)\b/,
      )
    ) {
      return { intent: "DIAS_SEM_GRUPO", grupo };
    }
    // Volume, frequência ou resumo DE UM GRUPO ainda não tem resposta local.
    return null;
  }

  if (tem(texto, PALAVRA_GRUPO) && tem(texto, /\b(menos|menor|least|less|fewer)\b/) && tem(texto, TREINAR)) {
    return { intent: "GRUPO_MENOS_FREQUENTE" };
  }
  if (
    tem(texto, PALAVRA_GRUPO) &&
    tem(texto, /\b(mais|maior|most|more|mas|mayor)\b/) &&
    tem(texto, /\b(volume|volumen|trein\w*|train\w*|entren\w*|series|sets)\b/)
  ) {
    return { intent: "GRUPO_MAIS_VOLUME" };
  }
  if (
    tem(texto, /\b(quant[oa]s|how many|how often|cuant[oa]s)\b/) &&
    tem(texto, /\b(treino|treinos|treinei|vezes|workouts?|trained|times|entrenamientos?|entrenos?|entrene|veces)\b/) &&
    tem(texto, SEMANA)
  ) {
    return { intent: "TREINOS_NA_SEMANA" };
  }
  if (tem(texto, /\b(volume|volumen|tonelagem|tonnage|tonelaje)\b/) && tem(texto, SEMANA)) {
    return { intent: "VOLUME_SEMANA" };
  }
  if (tem(texto, /\b(frequencia|frequency|frecuencia)\b/)) {
    return { intent: "FREQUENCIA_COMPARADA" };
  }
  if (tem(texto, /\b(como foi|como esta|resumo|resuma|how was|how is|summary|summarize|como fue|como va|resumen)\b/) && tem(texto, SEMANA)) {
    return { intent: "RESUMO_SEMANA" };
  }
  return null;
}
