/**
 * Script pour vérifier l'état de la base de données Supabase
 * Usage: node scripts/check-database.js
 */

import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement directement
// En production, utilisez les vraies variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Vérifiez que .env.local contient:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'users',
  'school_groups',
  'schools',
  'plans',
  'subscriptions',
  'business_categories',
  'modules',
  'activity_logs',
  'notifications',
];

async function checkConnection() {
  console.log('🔌 Test de connexion Supabase...');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  try {
    // Test de connexion simple
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('✅ Connexion établie');
        console.log('⚠️  Mais la base de données est vide (aucune table)\n');
        return { connected: true, isEmpty: true };
      }
      console.error('❌ Erreur:', error.message);
      return { connected: false, error: error.message };
    }

    console.log('✅ Connexion établie');
    console.log('✅ Base de données accessible\n');
    return { connected: true, isEmpty: false };
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message);
    return { connected: false, error: err.message };
  }
}

async function checkTables() {
  console.log('🔍 Vérification des tables...\n');

  const results = [];

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log(`❌ ${table.padEnd(25)} - N'existe pas`);
          results.push({ table, exists: false });
        } else {
          console.log(`⚠️  ${table.padEnd(25)} - Erreur: ${error.message}`);
          results.push({ table, exists: false, error: error.message });
        }
      } else {
        console.log(`✅ ${table.padEnd(25)} - Existe`);
        results.push({ table, exists: true });
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(25)} - Erreur: ${err.message}`);
      results.push({ table, exists: false, error: err.message });
    }
  }

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  E-PILOT CONGO - Vérification Base de Données');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Vérifier la connexion
  const connectionResult = await checkConnection();

  if (!connectionResult.connected) {
    console.error('\n❌ Impossible de se connecter à Supabase');
    console.error('Vérifiez vos identifiants dans .env.local');
    process.exit(1);
  }

  // 2. Vérifier les tables
  const tableResults = await checkTables();

  // 3. Résumé
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════\n');

  const existing = tableResults.filter((r) => r.exists).length;
  const missing = tableResults.filter((r) => !r.exists).length;

  console.log(`📊 Tables existantes: ${existing}/${TABLES.length}`);
  console.log(`📊 Tables manquantes: ${missing}/${TABLES.length}\n`);

  if (missing > 0) {
    console.log('⚠️  ACTIONS REQUISES:\n');
    console.log('1. Ouvrez le SQL Editor de Supabase:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/editor\n`);
    console.log('2. Copiez le contenu de: SUPABASE_SQL_SCHEMA.sql\n');
    console.log('3. Collez dans le SQL Editor et cliquez sur "Run"\n');
    console.log('4. Relancez ce script pour vérifier\n');
  } else {
    console.log('✅ Toutes les tables sont présentes!');
    console.log('✅ La base de données est prête à l\'emploi!\n');
  }

  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
