/**
 * Script de diagnostic des abonnements
 * Vérifie la cohérence des données et des KPIs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 DIAGNOSTIC DES ABONNEMENTS\n');
  console.log('═'.repeat(80));

  try {
    // 1. Vérifier la structure de la table subscriptions
    console.log('\n📋 1. STRUCTURE DE LA TABLE SUBSCRIPTIONS\n');
    
    const { data: sampleSub, error: sampleError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erreur:', sampleError.message);
    } else if (sampleSub && sampleSub.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(sampleSub[0]).join(', '));
    }

    // 2. Compter les abonnements par statut
    console.log('\n📊 2. RÉPARTITION PAR STATUT\n');
    
    const { data: allSubs, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('id, status, plan_id, school_group_id');

    if (allSubsError) {
      console.error('❌ Erreur:', allSubsError.message);
    } else {
      const statusCount = {};
      allSubs.forEach(sub => {
        statusCount[sub.status] = (statusCount[sub.status] || 0) + 1;
      });
      
      console.table(statusCount);
      console.log(`Total: ${allSubs.length} abonnements`);
    }

    // 3. Vérifier les relations avec subscription_plans
    console.log('\n🔗 3. COHÉRENCE AVEC SUBSCRIPTION_PLANS\n');
    
    const { data: subsWithPlans, error: subsPlansError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        subscription_plans (
          id,
          name,
          slug,
          price,
          billing_period
        )
      `);

    if (subsPlansError) {
      console.error('❌ Erreur:', subsPlansError.message);
    } else {
      const orphans = subsWithPlans.filter(s => !s.subscription_plans);
      if (orphans.length > 0) {
        console.log(`⚠️  ${orphans.length} abonnements orphelins (plan_id invalide)`);
        console.table(orphans.map(o => ({ id: o.id, plan_id: o.plan_id, status: o.status })));
      } else {
        console.log('✅ Tous les abonnements ont un plan valide');
      }
    }

    // 4. Vérifier les relations avec school_groups
    console.log('\n🏫 4. COHÉRENCE AVEC SCHOOL_GROUPS\n');
    
    const { data: subsWithGroups, error: subsGroupsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        school_group_id,
        status,
        school_groups (
          id,
          name,
          code
        )
      `);

    if (subsGroupsError) {
      console.error('❌ Erreur:', subsGroupsError.message);
    } else {
      const orphans = subsWithGroups.filter(s => !s.school_groups);
      if (orphans.length > 0) {
        console.log(`⚠️  ${orphans.length} abonnements orphelins (school_group_id invalide)`);
        console.table(orphans.map(o => ({ id: o.id, school_group_id: o.school_group_id, status: o.status })));
      } else {
        console.log('✅ Tous les abonnements ont un groupe scolaire valide');
      }
    }

    // 5. Calculer les KPIs par plan
    console.log('\n💰 5. KPIs PAR PLAN\n');
    
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, slug, price, billing_period')
      .order('price', { ascending: true });

    if (plansError) {
      console.error('❌ Erreur:', plansError.message);
    } else {
      const kpis = [];
      
      for (const plan of plans) {
        const planSubs = subsWithPlans.filter(s => s.plan_id === plan.id);
        const active = planSubs.filter(s => s.status === 'active').length;
        const trial = planSubs.filter(s => s.status === 'trial').length;
        const cancelled = planSubs.filter(s => s.status === 'cancelled').length;
        
        // Calculer MRR
        const mrr = planSubs
          .filter(s => s.status === 'active')
          .reduce((sum, sub) => {
            const price = sub.subscription_plans?.price || 0;
            const period = sub.subscription_plans?.billing_period || 'monthly';
            const monthlyPrice = period === 'yearly' ? price / 12 : price;
            return sum + monthlyPrice;
          }, 0);

        kpis.push({
          plan: plan.name,
          slug: plan.slug,
          total: planSubs.length,
          active,
          trial,
          cancelled,
          mrr: Math.round(mrr),
        });
      }
      
      console.table(kpis);
    }

    // 6. Vérifier les colonnes manquantes
    console.log('\n🔍 6. COLONNES REQUISES PAR LE FRONTEND\n');
    
    const requiredColumns = [
      'id', 'school_group_id', 'plan_id', 'status',
      'start_date', 'end_date', 'auto_renew', 'created_at'
    ];

    if (sampleSub && sampleSub.length > 0) {
      const actualColumns = Object.keys(sampleSub[0]);
      const missing = requiredColumns.filter(col => !actualColumns.includes(col));
      
      if (missing.length > 0) {
        console.log('❌ Colonnes manquantes:', missing.join(', '));
      } else {
        console.log('✅ Toutes les colonnes requises sont présentes');
      }
    }

    // 7. Vérifier les données nulles/invalides
    console.log('\n⚠️  7. DONNÉES INVALIDES\n');
    
    const issues = [];
    
    if (allSubs) {
      allSubs.forEach(sub => {
        if (!sub.plan_id) issues.push({ id: sub.id, issue: 'plan_id null' });
        if (!sub.school_group_id) issues.push({ id: sub.id, issue: 'school_group_id null' });
        if (!sub.status) issues.push({ id: sub.id, issue: 'status null' });
      });
    }

    if (issues.length > 0) {
      console.log(`⚠️  ${issues.length} problèmes détectés:`);
      console.table(issues);
    } else {
      console.log('✅ Aucune donnée invalide détectée');
    }

    // 8. Résumé global
    console.log('\n' + '═'.repeat(80));
    console.log('\n📈 RÉSUMÉ GLOBAL\n');
    
    const totalSubs = allSubs?.length || 0;
    const totalActive = allSubs?.filter(s => s.status === 'active').length || 0;
    const totalMRR = subsWithPlans
      ?.filter(s => s.status === 'active')
      .reduce((sum, sub) => {
        const price = sub.subscription_plans?.price || 0;
        const period = sub.subscription_plans?.billing_period || 'monthly';
        const monthlyPrice = period === 'yearly' ? price / 12 : price;
        return sum + monthlyPrice;
      }, 0) || 0;

    console.log(`Total abonnements: ${totalSubs}`);
    console.log(`Abonnements actifs: ${totalActive}`);
    console.log(`MRR Total: ${Math.round(totalMRR).toLocaleString()} FCFA`);
    console.log(`ARR Total: ${Math.round(totalMRR * 12).toLocaleString()} FCFA`);

    console.log('\n✅ Diagnostic terminé !');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
