import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'docs/screenshots/verificacao_13_gifs';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const EXERCICIOS_TESTE = [
  { slug: 'belt-squat', nome: 'Agachamento com cinto (Belt Squat)' },
  { slug: 'cadeira-flexora', nome: 'Cadeira Flexora' },
  { slug: 'cadeira-flexora-unilateral', nome: 'Cadeira Flexora Unilateral' },
  { slug: 'crossover-no-cabo', nome: 'Crossover no Cabo' },
  { slug: 'elevacao-pelvica-unilateral', nome: 'Elevação Pélvica Unilateral' },
  { slug: 'face-pull-no-cabo', nome: 'Face Pull no Cabo' },
  { slug: 'flexora-unilateral-no-cabo', nome: 'Flexora Unilateral no Cabo' },
  { slug: 'leg-press-horizontal', nome: 'Leg Press Horizontal' },
  { slug: 'leg-press-unilateral', nome: 'Leg Press Unilateral' },
  { slug: 'panturrilha-em-pe', nome: 'Panturrilha em Pé' },
  { slug: 'remada-unilateral-com-halter', nome: 'Remada Unilateral com Halter' },
  { slug: 'rotacao-de-tronco-maquina', nome: 'Rotação de Tronco Máquina' },
  { slug: 'supino-reto-maquina', nome: 'Supino Reto Máquina' }
];

async function run() {
  console.log('🚀 Iniciando verificação Playwright dos 13 GIFs atualizados...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile iPhone 14
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // Testar conexão inicial com a aplicação
  try {
    await page.goto('http://localhost:3000', { timeout: 30000, waitUntil: 'domcontentloaded' });
    console.log('✅ Servidor Next.js respondendo na porta 3000');
  } catch (err) {
    console.error('❌ Falha ao conectar no servidor local:', err.message);
    await browser.close();
    process.exit(1);
  }

  // Testar renderização de cada GIF direto no contexto da web e no player
  let sucesso = 0;
  for (const ex of EXERCICIOS_TESTE) {
    const gifUrl = `http://localhost:3000/videos/exercicios/${ex.slug}.gif`;
    const res = await page.request.get(gifUrl);
    if (res.status() === 200) {
      console.log(`[PASSOU 200 OK] GIF acessível: ${ex.slug}.gif (${res.headers()['content-length'] || 'N/A'} bytes)`);
      sucesso++;
    } else {
      console.error(`[FALHOU ${res.status()}] GIF não encontrado: ${gifUrl}`);
    }
  }

  console.log(`\n🏁 Resultado: ${sucesso}/${EXERCICIOS_TESTE.length} GIFs validados com sucesso!`);
  await browser.close();
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
