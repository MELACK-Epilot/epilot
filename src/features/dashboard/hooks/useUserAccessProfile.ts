/**
 * Hook pour récupérer le profil d'accès d'un utilisateur
 * ⚠️ LOGIQUE MÉTIER E-PILOT:
 * - Le profil est défini UNE FOIS à la création
 * - Les permissions sont héritées du profil
 * - Utilisé pour l'assignation de modules
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AccessProfile {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  description: string;
  permissions: {
    pedagogie?: {
      read: boolean;
      write: boolean;
      delete: boolean;
      export?: boolean;
    };
    finances?: {
      read: boolean;
      write: boolean;
      delete: boolean;
      export?: boolean;
    };
    administration?: {
      read: boolean;
      write: boolean;
      delete: boolean;
      export?: boolean;
    };
    communication?: {
      read: boolean;
      write: boolean;
      delete: boolean;
      export?: boolean;
    };
    scope: string;
  };
}

export const useUserAccessProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-access-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      // 1. Récupérer l'utilisateur avec son profil et son groupe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, access_profile_code, role, school_group_id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Erreur récupération user:', userError);
        throw userError;
      }

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Cast pour TypeScript
      const userData = user as any;

      // 2. Si pas de profil (admin), retourner null
      if (!userData.access_profile_code) {
        console.log('ℹ️ Utilisateur sans profil (admin):', userData.role);
        return null;
      }

      // 3. Récupérer le profil d'accès (priorité: groupe > template)
      let query = supabase
        .from('access_profiles')
        .select('*')
        .eq('code', userData.access_profile_code)
        .eq('is_active', true);
      
      // Filtrer par groupe si l'utilisateur en a un
      if (userData.school_group_id) {
        query = query.eq('school_group_id', userData.school_group_id);
      } else {
        // Sinon prendre le template
        query = query.eq('is_template', true);
      }
      
      const { data: profile, error: profileError } = await query.single();

      if (profileError) {
        console.error('❌ Erreur récupération profil:', profileError);
        throw profileError;
      }

      if (!profile) {
        throw new Error(`Profil ${userData.access_profile_code} non trouvé`);
      }

      const profileData = profile as any;
      console.log('✅ Profil chargé:', profileData.name_fr, profileData.permissions);

      return profileData as AccessProfile;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (profil change rarement)
    retry: 1,
  });
};

/**
 * Helper pour extraire les permissions d'une catégorie
 */
export const getCategoryPermissions = (
  profile: AccessProfile | null | undefined,
  categoryCode: string
): { read: boolean; write: boolean; delete: boolean; export: boolean } => {
  if (!profile || !profile.permissions) {
    return { read: true, write: false, delete: false, export: false };
  }

  const categoryPerms = profile.permissions[categoryCode as keyof typeof profile.permissions];
  
  if (!categoryPerms || typeof categoryPerms === 'string') {
    return { read: true, write: false, delete: false, export: false };
  }

  return {
    read: categoryPerms.read ?? true,
    write: categoryPerms.write ?? false,
    delete: categoryPerms.delete ?? false,
    export: categoryPerms.export ?? false,
  };
};

/**
 * Helper pour obtenir le scope du profil
 */
export const getProfileScope = (profile: AccessProfile | null | undefined): string => {
  if (!profile || !profile.permissions) {
    return 'AUCUN';
  }

  return profile.permissions.scope || 'AUCUN';
};
