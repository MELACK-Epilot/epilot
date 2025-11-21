/**
 * Script pour générer des activity_logs basés sur les vraies données
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csltuxbanvweyfzqpfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateActivityLogs() {
  console.log('\n🔄 GÉNÉRATION DES ACTIVITY_LOGS\n');
  console.log('='.repeat(70));

  // Récupérer les groupes
  const { data: groups } = await supabase
    .from('school_groups')
    .select('id, name');

  // Récupérer les utilisateurs
  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name, email');

  // Récupérer les abonnements
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, school_group_id, created_at');

  if (!groups || !users || !subscriptions) {
    console.error('❌ Erreur: Impossible de récupérer les données');
    return;
  }

  const activities = [];
  const now = new Date();

  // Générer des activités pour les 7 derniers jours
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Connexions d'utilisateurs
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      
      activities.push({
        action_type: 'user.login',
        user_id: user.id,
        user_name: userName,
        description: `s'est connecté(e) à la plateforme`,
        created_at: new Date(date.getTime() - Math.random() * 86400000).toISOString(),
      });
    }

    // Création de groupes (pour les premiers jours)
    if (day >= 5 && groups[day - 5]) {
      const group = groups[day - 5];
      activities.push({
        action_type: 'school_group.created',
        user_id: users[0]?.id,
        user_name: 'Super Admin',
        description: `a créé le groupe scolaire "${group.name}"`,
        school_group_id: group.id,
        created_at: new Date(date.getTime() - Math.random() * 86400000).toISOString(),
      });
    }

    // Mise à jour d'abonnements
    if (subscriptions[day % subscriptions.length]) {
      const sub = subscriptions[day % subscriptions.length];
      const group = groups.find(g => g.id === sub.school_group_id);
      
      activities.push({
        action_type: 'subscription.updated',
        user_id: users[0]?.id,
        user_name: 'Super Admin',
        description: `a mis à jour l'abonnement du groupe "${group?.name || 'N/A'}"`,
        school_group_id: sub.school_group_id,
        created_at: new Date(date.getTime() - Math.random() * 86400000).toISOString(),
      });
    }

    // Création d'utilisateurs
    if (day === 3 && users[day]) {
      const user = users[day];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      
      activities.push({
        action_type: 'user.created',
        user_id: users[0]?.id,
        user_name: 'Super Admin',
        description: `a créé l'utilisateur "${userName}"`,
        created_at: new Date(date.getTime() - Math.random() * 86400000).toISOString(),
      });
    }
  }

  // Insérer les activités
  console.log(`\n📝 Insertion de ${activities.length} activités...`);
  
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(activities)
    .select();

  if (error) {
    console.error('❌ Erreur:', error.message);
  } else {
    console.log(`✅ ${data?.length || 0} activités insérées avec succès !`);
    
    // Afficher quelques exemples
    console.log('\n📋 Exemples d\'activités créées:');
    data?.slice(0, 5).forEach((a, i) => {
      console.log(`\n${i + 1}. ${a.action_type}`);
      console.log(`   User: ${a.user_name}`);
      console.log(`   Desc: ${a.description}`);
      console.log(`   Date: ${new Date(a.created_at).toLocaleString('fr-FR')}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ GÉNÉRATION TERMINÉE\n');
}

generateActivityLogs().catch(err => {
  console.error('\n❌ ERREUR:', err);
  process.exit(1);
});
