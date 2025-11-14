/**
 * Hook pour la navigation vers les modules avec contexte automatique
 * Reconnaît automatiquement le groupe scolaire et l'école de l'utilisateur
 * @module ModuleNavigation
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import type { ModuleEnrichi } from '../types/proviseur-modules.types';

/**
 * Interface pour le contexte du module
 */
export interface ModuleContext {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  userId: string;
  userRole: string;
  schoolId: string;           // ⭐ Contexte école
  schoolGroupId: string;      // ⭐ Contexte groupe
  categoryId: string;
  categoryName: string;
}

/**
 * Hook pour naviguer vers un module avec reconnaissance automatique du contexte
 */
export function useModuleNavigation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Naviguer vers un module avec contexte automatique
   */
  const navigateToModule = async (module: ModuleEnrichi) => {
    if (!user) {
      console.error('❌ [Navigation] Utilisateur non connecté');
      return;
    }

    // Vérifier que l'utilisateur a les infos de contexte nécessaires
    const schoolId = user.schoolId || (user as any).school_id;
    const schoolGroupId = user.schoolGroupId || (user as any).school_group_id;

    if (!schoolId || !schoolGroupId) {
      console.error('❌ [Navigation] Contexte utilisateur incomplet', {
        user,
        schoolId,
        schoolGroupId,
      });
      alert('Erreur : Contexte utilisateur incomplet. Veuillez vous reconnecter.');
      return;
    }

    console.log('🚀 [Navigation] Début navigation vers module:', {
      module: module.name,
      slug: module.slug,
      école: schoolId,
      groupe: schoolGroupId,
      utilisateur: `${user.firstName} ${user.lastName}`,
    });

    // Incrémenter le compteur d'accès
    await incrementModuleAccess(module.module_id, user.id);

    // Construire le contexte complet
    const context: ModuleContext = {
      moduleId: module.module_id,
      moduleName: module.name,
      moduleSlug: module.slug,
      userId: user.id,
      userRole: user.role,
      schoolId: schoolId,
      schoolGroupId: schoolGroupId,
      categoryId: module.category_id,
      categoryName: module.category_name,
    };

    // Construire l'URL du module (sous /user pour l'espace utilisateur)
    const moduleUrl = `/user/modules/${module.slug}`;

    // Naviguer avec le state pour passer le contexte
    navigate(moduleUrl, {
      state: context,
    });

    console.log('✅ [Navigation] Navigation réussie vers:', moduleUrl);
    console.log('📋 [Navigation] Contexte passé:', context);
  };

  return { navigateToModule };
}

/**
 * Incrémenter le compteur d'accès au module
 */
async function incrementModuleAccess(moduleId: string, userId: string) {
  try {
    console.log('📊 [Navigation] Incrémentation accès module:', { moduleId, userId });

    const { error } = await supabase.rpc('increment_module_access', {
      p_module_id: moduleId,
      p_user_id: userId,
    });

    if (error) {
      // Si la fonction RPC n'existe pas, utiliser une mise à jour directe
      console.warn('⚠️ [Navigation] Fonction RPC non disponible, mise à jour directe');
      
      const { error: updateError } = await supabase
        .from('user_modules')
        .update({
          access_count: supabase.raw('access_count + 1') as any,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('module_id', moduleId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    console.log('✅ [Navigation] Accès incrémenté');
  } catch (error) {
    console.error('❌ [Navigation] Erreur incrémentation accès:', error);
    // Ne pas bloquer la navigation si l'incrémentation échoue
  }
}
