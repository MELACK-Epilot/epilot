/**
 * Script de vérification pour l'interface Proviseur
 * À exécuter dans la console pour valider le système
 */

export const verifyProviseurInterface = async () => {
  console.log('🔍 VÉRIFICATION INTERFACE PROVISEUR');
  console.log('=====================================');

  // 1. Vérifier l'utilisateur actuel
  const userStr = localStorage.getItem('auth-storage');
  if (!userStr) {
    console.log('❌ Aucun utilisateur connecté');
    return;
  }

  const authData = JSON.parse(userStr);
  const user = authData?.state?.user;
  
  console.log('👤 Utilisateur:', user?.email);
  console.log('🎭 Rôle:', user?.role);
  console.log('🏫 Groupe:', user?.schoolGroupId);

  // 2. Vérifier le routage
  const currentPath = window.location.pathname;
  console.log('📍 Page actuelle:', currentPath);

  if (user?.role === 'proviseur') {
    console.log('✅ Rôle Proviseur détecté - Interface optimisée devrait s\'afficher');
  } else {
    console.log('⚠️ Rôle différent - Interface debug s\'affichera');
  }

  // 3. Vérifier les modules en base
  try {
    const response = await fetch('/api/supabase/rest/v1/user_modules?user_id=eq.' + user?.id + '&select=*,modules(*)', {
      headers: {
        'apikey': 'your-anon-key',
        'Authorization': `Bearer ${authData?.state?.session?.access_token}`
      }
    });

    if (response.ok) {
      const modules = await response.json();
      console.log('📦 Modules assignés:', modules.length);
      
      if (modules.length === 13) {
        console.log('✅ Nombre correct de modules (13)');
      } else {
        console.log('⚠️ Nombre incorrect de modules:', modules.length);
        console.log('💡 Cliquer sur "Assigner Mes Modules" pour corriger');
      }
    }
  } catch (error) {
    console.log('⚠️ Impossible de vérifier les modules via API');
  }

  // 4. Vérifier les composants React
  const proviseurComponent = document.querySelector('[data-testid="proviseur-interface"]');
  const debugComponent = document.querySelector('[data-testid="debug-interface"]');

  if (proviseurComponent) {
    console.log('✅ Interface Proviseur détectée dans le DOM');
  } else if (debugComponent) {
    console.log('⚠️ Interface Debug détectée - Vérifier le routage');
  } else {
    console.log('❓ Interface non identifiée');
  }

  // 5. Résumé
  console.log('\n📋 RÉSUMÉ DE VÉRIFICATION');
  console.log('========================');
  
  const checks = [
    { name: 'Utilisateur connecté', status: !!user },
    { name: 'Rôle Proviseur', status: user?.role === 'proviseur' },
    { name: 'Page Mes Modules', status: currentPath.includes('/modules') },
  ];

  checks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
  });

  if (checks.every(c => c.status)) {
    console.log('\n🎉 TOUT EST CORRECT ! Interface Proviseur devrait s\'afficher');
  } else {
    console.log('\n⚠️ PROBLÈMES DÉTECTÉS - Voir les détails ci-dessus');
  }
};

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).verifyProviseurInterface = verifyProviseurInterface;
  
  // Auto-exécution si on est sur la page modules
  if (window.location.pathname.includes('/modules')) {
    console.log('🔍 Auto-vérification détectée...');
    setTimeout(verifyProviseurInterface, 1000);
  }
}
