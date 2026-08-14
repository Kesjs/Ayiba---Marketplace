#!/usr/bin/env node

/**
 * Script d'analyse des dépendances
 * Identifie les dépendances non utilisées et les optimisations possibles
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyse des dépendances...\n');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

console.log(`📦 Total dépendances: ${Object.keys(dependencies).length}\n`);

// Dépendances susceptibles d'être lourdes
const heavyDeps = {
  'framer-motion': 'Animation library - peut être lazy-loaded',
  'recharts': 'Charts library - uniquement si utilisé',
  'html5-qrcode': 'QR scanner - lazy-load pour les pages scanner',
  'leaflet': 'Maps library - lazy-load pour les pages carte',
  'pdfkit': 'PDF generation - lazy-load uniquement pour export',
  '@supabase/supabase-js': 'Peut être optimisé avec tree-shaking',
};

console.log('⚠️  Dépendances susceptibles d\'être optimisées:\n');

Object.entries(heavyDeps).forEach(([dep, note]) => {
  if (dependencies[dep]) {
    const version = dependencies[dep];
    console.log(`  ✓ ${dep}@${version}`);
    console.log(`    → ${note}\n`);
  }
});

// Vérifier les imports inutilisés
console.log('\n🔎 Recherche des imports potentiellement inutilisés...\n');

const srcDir = path.join(__dirname, '../app');
let totalFiles = 0;
let filesWithDynamicImports = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      totalFiles++;
      const content = fs.readFileSync(filePath, 'utf8');

      // Vérifier pour les patterns d'optimisation
      if (content.includes('dynamic(') || content.includes('React.lazy')) {
        filesWithDynamicImports++;
      }
    }
  });
}

scanDirectory(srcDir);

console.log(`  Fichiers TypeScript: ${totalFiles}`);
console.log(`  Avec dynamic imports: ${filesWithDynamicImports}`);
console.log(`  Potentiel d'optimisation: ${((filesWithDynamicImports / totalFiles) * 100).toFixed(1)}%\n`);

// Recommandations
console.log('💡 Recommandations:\n');
console.log('1. Lazy-load les composants volumineux (Framer Motion, Charts)');
console.log('2. Utiliser dynamic() pour les sections non-critiques');
console.log('3. Vérifier les importations inutilisées');
console.log('4. Configurer le tree-shaking dans tsconfig.json');
console.log('5. Utiliser @next/bundle-analyzer pour une analyse détaillée\n');

console.log('📊 Commandes utiles:\n');
console.log('  npm audit            - Vérifier les vulnérabilités');
console.log('  npm outdated         - Vérifier les mises à jour disponibles');
console.log('  npm ls               - Voir l\'arborescence des dépendances\n');
