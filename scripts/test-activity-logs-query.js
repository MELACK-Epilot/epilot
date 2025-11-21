/**
 * Tester la requête activity_logs avec JOIN sur users
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('\n🧪 TEST REQUÊTE ACTIVITY_LOGS\n');
  console.log('='.repeat(70));

  // Test 1: Requête simple
  console.log('\n📊 TEST 1: Requête simple (sans JOIN)');
  console.log('-'.repeat(70));
  const { data: simple, error: simpleError } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (simpleError) {
    console.error('❌ Erreur:', simpleError.message);
  } else {
    console.log(`✅ ${simple?.length || 0} activités trouvées`);
    simple?.slice(0, 3).forEach((a, i) => {
      console.log(`\n${i + 1}. Action: ${a.action} | Entity: ${a.entity}`);
      console.log(`   User ID: ${a.user_id}`);
      console.log(`   Details: ${a.details || 'N/A'}`);
      console.log(`   Date: ${new Date(a.created_at).toLocaleString('fr-FR')}`);
    });
  }

  // Test 2: Requête avec JOIN sur users
  console.log('\n\n📊 TEST 2: Requête avec JOIN sur users');
  console.log('-'.repeat(70));
  const { data: withJoin, error: joinError } = await supabase
    .from('activity_logs')
    .select(`
      *,
      users!activity_logs_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (joinError) {
    console.error('❌ Erreur:', joinError.message);
    console.log('Détails:', joinError);
  } else {
    console.log(`✅ ${withJoin?.length || 0} activités trouvées avec JOIN`);
    withJoin?.slice(0, 3).forEach((a, i) => {
      const user = a.users;
      const userName = user 
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
        : 'Système';
      
      console.log(`\n${i + 1}. ${a.action} ${a.entity}`);
      console.log(`   Utilisateur: ${userName}`);
      console.log(`   Details: ${a.details || 'N/A'}`);
      console.log(`   Date: ${new Date(a.created_at).toLocaleString('fr-FR')}`);
    });
  }

  // Test 3: Vérifier le mapping action + entity
  console.log('\n\n📊 TEST 3: Mapping action + entity');
  console.log('-'.repeat(70));
  
  const actionEntityPairs = new Set();
  simple?.forEach(a => {
    actionEntityPairs.add(`${a.action}.${a.entity}`);
  });

  console.log('Paires action.entity trouvées:');
  Array.from(actionEntityPairs).forEach(pair => {
    console.log(`  - ${pair}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ TESTS TERMINÉS\n');
}

testQuery().catch(console.error);
