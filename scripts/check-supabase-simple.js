/**
 * Test simple de connexion Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log('🔍 Vérification de la connexion Supabase...\n');
  
  try {
    // Test 1: Connexion basique
    console.log('1️⃣ Test de connexion...');
    const { data, error } = await supabase
      .from('school_groups')
      .select('id, name')
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return false;
    }
    
    console.log(`✅ Connexion réussie ! ${data?.length || 0} groupes scolaires trouvés`);
    if (data && data.length > 0) {
      console.log('   Exemples:', data.map(g => g.name).join(', '));
    }
    
    // Test 2: Vérifier les utilisateurs
    console.log('\n2️⃣ Vérification des utilisateurs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erreur:', usersError.message);
    } else {
      console.log(`✅ ${users?.length || 0} utilisateurs trouvés`);
    }
    
    // Test 3: Vérifier les modules
    console.log('\n3️⃣ Vérification des modules...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name, slug')
      .limit(5);
    
    if (modulesError) {
      console.error('❌ Erreur:', modulesError.message);
    } else {
      console.log(`✅ ${modules?.length || 0} modules trouvés`);
      if (modules && modules.length > 0) {
        console.log('   Modules:', modules.map(m => m.name).join(', '));
      }
    }
    
    // Test 4: Vérifier les plans
    console.log('\n4️⃣ Vérification des plans d\'abonnement...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price')
      .limit(5);
    
    if (plansError) {
      console.error('❌ Erreur:', plansError.message);
    } else {
      console.log(`✅ ${plans?.length || 0} plans trouvés`);
      if (plans && plans.length > 0) {
        console.log('   Plans:', plans.map(p => `${p.name} (${p.price} FCFA)`).join(', '));
      }
    }
    
    console.log('\n🎉 Configuration Supabase validée !');
    console.log('✅ Votre base de données est opérationnelle');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
    return false;
  }
}

checkConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
