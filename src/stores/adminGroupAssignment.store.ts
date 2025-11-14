/**
 * Store Zustand unifié pour l'assignation de modules par l'Admin Groupe
 * Architecture cohérente utilisant user_modules (table existante)
 * @module AdminGroupAssignmentStore
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Interface pour un module assignable
 */
export interface AssignableModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  status: 'active' | 'inactive';
  is_core: boolean;
  required_plan: string;
}

/**
 * Interface pour un utilisateur avec ses modules
 */
export interface UserWithModules {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  assignedModules: UserModuleAssignment[];
  assignedModulesCount: number;
  lastModuleAssignedAt?: string;
}

/**
 * Interface pour une assignation de module
 */
export interface UserModuleAssignment {
  id: string;
  user_id: string;
  module_id: string;
  module_name: string;
  module_slug: string;
  is_enabled: boolean;
  assigned_at: string;
  assigned_by: string;
  settings?: any;
  last_accessed_at?: string;
  access_count: number;
}

/**
 * Interface pour les permissions d'assignation
 */
export interface AssignmentPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
}

/**
 * État du store
 */
interface AdminGroupAssignmentState {
  // Données
  availableModules: AssignableModule[];
  users: UserWithModules[];
  selectedUser: UserWithModules | null;
  
  // États de chargement
  isLoadingModules: boolean;
  isLoadingUsers: boolean;
  isAssigning: boolean;
  
  // Erreurs
  error: string | null;
  
  // Filtres et recherche
  searchQuery: string;
  selectedCategory: string;
  selectedRole: string;
  
  // Temps réel
  realtimeChannel: RealtimeChannel | null;
  
  // Actions
  loadAvailableModules: (schoolGroupId: string) => Promise<void>;
  loadUsers: (schoolGroupId: string) => Promise<void>;
  
  // Actions internes
  _loadUsers: (schoolGroupId: string) => Promise<void>;
  _loadAvailableModules: (schoolGroupId: string) => Promise<void>;
  _setupRealtimeSubscription: (schoolGroupId: string) => void;
  assignModulesToUser: (userId: string, moduleIds: string[], permissions: AssignmentPermissions) => Promise<void>;
  assignCategoryToUser: (userId: string, categoryId: string, permissions: AssignmentPermissions) => Promise<void>;
  revokeModuleFromUser: (userId: string, moduleId: string) => Promise<void>;
  setSelectedUser: (user: UserWithModules | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setSelectedRole: (role: string) => void;
  setupRealtimeSubscription: (schoolGroupId: string) => void;
  cleanup: () => void;
}

/**
 * Store Zustand pour l'assignation de modules
 */
export const useAdminGroupAssignmentStore = create<AdminGroupAssignmentState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // État initial
      availableModules: [],
      users: [],
      selectedUser: null,
      isLoadingModules: false,
      isLoadingUsers: false,
      isAssigning: false,
      error: null,
      searchQuery: '',
      selectedCategory: 'all',
      selectedRole: 'all',
      realtimeChannel: null,

      /**
       * Charger les modules disponibles selon le plan du groupe
       */
      loadAvailableModules: async (schoolGroupId: string) => {
        set({ isLoadingModules: true, error: null });

        try {
          console.log('🔍 [AdminAssignment] Chargement modules disponibles selon PLAN pour groupe:', schoolGroupId);

          // Utiliser la fonction RPC optimisée qui vérifie le plan d'abonnement
          const { data: modulesData, error: modulesError } = await (supabase as any)
            .rpc('get_available_modules_for_group', {
              p_school_group_id: schoolGroupId
            });

          if (modulesError) throw modulesError;

          // Transformer les données
          const availableModules: AssignableModule[] = (modulesData || []).map((gm: any) => ({
            id: gm.modules.id,
            name: gm.modules.name,
            slug: gm.modules.slug,
            description: gm.modules.description,
            icon: gm.modules.icon || '📦',
            color: gm.modules.color || '#2A9D8F',
            category_id: gm.modules.category_id,
            category_name: gm.modules.business_categories?.name || 'Général',
            category_slug: gm.modules.business_categories?.slug || 'general',
            status: gm.modules.status,
            is_core: gm.modules.is_core,
            required_plan: gm.modules.required_plan || 'gratuit',
          }));

          set({ 
            availableModules,
            isLoadingModules: false 
          });

          console.log('✅ [AdminAssignment] Modules chargés:', availableModules.length);

        } catch (error: any) {
          console.error('❌ [AdminAssignment] Erreur chargement modules:', error);
          set({ 
            error: error.message,
            isLoadingModules: false 
          });
        }
      },

      /**
       * Charger les utilisateurs avec leurs modules assignés
       */
      loadUsers: async (schoolGroupId: string) => {
        return get()._loadUsers(schoolGroupId);
      },

      /**
       * Implémentation interne du chargement des utilisateurs
       */
      _loadUsers: async (schoolGroupId: string) => {
        set({ isLoadingUsers: true, error: null });

        try {
          console.log('🔍 [AdminAssignment] Chargement utilisateurs pour groupe:', schoolGroupId);

          // Récupérer les utilisateurs du groupe
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select(`
              id,
              first_name,
              last_name,
              email,
              role,
              school_id,
              schools(name)
            `)
            .eq('school_group_id', schoolGroupId)
            .neq('role', 'super_admin');

          if (usersError) throw usersError;

          // Récupérer les assignations de modules pour tous les utilisateurs
          const userIds = (usersData as any[] || []).map((u: any) => u.id);
          
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('user_modules')
            .select(`
              id,
              user_id,
              module_id,
              is_enabled,
              assigned_at,
              assigned_by,
              settings,
              last_accessed_at,
              access_count,
              modules!inner(
                name,
                slug
              )
            `)
            .in('user_id', userIds)
            .eq('is_enabled', true);

          if (assignmentsError) throw assignmentsError;

          // Grouper les assignations par utilisateur
          const assignmentsByUser = (assignmentsData || []).reduce((acc: any, assignment: any) => {
            if (!acc[assignment.user_id]) {
              acc[assignment.user_id] = [];
            }
            acc[assignment.user_id].push({
              id: assignment.id,
              user_id: assignment.user_id,
              module_id: assignment.module_id,
              module_name: assignment.modules.name,
              module_slug: assignment.modules.slug,
              is_enabled: assignment.is_enabled,
              assigned_at: assignment.assigned_at,
              assigned_by: assignment.assigned_by,
              settings: assignment.settings,
              last_accessed_at: assignment.last_accessed_at,
              access_count: assignment.access_count || 0,
            });
            return acc;
          }, {});

          // Construire la liste des utilisateurs avec leurs modules
          const users: UserWithModules[] = (usersData as any[] || []).map((user: any) => {
            const userAssignments = assignmentsByUser[user.id] || [];
            return {
              id: user.id,
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              email: user.email || '',
              role: user.role || '',
              schoolId: user.school_id,
              schoolName: user.schools?.name,
              assignedModules: userAssignments,
              assignedModulesCount: userAssignments.length,
              lastModuleAssignedAt: userAssignments.length > 0 
                ? new Date(Math.max(...userAssignments.map((a: any) => new Date(a.assigned_at).getTime()))).toISOString()
                : undefined,
            };
          });

          set({ 
            users,
            isLoadingUsers: false 
          });

          console.log('✅ [AdminAssignment] Utilisateurs chargés:', users.length);

        } catch (error: any) {
          console.error('❌ [AdminAssignment] Erreur chargement utilisateurs:', error);
          set({ 
            error: error.message,
            isLoadingUsers: false 
          });
        }
      },

      /**
       * Assigner des modules à un utilisateur avec validation serveur
       */
      assignModulesToUser: async (userId: string, moduleIds: string[], permissions: AssignmentPermissions) => {
        set({ isAssigning: true, error: null });

        try {
          console.log('🔄 [AdminAssignment] Assignation modules:', moduleIds.length, 'à utilisateur:', userId);

          const { data: currentUser } = await supabase.auth.getUser();
          if (!currentUser.user) throw new Error('Non authentifié');

          // Vérifier que l'admin et l'utilisateur sont du même groupe
          const { data: adminData } = await supabase
            .from('users')
            .select('school_group_id, role')
            .eq('id', currentUser.user.id)
            .single();

          const { data: userData } = await supabase
            .from('users')
            .select('school_group_id')
            .eq('id', userId)
            .single();

          if (!adminData || !userData) {
            throw new Error('Utilisateur introuvable');
          }

          if ((adminData as any).school_group_id !== (userData as any).school_group_id) {
            throw new Error('Vous ne pouvez assigner des modules qu\'aux utilisateurs de votre groupe scolaire');
          }

          // Utiliser la fonction RPC pour validation côté serveur
          console.log('🔐 [AdminAssignment] Utilisation de la validation serveur RPC');
          
          const results = await Promise.all(
            moduleIds.map(moduleId =>
              (supabase as any).rpc('assign_module_with_validation', {
                p_user_id: userId,
                p_module_id: moduleId,
                p_assigned_by: currentUser.user.id,
                p_permissions: permissions
              })
            )
          );

          // Vérifier les erreurs
          const errors = results.filter(r => r.error || (r.data && !r.data.success));
          if (errors.length > 0) {
            const errorMessages = errors.map(e => e.error?.message || e.data?.error).join(', ');
            throw new Error(`Erreur lors de l'assignation: ${errorMessages}`);
          }

          console.log('✅ [AdminAssignment] Modules assignés avec succès:', results.length);

          // Recharger les utilisateurs pour mettre à jour l'état
          await get()._loadUsers((adminData as any).school_group_id);

          set({ isAssigning: false });

        } catch (error: any) {
          console.error('❌ [AdminAssignment] Erreur assignation:', error);
          set({ 
            error: error.message,
            isAssigning: false 
          });
          throw error;
        }
      },

      /**
       * Assigner une catégorie complète à un utilisateur avec validation
       */
      assignCategoryToUser: async (userId: string, categoryId: string, permissions: AssignmentPermissions) => {
        const { availableModules } = get();
        
        // Filtrer les modules actifs de la catégorie
        const categoryModules = availableModules.filter(m => 
          m.category_id === categoryId && 
          m.status === 'active'
        );
        
        if (categoryModules.length === 0) {
          throw new Error('Aucun module actif trouvé dans cette catégorie');
        }
        
        const moduleIds = categoryModules.map(m => m.id);
        
        console.log(`📦 [AdminAssignment] Assignation catégorie: ${categoryModules.length} modules`);
        
        return get().assignModulesToUser(userId, moduleIds, permissions);
      },

      /**
       * Révoquer un module d'un utilisateur avec traçabilité (soft delete)
       */
      revokeModuleFromUser: async (userId: string, moduleId: string) => {
        try {
          console.log('🗑️ [AdminAssignment] Révocation module:', moduleId, 'de utilisateur:', userId);

          const { data: currentUser } = await supabase.auth.getUser();
          if (!currentUser.user) throw new Error('Non authentifié');

          // Utiliser la fonction RPC pour validation serveur
          const { data, error } = await (supabase as any).rpc('revoke_module_with_validation', {
            p_user_id: userId,
            p_module_id: moduleId,
            p_revoked_by: currentUser.user.id
          });

          if (error || (data && !data.success)) {
            throw new Error(error?.message || data?.error || 'Erreur lors de la révocation');
          }

          // Mettre à jour l'état local
          const { users } = get();
          const updatedUsers = users.map(user => {
            if (user.id === userId) {
              const updatedAssignments = user.assignedModules.filter(a => a.module_id !== moduleId);
              return {
                ...user,
                assignedModules: updatedAssignments,
                assignedModulesCount: updatedAssignments.length
              };
            }
            return user;
          });

          set({ users: updatedUsers });

          console.log('✅ [AdminAssignment] Module révoqué');

        } catch (error: any) {
          console.error('❌ [AdminAssignment] Erreur révocation:', error);
          set({ error: error.message });
          throw error;
        }
      },

      /**
       * Actions de filtrage et sélection
       */
      setSelectedUser: (user) => set({ selectedUser: user }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      setSelectedRole: (role) => set({ selectedRole: role }),

      /**
       * Configuration temps réel
       */
      setupRealtimeSubscription: (schoolGroupId: string) => {
        return get()._setupRealtimeSubscription(schoolGroupId);
      },

      /**
       * Implémentation interne de la configuration temps réel
       */
      _setupRealtimeSubscription: (schoolGroupId: string) => {
        const { realtimeChannel } = get();
        
        // Nettoyer l'ancien canal
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
        }

        // Créer un nouveau canal
        const channel = supabase
          .channel(`admin_assignment:${schoolGroupId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_modules',
            },
            (payload) => {
              console.log('🔔 [AdminAssignment] Changement temps réel détecté:', payload);
              // Recharger automatiquement les données
              get()._loadUsers(schoolGroupId);
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
              console.log('🔔 [AdminAssignment] Modules groupe modifiés:', payload);
              // Recharger les modules disponibles
              get()._loadAvailableModules(schoolGroupId);
            }
          )
          .subscribe((status) => {
            console.log('📡 [AdminAssignment] Statut temps réel:', status);
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
          realtimeChannel: null,
          availableModules: [],
          users: [],
          selectedUser: null,
          error: null
        });
      }
    })),
    {
      name: 'admin-group-assignment-store',
    }
  )
);
