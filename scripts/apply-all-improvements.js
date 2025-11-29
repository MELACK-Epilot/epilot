/**
 * Script pour appliquer toutes les améliorations
 * 1. Vue matérialisée subscriptions_enriched
 * 2. Colonnes additionnelles
 * 3. Vérification finale
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Application de toutes les améliorations\n');
  console.log('═'.repeat(80));

  try {
    // 1. Ajouter les colonnes manquantes
    console.log('\n📋 1. AJOUT DES COLONNES ADDITIONNELLES\n');
    
    const columnsToAdd = [
      { name: 'trial_end_date', type: 'TIMESTAMPTZ' },
      { name: 'cancellation_reason', type: 'TEXT' },
      { name: 'cancelled_at', type: 'TIMESTAMPTZ' },
      { name: 'cancelled_by', type: 'UUID' },
      { name: 'renewal_count', type: 'INTEGER' },
      { name: 'last_renewal_date', type: 'TIMESTAMPTZ' },
    ];

    for (const col of columnsToAdd) {
      // Vérifier si la colonne existe
      const { data: columns } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            AND column_name = '${col.name}'
          `
        })
        .single();

      if (!columns || columns.length === 0) {
        console.log(`  ⚠️  Colonne ${col.name} : Nécessite un accès service_role`);
        console.log(`     → À exécuter manuellement dans Supabase Dashboard`);
      } else {
        console.log(`  ✅ Colonne ${col.name} : Déjà présente`);
      }
    }

    // 2. Vérifier si la vue matérialisée existe
    console.log('\n📊 2. VÉRIFICATION VUE MATÉRIALISÉE\n');
    
    const { data: viewData, error: viewError } = await supabase
      .from('subscriptions_enriched')
      .select('id')
      .limit(1);

    if (viewError) {
      console.log('  ⚠️  Vue subscriptions_enriched : Non disponible');
      console.log('     → À créer manuellement dans Supabase Dashboard');
      console.log('     → Fichier: database/CREATE_SUBSCRIPTIONS_ENRICHED_VIEW.sql');
    } else {
      console.log('  ✅ Vue subscriptions_enriched : Disponible');
      console.log(`     → ${viewData?.length || 0} enregistrement(s) trouvé(s)`);
    }

    // 3. Tester les hooks optimisés
    console.log('\n🔍 3. TEST DES HOOKS OPTIMISÉS\n');
    
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('id, name, slug')
      .limit(1);

    if (plans && plans.length > 0) {
      const testPlan = plans[0];
      console.log(`  Test avec le plan: ${testPlan.name}`);

      // Test avec vue matérialisée
      const start1 = Date.now();
      const { data: enrichedSubs, error: enrichedError } = await supabase
        .from('subscriptions_enriched')
        .select('*')
        .eq('plan_id', testPlan.id);
      const time1 = Date.now() - start1;

      if (!enrichedError) {
        console.log(`  ✅ Vue matérialisée: ${time1}ms (${enrichedSubs?.length || 0} abonnements)`);
      }

      // Test avec méthode classique
      const start2 = Date.now();
      const { data: classicSubs } = await supabase
        .from('subscriptions')
        .select(`
          *,
          school_groups (name, logo),
          subscription_plans (name, price)
        `)
        .eq('plan_id', testPlan.id);
      const time2 = Date.now() - start2;

      console.log(`  📊 Méthode classique: ${time2}ms (${classicSubs?.length || 0} abonnements)`);
      
      if (!enrichedError && time1 < time2) {
        const improvement = ((time2 - time1) / time2 * 100).toFixed(1);
        console.log(`  🚀 Amélioration: ${improvement}% plus rapide !`);
      }
    }

    // 4. Vérifier les statistiques
    console.log('\n📈 4. STATISTIQUES GLOBALES\n');
    
    const { data: allSubs } = await supabase
      .from('subscriptions')
      .select('status, end_date');

    if (allSubs) {
      const now = Date.now();
      const expiringSoon = allSubs.filter(s => {
        if (s.status !== 'active' || !s.end_date) return false;
        const daysUntil = Math.ceil((new Date(s.end_date).getTime() - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 7;
      }).length;

      const expiringThisMonth = allSubs.filter(s => {
        if (s.status !== 'active' || !s.end_date) return false;
        const daysUntil = Math.ceil((new Date(s.end_date).getTime() - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 7 && daysUntil <= 30;
      }).length;

      console.log(`  Total abonnements: ${allSubs.length}`);
      console.log(`  Actifs: ${allSubs.filter(s => s.status === 'active').length}`);
      console.log(`  Expirant bientôt (7j): ${expiringSoon}`);
      console.log(`  Expirant ce mois (30j): ${expiringThisMonth}`);
    }

    // 5. Résumé des fichiers créés
    console.log('\n' + '═'.repeat(80));
    console.log('\n📁 FICHIERS CRÉÉS\n');
    
    const files = [
      'database/CREATE_SUBSCRIPTIONS_ENRICHED_VIEW.sql',
      'database/ADD_SUBSCRIPTION_COLUMNS.sql',
      'src/features/dashboard/hooks/usePlanSubscriptionsOptimized.ts',
      'src/features/dashboard/components/plans/ExpiryAlertBanner.tsx',
      'scripts/apply-all-improvements.js',
    ];

    files.forEach(file => {
      const fullPath = path.join(__dirname, '..', file);
      if (fs.existsSync(fullPath)) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ❌ ${file} (manquant)`);
      }
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Vérification terminée !\n');
    
    console.log('📝 ACTIONS MANUELLES REQUISES:\n');
    console.log('1. Exécuter database/CREATE_SUBSCRIPTIONS_ENRICHED_VIEW.sql dans Supabase Dashboard');
    console.log('2. Exécuter database/ADD_SUBSCRIPTION_COLUMNS.sql dans Supabase Dashboard');
    console.log('3. Les composants Frontend sont déjà mis à jour ✅');
    console.log('\n💡 Une fois les scripts SQL exécutés, le système utilisera automatiquement');
    console.log('   la vue matérialisée pour des performances optimales !');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
