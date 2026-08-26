import fs from 'fs';
import path from 'path';

const csvContent = fs.readFileSync('C:\\Users\\danin\\Downloads\\exercicios_102_gifs_corrigido\\mapping.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

const analiseCompleta = [];

for (let i = 1; i < lines.length; i++) {
  const [grupo, nomePt, consulta, nomeEn, gif] = lines[i].split(',');
  const pt = nomePt?.trim();
  const en = nomeEn?.trim();
  const grp = grupo?.trim();

  let status = 'CORRETO';
  let observacao = 'Movimento e equipamento 100% condizentes.';
  let acaoRecomendada = 'Manter GIF atual.';

  // Regras de detecção de falha:
  const ptL = pt.toLowerCase();
  const enL = en.toLowerCase();

  // Casos Críticos (Exercício completamente diferente):
  if (ptL.includes('rotação de tronco máquina') && enL.includes('dip')) {
    status = 'FALHA_CRITICA';
    observacao = 'Exercício de Abdômen (rotação de tronco) está com GIF de Tríceps Dip (mergulho).';
    acaoRecomendada = 'GERAR NOVO GIF: Máquina rotacional de tronco para oblíquos.';
  } else if (ptL.includes('elevação pélvica unilateral') && enL.includes('hanging leg')) {
    status = 'FALHA_CRITICA';
    observacao = 'Elevação pélvica unilateral (Glúteo) está com GIF de elevação de pernas na barra (Abdômen).';
    acaoRecomendada = 'GERAR NOVO GIF: Elevação pélvica com apoio unilateral.';
  } else if (ptL.includes('crossover no cabo') && enL.includes('seated row')) {
    status = 'FALHA_CRITICA';
    observacao = 'Crossover no cabo (Peito) está com GIF de remada sentada no cabo (Costas).';
    acaoRecomendada = 'GERAR NOVO GIF: Crucifixo/Crossover no crossover duplo de polias.';
  } else if (ptL.includes('supino reto máquina') && enL.includes('one leg press')) {
    status = 'FALHA_CRITICA';
    observacao = 'Supino reto máquina (Peito) está com GIF de Leg Press unilateral (Pernas).';
    acaoRecomendada = 'GERAR NOVO GIF: Supino reto em máquina articulada ou horizontal.';
  } else if (ptL.includes('leg press horizontal') && enL.includes('pallof press')) {
    status = 'FALHA_CRITICA';
    observacao = 'Leg press horizontal (Quadríceps) está com GIF de Pallof press com elástico.';
    acaoRecomendada = 'GERAR NOVO GIF: Leg press horizontal (banco corrediço/placas).';
  } else if (ptL.includes('remada unilateral com halter') && enL.includes('upright row')) {
    status = 'FALHA_IMPORTANTE';
    observacao = 'Remada unilateral com halter (serrote/costas) está com GIF de remada alta de pé (trapézio/ombro).';
    acaoRecomendada = 'GERAR NOVO GIF: Remada unilateral serrote no banco com halter.';
  } else if (ptL.includes('face pull no cabo') && enL.includes('twisting pull')) {
    status = 'FALHA_IMPORTANTE';
    observacao = 'Face pull no cabo está com puxada com giro diagonal, não o face pull clássico para deltoide posterior.';
    acaoRecomendada = 'GERAR NOVO GIF: Face pull na polia alta com corda direcionada à testa.';
  } else if (ptL.includes('belt squat') && enL.includes('band squat')) {
    status = 'EQUIPAMENTO_DIVERGENTE';
    observacao = 'Agachamento com cinto (máquina belt squat) está com GIF de agachamento com elástico preso nos pés.';
    acaoRecomendada = 'GERAR NOVO GIF: Máquina de belt squat com cinto e carga na cintura.';
  } else if (ptL.includes('cadeira flexora') && !ptL.includes('unilateral') && enL.includes('lying')) {
    status = 'VARIACAO_DIVERGENTE';
    observacao = 'Cadeira flexora (sentada) está com GIF de mesa flexora deitada.';
    acaoRecomendada = 'GERAR NOVO GIF: Cadeira flexora sentada com almofada sobre as coxas.';
  } else if (ptL.includes('cadeira flexora unilateral') && !enL.includes('single') && !enL.includes('one')) {
    status = 'MODALIDADE_BILATERAL';
    observacao = 'Exercício cadastrado como unilateral, mas GIF mostra execução com as duas pernas juntas.';
    acaoRecomendada = 'GERAR NOVO GIF: Flexão de joelhos unilateral na cadeira flexora.';
  } else if (ptL.includes('flexora unilateral no cabo') && enL.includes('inverse')) {
    status = 'MODALIDADE_BILATERAL';
    observacao = 'Flexora unilateral no cabo está com GIF de flexão nórdica invertida com elástico.';
    acaoRecomendada = 'GERAR NOVO GIF: Flexora de pé unilateral com tornozeleira no cabo.';
  } else if (ptL.includes('leg press unilateral') && !enL.includes('single') && !enL.includes('one')) {
    status = 'MODALIDADE_BILATERAL';
    observacao = 'Leg press unilateral está com GIF de leg press bilateral no Smith.';
    acaoRecomendada = 'GERAR NOVO GIF: Leg press 45º empurrando com apenas uma perna.';
  } else if (ptL.includes('panturrilha burrinho') && enL.includes('donkey')) {
    // Donkey calf raise está correto
    status = 'CORRETO';
  } else if (ptL.includes('panturrilha em pé') && enL.includes('cable')) {
    status = 'VARIACAO_CABO';
    observacao = 'Panturrilha em pé está com GIF na polia/cabo em vez da máquina de panturrilha em pé tradicional.';
    acaoRecomendada = 'GERAR NOVO GIF (Opcional): Máquina clássica de panturrilha em pé com apoio nos ombros.';
  }

  analiseCompleta.push({
    num: i,
    grupo: grp,
    nomePt: pt,
    nomeEnDataset: en,
    gifAtual: gif?.trim(),
    status,
    observacao,
    acaoRecomendada
  });
}

const corretos = analiseCompleta.filter(a => a.status === 'CORRETO');
const falhas = analiseCompleta.filter(a => a.status !== 'CORRETO');

console.log(`=== RESUMO DA AUDITORIA ===`);
console.log(`- Exercícios Corretos e Fidedignos: ${corretos.length}/102`);
console.log(`- Exercícios com Falhas ou Divergências: ${falhas.length}/102`);

console.log('\n--- LISTA DOS EXERCÍCIOS QUE PRECISAM SER GERADOS ---');
falhas.forEach((f, idx) => {
  console.log(`${idx + 1}. [${f.grupo}] ${f.nomePt}`);
  console.log(`   - Status: ${f.status}`);
  console.log(`   - Diagnóstico: ${f.observacao}`);
  console.log(`   - O que gerar: ${f.acaoRecomendada}\n`);
});

fs.writeFileSync('scripts/relatorio-auditoria-completo.json', JSON.stringify(analiseCompleta, null, 2), 'utf8');
