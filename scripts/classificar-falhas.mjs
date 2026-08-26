import fs from 'fs';
import path from 'path';

const csvContent = fs.readFileSync('C:\\Users\\danin\\Downloads\\exercicios_102_gifs_corrigido\\mapping.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

const lista = [];

for (let i = 1; i < lines.length; i++) {
  const [grupo, nomePt, consulta, nomeEn, gif] = lines[i].split(',');
  lista.push({
    id: i,
    grupo: grupo?.trim(),
    nomePt: nomePt?.trim(),
    consulta: consulta?.trim(),
    nomeEn: nomeEn?.trim(),
    gif: gif?.trim()
  });
}

console.log('=== VERIFICAÇÃO DETALHADA DE TODOS OS 102 EXERCÍCIOS ===\n');

const falhasIdentificadas = [];

for (const item of lista) {
  const pt = item.nomePt.toLowerCase();
  const en = item.nomeEn.toLowerCase();
  const cons = item.consulta.toLowerCase();

  let tipoFalha = null;
  let detalhe = '';

  // Casos específicos claros:
  if (pt === 'rotação de tronco máquina' && en.includes('dip')) {
    tipoFalha = 'CRÍTICO: Exercício trocado';
    detalhe = `Mapeou "Rotação de tronco máquina" (Abdômen) para "${item.nomeEn}" (Tríceps/Dip)!`;
  } else if (pt.includes('unilateral') && !en.includes('single') && !en.includes('one') && !en.includes('alternate') && !en.includes('unilateral')) {
    tipoFalha = 'MODERADO: Unilateral x Bilateral';
    detalhe = `Exercício é Unilateral no Lastro, mas o GIF mostra execução bilateral (${item.nomeEn})`;
  } else if (pt.includes('belt squat') && en.includes('band')) {
    tipoFalha = 'LEVE/MODERADO: Equipamento incorreto';
    detalhe = `Belt squat mapeado para agachamento com elástico (band squat)`;
  } else if (pt.includes('burrinho') && en.includes('standing')) {
    tipoFalha = 'MODERADO: Variação trocada';
    detalhe = `Panturrilha burrinho (donkey) mapeado para panturrilha em pé na máquina (${item.nomeEn})`;
  } else if (pt.includes('cavalinho') && !en.includes('t bar')) {
    tipoFalha = 'MODERADO: Equipamento trocado';
    detalhe = `Remada cavalinho sem T-Bar row`;
  } else if (pt.includes('ponte de glúteo') && en.includes('barbell')) {
    tipoFalha = 'LEVE: Carga livre vs solo';
    detalhe = `Ponte de glúteo mapeada com barra`;
  } else if (pt === 'elevação pélvica unilateral' && en.includes('hanging leg')) {
    tipoFalha = 'CRÍTICO: Exercício trocado';
    detalhe = `Elevação pélvica unilateral (Glúteos) mapeada para "${item.nomeEn}" (Elevação de pernas na barra/Abdômen)!`;
  }

  if (tipoFalha) {
    falhasIdentificadas.push({
      ...item,
      tipoFalha,
      detalhe
    });
  }
}

console.log(`Total de falhas explícitas identificadas: ${falhasIdentificadas.length}\n`);
falhasIdentificadas.forEach((f, idx) => {
  console.log(`${idx + 1}. [${f.grupo}] "${f.nomePt}"`);
  console.log(`   - GIF atual: ${f.nomeEn} (${f.gif})`);
  console.log(`   - 🔴 Falha: [${f.tipoFalha}] ${f.detalhe}\n`);
});

fs.writeFileSync('scripts/falhas-identificadas.json', JSON.stringify(falhasIdentificadas, null, 2), 'utf8');
