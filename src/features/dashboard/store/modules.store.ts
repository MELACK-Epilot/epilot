/**
 * Store Zustand pour la gestion des modules
 * Centralise l'état et les actions liées aux modules
 * @module modules.store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ModulePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface SelectedModule {
  id: string;
  name: string;
  categoryId?: string;
}

interface ModulesState {
  // État de sélection
  selectedModules: string[];
  selectedCategories: string[];
  selectedModulesDetails: SelectedModule[];
  
  // Permissions par défaut
  defaultPermissions: ModulePermissions;
  
  // État UI
  isAssigning: boolean;
  assignmentProgress: number;
  
  // Actions de sélection
  toggleModule: (moduleId: string) => void;
  toggleCategory: (categoryId: string) => void;
  selectAllModules: (moduleIds: string[]) => void;
  deselectAllModules: () => void;
  selectAllCategories: (categoryIds: string[]) => void;
  deselectAllCategories: () => void;
  clearSelection: () => void;
  
  // Actions de permissions
  setDefaultPermissions: (permissions: Partial<ModulePermissions>) => void;
  resetDefaultPermissions: () => void;
  
  // Actions d'assignation
  setIsAssigning: (isAssigning: boolean) => void;
  setAssignmentProgress: (progress: number) => void;
  
  // Utilitaires
  getTotalSelected: () => number;
  hasSelection: () => boolean;
}

const DEFAULT_PERMISSIONS: ModulePermissions = {
  canRead: true,
  canWrite: false,
  canDelete: false,
  canExport: false,
};

export const useModulesStore = create<ModulesState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        selectedModules: [],
        selectedCategories: [],
        selectedModulesDetails: [],
        defaultPermissions: DEFAULT_PERMISSIONS,
        isAssigning: false,
        assignmentProgress: 0,

        // Actions de sélection
        toggleModule: (moduleId: string) => {
          set((state) => ({
            selectedModules: state.selectedModules.includes(moduleId)
              ? state.selectedModules.filter((id) => id !== moduleId)
              : [...state.selectedModules, moduleId],
          }));
        },

        toggleCategory: (categoryId: string) => {
          set((state) => ({
            selectedCategories: state.selectedCategories.includes(categoryId)
              ? state.selectedCategories.filter((id) => id !== categoryId)
              : [...state.selectedCategories, categoryId],
          }));
        },

        selectAllModules: (moduleIds: string[]) => {
          set({ selectedModules: moduleIds });
        },

        deselectAllModules: () => {
          set({ selectedModules: [] });
        },

        selectAllCategories: (categoryIds: string[]) => {
          set({ selectedCategories: categoryIds });
        },

        deselectAllCategories: () => {
          set({ selectedCategories: [] });
        },

        clearSelection: () => {
          set({
            selectedModules: [],
            selectedCategories: [],
            selectedModulesDetails: [],
          });
        },

        // Actions de permissions
        setDefaultPermissions: (permissions: Partial<ModulePermissions>) => {
          set((state) => ({
            defaultPermissions: {
              ...state.defaultPermissions,
              ...permissions,
            },
          }));
        },

        resetDefaultPermissions: () => {
          set({ defaultPermissions: DEFAULT_PERMISSIONS });
        },

        // Actions d'assignation
        setIsAssigning: (isAssigning: boolean) => {
          set({ isAssigning });
        },

        setAssignmentProgress: (progress: number) => {
          set({ assignmentProgress: progress });
        },

        // Utilitaires
        getTotalSelected: () => {
          const state = get();
          return state.selectedModules.length + state.selectedCategories.length;
        },

        hasSelection: () => {
          const state = get();
          return state.selectedModules.length > 0 || state.selectedCategories.length > 0;
        },
      }),
      {
        name: 'modules-storage',
        partialize: (state) => ({
          defaultPermissions: state.defaultPermissions,
        }),
      }
    ),
    {
      name: 'ModulesStore',
    }
  )
);

// Sélecteurs optimisés
export const useSelectedModules = () => useModulesStore((state) => state.selectedModules);
export const useSelectedCategories = () => useModulesStore((state) => state.selectedCategories);
export const useDefaultPermissions = () => useModulesStore((state) => state.defaultPermissions);
export const useIsAssigning = () => useModulesStore((state) => state.isAssigning);
export const useAssignmentProgress = () => useModulesStore((state) => state.assignmentProgress);
export const useTotalSelected = () => useModulesStore((state) => state.getTotalSelected());
export const useHasSelection = () => useModulesStore((state) => state.hasSelection());
