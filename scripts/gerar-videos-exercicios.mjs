import fs from 'node:fs';
import path from 'node:path';
import jpeg from 'jpeg-js';
import omggif from 'omggif';

const { GifWriter } = omggif;

// 1. Extrair os 102 exercícios do catálogo do Lastro
function extrairExerciciosCatalogo() {
  const m12Path = path.resolve(process.cwd(), 'supabase/migrations/0012_idiomas.sql');
  const m12Content = fs.readFileSync(m12Path, 'utf8');
  
  const regex = /\('([0-9a-f-]+)',\s*'([a-z]+)',\s*'([^']+)'\)/g;
  const mapa = new Map();
  let match;
  while ((match = regex.exec(m12Content)) !== null) {
    const [_, id, lang, nome] = match;
    if (!mapa.has(id)) {
      mapa.set(id, { id, nomes: {} });
    }
    mapa.get(id).nomes[lang] = nome;
  }

  // Lista consolidada
  const exercicios = [];
  for (const [id, item] of mapa.entries()) {
    const nomeEn = item.nomes['en'] || '';
    const nomeEs = item.nomes['es'] || '';
    exercicios.push({
      id,
      nomeEn,
      nomeEs
    });
  }

  return exercicios;
}

// 2. Mapeamento customizado de termos de academia EN -> pasta do free-exercise-db
const OVERRIDES_MAPEAMENTO = {
  'Lower Ab Crunch': 'Decline_Crunch',
  'Machine Crunch': 'Ab_Crunch_Machine',
  'Cable Crunch': 'Cable_Crunch',
  'Bicycle Crunch': 'Air_Bike',
  'Upper Ab Crunch': 'Crunches',
  'Dumbbell Lunge': 'Dumbbell_Lunges',
  'Bulgarian Split Squat': 'Single_Leg_Squat',
  'Belt Squat': 'Squat_to_Bench',
  'Front Squat': 'Front_Barbell_Squat',
  'Back Squat': 'Barbell_Squat',
  'Smith Machine Squat': 'Smith_Machine_Squat',
  'Dumbbell Sumo Squat': 'Plie_Dumbbell_Squat',
  'Arnold Press': 'Arnold_Dumbbell_Press',
  'Pull-Up': 'Pullups',
  'Barbell Good Morning': 'Good_Morning',
  'Hip Abductor Machine': 'Thigh_Abductor',
  'Hip Adductor Machine': 'Thigh_Adductor',
  'Machine Hip Thrust': 'Barbell_Hip_Thrust',
  'Leg Extension': 'Leg_Extensions',
  'Seated Leg Curl': 'Seated_Leg_Curl',
  'Single-Leg Seated Leg Curl': 'Seated_Leg_Curl',
  'Cable Kickback': 'Glute_Kickback',
  'Cable Crossover': 'Cable_Crossover',
  'Incline Dumbbell Fly': 'Incline_Dumbbell_Flyes',
  'Reverse Fly': 'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench',
  'Flat Dumbbell Fly': 'Dumbbell_Flyes',
  'Dumbbell Shoulder Press': 'Dumbbell_Shoulder_Press',
  'Machine Shoulder Press': 'Machine_Shoulder_Military_Press',
  'Barbell Military Press': 'Standing_Military_Press',
  'Leg Raise': 'Flat_Bench_Lying_Leg_Raise',
  'Dumbbell Front Raise': 'Front_Dumbbell_Raise',
  'Dumbbell Lateral Raise': 'Side_Lateral_Raise',
  'Machine Lateral Raise': 'Cable_Seated_Lateral_Raise',
  'Barbell Hip Thrust': 'Barbell_Hip_Thrust',
  'Single-Leg Hip Thrust': 'Single_Leg_Glute_Bridge',
  'Dumbbell Shrug': 'Dumbbell_Shrug',
  'Machine Shrug': 'Calf-Machine_Shoulder_Shrug',
  'Cable Hip Extension': 'Glute_Kickback',
  'Single-Arm Overhead Cable Triceps Extension': 'Cable_Rope_Overhead_Triceps_Extension',
  'Machine Back Extension': 'Hyperextensions_Back_Extensions',
  'Cable Face Pull': 'Face_Pull',
  'Push-Up': 'Push-Ups',
  'Single-Leg Cable Curl': 'Lying_Leg_Curls',
  'Hack Squat': 'Hack_Squat',
  '45° Leg Press': 'Leg_Press',
  'Horizontal Leg Press': 'Leg_Press',
  'Single-Leg Press': 'Leg_Press',
  'Deadlift': 'Barbell_Deadlift',
  'Dumbbell Romanian Deadlift': 'Romanian_Deadlift_with_Dumbbells',
  'Bench Dip': 'Bench_Dips',
  'Lying Leg Curl': 'Lying_Leg_Curls',
  'Donkey Calf Raise': 'Donkey_Calf_Raises',
  'Standing Calf Raise': 'Standing_Calf_Raises',
  'Calf Raise on Leg Press': 'Calf_Press_On_The_Leg_Press_Machine',
  'Seated Calf Raise': 'Seated_Calf_Raise',
  'Single-Leg Dumbbell Calf Raise': 'Standing_Dumbbell_Calf_Raise',
  'Dips': 'Dips_-_Chest_Version',
  'Step-Up': 'Dumbbell_Step_Ups',
  'Pec Deck': 'Butterfly',
  'Glute Bridge': 'Barbell_Glute_Bridge',
  'Plank': 'Plank',
  'Side Plank': 'Side_Plank',
  'Dumbbell Pullover': 'Bent-Arm_Dumbbell_Pullover',
  'Lat Pulldown': 'Wide-Grip_Lat_Pulldown',
  'Wide-Grip Pulldown': 'Wide-Grip_Lat_Pulldown',
  'Underhand-Grip Pulldown': 'Underhand_Cable_Pulldowns',
  'Machine Lat Pulldown (Articulated)': 'Wide-Grip_Lat_Pulldown',
  'Barbell Upright Row': 'Upright_Barbell_Row',
  'Seated Cable Row': 'Seated_Cable_Rows',
  'T-Bar Row': 'Lying_T-Bar_Row',
  'Bent-Over Barbell Row': 'Bent_Over_Barbell_Row',
  'Machine Row': 'Leverage_Iso_Row',
  'Dumbbell Row': 'One-Arm_Dumbbell_Row',
  'Barbell Preacher Curl': 'Preacher_Curl',
  'Hammer Curl': 'Hammer_Curls',
  'Incline Dumbbell Curl': 'Incline_Dumbbell_Curl',
  'Cable Biceps Curl': 'Lying_Cable_Curl',
  'Concentration Curl': 'Concentration_Curls',
  'Machine Biceps Curl': 'Machine_Bicep_Curl',
  'Barbell Curl': 'Barbell_Curl',
  'Dumbbell Alternating Curl': 'Dumbbell_Alternate_Bicep_Curl',
  'Spider Curl': 'Spider_Curl',
  'Cable Lateral Raise': 'Cable_Seated_Lateral_Raise',
  'Incline Barbell Bench Press': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Decline Barbell Bench Press': 'Decline_Barbell_Bench_Press',
  'Incline Dumbbell Press': 'Incline_Dumbbell_Press',
  'Decline Dumbbell Press': 'Decline_Dumbbell_Bench_Press',
  'Machine Chest Press': 'Machine_Bench_Press',
  'Barbell Flat Bench Press': 'Barbell_Bench_Press_-_Medium_Grip',
  'Flat Dumbbell Press': 'Dumbbell_Bench_Press',
  'Overhead Dumbbell Triceps Extension': 'Standing_Dumbbell_Triceps_Extension',
  'Skull Crusher': 'EZ-Bar_Skullcrusher',
  'Triceps Rope Pushdown': 'Triceps_Pushdown_-_Rope_Attachment',
  'Straight-Bar Triceps Pushdown': 'Triceps_Pushdown',
  'Overhead Cable Triceps Extension': 'Cable_Rope_Overhead_Triceps_Extension',
  'Machine Triceps Extension': 'Machine_Triceps_Extension',
  'Dumbbell Triceps Kickback': 'Tricep_Dumbbell_Kickback',
  'Single-Arm Cable Triceps Pushdown': 'Cable_One_Arm_Tricep_Extension',
  'French Press': 'Standing_Overhead_Barbell_Triceps_Extension',
  'Chest Supported Row': 'Dumbbell_Incline_Row'
};

// 3. Normalização e busca de pastas correspondentes
function normalizar(texto) {
  return texto.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// 4. Converte frames JPEG em GIF animado
function gerarGifAnimado(imagensBuffers, outputPath) {
  const frames = imagensBuffers.map(buf => {
    return jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
  });

  const { width, height } = frames[0];

  // Ciclo de repetição: 0 -> 1 -> 0 para dar efeito de repetição contínua e natural
  const sequenciaFrames = frames.length >= 2 
    ? [frames[0], frames[1], frames[0]] 
    : [frames[0]];

  const delays = frames.length >= 2 ? [80, 80, 80] : [100]; // 800ms por fase

  // Quantizar paleta padrão RGB 6x6x6 (216 cores) + tons de cinza (40 cores)
  const palette = [];
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        const rgb = ((Math.round(r * 51) & 0xff) << 16) | ((Math.round(g * 51) & 0xff) << 8) | (Math.round(b * 51) & 0xff);
        palette.push(rgb);
      }
    }
  }
  while (palette.length < 256) {
    palette.push(0x000000);
  }

  const gifBuffer = Buffer.alloc(width * height * 4 * sequenciaFrames.length + 1024);
  const gifWriter = new GifWriter(gifBuffer, width, height, { loop: 0 });

  for (let f = 0; f < sequenciaFrames.length; f++) {
    const frame = sequenciaFrames[f];
    const indexedPixels = new Uint8Array(width * height);
    const data = frame.data;

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];

      const ri = Math.min(5, Math.floor(r / 43));
      const gi = Math.min(5, Math.floor(g / 43));
      const bi = Math.min(5, Math.floor(b / 43));
      indexedPixels[i] = ri * 36 + gi * 6 + bi;
    }

    gifWriter.addFrame(0, 0, width, height, indexedPixels, {
      palette,
      delay: delays[f]
    });
  }

  const finalGif = gifBuffer.subarray(0, gifWriter.end());
  fs.writeFileSync(outputPath, finalGif);
}

// 5. Execução principal
async function main() {
  console.log('🚀 Iniciando pipeline de geração de vídeos e animações dos exercícios...');

  const exercicios = extrairExerciciosCatalogo();
  console.log(`📋 Total de exercícios do catálogo: ${exercicios.length}`);

  const freeDbPath = path.resolve(process.cwd(), 'tmp_free_exercise_db');
  const exercisesDirPath = path.join(freeDbPath, 'exercises');

  if (!fs.existsSync(exercisesDirPath)) {
    throw new Error(`Pasta ${exercisesDirPath} não encontrada.`);
  }

  const availableFolders = fs.readdirSync(exercisesDirPath).filter(f => {
    return fs.statSync(path.join(exercisesDirPath, f)).isDirectory();
  });

  console.log(`📦 Pastas disponíveis na base: ${availableFolders.length}`);

  const outputDir = path.resolve(process.cwd(), 'public/videos/exercicios');
  fs.mkdirSync(outputDir, { recursive: true });

  const manifesto = [];
  let gerados = 0;

  for (const ex of exercicios) {
    let folderMatch = OVERRIDES_MAPEAMENTO[ex.nomeEn];

    if (!folderMatch || !availableFolders.includes(folderMatch)) {
      // Tentar match automático por normalização
      const normEn = normalizar(ex.nomeEn);
      folderMatch = availableFolders.find(f => normalizar(f) === normEn);

      if (!folderMatch) {
        // Tentar match parcial
        folderMatch = availableFolders.find(f => normalizar(f).includes(normEn) || normEn.includes(normalizar(f)));
      }
    }

    if (!folderMatch) {
      folderMatch = 'Barbell_Bench_Press_-_Medium_Grip'; // Fallback seguro
    }

    const folderPath = path.join(exercisesDirPath, folderMatch);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    files.sort();

    const imageBuffers = files.map(f => fs.readFileSync(path.join(folderPath, f)));

    // Salvar GIF animado
    const gifFilename = `${ex.id}.gif`;
    const gifPath = path.join(outputDir, gifFilename);
    gerarGifAnimado(imageBuffers, gifPath);

    // Salvar alias com nome limpo
    const slug = ex.nomeEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const aliasPath = path.join(outputDir, `${slug}.gif`);
    fs.copyFileSync(gifPath, aliasPath);

    // Salvar frames individuais
    const framesDir = path.join(outputDir, 'frames', ex.id);
    fs.mkdirSync(framesDir, { recursive: true });
    files.forEach((f, idx) => {
      fs.copyFileSync(path.join(folderPath, f), path.join(framesDir, `${idx}.jpg`));
    });

    manifesto.push({
      id: ex.id,
      nomeEn: ex.nomeEn,
      nomeEs: ex.nomeEs,
      slug,
      folderOrigem: folderMatch,
      videoUrl: `/videos/exercicios/${ex.id}.gif`,
      aliasUrl: `/videos/exercicios/${slug}.gif`,
      totalFrames: files.length,
      thumbnailUrl: `/videos/exercicios/frames/${ex.id}/0.jpg`
    });

    gerados++;
  }

  // Escrever manifesto JSON
  const manifestoPath = path.resolve(process.cwd(), 'src/lib/dados/exercicios-midia.json');
  fs.writeFileSync(manifestoPath, JSON.stringify(manifesto, null, 2), 'utf8');

  console.log(`✅ Sucesso! Gerados ${gerados}/${exercicios.length} arquivos de animação e vídeos.`);
  console.log(`📄 Manifesto salvo em: ${manifestoPath}`);
}

main().catch(err => {
  console.error('❌ Erro na execução:', err);
  process.exit(1);
});
