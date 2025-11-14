/**
 * Script de test pour valider le système de permissions
 * À utiliser en développement pour tester l'intégration
 * 
 * @module testPermissionsSystem
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
 * Tester l'assignation automatique de modules pour un utilisateur
 */
export async function testAutoModuleAssignment(userId: string): Promise<TestResult> {
  try {
    console.log('🧪 Test assignation automatique pour:', userId);

    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, school_group_id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        error: userError?.message
      };
    }

    // Appeler la fonction d'assignation automatique
    const { data: result, error } = await (supabase as any).rpc('assign_default_modules_by_role', {
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
      message: `Assignation automatique réussie pour ${user.first_name} ${user.last_name} (${user.role})`,
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
 * Tester la récupération des modules assignés
 */
export async function testUserModulesRetrieval(userId: string): Promise<TestResult> {
  try {
    console.log('🧪 Test récupération modules pour:', userId);

    const { data: modules, error } = await supabase
      .from('user_module_permissions')
      .select(`
        *,
        modules!inner(
          id,
          name,
          slug,
          description,
          icon,
          color,
          category_id,
          version,
          status,
          required_plan,
          is_core,
          business_categories!inner(
            id,
            name,
            slug,
            icon,
            color
          )
        )
      `)
      .eq('user_id', userId)
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
      message: `${modules?.length || 0} modules récupérés avec succès`,
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
 * Tester les permissions d'un module spécifique
 */
export async function testModulePermissions(userId: string, moduleSlug: string): Promise<TestResult> {
  try {
    console.log('🧪 Test permissions module:', moduleSlug, 'pour:', userId);

    const { data: permission, error } = await supabase
      .from('user_module_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('module_slug', moduleSlug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return {
        success: false,
        message: 'Erreur lors de la vérification des permissions',
        error: error.message
      };
    }

    if (!permission) {
      return {
        success: true,
        message: `Aucune permission trouvée pour le module ${moduleSlug}`,
        data: { hasAccess: false }
      };
    }

    return {
      success: true,
      message: `Permissions trouvées pour le module ${moduleSlug}`,
      data: {
        hasAccess: true,
        canRead: permission.can_read,
        canWrite: permission.can_write,
        canDelete: permission.can_delete,
        canExport: permission.can_export,
        canManage: permission.can_manage,
        assignmentType: permission.assignment_type,
        assignedAt: permission.assigned_at
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
export async function testCompleteSystem(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Assignation automatique
  results.push(await testAutoModuleAssignment(userId));

  // Test 2: Récupération des modules
  results.push(await testUserModulesRetrieval(userId));

  // Test 3: Permissions spécifiques
  const testModules = ['dashboard', 'finances', 'classes', 'eleves'];
  for (const moduleSlug of testModules) {
    results.push(await testModulePermissions(userId, moduleSlug));
  }

  return results;
}

/**
 * Créer un utilisateur de test pour valider le système
 */
export async function createTestUser(role: string, schoolGroupId?: string): Promise<TestResult> {
  try {
    console.log('🧪 Création utilisateur test avec rôle:', role);

    const testEmail = `test-${role}-${Date.now()}@example.com`;
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: `Test ${role}`,
          last_name: 'User',
          role: role
        }
      }
    });

    if (authError) {
      return {
        success: false,
        message: 'Erreur création utilisateur Auth',
        error: authError.message
      };
    }

    // Créer l'enregistrement dans la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user?.id,
        first_name: `Test ${role}`,
        last_name: 'User',
        email: testEmail,
        role: role,
        school_group_id: schoolGroupId,
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      return {
        success: false,
        message: 'Erreur création utilisateur DB',
        error: userError.message
      };
    }

    return {
      success: true,
      message: `Utilisateur test créé avec succès: ${testEmail}`,
      data: userData
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
 * Nettoyer les utilisateurs de test
 */
export async function cleanupTestUsers(): Promise<TestResult> {
  try {
    console.log('🧹 Nettoyage des utilisateurs de test...');

    // Supprimer les utilisateurs de test de la DB
    const { error } = await supabase
      .from('users')
      .delete()
      .like('email', 'test-%@example.com');

    if (error) {
      return {
        success: false,
        message: 'Erreur lors du nettoyage',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Nettoyage des utilisateurs de test terminé'
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
 * Fonction principale de test
 */
export async function runFullSystemTest(schoolGroupId?: string): Promise<void> {
  console.log('🚀 Début des tests du système de permissions...\n');

  const testRoles = ['proviseur', 'directeur', 'enseignant', 'comptable'];
  
  for (const role of testRoles) {
    console.log(`\n📋 Test pour le rôle: ${role}`);
    console.log('='.repeat(50));

    // Créer un utilisateur test
    const createResult = await createTestUser(role, schoolGroupId);
    console.log(`✅ Création: ${createResult.message}`);
    
    if (createResult.success && createResult.data) {
      const userId = createResult.data.id;
      
      // Tester le système complet
      const testResults = await testCompleteSystem(userId);
      
      testResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} Test ${index + 1}: ${result.message}`);
        if (result.error) {
          console.log(`   Erreur: ${result.error}`);
        }
      });
    }
  }

  // Nettoyer
  console.log('\n🧹 Nettoyage...');
  const cleanupResult = await cleanupTestUsers();
  console.log(`${cleanupResult.success ? '✅' : '❌'} ${cleanupResult.message}`);

  console.log('\n🎉 Tests terminés !');
}

// Export pour utilisation en console
if (typeof window !== 'undefined') {
  (window as any).testPermissionsSystem = {
    runFullSystemTest,
    testAutoModuleAssignment,
    testUserModulesRetrieval,
    testModulePermissions,
    createTestUser,
    cleanupTestUsers
  };
}
