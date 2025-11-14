/**
 * Store final unifié pour l'assignation de modules
 * Système automatique, temps réel et sans erreurs TypeScript
 * @module AssignmentStoreFinal
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Interface pour un module assigné
 */
export interface AssignedModuleFinal {
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
export interface UserWithModulesFinal {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
  assignedModules: AssignedModuleFinal[];
  assignedModulesCount: number;
}

/**
 * Interface pour un module disponible
 */
export interface AvailableModuleFinal {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
}

/**
 * État du store final
 */
interface AssignmentStoreFinalState {
  // Données
  users: UserWithModulesFinal[];
  availableModules: AvailableModuleFinal[];
  
  // États
  isLoading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  
  // Temps réel
  realtimeChannel: RealtimeChannel | null;
  
  // Actions
  initialize: (schoolGroupId: string) => Promise<void>;
  assignModule: (userId: string, moduleId: string) => Promise<void>;
  revokeModule: (userId: string, moduleId: string) => Promise<void>;
  cleanup: () => void;
  
  // Utilitaires
  getUserById: (userId: string) => UserWithModulesFinal | undefined;
  getModuleById: (moduleId: string) => AvailableModuleFinal | undefined;
}

/**
 * Store final unifié
 */
export const useAssignmentStoreFinal = create<AssignmentStoreFinalState>()(
  devtools((set, get) => ({
    // État initial
    users: [],
    availableModules: [],
    isLoading: false,
    error: null,
    lastSyncAt: null,
    realtimeChannel: null,

    /**
     * Initialisation complète
     */
    initialize: async (schoolGroupId: string) => {
      set({ isLoading: true, error: null });

      try {
        console.log('🚀 [AssignmentFinal] Initialisation pour groupe:', schoolGroupId);

        // Charger les données en parallèle
        await Promise.all([
          get().loadUsers(schoolGroupId),
          get().loadAvailableModules(schoolGroupId)
        ]);

        // Configurer le temps réel
        get().setupRealtime(schoolGroupId);

        set({ 
          lastSyncAt: new Date().toISOString(),
          isLoading: false 
        });

        console.log('✅ [AssignmentFinal] Initialisation terminée');

      } catch (error: any) {
        console.error('❌ [AssignmentFinal] Erreur initialisation:', error);
        set({ 
          error: error.message,
          isLoading: false 
        });
      }
    },

    /**
     * Charger les utilisateurs avec leurs modules
     */
    loadUsers: async (schoolGroupId: string) => {
      try {
        // Récupérer les utilisateurs
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, school_id')
          .eq('school_group_id', schoolGroupId)
          .neq('role', 'super_admin');

        if (usersError) throw usersError;

        // Récupérer les assignations avec détails des modules
        const userIds = (usersData || []).map(u => u.id);
        
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
          .in('user_id', userIds)
          .eq('is_enabled', true);

        if (assignmentsError) throw assignmentsError;

        // Grouper par utilisateur
        const assignmentsByUser: Record<string, AssignedModuleFinal[]> = {};
        
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

        // Construire la liste finale
        const users: UserWithModulesFinal[] = (usersData || []).map(user => {
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
        console.log('✅ [AssignmentFinal] Utilisateurs chargés:', users.length);

      } catch (error: any) {
        console.error('❌ [AssignmentFinal] Erreur chargement users:', error);
        throw error;
      }
    },

    /**
     * Charger les modules disponibles
     */
    loadAvailableModules: async (schoolGroupId: string) => {
      try {
        const { data: modulesData, error } = await supabase
          .from('group_module_configs')
          .select(`
            modules!inner(
              id,
              name,
              slug,
              description,
              category_id,
              icon,
              color,
              business_categories!inner(name)
            )
          `)
          .eq('school_group_id', schoolGroupId)
          .eq('is_enabled', true)
          .eq('modules.status', 'active');

        if (error) throw error;

        const availableModules: AvailableModuleFinal[] = (modulesData || []).map((item: any) => ({
          id: item.modules.id,
          name: item.modules.name,
          slug: item.modules.slug,
          description: item.modules.description || '',
          category_id: item.modules.category_id,
          category_name: item.modules.business_categories?.name || 'Général',
          icon: item.modules.icon || '📦',
          color: item.modules.color || '#2A9D8F',
        }));

        set({ availableModules });
        console.log('✅ [AssignmentFinal] Modules disponibles chargés:', availableModules.length);

      } catch (error: any) {
        console.error('❌ [AssignmentFinal] Erreur chargement modules:', error);
        throw error;
      }
    },

    /**
     * Assigner un module
     */
    assignModule: async (userId: string, moduleId: string) => {
      try {
        console.log('➕ [AssignmentFinal] Assignation:', moduleId, 'à', userId);

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

        console.log('✅ [AssignmentFinal] Module assigné');
        // Le temps réel se chargera de la mise à jour

      } catch (error: any) {
        console.error('❌ [AssignmentFinal] Erreur assignation:', error);
        set({ error: error.message });
        throw error;
      }
    },

    /**
     * Révoquer un module
     */
    revokeModule: async (userId: string, moduleId: string) => {
      try {
        console.log('➖ [AssignmentFinal] Révocation:', moduleId, 'de', userId);

        const { error } = await supabase
          .from('user_modules')
          .delete()
          .eq('user_id', userId)
          .eq('module_id', moduleId);

        if (error) throw error;

        console.log('✅ [AssignmentFinal] Module révoqué');
        // Le temps réel se chargera de la mise à jour

      } catch (error: any) {
        console.error('❌ [AssignmentFinal] Erreur révocation:', error);
        set({ error: error.message });
        throw error;
      }
    },

    /**
     * Configuration temps réel
     */
    setupRealtime: (schoolGroupId: string) => {
      const { realtimeChannel } = get();

      // Nettoyer l'ancien canal
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }

      console.log('📡 [AssignmentFinal] Configuration temps réel...');

      // Créer le canal unifié
      const channel = supabase
        .channel(`assignment_final:${schoolGroupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_modules',
          },
          (payload) => {
            console.log('🔔 [AssignmentFinal] Changement user_modules:', payload.eventType);
            // Recharger automatiquement
            get().loadUsers(schoolGroupId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_module_configs',
            filter: `school_group_id=eq.${schoolGroupId}`,
          },
          (payload) => {
            console.log('🔔 [AssignmentFinal] Changement group_modules:', payload.eventType);
            // Recharger automatiquement
            get().loadAvailableModules(schoolGroupId);
          }
        )
        .subscribe((status) => {
          console.log('📡 [AssignmentFinal] Statut canal:', status);
        });

      set({ realtimeChannel: channel });
    },

    /**
     * Nettoyage
     */
    cleanup: () => {
      const { realtimeChannel } = get();
      
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }

      set({
        users: [],
        availableModules: [],
        realtimeChannel: null,
        error: null
      });

      console.log('🧹 [AssignmentFinal] Nettoyage terminé');
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
  }))
);
