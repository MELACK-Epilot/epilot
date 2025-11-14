/**
 * Store Zustand pour gérer l'état global des espaces de travail des modules
 * Utilise les meilleures pratiques pour un système scalable (500+ groupes, 7000+ écoles)
 * @module ModuleWorkspaceStore
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ModuleContext } from '@/features/user-space/utils/module-navigation';

/**
 * Interface pour l'état d'un module workspace
 */
export interface ModuleWorkspaceState {
  // Contexte actuel
  currentContext: ModuleContext | null;
  
  // État de chargement
  isLoading: boolean;
  error: string | null;
  
  // Données du module
  moduleData: any | null;
  
  // Métadonnées
  lastLoadedAt: string | null;
  dataVersion: number;
  
  // Actions
  setContext: (context: ModuleContext) => void;
  loadModuleData: (moduleSlug: string, schoolId: string) => Promise<void>;
  updateModuleData: (data: any) => void;
  clearContext: () => void;
  reset: () => void;
}

/**
 * Store Zustand pour les espaces de travail des modules
 */
export const useModuleWorkspaceStore = create<ModuleWorkspaceState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // État initial
        currentContext: null,
        isLoading: false,
        error: null,
        moduleData: null,
        lastLoadedAt: null,
        dataVersion: 0,

        /**
         * Définir le contexte du module actuel
         */
        setContext: (context: ModuleContext) => {
          set((state) => {
            state.currentContext = context;
            state.dataVersion += 1;
          });

          console.log('✅ [ModuleWorkspace] Contexte défini:', {
            module: context.moduleName,
            école: context.schoolId,
            groupe: context.schoolGroupId,
          });
        },

        /**
         * Charger les données du module
         */
        loadModuleData: async (moduleSlug: string, schoolId: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            console.log('🔍 [ModuleWorkspace] Chargement données:', {
              module: moduleSlug,
              école: schoolId,
            });

            // TODO: Implémenter le chargement selon le module
            // Pour l'instant, retourner des données mockées
            const mockData = {
              moduleSlug,
              schoolId,
              loadedAt: new Date().toISOString(),
            };

            set((state) => {
              state.moduleData = mockData;
              state.lastLoadedAt = new Date().toISOString();
              state.isLoading = false;
            });

            console.log('✅ [ModuleWorkspace] Données chargées');
          } catch (error: any) {
            console.error('❌ [ModuleWorkspace] Erreur chargement:', error);
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
          }
        },

        /**
         * Mettre à jour les données du module
         */
        updateModuleData: (data: any) => {
          set((state) => {
            state.moduleData = data;
            state.dataVersion += 1;
          });
        },

        /**
         * Effacer le contexte
         */
        clearContext: () => {
          set((state) => {
            state.currentContext = null;
            state.moduleData = null;
            state.error = null;
          });
        },

        /**
         * Réinitialiser le store
         */
        reset: () => {
          set({
            currentContext: null,
            isLoading: false,
            error: null,
            moduleData: null,
            lastLoadedAt: null,
            dataVersion: 0,
          });
        },
      }))
    ),
    { name: 'ModuleWorkspaceStore' }
  )
);

/**
 * Sélecteurs optimisés pour éviter les re-renders inutiles
 */
export const selectCurrentContext = (state: ModuleWorkspaceState) => state.currentContext;
export const selectModuleData = (state: ModuleWorkspaceState) => state.moduleData;
export const selectIsLoading = (state: ModuleWorkspaceState) => state.isLoading;
export const selectError = (state: ModuleWorkspaceState) => state.error;
