import fs from 'fs';
import path from 'path';

const manifestoPath = 'src/lib/dados/exercicios-midia.json';
const manifesto = JSON.parse(fs.readFileSync(manifestoPath, 'utf8'));
const publicDir = 'public/videos/exercicios';
const genDir = 'C:/Users/danin/Downloads/gerados_ate_agora/gifs_gerados';

const mapa13 = [
  { genName: 'belt-squat.gif', id: '18bf7a23-2410-4905-b646-e152625c6136' },
  { genName: 'cadeira-flexora-sentada.gif', id: 'c64a781b-fb2b-42fa-b7be-79f94532b21b' },
  { genName: 'cadeira-flexora-unilateral.gif', id: '0e3dbd0b-bfb1-4359-8e86-647847b12100' },
  { genName: 'crossover-cabo.gif', id: '38ec491c-5d77-47d6-b324-48dae887f06f' },
  { genName: 'elevacao-pelvica-unilateral.gif', id: '203ffb85-feef-4a36-8f4c-2dc3dbad88c9' },
  { genName: 'face-pull-cabo.gif', id: 'c80d5e23-d24b-464e-a4e0-4b1450b480b6' },
  { genName: 'flexora-unilateral-cabo.gif', id: '79efba5d-33a4-470d-a526-41f7383c1c83' },
  { genName: 'leg-press-horizontal.gif', id: '3fdbf48a-5310-4373-9e95-8dfa1e912955' },
  { genName: 'leg-press-unilateral.gif', id: '54030c65-0b66-4995-af4e-5d968ac0cbb8' },
  { genName: 'panturrilha-em-pe.gif', id: 'e455709a-9ff8-47c1-8040-3cfff3860180' },
  { genName: 'remada-unilateral-halter.gif', id: '518c8216-bfc7-4c68-a708-1f5c9e178326' },
  { genName: 'rotacao-tronco-maquina.gif', id: 'b33347e8-056c-4f15-8a3a-bd00bf7852e6' },
  { genName: 'supino-reto-maquina.gif', id: '148801b9-dc8e-47d5-9198-4cd8aec022e7' }
];

// Se algum ID não bater direto, busca por similaridade de nome no manifesto
for (const item of mapa13) {
  let m = manifesto.find(x => x.id === item.id);
  if (!m) {
    // Tenta achar por match parcial de aliasUrl ou folderOrigem
    const cleanGen = item.genName.replace('.gif', '').replace(/-/g, '');
    m = manifesto.find(x => {
      const aliasClean = (x.aliasUrl || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return aliasClean.includes(cleanGen) || cleanGen.includes(aliasClean);
    });
  }

  if (m) {
    console.log(`[SYNC OK] ${item.genName} -> ID: ${m.id} | alias: ${m.aliasUrl}`);
    const src = path.join(genDir, item.genName);
    
    // Copia para UUID
    fs.copyFileSync(src, path.join(publicDir, `${m.id}.gif`));
    
    // Copia para alias
    if (m.aliasUrl) {
      const aliasFilename = path.basename(m.aliasUrl);
      fs.copyFileSync(src, path.join(publicDir, aliasFilename));
    }
    
    // Copia também pelo nome gerado
    fs.copyFileSync(src, path.join(publicDir, item.genName));
  } else {
    console.log(`[AVISO] ID nao encontrado no manifesto para: ${item.genName}`);
  }
}
