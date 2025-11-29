/**
 * Script de correction finale des plans
 * Corrige les valeurs incohérentes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Correction finale des plans...\n');

  const corrections = [
    {
      slug: 'gratuit',
      updates: {
        max_schools: 3,
        max_students: 1000,
        max_staff: 50,
        price: 0
      }
    },
    {
      slug: 'premium',
      updates: {
        price: 25000
      }
    },
    {
      slug: 'pro',
      updates: {
        price: 50000
      }
    },
    {
      slug: 'institutionnel',
      updates: {
        max_schools: -1,
        max_students: -1,
        max_staff: -1,
        price: 100000
      }
    }
  ];

  for (const { slug, updates } of corrections) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('slug', slug)
      .select();
    
    if (error) {
      console.error(`❌ Erreur ${slug}:`, error.message);
    } else {
      console.log(`✅ Plan ${slug} corrigé`);
    }
  }

  // Vérification finale
  console.log('\n📊 État final des plans:');
  const { data: finalPlans } = await supabase
    .from('subscription_plans')
    .select('name, slug, price, max_schools, max_students, max_staff, max_storage, support_level, api_access, custom_branding')
    .order('price', { ascending: true });
  
  console.table(finalPlans);
  
  console.log('\n✅ Correction terminée !');
}

main();
