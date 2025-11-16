/**
 * SCRIPT DE DIAGNOSTIC - À exécuter dans la console navigateur (F12)
 * Copiez-collez ce script dans la console et appuyez sur Entrée
 */

(async function diagnosticDashboard() {
  console.log('🔍 ========================================');
  console.log('🔍 DIAGNOSTIC DASHBOARD PROVISEUR');
  console.log('🔍 ========================================\n');

  // 1. Vérifier Supabase
  console.log('1️⃣ Vérification Supabase...');
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase non trouvé dans window');
    // Essayer d'importer depuis le module
    try {
      const { supabase } = await import('/src/lib/supabase.ts');
      window.supabase = supabase;
      console.log('✅ Supabase importé manuellement');
    } catch (e) {
      console.error('❌ Impossible d\'importer Supabase:', e);
      return;
    }
  } else {
    console.log('✅ Supabase disponible');
  }

  // 2. Vérifier la session
  console.log('\n2️⃣ Vérification Session...');
  const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Erreur session:', sessionError);
    return;
  }
  
  if (!session) {
    console.error('❌ Pas de session active - Vous devez être connecté');
    return;
  }
  
  console.log('✅ Session active');
  console.log('   User ID:', session.user.id);
  console.log('   Email:', session.user.email);

  // 3. Vérifier l'utilisateur dans la table users
  console.log('\n3️⃣ Vérification Utilisateur...');
  const { data: userData, error: userError } = await window.supabase
    .from('users')
    .select('id, email, first_name, last_name, role, school_id, status')
    .eq('id', session.user.id)
    .single();

  if (userError) {
    console.error('❌ Erreur récupération utilisateur:', userError);
    return;
  }

  if (!userData) {
    console.error('❌ Utilisateur non trouvé dans la table users');
    return;
  }

  console.log('✅ Utilisateur trouvé:');
  console.log('   ID:', userData.id);
  console.log('   Email:', userData.email);
  console.log('   Nom:', userData.first_name, userData.last_name);
  console.log('   Rôle:', userData.role);
  console.log('   School ID:', userData.school_id);
  console.log('   Status:', userData.status);

  if (!userData.school_id) {
    console.error('❌ PROBLÈME: school_id est NULL');
    console.error('   Solution: Mettre à jour school_id dans Supabase');
    return;
  }

  // 4. Vérifier l'école
  console.log('\n4️⃣ Vérification École...');
  const { data: schoolData, error: schoolError } = await window.supabase
    .from('schools')
    .select('id, name, has_preschool, has_primary, has_middle, has_high, status')
    .eq('id', userData.school_id)
    .single();

  if (schoolError) {
    console.error('❌ Erreur récupération école:', schoolError);
    console.error('   Code:', schoolError.code);
    console.error('   Message:', schoolError.message);
    return;
  }

  if (!schoolData) {
    console.error('❌ École non trouvée');
    return;
  }

  console.log('✅ École trouvée:');
  console.log('   ID:', schoolData.id);
  console.log('   Nom:', schoolData.name);
  console.log('   Status:', schoolData.status);
  console.log('   Niveaux:');
  console.log('     - Maternelle:', schoolData.has_preschool ? '✅' : '❌');
  console.log('     - Primaire:', schoolData.has_primary ? '✅' : '❌');
  console.log('     - Collège:', schoolData.has_middle ? '✅' : '❌');
  console.log('     - Lycée:', schoolData.has_high ? '✅' : '❌');

  const niveauxActifs = [
    schoolData.has_preschool && 'Maternelle',
    schoolData.has_primary && 'Primaire',
    schoolData.has_middle && 'Collège',
    schoolData.has_high && 'Lycée'
  ].filter(Boolean);

  console.log('\n   Niveaux actifs:', niveauxActifs.length);
  console.log('   Liste:', niveauxActifs.join(', '));

  if (niveauxActifs.length === 0) {
    console.error('❌ PROBLÈME: Aucun niveau actif');
    console.error('   Solution: Activer au moins un niveau dans Supabase');
    return;
  }

  // 5. Vérifier les élèves
  console.log('\n5️⃣ Vérification Élèves...');
  const { data: studentsData, error: studentsError } = await window.supabase
    .from('students')
    .select('level', { count: 'exact', head: false })
    .eq('school_id', userData.school_id)
    .eq('status', 'active');

  if (studentsError) {
    console.error('❌ Erreur récupération élèves:', studentsError);
  } else {
    console.log('✅ Élèves trouvés:', studentsData?.length || 0);
    if (studentsData && studentsData.length > 0) {
      const parNiveau = studentsData.reduce((acc, s) => {
        acc[s.level] = (acc[s.level] || 0) + 1;
        return acc;
      }, {});
      console.log('   Par niveau:', parNiveau);
    }
  }

  // 6. Vérifier les classes
  console.log('\n6️⃣ Vérification Classes...');
  const { data: classesData, error: classesError } = await window.supabase
    .from('classes')
    .select('level', { count: 'exact', head: false })
    .eq('school_id', userData.school_id)
    .eq('status', 'active');

  if (classesError) {
    console.error('❌ Erreur récupération classes:', classesError);
  } else {
    console.log('✅ Classes trouvées:', classesData?.length || 0);
    if (classesData && classesData.length > 0) {
      const parNiveau = classesData.reduce((acc, c) => {
        acc[c.level] = (acc[c.level] || 0) + 1;
        return acc;
      }, {});
      console.log('   Par niveau:', parNiveau);
    }
  }

  // 7. Résumé
  console.log('\n🎯 ========================================');
  console.log('🎯 RÉSUMÉ DU DIAGNOSTIC');
  console.log('🎯 ========================================');
  console.log('✅ Session:', session ? 'OK' : 'KO');
  console.log('✅ Utilisateur:', userData ? 'OK' : 'KO');
  console.log('✅ School ID:', userData?.school_id ? 'OK' : 'KO');
  console.log('✅ École:', schoolData ? 'OK' : 'KO');
  console.log('✅ Niveaux actifs:', niveauxActifs.length);
  console.log('✅ Élèves:', studentsData?.length || 0);
  console.log('✅ Classes:', classesData?.length || 0);

  if (niveauxActifs.length > 0) {
    console.log('\n✅ TOUT EST CORRECT EN BASE DE DONNÉES !');
    console.log('   Le problème vient du hook React qui ne se rafraîchit pas.');
    console.log('\n📋 SOLUTIONS:');
    console.log('   1. Vider le cache navigateur (Ctrl+Shift+Delete)');
    console.log('   2. Fermer et rouvrir le navigateur');
    console.log('   3. Se reconnecter');
    console.log('   4. Vérifier les logs du hook useDirectorDashboard');
  } else {
    console.log('\n❌ PROBLÈME IDENTIFIÉ: Aucun niveau actif');
    console.log('\n📋 SOLUTION SQL:');
    console.log(`   UPDATE schools SET has_primary = true, has_middle = true WHERE id = '${userData.school_id}';`);
  }

  console.log('\n🔍 ========================================\n');
})();
