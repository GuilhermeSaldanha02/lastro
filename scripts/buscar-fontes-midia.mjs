import fs from 'fs';
import path from 'path';

const downloadsDir = 'C:\\Users\\danin\\Downloads';
const itens = fs.readdirSync(downloadsDir);

console.log('--- PASTAS/ARQUIVOS NOS DOWNLOADS RELACIONADOS A EXERCÍCIOS ---');
itens.forEach(item => {
  const full = path.join(downloadsDir, item);
  try {
    const stat = fs.statSync(full);
    const nameLower = item.toLowerCase();
    if (nameLower.includes('exercic') || nameLower.includes('gym') || nameLower.includes('dataset') || nameLower.includes('midia') || nameLower.includes('treino') || nameLower.includes('3d') || nameLower.includes('gif')) {
      console.log(`- [${stat.isDirectory() ? 'PASTA' : 'ARQUIVO'}] ${item} (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  } catch {}
});
