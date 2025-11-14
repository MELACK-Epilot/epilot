/**
 * Store Zustand centralisé pour la gestion des abonnements temps réel
 * Conforme aux bonnes pratiques React 19
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';

// Types pour le système d'abonnement
export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended';

export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'biannual' | null;

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  features: string[] | null;
  billing_cycle?: BillingCycle;
  max_schools?: number | null;
  max_users?: number | null;
}

export interface SchoolGroupSubscription {
  id: string;
  school_group_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  billing_cycle: BillingCycle;
  next_billing_date: string | null;
  plan: SubscriptionPlan | null;
}

export interface ModuleAccess {
  module_id: string;
  module_name: string;
  category_id: string | null;
  category_name: string;
  is_enabled: boolean;
  plan_required: string | null;
}

export interface SubscriptionState {
  // État des abonnements
  currentSubscription: SchoolGroupSubscription | null;
  availablePlans: SubscriptionPlan[];
  moduleAccess: ModuleAccess[];
  
  // État de synchronisation
  isLoading: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
  
  // WebSocket/Polling
  isConnected: boolean;
  reconnectAttempts: number;
  
  // Actions
  setCurrentSubscription: (subscription: SchoolGroupSubscription | null) => void;
  setAvailablePlans: (plans: SubscriptionPlan[]) => void;
  setModuleAccess: (modules: ModuleAccess[]) => void;
  updateSubscriptionPlan: (planId: string, queryClient?: QueryClient) => Promise<void>;
  
  // Synchronisation
  startSync: () => void;
  stopSync: () => void;
  forceRefresh: (queryClient?: QueryClient) => Promise<void>;
  
  // WebSocket
  connect: () => void;
  disconnect: () => void;
  
  // Utilitaires
  hasModuleAccess: (moduleId: string) => boolean;
  hasCategoryAccess: (categoryId: string) => boolean;
  getPlanFeatures: () => string[];
  
  // Réinitialisation
  reset: () => void;
}

// État initial
const initialState = {
  currentSubscription: null,
  availablePlans: [],
  moduleAccess: [],
  isLoading: false,
  isSyncing: false,
  lastSync: null,
  error: null,
  isConnected: false,
  reconnectAttempts: 0,
};

/**
 * Store principal pour la gestion des abonnements
 */
export const useSubscriptionStore = create<SubscriptionState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Actions de base
      setCurrentSubscription: (subscription) => {
        set((state) => {
          state.currentSubscription = subscription;
          state.lastSync = new Date();
          state.error = null;
        });
      },

      setAvailablePlans: (plans) => {
        set((state) => {
          state.availablePlans = plans;
        });
      },

      setModuleAccess: (modules) => {
        set((state) => {
          state.moduleAccess = modules;
          state.lastSync = new Date();
        });
      },

      // Mise à jour du plan d'abonnement (ACTION PRINCIPALE)
      // Optimisé pour 500+ groupes avec fonction RPC
      updateSubscriptionPlan: async (planId, queryClient) => {
        const state = get();
        const schoolGroupId = state.currentSubscription?.school_group_id;

        if (!schoolGroupId) {
          console.error('❌ Impossible de mettre à jour le plan: aucune souscription active');
          throw new Error('Aucune souscription active à mettre à jour');
        }

        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          console.log('🔄 Mise à jour du plan d\'abonnement:', planId, 'pour le groupe:', schoolGroupId);

          // 1. Mettre à jour l'abonnement en base
          const { data: updatedSubscription, error: updateError } = await supabase
            .from('school_group_subscriptions')
            .update({ 
              plan_id: planId,
              updated_at: new Date().toISOString()
            })
            .eq('school_group_id', schoolGroupId)
            .eq('status', 'active')
            .select(`
              *,
              plan:subscription_plans(*)
            `)
            .single();

          if (updateError) throw updateError;
          if (!updatedSubscription) {
            throw new Error('La souscription mise à jour est introuvable');
          }

          const normalizedSubscription: SchoolGroupSubscription = {
            ...updatedSubscription,
            plan: (updatedSubscription as any).plan ?? null,
          };

          // 2. Utiliser la fonction RPC optimisée pour récupérer les modules disponibles
          const { data: availableModules, error: moduleError } = await (supabase as any)
            .rpc('get_available_modules_for_group', {
              p_school_group_id: schoolGroupId
            });

          if (moduleError) throw moduleError;

          // 3. Formater les données
          const formattedModules: ModuleAccess[] = (availableModules || [])
            .map((module: any) => ({
              module_id: module.module_id,
              module_name: module.module_name,
              category_id: module.category_id,
              category_name: module.category_name || 'Sans catégorie',
              is_enabled: true, // Modules disponibles sont activés
              plan_required: normalizedSubscription.plan?.slug ?? null,
            }));

          // 4. Mettre à jour le store
          set((draft) => {
            draft.currentSubscription = normalizedSubscription;
            draft.moduleAccess = formattedModules;
            draft.isLoading = false;
            draft.lastSync = new Date();
            draft.error = null;
          });

          // 5. Invalider les caches React Query
          if (queryClient) {
            console.log('🔄 Invalidation des caches React Query...');
            await queryClient.invalidateQueries({ 
              queryKey: ['school-group-modules'] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['school-group-categories'] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['school-group-plan', schoolGroupId] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['user-modules'] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['user-categories'] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['admin-group-modules', schoolGroupId] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['admin-group-categories', schoolGroupId] 
            });
            await queryClient.invalidateQueries({ 
              queryKey: ['proviseur-modules'] 
            });
          }

          console.log('✅ Plan mis à jour avec succès - Modules disponibles:', formattedModules.length);
          
        } catch (error: any) {
          console.error('❌ Erreur mise à jour plan:', error);
          set((draft) => {
            draft.isLoading = false;
            draft.error = error.message;
          });
          throw error;
        }
      },

      // Synchronisation
      startSync: () => {
        set((state) => {
          state.isSyncing = true;
        });
      },

      stopSync: () => {
        set((state) => {
          state.isSyncing = false;
        });
      },

      forceRefresh: async (queryClient) => {
        const state = get();
        if (!state.currentSubscription) return;

        try {
          set((draft) => {
            draft.isSyncing = true;
          });

          // Recharger les données depuis la base
          const { data: subscription } = await supabase
            .from('school_group_subscriptions')
            .select(`
              *,
              plans:plan_id(*)
            `)
            .eq('school_group_id', state.currentSubscription.school_group_id)
            .eq('status', 'active')
            .single();

          if (subscription) {
            get().setCurrentSubscription(subscription as SchoolGroupSubscription);
          }

          // Invalider les caches
          if (queryClient) {
            await queryClient.invalidateQueries();
          }

        } finally {
          set((draft) => {
            draft.isSyncing = false;
            draft.lastSync = new Date();
          });
        }
      },

      // WebSocket (placeholder pour implémentation future)
      connect: () => {
        set((state) => {
          state.isConnected = true;
          state.reconnectAttempts = 0;
        });
      },

      disconnect: () => {
        set((state) => {
          state.isConnected = false;
        });
      },

      // Utilitaires
      hasModuleAccess: (moduleId) => {
        const state = get();
        return state.moduleAccess.some(
          (module) => module.module_id === moduleId && module.is_enabled
        );
      },

      hasCategoryAccess: (categoryId) => {
        const state = get();
        return state.moduleAccess.some(
          (module) => module.category_id === categoryId && module.is_enabled
        );
      },

      getPlanFeatures: () => {
        const state = get();
        return state.currentSubscription?.plan.features || [];
      },

      // Réinitialisation
      reset: () => {
        set(() => ({ ...initialState }));
      },
    }))
  )
);

/**
 * Sélecteurs optimisés pour éviter les re-renders inutiles
 */
export const subscriptionSelectors = {
  currentPlan: (state: SubscriptionState) => state.currentSubscription?.plan,
  moduleAccess: (state: SubscriptionState) => state.moduleAccess,
  isLoading: (state: SubscriptionState) => state.isLoading,
  error: (state: SubscriptionState) => state.error,
  lastSync: (state: SubscriptionState) => state.lastSync,
};
