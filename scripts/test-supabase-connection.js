/**
 * Script de test de connexion Supabase
 * Vérifie que la base de données est correctement configurée
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Test de connexion Supabase...');
  
  try {
    // Test 1: Connexion de base
    console.log('1️⃣ Test de connexion de base...');
    const { data, error } = await supabase
      .from('school_groups')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion réussie !');
    
    // Test 2: Vérifier la structure de la table
    console.log('2️⃣ Vérification de la structure de la table...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'school_groups' });
    
    if (columnsError) {
      console.warn('⚠️ Impossible de vérifier les colonnes:', columnsError.message);
    } else {
      console.log('✅ Colonnes disponibles:', columns?.map(c => c.column_name) || 'Non disponible');
    }
    
    // Test 3: Test d'insertion (avec rollback)
    console.log('3️⃣ Test d\'insertion...');
    const testGroup = {
      name: 'Test Group',
      code: 'TEST-001',
      region: 'Brazzaville',
      city: 'Brazzaville',
      plan: 'gratuit',
      status: 'active'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('school_groups')
      .insert(testGroup)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError.message);
      return false;
    }
    
    console.log('✅ Insertion réussie !', insertData);
    
    // Nettoyer le test
    await supabase
      .from('school_groups')
      .delete()
      .eq('id', insertData.id);
    
    console.log('✅ Nettoyage effectué');
    
    console.log('\n🎉 Tous les tests sont passés ! Supabase est correctement configuré.');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return false;
  }
}

// Exécuter le test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Configuration Supabase validée !');
      process.exit(0);
    } else {
      console.log('\n❌ Configuration Supabase incomplète. Vérifiez les étapes ci-dessus.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
