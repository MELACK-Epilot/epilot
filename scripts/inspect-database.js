/**
 * Script pour inspecter les tables Supabase en détail
 * Usage: node scripts/inspect-database.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

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

async function inspectTable(tableName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 TABLE: ${tableName.toUpperCase()}`);
  console.log('='.repeat(60));

  try {
    // Compter les lignes
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Erreur: ${countError.message}`);
      return;
    }

    console.log(`📊 Nombre de lignes: ${count || 0}`);

    // Récupérer quelques exemples
    if (count > 0) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`❌ Erreur lors de la récupération: ${error.message}`);
        return;
      }

      console.log(`\n📝 Colonnes détectées:`);
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        columns.forEach((col, index) => {
          const value = data[0][col];
          const type = typeof value;
          console.log(`   ${(index + 1).toString().padStart(2)}. ${col.padEnd(25)} (${type})`);
        });

        console.log(`\n📄 Exemple de données (${Math.min(3, data.length)} première(s) ligne(s)):`);
        data.forEach((row, index) => {
          console.log(`\n   Ligne ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            let displayValue = value;
            if (value === null) displayValue = 'NULL';
            else if (typeof value === 'string' && value.length > 50) {
              displayValue = value.substring(0, 47) + '...';
            }
            console.log(`      ${key.padEnd(25)}: ${displayValue}`);
          });
        });
      }
    } else {
      console.log('⚠️  Table vide (aucune donnée)');
    }
  } catch (err) {
    console.log(`❌ Erreur: ${err.message}`);
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  E-PILOT CONGO - Inspection détaillée de la base');
  console.log('═'.repeat(60));
  console.log(`📍 URL: ${supabaseUrl}\n`);

  for (const table of TABLES) {
    await inspectTable(table);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  INSPECTION TERMINÉE');
  console.log('═'.repeat(60));
}

main().catch(console.error);
