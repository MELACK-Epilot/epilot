/**
 * Script de diagnostic Supabase pour E-Pilot Congo
 * Vérifie la connexion et l'état de la base de données
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration du chemin pour .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

// Charger les variables d'environnement
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 DIAGNOSTIC SUPABASE - E-PILOT CONGO\n');
console.log('='.repeat(60));

// Vérification des variables d'environnement
console.log('\n📋 1. VARIABLES D\'ENVIRONNEMENT');
console.log('-'.repeat(60));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes !');
  console.log('\n⚠️  Fichier .env.local introuvable ou incomplet.');
  console.log('\n📝 Créez le fichier .env.local à la racine avec :');
  console.log('   VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=votre_anon_key');
  process.exit(1);
}

console.log('✅ VITE_SUPABASE_URL:', supabaseUrl);
console.log('✅ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test de connexion
console.log('\n🔌 2. TEST DE CONNEXION');
console.log('-'.repeat(60));

try {
  const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n⚠️  La table "users" n\'existe peut-être pas encore.');
    console.log('📝 Exécutez le fichier SUPABASE_SQL_SCHEMA.sql dans le SQL Editor de Supabase.');
  } else {
    console.log('✅ Connexion établie avec succès !');
  }
} catch (err) {
  console.error('❌ Erreur critique:', err.message);
}

// Vérification des tables
console.log('\n🗃️  3. VÉRIFICATION DES TABLES');
console.log('-'.repeat(60));

const tables = [
  'users',
  'school_groups',
  'schools',
  'plans',
  'subscriptions',
  'business_categories',
  'modules',
  'activity_logs',
  'notifications'
];

const tableStatus = {};

for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table.padEnd(25)} → Erreur: ${error.message}`);
      tableStatus[table] = { exists: false, count: 0, error: error.message };
    } else {
      console.log(`✅ ${table.padEnd(25)} → ${count || 0} enregistrement(s)`);
      tableStatus[table] = { exists: true, count: count || 0 };
    }
  } catch (err) {
    console.log(`❌ ${table.padEnd(25)} → Erreur: ${err.message}`);
    tableStatus[table] = { exists: false, count: 0, error: err.message };
  }
}

// Vérification des données
console.log('\n📊 4. DONNÉES EXISTANTES');
console.log('-'.repeat(60));

// Vérifier les plans
try {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('name, slug, price, max_schools');
  
  if (error) {
    console.log('❌ Plans:', error.message);
  } else if (plans && plans.length > 0) {
    console.log(`✅ Plans d'abonnement: ${plans.length} plan(s)`);
    plans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.slug}): ${plan.price} FCFA - Max ${plan.max_schools} école(s)`);
    });
  } else {
    console.log('⚠️  Aucun plan d\'abonnement trouvé');
  }
} catch (err) {
  console.log('❌ Plans:', err.message);
}

// Vérifier les utilisateurs
try {
  const { data: users, error } = await supabase
    .from('users')
    .select('email, first_name, last_name, role, status');
  
  if (error) {
    console.log('❌ Utilisateurs:', error.message);
  } else if (users && users.length > 0) {
    console.log(`✅ Utilisateurs: ${users.length} utilisateur(s)`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name}) - ${user.role} [${user.status}]`);
    });
  } else {
    console.log('⚠️  Aucun utilisateur trouvé');
  }
} catch (err) {
  console.log('❌ Utilisateurs:', err.message);
}

// Vérifier les groupes scolaires
try {
  const { data: groups, error } = await supabase
    .from('school_groups')
    .select('name, code, region, plan, status');
  
  if (error) {
    console.log('❌ Groupes scolaires:', error.message);
  } else if (groups && groups.length > 0) {
    console.log(`✅ Groupes scolaires: ${groups.length} groupe(s)`);
    groups.forEach(group => {
      console.log(`   - ${group.name} (${group.code}) - ${group.region} - Plan: ${group.plan} [${group.status}]`);
    });
  } else {
    console.log('⚠️  Aucun groupe scolaire trouvé');
  }
} catch (err) {
  console.log('❌ Groupes scolaires:', err.message);
}

// Résumé
console.log('\n📈 5. RÉSUMÉ');
console.log('-'.repeat(60));

const existingTables = Object.values(tableStatus).filter(t => t.exists).length;
const totalTables = tables.length;

console.log(`Tables créées: ${existingTables}/${totalTables}`);

if (existingTables === totalTables) {
  console.log('✅ Toutes les tables sont créées !');
} else {
  console.log('⚠️  Certaines tables sont manquantes.');
  console.log('\n📝 Actions à effectuer :');
  console.log('   1. Ouvrez le dashboard Supabase');
  console.log('   2. Allez dans SQL Editor');
  console.log('   3. Exécutez le fichier SUPABASE_SQL_SCHEMA.sql');
  console.log('   4. Relancez ce script');
}

// Recommandations
console.log('\n💡 6. RECOMMANDATIONS');
console.log('-'.repeat(60));

if (existingTables === 0) {
  console.log('🔴 CRITIQUE: Aucune table n\'existe');
  console.log('   → Exécutez SUPABASE_SQL_SCHEMA.sql immédiatement');
} else if (existingTables < totalTables) {
  console.log('🟡 ATTENTION: Base de données incomplète');
  console.log('   → Vérifiez les erreurs SQL et réexécutez le schéma');
} else {
  console.log('🟢 EXCELLENT: Base de données complète');
  
  const totalRecords = Object.values(tableStatus).reduce((sum, t) => sum + (t.count || 0), 0);
  
  if (totalRecords === 0) {
    console.log('   → Ajoutez des données de test');
  } else {
    console.log(`   → ${totalRecords} enregistrement(s) au total`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Diagnostic terminé !\n');
