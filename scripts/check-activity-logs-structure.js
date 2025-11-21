/**
 * Vérifier la structure de la table activity_logs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('\n🔍 STRUCTURE DE LA TABLE activity_logs\n');
  
  // Essayer de récupérer une ligne pour voir les colonnes
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erreur:', error.message);
    
    // Essayer avec un INSERT vide pour voir les colonnes requises
    console.log('\n📝 Tentative d\'insertion vide pour voir les colonnes...');
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert({});
    
    if (insertError) {
      console.log('Message d\'erreur:', insertError.message);
      console.log('Détails:', insertError.details);
      console.log('Hint:', insertError.hint);
    }
  } else {
    console.log('✅ Structure trouvée:');
    if (data && data.length > 0) {
      console.log('\nColonnes disponibles:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]}`);
      });
      console.log('\nExemple de données:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Table vide, impossible de déterminer la structure');
      console.log('\n📝 Essayons de créer une entrée de test...');
      
      // Essayer différentes structures possibles
      const testStructures = [
        { type: 'login', description: 'Test', user_id: '00000000-0000-0000-0000-000000000000' },
        { event_type: 'login', message: 'Test', user_id: '00000000-0000-0000-0000-000000000000' },
        { action: 'login', details: 'Test', user_id: '00000000-0000-0000-0000-000000000000' },
      ];
      
      for (const struct of testStructures) {
        console.log(`\nTest avec structure: ${JSON.stringify(Object.keys(struct))}`);
        const { error: testError } = await supabase
          .from('activity_logs')
          .insert(struct);
        
        if (testError) {
          console.log(`❌ ${testError.message}`);
        } else {
          console.log('✅ Structure valide trouvée!');
          break;
        }
      }
    }
  }
}

checkStructure().catch(console.error);
