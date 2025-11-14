/**
 * Store d'auto-synchronisation pour l'assignation de modules
 * Système automatique et temps réel qui détecte tous les changements
 * @module AutoSyncAssignmentStore
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Interface pour un module assigné (simplifié)
 */
export interface AssignedModuleSimple {
  id: string;
  user_id: string;
  module_id: string;
  module_name: string;
  module_slug: string;
  is_enabled: boolean;
  assigned_at: string;
  assigned_by: string | null;
  category_name: string;
  access_count: number;
}

/**
 * Interface pour un utilisateur avec modules
 */
export interface UserWithModulesSimple {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
  assignedModules: AssignedModuleSimple[];
  assignedModulesCount: number;
}

/**
 * Interface pour les modules disponibles
 */
export interface AvailableModuleSimple {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_name: string;
  is_enabled: boolean;
}

/**
 * État du store auto-sync
 */
interface AutoSyncAssignmentState {
  // Données synchronisées
  users: UserWithModulesSimple[];
  availableModules: AvailableModuleSimple[];
  
  // États
  isLoading: boolean;
  lastSyncAt: string | null;
  error: string | null;
  
  // Canaux temps réel
  userModulesChannel: RealtimeChannel | null;
  groupModulesChannel: RealtimeChannel | null;
  
  // Actions
  initialize: (schoolGroupId: string) => Promise<void>;
  syncUserModules: (schoolGroupId: string) => Promise<void>;
  syncAvailableModules: (schoolGroupId: string) => Promise<void>;
  assignModuleToUser: (userId: string, moduleId: string) => Promise<void>;
  revokeModuleFromUser: (userId: string, moduleId: string) => Promise<void>;
  cleanup: () => void;
  
  // Utilitaires
  getUserById: (userId: string) => UserWithModulesSimple | undefined;
  getModuleById: (moduleId: string) => AvailableModuleSimple | undefined;
  getUsersWithModule: (moduleId: string) => UserWithModulesSimple[];
}

/**
 * Store auto-sync
 */
export const useAutoSyncAssignmentStore = create<AutoSyncAssignmentState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // État initial
      users: [],
      availableModules: [],
      isLoading: false,
      lastSyncAt: null,
      error: null,
      userModulesChannel: null,
      groupModulesChannel: null,

      /**
       * Initialisation complète du système
       */
      initialize: async (schoolGroupId: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🚀 [AutoSync] Initialisation pour groupe:', schoolGroupId);

          // Synchroniser les données en parallèle
          await Promise.all([
            get().syncUserModules(schoolGroupId),
            get().syncAvailableModules(schoolGroupId)
          ]);

          // Configurer les canaux temps réel
          get().setupRealtimeChannels(schoolGroupId);

          set({ 
            lastSyncAt: new Date().toISOString(),
            isLoading: false 
          });

          console.log('✅ [AutoSync] Initialisation terminée');

        } catch (error: any) {
          console.error('❌ [AutoSync] Erreur initialisation:', error);
          set({ 
            error: error.message,
            isLoading: false 
          });
        }
      },

      /**
       * Synchroniser les modules des utilisateurs
       */
      syncUserModules: async (schoolGroupId: string) => {
        try {
          console.log('🔄 [AutoSync] Synchronisation user_modules...');

          // Récupérer tous les utilisateurs du groupe
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, role, school_id')
            .eq('school_group_id', schoolGroupId)
            .neq('role', 'super_admin');

          if (usersError) throw usersError;

          // Récupérer toutes les assignations avec détails des modules
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('user_modules')
            .select(`
              id,
              user_id,
              module_id,
              is_enabled,
              assigned_at,
              assigned_by,
              access_count,
              modules!inner(
                name,
                slug,
                business_categories(name)
              )
            `)
            .in('user_id', (usersData || []).map(u => u.id))
            .eq('is_enabled', true);

          if (assignmentsError) throw assignmentsError;

          // Grouper les assignations par utilisateur
          const assignmentsByUser: Record<string, AssignedModuleSimple[]> = {};
          
          (assignmentsData || []).forEach((assignment: any) => {
            if (!assignmentsByUser[assignment.user_id]) {
              assignmentsByUser[assignment.user_id] = [];
            }
            
            assignmentsByUser[assignment.user_id].push({
              id: assignment.id,
              user_id: assignment.user_id,
              module_id: assignment.module_id,
              module_name: assignment.modules?.name || 'Module inconnu',
              module_slug: assignment.modules?.slug || '',
              is_enabled: assignment.is_enabled,
              assigned_at: assignment.assigned_at,
              assigned_by: assignment.assigned_by,
              category_name: assignment.modules?.business_categories?.name || 'Général',
              access_count: assignment.access_count || 0,
            });
          });

          // Construire la liste des utilisateurs
          const users: UserWithModulesSimple[] = (usersData || []).map(user => {
            const userAssignments = assignmentsByUser[user.id] || [];
            return {
              id: user.id,
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              email: user.email || '',
              role: user.role || '',
              schoolId: user.school_id,
              assignedModules: userAssignments,
              assignedModulesCount: userAssignments.length,
            };
          });

          set({ users });
          console.log('✅ [AutoSync] Users synchronisés:', users.length);

        } catch (error: any) {
          console.error('❌ [AutoSync] Erreur sync users:', error);
          set({ error: error.message });
        }
      },

      /**
       * Synchroniser les modules disponibles
       */
      syncAvailableModules: async (schoolGroupId: string) => {
        try {
          console.log('🔄 [AutoSync] Synchronisation modules disponibles...');

          const { data: modulesData, error } = await supabase
            .from('group_module_configs')
            .select(`
              is_enabled,
              modules!inner(
                id,
                name,
                slug,
                description,
                category_id,
                business_categories!inner(name)
              )
            `)
            .eq('school_group_id', schoolGroupId)
            .eq('is_enabled', true)
            .eq('modules.status', 'active');

          if (error) throw error;

          const availableModules: AvailableModuleSimple[] = (modulesData || []).map((item: any) => ({
            id: item.modules.id,
            name: item.modules.name,
            slug: item.modules.slug,
            description: item.modules.description || '',
            category_id: item.modules.category_id,
            category_name: item.modules.business_categories?.name || 'Général',
            is_enabled: item.is_enabled,
          }));

          set({ availableModules });
          console.log('✅ [AutoSync] Modules disponibles synchronisés:', availableModules.length);

        } catch (error: any) {
          console.error('❌ [AutoSync] Erreur sync modules:', error);
          set({ error: error.message });
        }
      },

      /**
       * Assigner un module à un utilisateur (action simple)
       */
      assignModuleToUser: async (userId: string, moduleId: string) => {
        try {
          console.log('➕ [AutoSync] Assignation module:', moduleId, 'à utilisateur:', userId);

          const { data: currentUser } = await supabase.auth.getUser();
          if (!currentUser.user) throw new Error('Non authentifié');

          const { error } = await supabase
            .from('user_modules')
            .upsert({
              user_id: userId,
              module_id: moduleId,
              is_enabled: true,
              assigned_at: new Date().toISOString(),
              assigned_by: currentUser.user.id,
              access_count: 0
            });

          if (error) throw error;

          console.log('✅ [AutoSync] Module assigné (temps réel se chargera de la sync)');

        } catch (error: any) {
          console.error('❌ [AutoSync] Erreur assignation:', error);
          set({ error: error.message });
          throw error;
        }
      },

      /**
       * Révoquer un module d'un utilisateur
       */
      revokeModuleFromUser: async (userId: string, moduleId: string) => {
        try {
          console.log('➖ [AutoSync] Révocation module:', moduleId, 'de utilisateur:', userId);

          const { error } = await supabase
            .from('user_modules')
            .delete()
            .eq('user_id', userId)
            .eq('module_id', moduleId);

          if (error) throw error;

          console.log('✅ [AutoSync] Module révoqué (temps réel se chargera de la sync)');

        } catch (error: any) {
          console.error('❌ [AutoSync] Erreur révocation:', error);
          set({ error: error.message });
          throw error;
        }
      },

      /**
       * Configuration des canaux temps réel
       */
      setupRealtimeChannels: (schoolGroupId: string) => {
        const { userModulesChannel, groupModulesChannel } = get();

        // Nettoyer les anciens canaux
        if (userModulesChannel) supabase.removeChannel(userModulesChannel);
        if (groupModulesChannel) supabase.removeChannel(groupModulesChannel);

        console.log('📡 [AutoSync] Configuration temps réel...');

        // Canal pour user_modules (assignations)
        const userChannel = supabase
          .channel(`user_modules_sync:${schoolGroupId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_modules',
            },
            (payload) => {
              console.log('🔔 [AutoSync] Changement user_modules:', payload.eventType, payload.new || payload.old);
              // Re-synchroniser automatiquement
              get().syncUserModules(schoolGroupId);
            }
          )
          .subscribe((status) => {
            console.log('📡 [AutoSync] Canal user_modules:', status);
          });

        // Canal pour group_module_configs (modules disponibles)
        const groupChannel = supabase
          .channel(`group_modules_sync:${schoolGroupId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'group_module_configs',
              filter: `school_group_id=eq.${schoolGroupId}`,
            },
            (payload) => {
              console.log('🔔 [AutoSync] Changement group_modules:', payload.eventType, payload.new || payload.old);
              // Re-synchroniser automatiquement
              get().syncAvailableModules(schoolGroupId);
            }
          )
          .subscribe((status) => {
            console.log('📡 [AutoSync] Canal group_modules:', status);
          });

        set({ 
          userModulesChannel: userChannel,
          groupModulesChannel: groupChannel 
        });
      },

      /**
       * Nettoyage
       */
      cleanup: () => {
        const { userModulesChannel, groupModulesChannel } = get();
        
        if (userModulesChannel) {
          supabase.removeChannel(userModulesChannel);
        }
        if (groupModulesChannel) {
          supabase.removeChannel(groupModulesChannel);
        }

        set({
          users: [],
          availableModules: [],
          userModulesChannel: null,
          groupModulesChannel: null,
          error: null
        });

        console.log('🧹 [AutoSync] Nettoyage terminé');
      },

      /**
       * Utilitaires
       */
      getUserById: (userId: string) => {
        return get().users.find(u => u.id === userId);
      },

      getModuleById: (moduleId: string) => {
        return get().availableModules.find(m => m.id === moduleId);
      },

      getUsersWithModule: (moduleId: string) => {
        return get().users.filter(user => 
          user.assignedModules.some(module => module.module_id === moduleId)
        );
      },
    })),
    {
      name: 'auto-sync-assignment-store',
    }
  )
);
