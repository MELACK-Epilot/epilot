/**
 * Script pour vérifier l'existence des tables dans Supabase
 * @module CheckSupabaseTables
 */

import { supabase } from './supabase';

/**
 * Liste des tables attendues
 */
const EXPECTED_TABLES = [
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

/**
 * Vérifier l'existence des tables
 */
export const checkSupabaseTables = async () => {
  console.log('🔍 Vérification des tables Supabase...\n');

  const results: { table: string; exists: boolean; error?: string }[] = [];

  for (const tableName of EXPECTED_TABLES) {
    try {
      // Tenter de faire un SELECT sur la table
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);

      if (error) {
        // Erreur 42P01 = table n'existe pas
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          results.push({ table: tableName, exists: false });
          console.log(`❌ Table "${tableName}" n'existe pas`);
        } else {
          results.push({ table: tableName, exists: false, error: error.message });
          console.log(`⚠️  Table "${tableName}" - Erreur: ${error.message}`);
        }
      } else {
        results.push({ table: tableName, exists: true });
        console.log(`✅ Table "${tableName}" existe`);
      }
    } catch (err: any) {
      results.push({ table: tableName, exists: false, error: err.message });
      console.log(`❌ Table "${tableName}" - Erreur: ${err.message}`);
    }
  }

  console.log('\n📊 Résumé:');
  const existingTables = results.filter((r) => r.exists);
  const missingTables = results.filter((r) => !r.exists);

  console.log(`✅ Tables existantes: ${existingTables.length}/${EXPECTED_TABLES.length}`);
  console.log(`❌ Tables manquantes: ${missingTables.length}/${EXPECTED_TABLES.length}`);

  if (missingTables.length > 0) {
    console.log('\n⚠️  Tables manquantes:');
    missingTables.forEach((r) => console.log(`   - ${r.table}`));
    console.log('\n💡 Action requise: Exécutez le fichier SUPABASE_SQL_SCHEMA.sql dans le SQL Editor');
  } else {
    console.log('\n✅ Toutes les tables sont présentes!');
  }

  return {
    total: EXPECTED_TABLES.length,
    existing: existingTables.length,
    missing: missingTables.length,
    tables: results,
  };
};

/**
 * Vérifier la connexion Supabase
 */
export const testSupabaseConnection = async () => {
  console.log('🔌 Test de connexion Supabase...');

  try {
    // Test simple de connexion
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Connexion établie mais la table "users" n\'existe pas encore');
        return { connected: true, tablesExist: false };
      }
      console.error('❌ Erreur de connexion:', error.message);
      return { connected: false, error: error.message };
    }

    console.log('✅ Connexion Supabase réussie!');
    return { connected: true, tablesExist: true };
  } catch (err: any) {
    console.error('❌ Erreur de connexion:', err.message);
    return { connected: false, error: err.message };
  }
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await testSupabaseConnection();
    console.log('\n');
    await checkSupabaseTables();
  })();
}
