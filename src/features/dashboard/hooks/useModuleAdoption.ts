/**
 * Hook pour récupérer les données d'adoption des modules
 * @module useModuleAdoption
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface ModuleAdoptionData {
  name: string;
  adoption: number;
  schools: number;
  trend: number;
  activeUsers: number;
  lastUpdate: string;
}

export const useModuleAdoption = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const schoolGroupId = user?.schoolGroupId;
  
  return useQuery({
    queryKey: ['module-adoption', user?.role, schoolGroupId],
    queryFn: async () => {
      try {
        // Si pas de user, retourner vide
        if (!user) return [];
        
        // SUPER ADMIN : Vue plateforme (tous les groupes)
        if (isSuperAdmin) {
          return await getGlobalAdoption();
        }
        
        // ADMIN GROUPE : Vue groupe uniquement
        if (!schoolGroupId) return [];
        return await getGroupModules(schoolGroupId);
        
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'adoption des modules:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });
};

// Fonction pour Super Admin : Adoption globale
async function getGlobalAdoption(): Promise<ModuleAdoptionData[]> {
  try {
    // Récupérer tous les modules actifs depuis modules
    const { data: allModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name, slug')
      .eq('status', 'active')
      .limit(5)
      .order('name');

    if (modulesError) throw modulesError;

    const results: ModuleAdoptionData[] = [];

        // Compter le nombre total de groupes scolaires
        const { count: totalGroups } = await supabase
          .from('school_groups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Calculer la date il y a 30 jours (une seule fois)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const module of (allModules || []) as Array<{ id: string; name: string; slug: string }>) {
          // Compter les groupes qui ont activé ce module
          const { count: groupsWithModuleCount } = await supabase
            .from('group_module_configs')
            .select('*', { count: 'exact', head: true })
            .eq('module_id', module.id)
            .eq('is_enabled', true);

          // Compter les utilisateurs actifs des GROUPES qui ont ce module activé
          // 1. Récupérer les groupes qui ont le module activé
          const { data: groupsWithModuleData } = await supabase
            .from('group_module_configs')
            .select('school_group_id')
            .eq('module_id', module.id)
            .eq('is_enabled', true);

          const groupIds = groupsWithModuleData?.map((g: any) => g.school_group_id) || [];

          let activeUsersCount = 0;
          if (groupIds.length > 0) {
            // 2. Compter les users actifs de ces groupes
            // Note : On compte TOUS les users actifs, même sans connexion récente
            // Car last_sign_in_at peut être NULL pour les nouveaux utilisateurs
            
            // DEBUG : Récupérer les données complètes pour voir ce qui se passe
            const { data: usersData, count, error: usersError } = await supabase
              .from('users')
              .select('id, email, status, school_group_id', { count: 'exact' })
              .in('school_group_id', groupIds)
              .eq('status', 'active');

            activeUsersCount = count || 0;
            
            // TEST ALTERNATIF : Compter sans l'opérateur IN
            if (import.meta.env.DEV && activeUsersCount === 0 && groupIds.length > 0) {
              console.log('🧪 TEST : Tentative de comptage alternatif...');
              
              // Test 1 : Compter TOUS les users actifs (sans filtre groupe)
              const { count: totalActiveUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
              
              console.log('Total users actifs dans toute la BDD:', totalActiveUsers);
              
              // Test 2 : Compter avec OR au lieu de IN
              let orQuery = supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
              
              // Construire le OR manuellement
              if (groupIds.length === 1) {
                orQuery = orQuery.eq('school_group_id', groupIds[0]);
              } else if (groupIds.length === 2) {
                orQuery = orQuery.or(`school_group_id.eq.${groupIds[0]},school_group_id.eq.${groupIds[1]}`);
              }
              
              const { count: countWithOr, data: dataWithOr } = await supabase
                .from('users')
                .select('id, email, school_group_id', { count: 'exact' })
                .eq('status', 'active')
                .or(`school_group_id.eq.${groupIds[0]},school_group_id.eq.${groupIds[1]}`);
              
              console.log('🧪 Comptage avec OR:', countWithOr);
              console.log('🧪 Données avec OR:', dataWithOr);
            }
            
            // Debug en développement - LOGS DÉTAILLÉS
            if (import.meta.env.DEV) {
              console.log(`📊 Module "${module.name}":`, {
                groupsWithModule: groupsWithModuleCount,
                groupIds: groupIds,
                activeUsers: activeUsersCount,
                usersData: usersData,
                error: usersError
              });
              
              // Si erreur, afficher en rouge
              if (usersError) {
                console.error(`❌ ERREUR pour module "${module.name}":`, usersError);
              }
              
              // Si count = 0 mais on attend des users
              if (activeUsersCount === 0 && groupIds.length > 0) {
                console.warn(`⚠️ ATTENTION : 0 utilisateurs trouvés pour le module "${module.name}" alors que ${groupIds.length} groupe(s) ont ce module !`);
                console.warn('GroupIds:', groupIds);
                console.warn('UsersData:', usersData);
              }
            }
          } else {
            // Debug : Aucun groupe n'a ce module
            if (import.meta.env.DEV) {
              console.log(`⚠️ Module "${module.name}": Aucun groupe n'a ce module activé`);
            }
          }

          // Calculer l'adoption (pourcentage de groupes qui utilisent ce module)
          const adoption = totalGroups && totalGroups > 0
            ? Math.min(100, ((groupsWithModuleCount || 0) / totalGroups) * 100)
            : 0;

          // Calculer la tendance (nouveaux groupes sur 30 jours)
          const { count: recentAdoptions } = await supabase
            .from('group_module_configs')
            .select('*', { count: 'exact', head: true })
            .eq('module_id', module.id)
            .eq('is_enabled', true)
            .gte('enabled_at', thirtyDaysAgo.toISOString());

          const trend = groupsWithModuleCount && groupsWithModuleCount > 0
            ? ((recentAdoptions || 0) / groupsWithModuleCount) * 100
            : 0;

          // Dernière activation
          const { data: lastActivation } = await supabase
            .from('group_module_configs')
            .select('enabled_at')
            .eq('module_id', module.id)
            .eq('is_enabled', true)
            .order('enabled_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastUpdate = (lastActivation as any)?.enabled_at
            ? getTimeAgo(new Date((lastActivation as any).enabled_at))
            : '1j';

          results.push({
            name: module.name,
            adoption: Math.round(adoption),
            schools: groupsWithModuleCount || 0,
            trend: Math.round(trend * 10) / 10,
            activeUsers: activeUsersCount,
            lastUpdate,
          });
        }

    return results;
  } catch (error) {
    console.error('Erreur adoption globale:', error);
    return [];
  }
}

// Fonction pour Admin Groupe : Modules du groupe uniquement
async function getGroupModules(schoolGroupId: string): Promise<ModuleAdoptionData[]> {
  try {
    // Récupérer les modules configurés pour ce groupe
    const { data: groupModules, error } = await supabase
      .from('group_module_configs')
      .select(`
        module_id,
        is_enabled,
        enabled_at,
        modules!inner (
          id,
          name,
          slug
        )
      `)
      .eq('school_group_id', schoolGroupId)
      .limit(5);

    if (error) throw error;

    const results: ModuleAdoptionData[] = [];

    for (const config of (groupModules || [])) {
      const module = (config as any).modules;
      const isEnabled = (config as any).is_enabled;
      const enabledAt = (config as any).enabled_at;

      // Compter les utilisateurs actifs du groupe pour ce module
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active')
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Pour Admin Groupe :
      // - adoption = 100% si activé, 0% si désactivé
      // - schools = 1 (son groupe)
      // - trend = 0 (pas de comparaison multi-groupes)
      results.push({
        name: module.name,
        adoption: isEnabled ? 100 : 0,
        schools: 1,
        trend: 0,
        activeUsers: activeUsersCount || 0,
        lastUpdate: enabledAt ? getTimeAgo(new Date(enabledAt)) : '-',
      });
    }

    return results;
  } catch (error) {
    console.error('Erreur modules groupe:', error);
    return [];
  }
}

// Fonction helper pour calculer "il y a X temps"
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}j`;
}
