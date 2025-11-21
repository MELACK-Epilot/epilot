/**
 * Script pour inspecter les tables Supabase et leurs données
 * Permet de voir la structure réelle de la base de données
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log('\n🔍 INSPECTION BASE DE DONNÉES SUPABASE\n');
  console.log('='.repeat(60));

  // Liste des tables à vérifier
  const tablesToCheck = [
    'school_groups',
    'subscriptions',
    'subscription_plans',
    'users',
    'activity_logs',
    'fee_payments',
    'expenses',
    'modules',
    'group_module_configs',
  ];

  for (const table of tablesToCheck) {
    console.log(`\n📊 TABLE: ${table}`);
    console.log('-'.repeat(60));

    try {
      // Compter les lignes
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error(`❌ Erreur: ${countError.message}`);
        continue;
      }

      console.log(`✅ Nombre de lignes: ${count || 0}`);

      // Récupérer quelques exemples
      if (count && count > 0) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);

        if (error) {
          console.error(`❌ Erreur lecture: ${error.message}`);
        } else {
          console.log('\n📝 Exemples de données:');
          console.log(JSON.stringify(data, null, 2));
        }
      } else {
        console.log('⚠️ Table vide');
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
    }
  }

  // Vérifier les groupes scolaires avec abonnements
  console.log('\n\n🏫 GROUPES SCOLAIRES AVEC ABONNEMENTS');
  console.log('='.repeat(60));

  try {
    const { data: groups, error } = await supabase
      .from('school_groups')
      .select(`
        id,
        name,
        status,
        subscriptions (
          id,
          status,
          start_date,
          end_date,
          subscription_plans (
            name,
            price
          )
        )
      `);

    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
    } else {
      console.log(`\n✅ ${groups?.length || 0} groupes trouvés`);
      groups?.forEach((group, index) => {
        console.log(`\n${index + 1}. ${group.name}`);
        console.log(`   Statut: ${group.status}`);
        console.log(`   Abonnements: ${group.subscriptions?.length || 0}`);
        group.subscriptions?.forEach((sub, subIndex) => {
          console.log(`   ${subIndex + 1}. ${sub.subscription_plans?.name || 'N/A'} - ${sub.subscription_plans?.price || 0} FCFA`);
          console.log(`      Statut: ${sub.status}`);
          console.log(`      Période: ${sub.start_date} → ${sub.end_date}`);
        });
      });
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  // Calculer MRR réel
  console.log('\n\n💰 CALCUL MRR RÉEL');
  console.log('='.repeat(60));

  try {
    const { data: activeSubs, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        subscription_plans (
          name,
          price
        )
      `)
      .eq('status', 'active');

    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
    } else {
      const mrr = activeSubs?.reduce((sum, sub) => sum + (sub.subscription_plans?.price || 0), 0) || 0;
      console.log(`\n✅ Abonnements actifs: ${activeSubs?.length || 0}`);
      console.log(`💵 MRR Total: ${(mrr / 1000000).toFixed(2)}M FCFA`);
      
      if (activeSubs && activeSubs.length > 0) {
        console.log('\n📋 Détails:');
        activeSubs.forEach((sub, index) => {
          console.log(`${index + 1}. ${sub.subscription_plans?.name || 'N/A'}: ${(sub.subscription_plans?.price || 0).toLocaleString()} FCFA`);
        });
      }
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  // Vérifier les activités récentes
  console.log('\n\n📝 ACTIVITÉS RÉCENTES');
  console.log('='.repeat(60));

  try {
    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
    } else {
      console.log(`\n✅ ${activities?.length || 0} activités récentes`);
      activities?.forEach((activity, index) => {
        console.log(`\n${index + 1}. ${activity.action_type}`);
        console.log(`   Utilisateur: ${activity.user_name || 'N/A'}`);
        console.log(`   Description: ${activity.description}`);
        console.log(`   Date: ${activity.created_at}`);
      });
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ INSPECTION TERMINÉE\n');
}

inspectTables().catch(console.error);
