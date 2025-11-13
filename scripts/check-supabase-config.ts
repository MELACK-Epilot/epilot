/**
 * Script de vérification de la configuration Supabase
 * Vérifie la connexion et la structure de la base de données
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfiguration() {
  console.log('🔍 Vérification de la configuration Supabase E-Pilot...\n');
  
  const results = {
    connection: false,
    tables: {} as Record<string, boolean>,
    columns: {} as Record<string, string[]>,
    errors: [] as string[]
  };

  try {
    // 1. Test de connexion
    console.log('1️⃣ Test de connexion...');
    const { error: pingError } = await supabase.from('school_groups').select('count').limit(0);
    
    if (pingError) {
      if (pingError.message.includes('relation') || pingError.message.includes('does not exist')) {
        console.log('⚠️  Table school_groups n\'existe pas encore');
        results.errors.push('Table school_groups manquante - Exécutez SUPABASE_SQL_SCHEMA.sql');
      } else {
        console.error('❌ Erreur de connexion:', pingError.message);
        results.errors.push(`Connexion: ${pingError.message}`);
        return results;
      }
    } else {
      console.log('✅ Connexion établie');
      results.connection = true;
    }

    // 2. Vérifier les tables principales
    console.log('\n2️⃣ Vérification des tables...');
    const tables = ['users', 'school_groups', 'schools', 'plans', 'subscriptions', 'business_categories', 'modules'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(0);
      results.tables[table] = !error;
      console.log(`   ${!error ? '✅' : '❌'} ${table}`);
      
      if (error && !error.message.includes('relation')) {
        results.errors.push(`Table ${table}: ${error.message}`);
      }
    }

    // 3. Vérifier les colonnes de school_groups
    if (results.tables['school_groups']) {
      console.log('\n3️⃣ Vérification des colonnes school_groups...');
      
      const requiredColumns = [
        'id', 'name', 'code', 'region', 'city', 
        'address', 'phone', 'website', 'founded_year', 'description', 'logo',
        'admin_id', 'plan', 'status', 'school_count', 'student_count'
      ];
      
      // Test d'insertion pour vérifier les colonnes
      const testData = {
        name: 'Test Verification',
        code: 'TEST-VERIFY',
        region: 'Brazzaville',
        city: 'Brazzaville',
        address: 'Test Address',
        phone: '+242 06 000 00 00',
        website: 'https://test.cg',
        founded_year: 2020,
        description: 'Test description',
        logo: '',
        plan: 'gratuit',
        status: 'active',
        school_count: 0,
        student_count: 0
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('school_groups')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.log('❌ Erreur d\'insertion test:', insertError.message);
        
        // Analyser quelle colonne manque
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const match = insertError.message.match(/column "([^"]+)"/);
          if (match) {
            results.errors.push(`Colonne manquante: ${match[1]}`);
            console.log(`   ❌ Colonne manquante: ${match[1]}`);
          }
        } else {
          results.errors.push(`Insertion test: ${insertError.message}`);
        }
      } else {
        console.log('✅ Toutes les colonnes requises sont présentes');
        
        // Nettoyer le test
        await supabase.from('school_groups').delete().eq('id', insertTest.id);
        console.log('✅ Test nettoyé');
        
        results.columns['school_groups'] = requiredColumns;
      }
    }

    // 4. Vérifier l'authentification
    console.log('\n4️⃣ Vérification de l\'authentification...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  Aucun utilisateur connecté (normal en développement)');
      results.errors.push('Aucun utilisateur connecté - Utilisez le mock pour le développement');
    } else {
      console.log('✅ Utilisateur connecté:', user.email);
    }

    return results;

  } catch (error: any) {
    console.error('❌ Erreur fatale:', error.message);
    results.errors.push(`Erreur fatale: ${error.message}`);
    return results;
  }
}

// Exécuter la vérification
checkConfiguration().then((results) => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA CONFIGURATION');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Connexion: ${results.connection ? 'OK' : 'ÉCHEC'}`);
  
  console.log('\n📋 Tables:');
  Object.entries(results.tables).forEach(([table, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  });
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  ERREURS DÉTECTÉES:');
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    
    console.log('\n🔧 ACTIONS REQUISES:');
    if (results.errors.some(e => e.includes('Table') && e.includes('manquante'))) {
      console.log('   1. Exécutez SUPABASE_SQL_SCHEMA.sql dans le SQL Editor de Supabase');
      console.log('      URL: https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/sql');
    }
    if (results.errors.some(e => e.includes('Colonne manquante'))) {
      console.log('   2. Exécutez SUPABASE_FIX_SCHOOL_GROUPS.sql pour ajouter les colonnes manquantes');
    }
    if (results.errors.some(e => e.includes('utilisateur'))) {
      console.log('   3. Le système utilise un mock pour le développement (normal)');
    }
  } else {
    console.log('\n🎉 CONFIGURATION COMPLÈTE !');
    console.log('   Toutes les tables et colonnes sont présentes.');
    console.log('   Vous pouvez utiliser le formulaire de création de groupes scolaires.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(results.errors.length > 0 ? 1 : 0);
});
