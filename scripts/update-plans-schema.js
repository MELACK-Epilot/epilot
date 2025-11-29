/**
 * Script de mise à jour du schéma subscription_plans
 * Ajoute les colonnes manquantes et met à jour les données
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Mise à jour du schéma subscription_plans...\n');

  try {
    // 1. Lire le fichier SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'UPDATE_PLANS_SCHEMA_AND_DATA.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Fichier SQL chargé:', sqlPath);
    
    // 2. Vérifier le schéma actuel
    console.log('\n📊 Schéma actuel de subscription_plans:');
    const { data: currentPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(1);
    
    if (plansError) {
      console.error('❌ Erreur lecture plans:', plansError);
    } else if (currentPlans && currentPlans.length > 0) {
      console.log('Colonnes existantes:', Object.keys(currentPlans[0]).join(', '));
    }

    // 3. Afficher les plans actuels
    console.log('\n📋 Plans actuels:');
    const { data: allPlans, error: allPlansError } = await supabase
      .from('subscription_plans')
      .select('id, name, slug, price, max_schools, max_students, max_staff')
      .order('price', { ascending: true });
    
    if (allPlansError) {
      console.error('❌ Erreur:', allPlansError);
    } else {
      console.table(allPlans);
    }

    // 4. Mise à jour manuelle des plans (car RPC n'est pas disponible avec anon key)
    console.log('\n🔧 Mise à jour des plans avec les nouvelles colonnes...');
    
    const updates = [
      {
        slug: 'gratuit',
        updates: {
          max_storage: 1,
          support_level: 'email',
          custom_branding: false,
          api_access: false,
          trial_days: 0,
          discount: 0,
          max_schools: 3,
          max_students: 1000,
          max_staff: 50,
          description: 'Pour découvrir la plateforme et gérer une petite école.'
        }
      },
      {
        slug: 'premium',
        updates: {
          max_storage: 5,
          support_level: 'email',
          custom_branding: false,
          api_access: false,
          trial_days: 14,
          discount: 0,
          is_popular: true,
          max_schools: 10,
          max_students: 5000,
          max_staff: 500,
          description: 'Idéal pour les groupes scolaires en croissance.'
        }
      },
      {
        slug: 'pro',
        updates: {
          max_storage: 20,
          support_level: 'priority',
          custom_branding: true,
          api_access: true,
          trial_days: 30,
          discount: 0,
          max_schools: 50,
          max_students: 20000,
          max_staff: 2000,
          description: 'Pour les grands réseaux nécessitant des fonctionnalités avancées.'
        }
      },
      {
        slug: 'institutionnel',
        updates: {
          max_storage: 100,
          support_level: '24/7',
          custom_branding: true,
          api_access: true,
          trial_days: 0,
          discount: 0,
          max_schools: -1,
          max_students: -1,
          max_staff: -1,
          description: 'Solution sur mesure pour les gouvernements et très grands réseaux.'
        }
      }
    ];

    for (const { slug, updates: planUpdates } of updates) {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(planUpdates)
        .eq('slug', slug)
        .select();
      
      if (error) {
        console.error(`❌ Erreur mise à jour ${slug}:`, error.message);
      } else {
        console.log(`✅ Plan ${slug} mis à jour`);
      }
    }

    // 5. Vérifier les résultats
    console.log('\n✅ Résultats après mise à jour:');
    const { data: updatedPlans, error: updatedError } = await supabase
      .from('subscription_plans')
      .select('name, slug, price, max_storage, support_level, api_access, custom_branding')
      .order('price', { ascending: true });
    
    if (updatedError) {
      console.error('❌ Erreur:', updatedError);
    } else {
      console.table(updatedPlans);
    }

    console.log('\n🎉 Mise à jour terminée avec succès !');
    console.log('\n⚠️  NOTE: Si certaines colonnes n\'existent pas encore dans la BDD,');
    console.log('vous devez exécuter le script SQL manuellement dans Supabase Dashboard:');
    console.log('👉 https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor');
    console.log('👉 Fichier: database/UPDATE_PLANS_SCHEMA_AND_DATA.sql');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
