/**
 * Script d'assignation intelligente des modules et catégories aux plans
 * Basé sur les meilleures pratiques SaaS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

// Définition de la stratégie d'assignation
const PLAN_STRATEGY = {
  gratuit: {
    categories: ['scolarite-admissions', 'pedagogie-evaluations', 'finances-comptabilite'],
    modules: [
      // Scolarité (3)
      'gestion-inscriptions', 'admission-eleves', 'suivi-eleves',
      // Pédagogie (4)
      'gestion-classes', 'gestion-matieres', 'notes-evaluations', 'bulletins-scolaires',
      // Finances (3)
      'frais-scolarite', 'paiements-recus', 'caisse-scolaire'
    ]
  },
  premium: {
    categories: [
      'scolarite-admissions', 'pedagogie-evaluations', 'finances-comptabilite',
      'ressources-humaines', 'vie-scolaire-discipline', 'services-infrastructures'
    ],
    modulesCore: true, // Tous les modules core
    modulesExtra: [
      'emplois-du-temps', 'cahier-textes', 'releves-notes',
      'gestion-enseignants', 'suivi-absences', 'suivi-retards',
      'gestion-cantine', 'bibliotheque-cdi', 'comptabilite-generale', 'rapports-financiers'
    ]
  },
  pro: {
    categories: [
      'scolarite-admissions', 'pedagogie-evaluations', 'finances-comptabilite',
      'ressources-humaines', 'vie-scolaire-discipline', 'services-infrastructures',
      'securite-acces', 'documents-rapports'
    ],
    allModulesExcept: ['badges-eleves', 'dossiers-scolaires'] // Exclus ultra-premium
  },
  institutionnel: {
    allCategories: true,
    allModules: true
  }
};

async function main() {
  console.log('🚀 Assignation intelligente des modules et catégories aux plans\n');

  try {
    // 1. Récupérer les plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, slug')
      .order('price', { ascending: true });

    if (plansError) throw plansError;
    console.log(`📋 ${plans.length} plans trouvés\n`);

    // 2. Récupérer toutes les catégories
    const { data: categories, error: catError } = await supabase
      .from('business_categories')
      .select('id, name, slug')
      .eq('status', 'active');

    if (catError) throw catError;
    console.log(`📁 ${categories.length} catégories actives\n`);

    // 3. Récupérer tous les modules
    const { data: modules, error: modError } = await supabase
      .from('modules')
      .select('id, name, slug, is_core, category_id')
      .eq('status', 'active');

    if (modError) throw modError;
    console.log(`📦 ${modules.length} modules actifs\n`);

    // 4. Nettoyer les assignations existantes
    console.log('🧹 Nettoyage des assignations existantes...');
    await supabase.from('plan_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('plan_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Nettoyage terminé\n');

    // 5. Assigner pour chaque plan
    for (const plan of plans) {
      console.log(`\n📊 Assignation pour le plan: ${plan.name} (${plan.slug})`);
      const strategy = PLAN_STRATEGY[plan.slug];

      if (!strategy) {
        console.log(`⚠️  Pas de stratégie définie pour ${plan.slug}`);
        continue;
      }

      // Assigner les catégories
      let planCategories = [];
      if (strategy.allCategories) {
        planCategories = categories;
      } else if (strategy.categories) {
        planCategories = categories.filter(c => strategy.categories.includes(c.slug));
      }

      if (planCategories.length > 0) {
        const catAssignments = planCategories.map(cat => ({
          plan_id: plan.id,
          category_id: cat.id
        }));

        const { error: catAssignError } = await supabase
          .from('plan_categories')
          .insert(catAssignments);

        if (catAssignError) {
          console.error(`❌ Erreur catégories:`, catAssignError.message);
        } else {
          console.log(`  ✅ ${planCategories.length} catégories assignées`);
        }
      }

      // Assigner les modules
      let planModules = [];
      
      if (strategy.allModules) {
        // Tous les modules
        planModules = modules;
      } else if (strategy.allModulesExcept) {
        // Tous sauf certains
        planModules = modules.filter(m => !strategy.allModulesExcept.includes(m.slug));
      } else if (strategy.modules) {
        // Liste spécifique
        planModules = modules.filter(m => strategy.modules.includes(m.slug));
      } else if (strategy.modulesCore) {
        // Modules core + extra (sans doublons)
        const coreModules = modules.filter(m => m.is_core);
        const extraModules = modules.filter(m => 
          strategy.modulesExtra?.includes(m.slug) && !m.is_core
        );
        planModules = [...coreModules, ...extraModules];
      }

      // Filtrer par catégories assignées si nécessaire
      if (!strategy.allCategories && !strategy.allModules) {
        const catIds = planCategories.map(c => c.id);
        planModules = planModules.filter(m => catIds.includes(m.category_id));
      }

      if (planModules.length > 0) {
        const modAssignments = planModules.map(mod => ({
          plan_id: plan.id,
          module_id: mod.id
        }));

        const { error: modAssignError } = await supabase
          .from('plan_modules')
          .insert(modAssignments);

        if (modAssignError) {
          console.error(`❌ Erreur modules:`, modAssignError.message);
        } else {
          console.log(`  ✅ ${planModules.length} modules assignés`);
        }
      }
    }

    // 6. Afficher les statistiques finales
    console.log('\n\n📊 STATISTIQUES FINALES\n');
    console.log('═'.repeat(80));

    for (const plan of plans) {
      const { data: catData, count: catCount } = await supabase
        .from('plan_categories')
        .select('*', { count: 'exact' })
        .eq('plan_id', plan.id);

      const { data: modData, count: modCount } = await supabase
        .from('plan_modules')
        .select('*', { count: 'exact' })
        .eq('plan_id', plan.id);

      console.log(`\n${plan.name.toUpperCase()} (${plan.slug})`);
      console.log('─'.repeat(80));
      console.log(`  Catégories: ${catCount || 0}`);
      console.log(`  Modules:    ${modCount || 0}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Assignation terminée avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
