/**
 * Store Zustand pour la gestion globale des modules et catégories
 * Synchronisation en temps réel avec Supabase
 * @module ModulesStore
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Interface pour un module
 */
export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category_id: string;
  status: 'active' | 'inactive' | 'maintenance';
  is_core: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour une catégorie
 */
export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour le store
 */
interface ModulesStore {
  // État
  modules: Module[];
  categories: BusinessCategory[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  
  // Channels Realtime
  modulesChannel: RealtimeChannel | null;
  categoriesChannel: RealtimeChannel | null;
  
  // Actions
  loadModules: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadAll: () => Promise<void>;
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
  
  // Getters
  getModuleBySlug: (slug: string) => Module | undefined;
  getCategoryById: (id: string) => BusinessCategory | undefined;
  getModulesByCategory: (categoryId: string) => Module[];
}

/**
 * Store Zustand pour les modules et catégories
 */
export const useModulesStore = create<ModulesStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // État initial
      modules: [],
      categories: [],
      isLoading: false,
      error: null,
      lastSync: null,
      modulesChannel: null,
      categoriesChannel: null,

      /**
       * Charger tous les modules
       */
      loadModules: async () => {
        try {
          set({ isLoading: true, error: null });
          
          console.log('🔄 [ModulesStore] Chargement des modules...');

          const { data, error } = await supabase
            .from('modules')
            .select('*')
            .order('name');

          if (error) throw error;

          set({ 
            modules: data || [],
            lastSync: new Date(),
            isLoading: false,
          });

          console.log('✅ [ModulesStore] Modules chargés:', data?.length);
        } catch (error: any) {
          console.error('❌ [ModulesStore] Erreur chargement modules:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      /**
       * Charger toutes les catégories
       */
      loadCategories: async () => {
        try {
          set({ isLoading: true, error: null });
          
          console.log('🔄 [ModulesStore] Chargement des catégories...');

          const { data, error } = await supabase
            .from('business_categories')
            .select('*')
            .order('order_index');

          if (error) throw error;

          set({ 
            categories: data || [],
            lastSync: new Date(),
            isLoading: false,
          });

          console.log('✅ [ModulesStore] Catégories chargées:', data?.length);
        } catch (error: any) {
          console.error('❌ [ModulesStore] Erreur chargement catégories:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      /**
       * Charger modules et catégories
       */
      loadAll: async () => {
        await Promise.all([
          get().loadModules(),
          get().loadCategories(),
        ]);
      },

      /**
       * S'abonner aux changements en temps réel
       */
      subscribeToChanges: () => {
        console.log('🔔 [ModulesStore] Abonnement aux changements Realtime...');

        // Channel pour les modules
        const modulesChannel = supabase
          .channel('modules-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'modules',
            },
            (payload) => {
              console.log('🔔 [ModulesStore] Module changé:', payload);
              
              // Recharger les modules
              get().loadModules();
            }
          )
          .subscribe((status) => {
            console.log('📡 [ModulesStore] Modules channel status:', status);
          });

        // Channel pour les catégories
        const categoriesChannel = supabase
          .channel('categories-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'business_categories',
            },
            (payload) => {
              console.log('🔔 [ModulesStore] Catégorie changée:', payload);
              
              // Recharger les catégories
              get().loadCategories();
            }
          )
          .subscribe((status) => {
            console.log('📡 [ModulesStore] Categories channel status:', status);
          });

        set({ modulesChannel, categoriesChannel });
        
        console.log('✅ [ModulesStore] Abonnement Realtime activé');
      },

      /**
       * Se désabonner des changements
       */
      unsubscribeFromChanges: () => {
        const { modulesChannel, categoriesChannel } = get();

        if (modulesChannel) {
          supabase.removeChannel(modulesChannel);
          console.log('🔕 [ModulesStore] Désabonnement modules channel');
        }

        if (categoriesChannel) {
          supabase.removeChannel(categoriesChannel);
          console.log('🔕 [ModulesStore] Désabonnement categories channel');
        }

        set({ modulesChannel: null, categoriesChannel: null });
      },

      /**
       * Obtenir un module par son slug
       */
      getModuleBySlug: (slug: string) => {
        return get().modules.find((m) => m.slug === slug);
      },

      /**
       * Obtenir une catégorie par son ID
       */
      getCategoryById: (id: string) => {
        return get().categories.find((c) => c.id === id);
      },

      /**
       * Obtenir les modules d'une catégorie
       */
      getModulesByCategory: (categoryId: string) => {
        return get().modules.filter((m) => m.category_id === categoryId);
      },
    })),
    { name: 'ModulesStore' }
  )
);

/**
 * Sélecteurs optimisés
 */
export const selectModules = (state: ModulesStore) => state.modules;
export const selectCategories = (state: ModulesStore) => state.categories;
export const selectIsLoading = (state: ModulesStore) => state.isLoading;
export const selectError = (state: ModulesStore) => state.error;
export const selectLastSync = (state: ModulesStore) => state.lastSync;
