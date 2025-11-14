/**
 * Script de test pour valider le système compatible avec la structure existante
 * Utilise la table user_modules et la structure actuelle
 * 
 * @module testSystemeCompatible
 */

import { supabase } from '@/lib/supabase';

/**
 * Interface pour les résultats de test
 */
interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Tester l'assignation automatique compatible
 */
export async function testAutoAssignmentCompatible(userId: string): Promise<TestResult> {
  try {
    console.log('🧪 Test assignation automatique compatible pour:', userId);

    // Récupérer l'utilisateur (essayer users puis profiles)
    let user: any = null;
    let userError: any = null;

    const { data: userData, error: usersError } = await supabase
      .from('users')
      .select('id, role, school_group_id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (usersError && usersError.code !== 'PGRST116') {
      // Essayer la table profiles
      const { data: profileData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, school_group_id, full_name')
        .eq('id', userId)
        .single();

      if (profilesError) {
        return {
          success: false,
          message: 'Utilisateur non trouvé dans users ni profiles',
          error: profilesError.message
        };
      }
      user = profileData;
    } else {
      user = userData;
    }

    if (!user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        error: userError?.message
      };
    }

    // Appeler la fonction d'assignation compatible
    const { data: result, error } = await (supabase as any).rpc('assign_modules_by_role_compatible', {
      p_user_id: userId,
      p_user_role: user.role,
      p_school_group_id: user.school_group_id
    });

    if (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'assignation automatique',
        error: error.message
      };
    }

    return {
      success: true,
      message: `Assignation automatique réussie pour ${user.first_name || user.full_name} (${user.role})`,
      data: result
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur inattendue',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tester la récupération des modules via user_modules
 */
export async function testUserModulesRetrieval(userId: string): Promise<TestResult> {
  try {
    console.log('🧪 Test récupération modules user_modules pour:', userId);

    const { data: modules, error } = await supabase
      .from('user_modules')
      .select(`
        id,
        module_id,
        is_enabled,
        assigned_at,
        assigned_by,
        settings,
        last_accessed_at,
        access_count,
        modules!inner(
          id,
          name,
          slug,
          description,
          icon,
          color,
          is_core,
          category_id,
          status,
          business_categories(
            id,
            name,
            slug,
            icon,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .eq('modules.status', 'active');

    if (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des modules',
        error: error.message
      };
    }

    return {
      success: true,
      message: `${modules?.length || 0} modules récupérés avec succès via user_modules`,
      data: modules
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur inattendue',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tester les modules disponibles par rôle
 */
export async function testAvailableModulesByRole(role: string, schoolGroupId?: string): Promise<TestResult> {
  try {
    console.log('🧪 Test modules disponibles pour rôle:', role);

    const { data: availableModules, error } = await (supabase as any)
      .rpc('get_available_modules_by_role', {
        p_user_role: role,
        p_school_group_id: schoolGroupId
      });

    if (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des modules disponibles',
        error: error.message
      };
    }

    return {
      success: true,
      message: `${availableModules?.length || 0} modules disponibles pour le rôle ${role}`,
      data: availableModules
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur inattendue',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tester l'accès à un module spécifique
 */
export async function testModuleAccess(userId: string, moduleSlug: string): Promise<TestResult> {
  try {
    console.log('🧪 Test accès module:', moduleSlug, 'pour:', userId);

    const { data: userModule, error } = await supabase
      .from('user_modules')
      .select(`
        *,
        modules!inner(
          id,
          name,
          slug,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('modules.slug', moduleSlug)
      .eq('is_enabled', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        message: 'Erreur lors de la vérification d\'accès',
        error: error.message
      };
    }

    if (!userModule) {
      return {
        success: true,
        message: `Aucun accès au module ${moduleSlug}`,
        data: { hasAccess: false }
      };
    }

    return {
      success: true,
      message: `Accès confirmé au module ${moduleSlug}`,
      data: {
        hasAccess: true,
        isEnabled: userModule.is_enabled,
        assignedAt: userModule.assigned_at,
        lastAccessed: userModule.last_accessed_at,
        accessCount: userModule.access_count
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur inattendue',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tester le système complet pour un utilisateur
 */
export async function testCompleteSystemCompatible(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('🚀 Test système complet pour:', userId);

  // Test 1: Assignation automatique
  results.push(await testAutoAssignmentCompatible(userId));

  // Test 2: Récupération des modules
  results.push(await testUserModulesRetrieval(userId));

  // Test 3: Modules spécifiques
  const testModules = ['dashboard', 'classes', 'eleves', 'personnel'];
  for (const moduleSlug of testModules) {
    results.push(await testModuleAccess(userId, moduleSlug));
  }

  return results;
}

/**
 * Tester tous les rôles disponibles
 */
export async function testAllRolesCompatible(schoolGroupId?: string): Promise<void> {
  console.log('🚀 Test de tous les rôles compatibles...\n');

  const testRoles = [
    'SUPER_ADMIN',
    'admin_groupe', 
    'proviseur',
    'directeur',
    'directeur_etudes',
    'enseignant',
    'cpe',
    'comptable',
    'secretaire'
  ];
  
  for (const role of testRoles) {
    console.log(`\n📋 Test pour le rôle: ${role}`);
    console.log('='.repeat(50));

    // Tester les modules disponibles par rôle
    const availableResult = await testAvailableModulesByRole(role, schoolGroupId);
    console.log(`${availableResult.success ? '✅' : '❌'} Modules disponibles: ${availableResult.message}`);
    
    if (availableResult.success && availableResult.data) {
      console.log(`   Modules: ${availableResult.data.map((m: any) => m.module_slug).join(', ')}`);
    }
  }

  console.log('\n🎉 Tests des rôles terminés !');
}

/**
 * Vérifier la cohérence de la base de données
 */
export async function checkDatabaseConsistency(): Promise<TestResult> {
  try {
    console.log('🔍 Vérification cohérence base de données...');

    // Vérifier l'existence des tables
    const tables = ['users', 'profiles', 'user_modules', 'modules', 'business_categories'];
    const results: any = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        results[table] = error ? `Erreur: ${error.message}` : `${count} enregistrements`;
      } catch (e) {
        results[table] = `Table non accessible`;
      }
    }

    // Vérifier les fonctions SQL
    const functions = [
      'assign_modules_by_role_compatible',
      'get_available_modules_by_role',
      'reassign_user_modules_compatible'
    ];

    for (const func of functions) {
      try {
        const { error } = await (supabase as any).rpc(func, {});
        results[`function_${func}`] = error ? `Erreur: ${error.message}` : 'Disponible';
      } catch (e) {
        results[`function_${func}`] = 'Non disponible';
      }
    }

    return {
      success: true,
      message: 'Vérification cohérence terminée',
      data: results
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors de la vérification',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fonction principale de test compatible
 */
export async function runCompatibilityTests(schoolGroupId?: string): Promise<void> {
  console.log('🚀 Début des tests de compatibilité...\n');

  // 1. Vérifier la cohérence de la BDD
  console.log('📊 Vérification de la base de données...');
  const dbCheck = await checkDatabaseConsistency();
  console.log(`${dbCheck.success ? '✅' : '❌'} ${dbCheck.message}`);
  if (dbCheck.data) {
    Object.entries(dbCheck.data).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }

  // 2. Tester tous les rôles
  await testAllRolesCompatible(schoolGroupId);

  console.log('\n🎉 Tests de compatibilité terminés !');
}

// Export pour utilisation en console
if (typeof window !== 'undefined') {
  (window as any).testSystemeCompatible = {
    runCompatibilityTests,
    testAutoAssignmentCompatible,
    testUserModulesRetrieval,
    testAvailableModulesByRole,
    testModuleAccess,
    testCompleteSystemCompatible,
    testAllRolesCompatible,
    checkDatabaseConsistency
  };
}
