#!/usr/bin/env node

/**
 * Script d'analyse du bundle Next.js
 * Identifie les gros bundles et les dépendances non optimisées
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyse du bundle...\n');

// Lancer l'analyse Webpack
try {
  console.log('📦 Exécution de l\'analyse webpack...');
  execSync('next build --analyze=true', { stdio: 'inherit' });
} catch (error) {
  console.error('Erreur lors de la build:', error.message);
}

// Analyser les fichiers générés
const buildDir = path.join(__dirname, '../.next');

if (fs.existsSync(buildDir)) {
  console.log('\n📊 Résultats d\'analyse:\n');

  // Lister les chunks principaux
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    const chunks = fs.readdirSync(staticDir);
    console.log('Chunks générés:');
    chunks.forEach(chunk => {
      const chunkPath = path.join(staticDir, chunk);
      const stat = fs.statSync(chunkPath);
      const sizeKb = (stat.size / 1024).toFixed(2);
      console.log(`  - ${chunk}: ${sizeKb}KB`);
    });
  }
}

console.log('\n✅ Analyse terminée!\n');
console.log('💡 Optimisations recommandées:');
console.log('   1. Vérifier les gros chunks (> 500KB)');
console.log('   2. Lazy-load les sections non-critiques');
console.log('   3. Utiliser dynamic imports pour les composants lourds');
console.log('   4. Vérifier les dépendances inutilisées avec "npm audit"\n');
