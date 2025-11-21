/**
 * Script pour vérifier les vraies données dans Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('\n🔍 VÉRIFICATION DES DONNÉES RÉELLES\n');
  console.log('='.repeat(70));

  // 1. Groupes scolaires
  console.log('\n📊 1. GROUPES SCOLAIRES');
  console.log('-'.repeat(70));
  const { data: groups, error: groupsError } = await supabase
    .from('school_groups')
    .select('*');
  
  if (groupsError) {
    console.error('❌ Erreur:', groupsError.message);
  } else {
    console.log(`✅ ${groups?.length || 0} groupes trouvés`);
    groups?.forEach((g, i) => {
      console.log(`   ${i + 1}. ${g.name} (${g.status || 'N/A'})`);
    });
  }

  // 2. Abonnements actifs
  console.log('\n💳 2. ABONNEMENTS ACTIFS');
  console.log('-'.repeat(70));
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select(`
      *,
      school_groups (name),
      subscription_plans (name, price)
    `)
    .eq('status', 'active');
  
  if (subsError) {
    console.error('❌ Erreur:', subsError.message);
  } else {
    console.log(`✅ ${subs?.length || 0} abonnements actifs`);
    let totalMRR = 0;
    subs?.forEach((s, i) => {
      const price = s.subscription_plans?.price || 0;
      totalMRR += price;
      console.log(`   ${i + 1}. ${s.school_groups?.name || 'N/A'}`);
      console.log(`      Plan: ${s.subscription_plans?.name || 'N/A'}`);
      console.log(`      Prix: ${price.toLocaleString()} FCFA/mois`);
      console.log(`      Fin: ${s.end_date || 'N/A'}`);
    });
    console.log(`\n💰 MRR TOTAL: ${(totalMRR / 1000000).toFixed(2)}M FCFA`);
  }

  // 3. Utilisateurs actifs
  console.log('\n👥 3. UTILISATEURS ACTIFS');
  console.log('-'.repeat(70));
  const { count: activeUsers, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  if (usersError) {
    console.error('❌ Erreur:', usersError.message);
  } else {
    console.log(`✅ ${activeUsers || 0} utilisateurs actifs`);
  }

  // 4. Activités récentes
  console.log('\n📝 4. ACTIVITÉS RÉCENTES (10 dernières)');
  console.log('-'.repeat(70));
  const { data: activities, error: actError } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (actError) {
    console.error('❌ Erreur:', actError.message);
  } else {
    console.log(`✅ ${activities?.length || 0} activités trouvées`);
    activities?.forEach((a, i) => {
      const date = new Date(a.created_at);
      console.log(`   ${i + 1}. ${a.action_type || 'N/A'}`);
      console.log(`      User: ${a.user_name || 'Système'}`);
      console.log(`      Date: ${date.toLocaleString('fr-FR')}`);
      console.log(`      Desc: ${a.description || 'N/A'}`);
    });
  }

  // 5. Paiements (fee_payments)
  console.log('\n💵 5. PAIEMENTS RÉCENTS');
  console.log('-'.repeat(70));
  const { data: payments, error: payError } = await supabase
    .from('fee_payments')
    .select('*')
    .order('payment_date', { ascending: false })
    .limit(10);
  
  if (payError) {
    console.error('❌ Erreur:', payError.message);
  } else {
    console.log(`✅ ${payments?.length || 0} paiements trouvés`);
    let totalPayments = 0;
    payments?.forEach((p, i) => {
      totalPayments += p.amount || 0;
      console.log(`   ${i + 1}. ${p.amount?.toLocaleString()} FCFA`);
      console.log(`      Date: ${p.payment_date || 'N/A'}`);
      console.log(`      Statut: ${p.status || 'N/A'}`);
    });
    console.log(`\n💰 TOTAL: ${(totalPayments / 1000000).toFixed(2)}M FCFA`);
  }

  // 6. Modules configurés
  console.log('\n📦 6. MODULES CONFIGURÉS');
  console.log('-'.repeat(70));
  const { data: moduleConfigs, error: modError } = await supabase
    .from('group_module_configs')
    .select(`
      *,
      modules (name),
      school_groups (name)
    `)
    .eq('is_enabled', true);
  
  if (modError) {
    console.error('❌ Erreur:', modError.message);
  } else {
    console.log(`✅ ${moduleConfigs?.length || 0} modules activés`);
    moduleConfigs?.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.modules?.name || 'N/A'}`);
      console.log(`      Groupe: ${m.school_groups?.name || 'N/A'}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ VÉRIFICATION TERMINÉE\n');
}

checkData().catch(err => {
  console.error('\n❌ ERREUR GLOBALE:', err);
  process.exit(1);
});
