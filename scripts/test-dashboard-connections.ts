/**
 * Script de Test - Connexions Dashboard Proviseur
 * Vérifie que tous les fichiers et imports sont corrects
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

const results: TestResult[] = [];

// Fonction helper pour vérifier l'existence d'un fichier
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Fonction helper pour vérifier un import dans un fichier
function checkImport(filePath: string, importStatement: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes(importStatement);
  } catch {
    return false;
  }
}

console.log('🔍 Test des Connexions Dashboard Proviseur\n');

// Test 1: Fichiers principaux existent
console.log('📁 Test 1: Fichiers principaux...');
const mainFiles = [
  'src/features/user-space/pages/DirectorDashboard.tsx',
  'src/features/user-space/hooks/useDirectorDashboard.ts',
  'src/App.tsx',
  'src/features/user-space/pages/UserDashboard.tsx'
];

mainFiles.forEach(file => {
  const exists = fileExists(file);
  results.push({
    name: `Fichier ${file}`,
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? 'Existe' : 'Manquant'
  });
});

// Test 2: Composants dashboard existent
console.log('📁 Test 2: Composants dashboard...');
const dashboardComponents = [
  'src/features/user-space/components/dashboard/index.ts',
  'src/features/user-space/components/dashboard/DashboardHeader.tsx',
  'src/features/user-space/components/dashboard/KPICard.tsx',
  'src/features/user-space/components/dashboard/NiveauSection.tsx',
  'src/features/user-space/components/dashboard/GlobalKPIsSection.tsx',
  'src/features/user-space/components/dashboard/EmptyState.tsx'
];

dashboardComponents.forEach(file => {
  const exists = fileExists(file);
  results.push({
    name: `Composant ${path.basename(file)}`,
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? 'Existe' : 'Manquant'
  });
});

// Test 3: Imports dans DirectorDashboard.tsx
console.log('📁 Test 3: Imports DirectorDashboard...');
const dashboardFile = 'src/features/user-space/pages/DirectorDashboard.tsx';
const requiredImports = [
  "import { useDirectorDashboard } from '../hooks/useDirectorDashboard'",
  "import { DashboardHeader } from '../components/dashboard/DashboardHeader'",
  "import { GlobalKPIsSection } from '../components/dashboard/GlobalKPIsSection'",
  "import { NiveauSection } from '../components/dashboard/NiveauSection'",
  "import { EmptyState } from '../components/dashboard/EmptyState'",
  "import AlertSystem from '../components/AlertSystem'",
  "import TrendChart from '../components/TrendChart'",
  "import TemporalComparison from '../components/TemporalComparison'"
];

requiredImports.forEach(importStmt => {
  const exists = checkImport(dashboardFile, importStmt);
  results.push({
    name: `Import ${importStmt.split("'")[1]}`,
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? 'Présent' : 'Manquant'
  });
});

// Test 4: Routes dans App.tsx
console.log('📁 Test 4: Routes App.tsx...');
const appFile = 'src/App.tsx';
const routeChecks = [
  "import { DirectorDashboard } from './features/user-space/pages/DirectorDashboard'",
  "<DirectorDashboard />"
];

routeChecks.forEach(check => {
  const exists = checkImport(appFile, check);
  results.push({
    name: `Route ${check.includes('import') ? 'Import' : 'Usage'}`,
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? 'Présent' : 'Manquant'
  });
});

// Test 5: Modules dashboard
console.log('📁 Test 5: Modules dashboard...');
const dashboardModules = [
  'src/features/user-space/hooks/dashboard/loadSchoolLevels.ts',
  'src/features/user-space/hooks/dashboard/loadTrendData.ts',
  'src/features/user-space/hooks/dashboard/types.ts'
];

dashboardModules.forEach(file => {
  const exists = fileExists(file);
  results.push({
    name: `Module ${path.basename(file)}`,
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? 'Existe' : 'Manquant'
  });
});

// Afficher les résultats
console.log('\n📊 RÉSULTATS DES TESTS\n');
console.log('═'.repeat(60));

let passCount = 0;
let failCount = 0;

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  
  if (result.status === 'PASS') passCount++;
  else failCount++;
});

console.log('═'.repeat(60));
console.log(`\n📈 Score: ${passCount}/${results.length} tests réussis`);
console.log(`✅ Réussis: ${passCount}`);
console.log(`❌ Échoués: ${failCount}`);

if (failCount === 0) {
  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
  console.log('✅ Dashboard Proviseur correctement connecté');
  process.exit(0);
} else {
  console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
  console.log('❌ Vérifier les connexions manquantes');
  process.exit(1);
}
