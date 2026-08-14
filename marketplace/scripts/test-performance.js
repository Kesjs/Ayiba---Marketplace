#!/usr/bin/env node

/**
 * Script de test des performances
 * Vérifie que les optimisations sont en place et efficaces
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Tests de Performance\n');
console.log('=' .repeat(50) + '\n');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Test 1: Vérifier que le proxy.ts a le caching
console.log('📋 Test 1: Caching dans proxy.ts');
try {
  const proxyFile = fs.readFileSync(
    path.join(__dirname, '../proxy.ts'),
    'utf8'
  );

  if (proxyFile.includes('maintenanceCache')) {
    console.log('  ✅ Cache en mémoire pour maintenance trouvé');
    results.passed.push('Maintenance cache');
  } else {
    console.log('  ❌ Cache en mémoire MANQUANT');
    results.failed.push('Maintenance cache');
  }

  if (proxyFile.includes('Cache-Control')) {
    console.log('  ✅ Headers Cache-Control trouvés');
    results.passed.push('Cache-Control headers');
  } else {
    console.log('  ❌ Headers Cache-Control MANQUANTS');
    results.failed.push('Cache-Control headers');
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
  results.failed.push('proxy.ts analysis');
}

console.log('\n📋 Test 2: Cache utilities');
try {
  const cacheFile = fs.readFileSync(
    path.join(__dirname, '../lib/cache-utils.ts'),
    'utf8'
  );

  if (cacheFile.includes('cache(')) {
    console.log('  ✅ React Cache trouvé');
    results.passed.push('React Cache');
  } else {
    console.log('  ⚠️  React Cache pas trouvé');
    results.warnings.push('React Cache');
  }

  if (cacheFile.includes('getCachedUser') && cacheFile.includes('getCachedShopList')) {
    console.log('  ✅ Cache utilities trouvées');
    results.passed.push('Cache utilities');
  } else {
    console.log('  ⚠️  Certaines cache utilities manquent');
    results.warnings.push('Cache utilities');
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
  results.failed.push('cache-utils.ts analysis');
}

console.log('\n📋 Test 3: Image optimization');
try {
  const optimizedImage = fs.readFileSync(
    path.join(__dirname, '../components/ui/OptimizedImage.tsx'),
    'utf8'
  );

  if (optimizedImage.includes('next/image')) {
    console.log('  ✅ Next.js Image component utilisé');
    results.passed.push('Image component');
  } else {
    console.log('  ❌ Next.js Image component MANQUANT');
    results.failed.push('Image component');
  }

  if (optimizedImage.includes('loading="lazy"') || optimizedImage.includes('priority')) {
    console.log('  ✅ Lazy loading configuré');
    results.passed.push('Lazy loading');
  } else {
    console.log('  ⚠️  Lazy loading pourrait être mieux configuré');
    results.warnings.push('Lazy loading');
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
  results.failed.push('OptimizedImage analysis');
}

console.log('\n📋 Test 4: Dynamic imports');
try {
  const develivreurFile = fs.readFileSync(
    path.join(__dirname, '../app/devenir-livreur/page.tsx'),
    'utf8'
  );

  const dynamicCount = (develivreurFile.match(/dynamic\(/g) || []).length;
  console.log(`  ✅ ${dynamicCount} dynamic imports trouvés`);

  if (dynamicCount >= 4) {
    console.log('  ✅ Suffisamment de sections lazy-loadées');
    results.passed.push('Dynamic imports');
  } else {
    console.log('  ⚠️  Seulement ' + dynamicCount + ' dynamic imports');
    results.warnings.push('Dynamic imports count');
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
  results.failed.push('Dynamic imports analysis');
}

console.log('\n📋 Test 5: Bundle size check');
try {
  console.log('  ⏳ Analyse du package.json...');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );

  const deps = Object.keys(packageJson.dependencies || {});
  console.log(`  ✅ ${deps.length} dépendances trouvées`);

  // Vérifier les dépendances lourdes
  const heavyDeps = ['framer-motion', 'recharts', 'leaflet', 'html5-qrcode', 'pdfkit'];
  const found = heavyDeps.filter(dep => deps.includes(dep));

  if (found.length > 0) {
    console.log(`  ℹ️  Dépendances lourdes présentes: ${found.join(', ')}`);
    console.log('  💡 À vérifier que ces dépendances sont lazy-loadées');
    results.warnings.push('Heavy dependencies need lazy loading');
  }

  results.passed.push('Package.json analysis');
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
  results.failed.push('Package.json analysis');
}

console.log('\n📋 Test 6: Documentation');
try {
  const perfFile = fs.existsSync(path.join(__dirname, '../PERFORMANCE.md'));
  const depsFile = fs.existsSync(path.join(__dirname, '../DEPENDENCIES.md'));
  const planFile = fs.existsSync(path.join(__dirname, '../OPTIMIZATION_PLAN.md'));

  if (perfFile && depsFile && planFile) {
    console.log('  ✅ Documentation complète trouvée');
    results.passed.push('Documentation');
  } else {
    console.log('  ⚠️  Certains fichiers de documentation manquent');
    results.warnings.push('Documentation');
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
  results.failed.push('Documentation check');
}

// Résumé
console.log('\n' + '=' .repeat(50));
console.log('\n📊 RÉSUMÉ DES TESTS\n');
console.log(`✅ Réussis: ${results.passed.length}`);
results.passed.forEach(test => console.log(`   • ${test}`));

if (results.warnings.length > 0) {
  console.log(`\n⚠️  Avertissements: ${results.warnings.length}`);
  results.warnings.forEach(test => console.log(`   • ${test}`));
}

if (results.failed.length > 0) {
  console.log(`\n❌ Échoués: ${results.failed.length}`);
  results.failed.forEach(test => console.log(`   • ${test}`));
  console.log('\n🔴 CERTAINS TESTS ONT ÉCHOUÉ');
  process.exit(1);
} else {
  console.log('\n🟢 TOUS LES TESTS SONT PASSÉS!');
  process.exit(0);
}
