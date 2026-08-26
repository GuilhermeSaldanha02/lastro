import fs from 'fs';
import path from 'path';

const baseDir = 'C:\\Users\\danin\\Downloads\\exercicios_102_gifs_corrigido';
const csvContent = fs.readFileSync(path.join(baseDir, 'mapping.csv'), 'utf8');
const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

console.log('=== ANALISANDO LINHA A LINHA DO MAPPING.CSV ===\n');

const divergencias = [];

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  const grupo = parts[0]?.trim();
  const nomePt = parts[1]?.trim();
  const consulta = parts[2]?.trim();
  const nomeEn = parts[3]?.trim();
  const gif = parts[4]?.trim();

  // Verifica discrepâncias óbvias (ex: rotação de tronco mapeada para lever seated dip!)
  let suspeito = false;
  let motivo = '';

  const ptLower = (nomePt || '').toLowerCase();
  const enLower = (nomeEn || '').toLowerCase();
  const consLower = (consulta || '').toLowerCase();

  // 1. Rotação de tronco mapeada para dip (tríceps)
  if (ptLower.includes('rotacao') && enLower.includes('dip')) {
    suspeito = true;
    motivo = 'Exercício de Rotação de Tronco mapeado para DIP (mergulho/tríceps)!';
  }
  // 2. Agachamento com cinto (belt squat) mapeado para band squat
  else if (ptLower.includes('belt squat') && enLower.includes('band squat')) {
    suspeito = true;
    motivo = 'Belt squat mapeado para agachamento com elástico (band squat)';
  }
  // 3. Puxador articulado máquina mapeado para lever front pulldown vs chest supported
  else if (ptLower.includes('remada') && enLower.includes('pulldown')) {
    suspeito = true;
    motivo = 'Remada mapeada para Puxada (pulldown)';
  }
  else if (ptLower.includes('puxada') && enLower.includes('row')) {
    suspeito = true;
    motivo = 'Puxada mapeada para Remada (row)';
  }
  // 4. Supino fechado mapeado para outro
  else if (ptLower.includes('fechado') && !enLower.includes('close grip')) {
    suspeito = true;
    motivo = 'Supino fechado sem close-grip no nome em inglês';
  }
  // 5. Unilateral vs bilateral
  else if (ptLower.includes('unilateral') && !enLower.includes('single') && !enLower.includes('one arm') && !enLower.includes('alternate') && !enLower.includes('unilateral')) {
    suspeito = true;
    motivo = 'Exercício unilateral no Lastro mapeado para GIF bilateral';
  }
  // 6. Máquina vs Barra / Halter
  else if (ptLower.includes('maquina') && (enLower.includes('barbell') || enLower.includes('dumbbell'))) {
    suspeito = true;
    motivo = 'Exercício em máquina mapeado para barra/halter livre';
  }
  else if ((ptLower.includes('barra') || ptLower.includes('halter')) && enLower.includes('lever')) {
    suspeito = true;
    motivo = 'Exercício livre (barra/halter) mapeado para máquina de alavanca (lever)';
  }
  // 7. Leg press unilateral vs bilateral
  else if (ptLower.includes('leg press unilateral') && !enLower.includes('single')) {
    suspeito = true;
    motivo = 'Leg press unilateral com GIF de leg press normal';
  }
  // 8. Panturrilha burrinho vs máquina
  else if (ptLower.includes('burrinho') && enLower.includes('standing')) {
    suspeito = true;
    motivo = 'Panturrilha burrinho mapeada para em pé (standing)';
  }

  divergencias.push({
    num: i,
    grupo,
    nomePt,
    consulta,
    nomeEn,
    gif,
    suspeito,
    motivo: motivo || 'OK ou verificar visualmente'
  });
}

const encontradas = divergencias.filter(d => d.suspeito);
console.log(`Total de divergências lógicas/semânticas flagradas no CSV: ${encontradas.length}/${lines.length - 1}`);
console.log('\n--- LISTA DE EXERCÍCIOS COM MAPEAMENTO INCORRETO NO DATASET ---');
encontradas.forEach(d => {
  console.log(`[${d.num}] [${d.grupo}] "${d.nomePt}" -> "${d.nomeEn}"\n   ⚠️ Motivo: ${d.motivo} (GIF: ${d.gif})\n`);
});

fs.writeFileSync('scripts/divergencias-mapeamento.json', JSON.stringify(divergencias, null, 2), 'utf8');
