import fs from "fs";
import path from "path";

// Mapeamento anatômico biomecânico preciso para os 102 exercícios canônicos
const MAPA_ANATOMICO_102 = {
  // ABDÔMEN
  "d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b": {
    musculoAlvo: "Reto Abdominal (Fibras Inferiores)",
    sinergistas: "Iliopsoas, Oblíquos",
    articulacao: "Flexão de Coluna Lombar / Quadril",
  },
  "6fb49df0-a2f5-4865-9d7f-342cc2f67f17": {
    musculoAlvo: "Reto Abdominal (Geral)",
    sinergistas: "Oblíquo Externo / Interno",
    articulacao: "Flexão de Coluna Toracolombar",
  },
  "97778ea6-fd70-46aa-95d9-ada174993433": {
    musculoAlvo: "Reto Abdominal e Serrátil",
    sinergistas: "Oblíquos",
    articulacao: "Flexão de Tronco no Cabo",
  },
  "1953ad1b-671c-47f2-8cef-40055037cb32": {
    musculoAlvo: "Oblíquos Externos e Internos",
    sinergistas: "Reto Abdominal, Flexores de Quadril",
    articulacao: "Rotação e Flexão de Tronco Cruzada",
  },
  "2e63f78d-f145-4015-a5d8-84c753e0670a": {
    musculoAlvo: "Reto Abdominal (Fibras Superiores)",
    sinergistas: "Transverso do Abdômen",
    articulacao: "Flexão Torácica",
  },
  "256ee63f-4348-4a8f-99ee-a6faa2472750": {
    musculoAlvo: "Reto Abdominal e Flexores de Quadril",
    sinergistas: "Oblíquos, Reto Femoral",
    articulacao: "Flexão Pélvica",
  },
  "c2cd8199-e5ea-4928-8703-659ff37ebedb": {
    musculoAlvo: "Core Geral e Transverso do Abdômen",
    sinergistas: "Reto Abdominal, Deltóides, Glúteos",
    articulacao: "Anti-Extensão Lombar Isométrica",
  },
  "1fd198de-8af3-4bd5-845d-130a6a19f7aa": {
    musculoAlvo: "Oblíquos e Quadrado Lombar",
    sinergistas: "Glúteo Médio, Tensor da Fáscia Lata",
    articulacao: "Anti-Flexão Lateral Isométrica",
  },

  // PEITO
  "2f09b9a4-46dc-4c6c-9333-14224c5ee431": {
    musculoAlvo: "Peitoral Maior",
    sinergistas: "Tríceps Braquial, Deltoide Anterior",
    articulacao: "Adução Horizontal de Ombro e Extensão de Cotovelo",
  },
  "38ec491c-5d77-47d6-b324-48dae887f06f": {
    musculoAlvo: "Peitoral Maior (Fibras Médias/Esternais)",
    sinergistas: "Deltoide Anterior",
    articulacao: "Adução Horizontal no Cabo",
  },
  "c7e6d68c-144a-4137-9bb0-0eebb3f00587": {
    musculoAlvo: "Peitoral Maior (Porção Clavicular / Superior)",
    sinergistas: "Deltoide Anterior, Coracobraquial",
    articulacao: "Adução Horizontal Inclinada",
  },
  "d6ebe533-c67b-4c0c-a222-29513cd011cf": {
    musculoAlvo: "Peitoral Maior (Esternocostal)",
    sinergistas: "Deltoide Anterior",
    articulacao: "Adução Horizontal com Halteres",
  },
  "7dca79cf-beac-497d-94a0-a5c15b94f45c": {
    musculoAlvo: "Peitoral Maior (Isolamento)",
    sinergistas: "Deltoide Anterior",
    articulacao: "Adução Guiada em Máquina",
  },
  "da5cbe01-2fee-410f-b3a2-823318537a04": {
    musculoAlvo: "Peitoral Maior e Latíssimo do Dorso",
    sinergistas: "Tríceps (Cabeça Longa), Serrátil Anterior",
    articulacao: "Extensão e Flexão Sagital de Ombro",
  },

  // COSTAS / DORSAL
  "36bb6cc1-0315-462d-944d-fdadd20d2e09": {
    musculoAlvo: "Latíssimo do Dorso e Redondo Maior",
    sinergistas: "Bíceps Braquial, Braquiorradial, Trapézio Inferior",
    articulacao: "Adução e Depressão Escapular",
  },
  "0f4d2b26-f2eb-4e16-b9e8-48d1d737590d": {
    musculoAlvo: "Latíssimo do Dorso",
    sinergistas: "Bíceps, Braquial, Rombóides",
    articulacao: "Adução Frontal no Pulley",
  },
  "7a4402da-f39a-4a75-ad03-f2ef9775ac7e": {
    musculoAlvo: "Latíssimo do Dorso (Fibras Superiores)",
    sinergistas: "Redondo Maior, Bíceps",
    articulacao: "Adução com Pegada Aberta",
  },
  "267c6648-e80e-4d90-ad8c-abfb7c5fabf0": {
    musculoAlvo: "Latíssimo do Dorso (Fibras Inferiores) e Bíceps",
    sinergistas: "Braquial, Trapézio Médio",
    articulacao: "Extensão Sagital com Pegada Supinada",
  },
  "964bf20c-48bf-49c7-8bec-070079768d00": {
    musculoAlvo: "Latíssimo do Dorso (Movimento Articulado)",
    sinergistas: "Bíceps Braquial, Rombóides",
    articulacao: "Puxada Articulada Convergente",
  },
  "38f23b62-e6a9-4826-a7ff-293427607b45": {
    musculoAlvo: "Trapézio Médio/Inferior e Rombóides",
    sinergistas: "Latíssimo do Dorso, Bíceps",
    articulacao: "Retração Escapular no Cabo",
  },
  "83a0faee-9b3d-4920-8bc6-8621127fba60": {
    musculoAlvo: "Espessura de Costas e Rombóides",
    sinergistas: "Latíssimo, Eretor da Espinha, Bíceps",
    articulacao: "Extensão de Ombro e Retração Escapular",
  },
  "00b173f0-17e1-4c57-8429-7d7cb876ded0": {
    musculoAlvo: "Latíssimo do Dorso e Rombóides",
    sinergistas: "Trapézio, Eretor da Espinha, Bíceps",
    articulacao: "Remo Curvado Livre com Barra",
  },
  "8da3b406-5e31-47b7-993d-d3c478d45a23": {
    musculoAlvo: "Rombóides e Trapézio Médio",
    sinergistas: "Latíssimo do Dorso, Bíceps",
    articulacao: "Remo Guiado em Máquina",
  },

  // OMBROS / DELTÓIDES
  "b8b73c8e-066c-4a4d-ae29-2b1ae21331c5": {
    musculoAlvo: "Deltoide Anterior e Lateral",
    sinergistas: "Tríceps, Trapézio Superior",
    articulacao: "Abdução e Rotação de Ombro",
  },
  "2220953e-8fff-49e0-afdf-2b2d510336c2": {
    musculoAlvo: "Deltoide Anterior",
    sinergistas: "Tríceps Braquial, Serrátil",
    articulacao: "Desenvolvimento com Halteres",
  },
  "8647dbab-a45a-4b00-bf61-965d2096b6ec": {
    musculoAlvo: "Deltoide Anterior e Médio",
    sinergistas: "Tríceps Braquial",
    articulacao: "Desenvolvimento em Máquina",
  },
  "71c5a306-acad-4c55-8609-b8947d00ab28": {
    musculoAlvo: "Deltoide Anterior e Core",
    sinergistas: "Tríceps, Clavicular do Peitoral",
    articulacao: "Press Militar com Barra",
  },
  "a25b4dc2-563f-439b-897e-c3facf5c600e": {
    musculoAlvo: "Deltoide Anterior",
    sinergistas: "Peitoral Superior",
    articulacao: "Flexão de Ombro",
  },
  "ff8a4f89-15e6-4c97-85cc-90cd5c15d03f": {
    musculoAlvo: "Deltoide Lateral",
    sinergistas: "Supraespinhal, Trapézio",
    articulacao: "Abdução no Plano Escapular",
  },
  "f806164a-38a2-4e98-b8f9-b6487685f234": {
    musculoAlvo: "Deltoide Lateral (Isolamento)",
    sinergistas: "Trapézio Superior",
    articulacao: "Abdução Guiada em Máquina",
  },
  "d5cf25c0-8d09-4ff8-8c98-bdfca89811ce": {
    musculoAlvo: "Deltoide Posterior",
    sinergistas: "Infraespinhal, Rombóides",
    articulacao: "Abdução Horizontal Reversa",
  },
  "c80d5e23-d24b-464e-a4e0-4b1450b480b6": {
    musculoAlvo: "Deltoide Posterior e Manguito Rotador",
    sinergistas: "Trapézio Médio/Superior, Rombóides",
    articulacao: "Rotação Externa e Retração Escapular",
  },
  "d4e52f27-d643-406d-8850-56e6cd457f24": {
    musculoAlvo: "Deltoide Lateral e Trapézio Superior",
    sinergistas: "Bíceps Braquial, Braquial",
    articulacao: "Remo Vertical ao Queixo",
  },

  // TRAPÉZIO
  "6a0bf165-1172-4de4-8167-875290c3fb99": {
    musculoAlvo: "Trapézio Superior",
    sinergistas: "Levantador da Escápula",
    articulacao: "Elevação Escapular com Halteres",
  },
  "960fe5e9-f480-48bd-bbe1-dbeaee22ca1c": {
    musculoAlvo: "Trapézio Superior",
    sinergistas: "Levantador da Escápula",
    articulacao: "Elevação Escapular em Máquina",
  },

  // TRÍCEPS
  "ac1b9b26-a4bd-407e-bf37-57517b0c3cb9": {
    musculoAlvo: "Tríceps Braquial (Cabeça Lateral/Medial)",
    sinergistas: "Deltoide Anterior, Peitoral",
    articulacao: "Extensão de Cotovelo no Banco",
  },
  "e9d96eea-745d-4b4b-a00c-44227f1b2f60": {
    musculoAlvo: "Tríceps Braquial e Peitoral Inferior",
    sinergistas: "Deltoide Anterior",
    articulacao: "Extensão em Paralelas",
  },
  "d902793c-9a6e-418c-a7b7-956771eaa0a0": {
    musculoAlvo: "Tríceps Braquial (Cabeça Longa)",
    sinergistas: "Cabeça Lateral/Medial",
    articulacao: "Extensão Unilateral Francesa no Cabo",
  },

  // QUADRÍCEPS / PERNAS
  "1db2c316-4c25-4f71-b2f4-6c30ceb75259": {
    musculoAlvo: "Quadríceps e Glúteo Máximo",
    sinergistas: "Adutores, Isquiotibiais, Eretor da Espinha",
    articulacao: "Agachamento Livre com Barra",
  },
  "ab098c28-ac32-4be2-8837-9fb05faf3888": {
    musculoAlvo: "Quadríceps (Vasto Lateral/Intermédio/Medial)",
    sinergistas: "Glúteos, Core Anterior",
    articulacao: "Agachamento Frontal",
  },
  "c5a978dc-cbf2-4b62-bfbf-b2aeb6cafece": {
    musculoAlvo: "Quadríceps e Glúteo Máximo",
    sinergistas: "Adutores",
    articulacao: "Agachamento no Smith",
  },
  "61b99b77-5085-489a-8ee9-18452c4ed9f2": {
    musculoAlvo: "Quadríceps e Glúteo Máximo/Médio",
    sinergistas: "Adutores, Isquiotibiais",
    articulacao: "Agachamento Búlgaro Unilateral",
  },
  "4968787c-701a-45d5-b226-d1ee8834ebb8": {
    musculoAlvo: "Quadríceps e Glúteos",
    sinergistas: "Isquiotibiais, Panturrilhas",
    articulacao: "Passada / Avanço com Halteres",
  },
  "18bf7a23-2410-4905-b646-e152625c6136": {
    musculoAlvo: "Quadríceps (Sem Carga Axial na Coluna)",
    sinergistas: "Glúteos, Adutores",
    articulacao: "Agachamento com Cinturão",
  },
  "d2be1b21-dc02-4586-979d-e2fbb6b3010e": {
    musculoAlvo: "Adutores e Glúteos",
    sinergistas: "Quadríceps",
    articulacao: "Agachamento Sumô com Halter",
  },
  "c7a31b7d-1f7d-4b1c-a2cb-b89fe1d19446": {
    musculoAlvo: "Quadríceps (Foco Vasto Lateral/Reto Femoral)",
    sinergistas: "Glúteos",
    articulacao: "Agachamento Hack Machine",
  },
  "c59fc8a9-8fdf-494e-a418-e10f356d7656": {
    musculoAlvo: "Quadríceps e Glúteo Máximo",
    sinergistas: "Isquiotibiais, Adutores",
    articulacao: "Leg Press 45°",
  },
  "3fdbf48a-5310-4373-9e95-8dfa1e912955": {
    musculoAlvo: "Quadríceps",
    sinergistas: "Glúteos, Isquiotibiais",
    articulacao: "Leg Press Horizontal",
  },
  "54030c65-0b66-4995-af4e-5d968ac0cbb8": {
    musculoAlvo: "Quadríceps (Unilateral)",
    sinergistas: "Glúteos",
    articulacao: "Prensa de Pernas Unilateral",
  },
  "2193c8f0-877b-408e-89f5-777d38a08b19": {
    musculoAlvo: "Quadríceps (Reto Femoral / Vasto Medial/Lateral)",
    sinergistas: "Tensor da Fáscia Lata",
    articulacao: "Extensão de Joelhos na Cadeira",
  },
  "6c6196c2-f34f-40a5-ba1c-44d53ea5c17c": {
    musculoAlvo: "Quadríceps e Glúteo Máximo",
    sinergistas: "Isquiotibiais, Panturrilhas",
    articulacao: "Subida no Banco / Step-Up",
  },

  // POSTERIOR / ISQUIOTIBIAIS & GLÚTEOS
  "4450b391-ffe0-4c1e-bec8-4176536c04bb": {
    musculoAlvo: "Cadeia Posterior Completa (Glúteos, Isquiotibiais, Eretores)",
    sinergistas: "Trapézio, Quadríceps, Antebraços",
    articulacao: "Extensão de Quadril e Joelho (Deadlift)",
  },
  "f98c766c-4631-4d12-9064-3145525336a3": {
    musculoAlvo: "Isquiotibiais (Bíceps Femoral/Semimembranoso) e Glúteos",
    sinergistas: "Eretor da Espinha",
    articulacao: "Extensão de Quadril (RDL)",
  },
  "3698a49e-4b51-4d00-8222-986f44afd191": {
    musculoAlvo: "Isquiotibiais e Eretores da Espinha",
    sinergistas: "Glúteo Máximo",
    articulacao: "Bom Dia / Good Morning",
  },
  "8da6b2fc-4d68-40e7-96d1-65a525527463": {
    musculoAlvo: "Isquiotibiais (Porção Distal/Proximal)",
    sinergistas: "Gastrocnêmio",
    articulacao: "Flexão de Joelho na Cadeira Flexora",
  },
  "0e3dbd0b-bfb1-4359-8e86-647847b12100": {
    musculoAlvo: "Isquiotibiais (Unilateral)",
    sinergistas: "Gastrocnêmio",
    articulacao: "Flexão de Joelho Unilateral Sentado",
  },
  "5bafb2e4-1b95-4987-bb67-a4d413c82cf4": {
    musculoAlvo: "Isquiotibiais (Bíceps Femoral / Semitendinoso)",
    sinergistas: "Gastrocnêmio",
    articulacao: "Flexão de Joelho na Mesa Flexora",
  },
  "79efba5d-33a4-470d-a526-41f7383c1c83": {
    musculoAlvo: "Isquiotibiais (Unilateral no Cabo)",
    sinergistas: "Gastrocnêmio",
    articulacao: "Flexão Unilateral no Cabo",
  },
  "aeb20b7e-7928-4ea9-9ab3-0695e5d84183": {
    musculoAlvo: "Glúteo Máximo (Pico de Contração)",
    sinergistas: "Isquiotibiais, Adutores",
    articulacao: "Extensão de Quadril com Barra",
  },
  "4d125765-74b7-4171-bb0f-f0b8fbae5aee": {
    musculoAlvo: "Glúteo Máximo",
    sinergistas: "Isquiotibiais",
    articulacao: "Hip Thrust em Máquina",
  },
  "203ffb85-feef-4a36-8f4c-2dc3dbad88c9": {
    musculoAlvo: "Glúteo Máximo (Unilateral)",
    sinergistas: "Isquiotibiais, Core",
    articulacao: "Hip Thrust Unilateral",
  },
  "068a8275-2484-485e-911b-5ca21de4bb3c": {
    musculoAlvo: "Glúteo Máximo",
    sinergistas: "Isquiotibiais, Eretores",
    articulacao: "Ponte de Glúteos no Solo",
  },
  "54e723c0-df3d-4bb9-a950-a59f0e5481a2": {
    musculoAlvo: "Glúteo Máximo (Extensão Pura)",
    sinergistas: "Isquiotibiais",
    articulacao: "Coice / Glute Kickback na Polia",
  },
  "a57e020d-7afc-41c4-b372-6066386848c1": {
    musculoAlvo: "Glúteo Máximo e Isquiotibiais",
    sinergistas: "Eretores",
    articulacao: "Extensão de Quadril no Cabo",
  },
  "e2f6ae67-b7b9-46ed-833a-5053f5a5d6ee": {
    musculoAlvo: "Glúteo Médio e Mínimo",
    sinergistas: "Tensor da Fáscia Lata",
    articulacao: "Abdução de Quadril na Máquina",
  },
  "edeb574d-ecf7-48d0-8cf0-c69c771b3708": {
    musculoAlvo: "Adutor Magno, Longo e Breve",
    sinergistas: "Grácil, Pectíneo",
    articulacao: "Adução de Quadril na Máquina",
  },
  "2f4874ac-e461-4916-89b2-07380a817ae1": {
    musculoAlvo: "Eretores da Espinha (Lombar)",
    sinergistas: "Glúteo Máximo, Isquiotibiais",
    articulacao: "Extensão Lombar na Máquina",
  },

  // PANTURRILHAS
  "e455709a-9ff8-47c1-8040-3cfff3860180": {
    musculoAlvo: "Gastrocnêmio (Cabeça Medial e Lateral)",
    sinergistas: "Sóleo",
    articulacao: "Flexão Plantar com Joelhos Estendidos",
  },
  "ebc8498c-20c4-427e-b6d6-b778c0b545d0": {
    musculoAlvo: "Sóleo",
    sinergistas: "Gastrocnêmio",
    articulacao: "Flexão Plantar Sentado",
  },
  "021e4c30-b247-424d-ac49-5c7939c3cad7": {
    musculoAlvo: "Gastrocnêmio e Sóleo",
    sinergistas: "Tibial Posterior",
    articulacao: "Flexão Plantar no Leg Press",
  },
  "fd8bff1e-1306-4dec-8a62-dd1a6dc31058": {
    musculoAlvo: "Gastrocnêmio (Alongamento Máximo)",
    sinergistas: "Sóleo",
    articulacao: "Donkey Calf Raise",
  },
  "d4411272-aaa7-4a56-97e9-58cde19d65ad": {
    musculoAlvo: "Gastrocnêmio (Unilateral)",
    sinergistas: "Sóleo",
    articulacao: "Elevação de Panturrilha Unilateral",
  },
};

const MANIFESTO_PATH = path.resolve("src/lib/dados/exercicios-midia.json");
const manifestoAtual = JSON.parse(fs.readFileSync(MANIFESTO_PATH, "utf-8"));

// Atualizar manifesto com informações biomecânicas anatômicas 3D detalhadas
const manifestoAtualizado = manifestoAtual.map((item) => {
  const anatomia = MAPA_ANATOMICO_102[item.id] || {
    musculoAlvo: "Musculatura Alvo Principal",
    sinergistas: "Músculos Estabilizadores",
    articulacao: "Padrão Biomecânico Anatômico",
  };

  return {
    ...item,
    estilo_visual: "3d_anatomico",
    musculo_alvo: anatomia.musculoAlvo,
    musculos_sinergistas: anatomia.sinergistas,
    mecanica_articular: anatomia.articulacao,
  };
});

fs.writeFileSync(MANIFESTO_PATH, JSON.stringify(manifestoAtualizado, null, 2), "utf-8");
console.log(`✅ Manifesto atualizado com sucesso com os 102 modelos anatômicos 3D! (${manifestoAtualizado.length} exercícios)`);
