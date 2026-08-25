import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbkzcqfvafznxallyfqk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7";

const sourceDir = 'C:\\Users\\danin\\Downloads\\exercicios_102_gifs_corrigido';
const targetDir = 'c:\\lastro\\public\\videos\\exercicios';
const midiaJsonPath = 'c:\\lastro\\src\\lib\\dados\\exercicios-midia.json';

// Cria pasta de destino se não existir
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function gerarSlug(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function importar() {
  console.log('--- INICIANDO IMPORTAÇÃO DOS 102 GIFS ---');

  // 1. Ler Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await supabase.auth.signInWithPassword({
    email: "qa_player_tester@lastro.app",
    password: "PlaywrightTester_2026!",
  });

  const { data: exerciciosDb, error } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular_primario, unilateral, peso_por_lado, dica_execucao, grupo_muscular(nome)")
    .order("nome");

  if (error) {
    throw new Error(`Falha no Supabase: ${error.message}`);
  }

  // 2. Ler todos os GIFs físicos na pasta de download
  const gifFiles = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (item.toLowerCase().endsWith('.gif')) {
        gifFiles.push({
          folder: path.basename(path.dirname(full)),
          filename: item,
          fullPath: full,
          relPath: path.relative(sourceDir, full),
        });
      }
    }
  }
  walk(sourceDir);

  // 3. Ler CSV
  const csvContent = fs.readFileSync(path.join(sourceDir, 'mapping.csv'), 'utf8');
  const csvLines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  const csvRows = csvLines.slice(1).map(line => {
    const parts = line.split(',');
    return {
      grupo: parts[0]?.trim(),
      nome_pt: parts[1]?.trim(),
      consulta: parts[2]?.trim(),
      nome_en_encontrado: parts[3]?.trim(),
      gif_url: parts[4]?.trim()
    };
  });

  // 4. Ler manifesto existente (para preservar dados anatômicos / sinergistas se já existirem)
  let manifestoExistente = [];
  if (fs.existsSync(midiaJsonPath)) {
    try {
      manifestoExistente = JSON.parse(fs.readFileSync(midiaJsonPath, 'utf8'));
    } catch {
      manifestoExistente = [];
    }
  }
  const mapaExistente = new Map(manifestoExistente.map(item => [item.id, item]));

  const novoManifesto = [];
  let copiados = 0;

  for (const ex of exerciciosDb) {
    const slug = gerarSlug(ex.nome);
    const matchCsv = csvRows.find(r => normalizar(r.nome_pt) === normalizar(ex.nome));

    let matchFisico = null;
    if (matchCsv && matchCsv.gif_url) {
      const gifNome = path.basename(matchCsv.gif_url).toLowerCase();
      matchFisico = gifFiles.find(f => f.filename.toLowerCase() === gifNome);
    }
    if (!matchFisico) {
      matchFisico = gifFiles.find(f => {
        const nomeSemExt = path.basename(f.filename, '.gif');
        return normalizar(nomeSemExt) === normalizar(ex.nome) || 
               (matchCsv && normalizar(nomeSemExt) === normalizar(matchCsv.nome_pt));
      });
    }

    if (!matchFisico) {
      console.warn(`⚠️ GIF não encontrado para: ${ex.nome}`);
      continue;
    }

    // Copiar arquivo GIF para public/videos/exercicios/[id].gif e [slug].gif
    const destId = path.join(targetDir, `${ex.id}.gif`);
    const destSlug = path.join(targetDir, `${slug}.gif`);

    fs.copyFileSync(matchFisico.fullPath, destId);
    fs.copyFileSync(matchFisico.fullPath, destSlug);
    copiados++;

    const itemAntigo = mapaExistente.get(ex.id) || {};
    const grupoNome = Array.isArray(ex.grupo_muscular) ? ex.grupo_muscular[0]?.nome : ex.grupo_muscular?.nome;

    novoManifesto.push({
      id: ex.id,
      nomePt: ex.nome,
      nomeEn: matchCsv?.nome_en_encontrado || itemAntigo.nomeEn || ex.nome,
      nomeEs: itemAntigo.nomeEs || ex.nome,
      slug: slug,
      grupoMuscular: grupoNome || ex.grupo_muscular_primario,
      grupoMuscularId: ex.grupo_muscular_primario,
      unilateral: ex.unilateral,
      pesoPorLado: ex.peso_por_lado,
      videoUrl: `/videos/exercicios/${ex.id}.gif`,
      aliasUrl: `/videos/exercicios/${slug}.gif`,
      arquivoOrigem: matchFisico.relPath,
      totalFrames: 2,
      thumbnailUrl: `/videos/exercicios/${ex.id}.gif`,
      estilo_visual: "gif_animado_gymvisual",
      creditos: "© Gym visual — https://gymvisual.com/",
      musculo_alvo: itemAntigo.musculo_alvo || grupoNome || "Musculatura Alvo Principal",
      musculos_sinergistas: itemAntigo.musculos_sinergistas || "Estabilizadores correspondentes",
      mecanica_articular: itemAntigo.mecanica_articular || (ex.unilateral ? "Unilateral" : "Bilateral")
    });
  }

  // Copiar NOTICE.md e mapping.csv
  fs.copyFileSync(path.join(sourceDir, 'NOTICE.md'), path.join(targetDir, 'NOTICE.md'));
  fs.copyFileSync(path.join(sourceDir, 'mapping.csv'), path.join(targetDir, 'mapping.csv'));

  // Salvar novo manifesto JSON
  fs.writeFileSync(midiaJsonPath, JSON.stringify(novoManifesto, null, 2), 'utf8');

  console.log(`\n✅ Sucesso!`);
  console.log(`- ${copiados} GIFs copiados para ${targetDir}`);
  console.log(`- Manifesto atualizado em ${midiaJsonPath} com ${novoManifesto.length} itens.`);
}

importar().catch(console.error);
